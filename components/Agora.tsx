import { BookOpen, Check, Droplet, Pill, Scale, Utensils, House as HouseIcon, ChevronRight } from "lucide-react";
import { REPEAT_MIN, State, dayKey, dayTotals, latestKg, nextPending, nextTask, todayDoses, todayTasks, weekStudy } from "@/lib/store";
import { plan, waterGoal } from "@/lib/body";
import Hoje from "./Hoje";
import { Ring, fmtNum } from "./ui";

export type Tab = "inicio" | "rotina" | "estudos" | "corpo" | "ajustes";

type Props = {
  state: State;
  update: (fn: (s: State) => State) => void;
  mark: (id: string, status: "taken" | "skipped" | null) => void;
  snooze: (id: string) => void;
  go: (t: Tab) => void;
};

const TASK_SNOOZE_MIN = 30;

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default function Inicio({ state, update, mark, snooze, go }: Props) {
  const today = dayKey();
  const low = !!state.lowEnergy[today];
  const name = state.profile?.name?.trim();
  const rawDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  const toggleLow = () =>
    update((s) => {
      const lowEnergy = { ...s.lowEnergy };
      if (lowEnergy[today]) delete lowEnergy[today];
      else lowEnergy[today] = true;
      return { ...s, lowEnergy };
    });

  return (
    <>
      <p className="muted pt-2">{date}</p>
      <div className="flex items-start justify-between gap-3">
        <h1 className="h1">{greeting()}{name ? `, ${name}` : ""} 👋</h1>
      </div>
      <button onClick={toggleLow} aria-pressed={low}
        className={`mt-3 flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-left ${low ? "bg-warm" : "border-2 border-dashed border-line"}`}>
        <span className="text-xl" aria-hidden>🔋</span>
        <span className="flex-1">
          <span className="block font-semibold">{low ? "Modo baixa energia ligado" : "Dia difícil? Ligue o modo baixa energia"}</span>
          {low && <span className="muted block">Só o essencial hoje. Toque para desligar.</span>}
        </span>
        <span className={`h-7 w-12 rounded-full p-1 transition ${low ? "bg-accent" : "bg-line"}`}>
          <span className={`block h-5 w-5 rounded-full bg-card transition ${low ? "translate-x-5" : ""}`} />
        </span>
      </button>

      <NowCard state={state} update={update} mark={mark} snooze={snooze} go={go} />
      <Tiles state={state} update={update} go={go} />

      <details className="card">
        <summary className="flex min-h-[32px] cursor-pointer items-center justify-between font-semibold">
          Meu dia completo <ChevronRight size={18} />
        </summary>
        <Hoje state={state} update={update} mark={mark} />
      </details>
    </>
  );
}

function NowCard({ state, update, mark, snooze, go }: Props) {
  const low = !!state.lowEnergy[dayKey()];
  const { due, upcoming } = nextPending(state);
  const task = due ? null : nextTask(state);

  if (!state.meds.length && !state.tasks.length) {
    return (
      <div className="card bg-soft">
        <p className="text-lg font-bold">Comece pela sua rotina</p>
        <p className="mt-1">Cadastre remédios e tarefas da casa. Aqui vai aparecer sempre <b>só a próxima coisa</b> a fazer.</p>
        <button className="btn" onClick={() => go("rotina")}>Montar minha rotina <ChevronRight size={20} /></button>
      </div>
    );
  }

  if (due) {
    const late = Date.now() - due.at > 30 * 60000;
    return (
      <div className={`card border-0 ${late ? "bg-warm" : "bg-med-soft"}`}>
        <p className="flex items-center gap-2 font-semibold text-med"><Pill size={18} /> Agora · remédio das {due.time}</p>
        <p className="mt-1 text-3xl font-bold">{due.med.name}</p>
        {due.med.dose && <p className="text-lg">{due.med.dose}</p>}
        {late && <p className="muted mt-1">Sem pressa, ainda dá tempo.</p>}
        <button className="btn !bg-med" onClick={() => mark(due.id, "taken")}><Check size={22} /> Tomei</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-secondary" onClick={() => snooze(due.id)}>Daqui a {REPEAT_MIN} min</button>
          <button className="btn btn-secondary" onClick={() => mark(due.id, "skipped")}>Pular hoje</button>
        </div>
      </div>
    );
  }

  if (task) {
    const { key, task: t } = task;
    const stepKey = (i: number) => `${key}|${i}`;
    const toggleStep = (i: number) =>
      update((s) => {
        const stepDone = { ...s.stepDone };
        if (stepDone[stepKey(i)]) delete stepDone[stepKey(i)];
        else stepDone[stepKey(i)] = true;
        return { ...s, stepDone };
      });
    const doneSteps = t.steps.filter((_, i) => state.stepDone[stepKey(i)]).length;
    return (
      <div className="card border-0 bg-soft">
        <p className="flex items-center gap-2 font-semibold text-accent"><HouseIcon size={18} /> Agora{t.time ? ` · ${t.time}` : ""}</p>
        <p className="mt-1 text-3xl font-bold">{t.name}</p>
        {t.steps.length > 0 && (
          <>
            <p className="muted">{doneSteps} de {t.steps.length} passos · um de cada vez</p>
            <ul className="mt-3 space-y-2">
              {t.steps.map((step, i) => {
                const on = !!state.stepDone[stepKey(i)];
                return (
                  <li key={i}>
                    <button onClick={() => toggleStep(i)} aria-pressed={on}
                      className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl bg-card px-3 text-left ${on ? "opacity-60" : ""}`}>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${on ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>
                        {on && <Check size={16} />}
                      </span>
                      <span className={on ? "line-through" : ""}>{step}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <button className="btn" onClick={() => update((s) => ({ ...s, taskDone: { ...s.taskDone, [key]: true } }))}>
          <Check size={22} /> Feito
        </button>
        <button className="btn btn-secondary"
          onClick={() => update((s) => ({ ...s, snooze: { ...s.snooze, [key]: Date.now() + TASK_SNOOZE_MIN * 60000 } }))}>
          Agora não ({TASK_SNOOZE_MIN} min)
        </button>
      </div>
    );
  }

  const left = todayDoses(state).filter((d) => !d.status).length +
    todayTasks(state).filter((t) => !t.done && (!low || t.task.essential)).length;
  return (
    <div className="card border-0 bg-soft text-center">
      <p className="text-4xl" aria-hidden>{left ? "🌿" : "🎉"}</p>
      <p className="mt-1 text-2xl font-bold">{left ? "Nada para agora" : "Tudo feito por hoje!"}</p>
      {upcoming && <p className="mt-1">Próximo remédio: <b>{upcoming.med.name}</b> às {upcoming.time}</p>}
      <p className="muted mt-1">Pode descansar ou fazer o que quiser.</p>
    </div>
  );
}

function Tiles({ state, update, go }: Pick<Props, "state" | "update" | "go">) {
  const today = dayKey();
  const kg = latestKg(state);
  const p = state.profile;
  const target = p && kg ? plan(p, kg).target : null;
  const eaten = dayTotals(state).kcal;
  const ml = state.water[today] ?? 0;
  const wGoal = kg ? waterGoal(kg) : 2000;
  const week = weekStudy(state);
  const weekMin = Object.values(week).reduce((a, b) => a + b, 0);
  const weekGoal = state.subjects.reduce((a, s) => a + s.weeklyGoalMin, 0);
  const todayStudy = Object.values(state.studyLog[today] ?? {}).reduce((a, b) => a + b, 0);

  const tile = "card !my-0 flex flex-col items-start gap-2 text-left active:scale-[.98] transition";
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <button className={tile} onClick={() => go("corpo")}>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-food"><Utensils size={16} /> Comida</span>
        {target ? (
          <Ring pct={eaten / target} color="var(--food)">
            <span className="block text-lg font-bold tabular-nums">{Math.max(0, target - eaten)}</span>
            <span className="block text-[.7rem] text-muted">kcal restam</span>
          </Ring>
        ) : <span className="text-sm">Configure seu plano →</span>}
      </button>

      <div className={tile}>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-water"><Droplet size={16} /> Água</span>
        <div className="flex w-full items-center justify-between">
          <Ring pct={ml / wGoal} color="var(--water)">
            <span className="block text-lg font-bold tabular-nums">{fmtNum(ml / 1000)}</span>
            <span className="block text-[.7rem] text-muted">de {fmtNum(wGoal / 1000)} L</span>
          </Ring>
          <button aria-label="Bebi um copo de água, mais 250 mililitros"
            onClick={() => update((s) => ({ ...s, water: { ...s.water, [today]: (s.water[today] ?? 0) + 250 } }))}
            className="grid h-12 w-12 place-items-center rounded-full bg-water text-lg font-bold text-white active:scale-95">+</button>
        </div>
      </div>

      <button className={tile} onClick={() => go("corpo")}>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-weight"><Scale size={16} /> Peso</span>
        <span className="text-2xl font-bold tabular-nums">{kg ? `${fmtNum(kg)} kg` : "—"}</span>
        <span className="muted">
          {kg && p?.targetKg ? (Math.abs(kg - p.targetKg) < 0.1 ? "Meta atingida 🎉" : `Faltam ${fmtNum(Math.abs(kg - p.targetKg))} kg`) : "Registrar peso →"}
        </span>
      </button>

      <button className={tile} onClick={() => go("estudos")}>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-study"><BookOpen size={16} /> Estudos</span>
        {weekGoal ? (
          <Ring pct={weekMin / weekGoal} color="var(--study)">
            <span className="block text-lg font-bold tabular-nums">{todayStudy}</span>
            <span className="block text-[.7rem] text-muted">min hoje</span>
          </Ring>
        ) : <span className="text-sm">{todayStudy ? `${todayStudy} min hoje` : "Criar matérias →"}</span>}
      </button>
    </div>
  );
}
