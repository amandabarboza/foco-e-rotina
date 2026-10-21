import { REPEAT_MIN, State, dayKey, nextPending, nextTask, todayDoses, todayTasks } from "@/lib/store";
import { waterGoal } from "@/lib/body";
import Hoje from "./Hoje";

type Props = {
  state: State;
  update: (fn: (s: State) => State) => void;
  mark: (id: string, status: "taken" | "skipped" | null) => void;
  snooze: (id: string) => void;
  goAdd: () => void;
};

const TASK_SNOOZE_MIN = 30;

export default function Agora({ state, update, mark, snooze, goAdd }: Props) {
  const today = dayKey();
  const low = !!state.lowEnergy[today];
  const { due, upcoming } = nextPending(state);
  const task = due ? null : nextTask(state);

  const toggleLow = () =>
    update((s) => {
      const lowEnergy = { ...s.lowEnergy };
      if (lowEnergy[today]) delete lowEnergy[today];
      else lowEnergy[today] = true;
      return { ...s, lowEnergy };
    });

  const header = (
    <div className="mb-1 flex items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Agora</h1>
      <button onClick={toggleLow} aria-pressed={low}
        className={`min-h-[44px] rounded-full px-4 text-sm ${low ? "bg-warm font-semibold" : "border-2 border-line text-muted"}`}>
        {low ? "🔋 Baixa energia: ligado" : "🔋 Pouca energia?"}
      </button>
    </div>
  );

  if (!state.meds.length && !state.tasks.length) {
    return (
      <>
        {header}
        <div className="card bg-soft px-5 py-6 text-center">
          <p className="my-1 text-3xl font-bold">Vamos começar?</p>
          <p>Cadastre um remédio ou uma tarefa da casa e eu te mostro uma coisa por vez.</p>
          <button className="btn" onClick={goAdd}>Ir para Rotina</button>
        </div>
      </>
    );
  }

  let main: React.ReactNode;
  if (due) {
    const late = Date.now() - due.at > 30 * 60000;
    main = (
      <div className={`card px-5 py-6 text-center ${late ? "bg-warm" : "bg-soft"}`}>
        <p className="text-lg text-muted">💊 {due.time}{late ? " · sem pressa, ainda dá tempo" : ""}</p>
        <p className="my-1 text-3xl font-bold">{due.med.name}</p>
        {due.med.dose && <p>{due.med.dose}</p>}
        <button className="btn" onClick={() => mark(due.id, "taken")}>Tomei ✔</button>
        <button className="btn btn-secondary" onClick={() => snooze(due.id)}>Daqui a {REPEAT_MIN} min</button>
        <button className="btn btn-secondary" onClick={() => mark(due.id, "skipped")}>Pular hoje</button>
      </div>
    );
  } else if (task) {
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
    main = (
      <div className="card bg-soft px-5 py-6">
        <p className="text-center text-lg text-muted">🏠 {t.time || "Hoje"}</p>
        <p className="my-1 text-center text-3xl font-bold">{t.name}</p>
        {t.steps.length > 0 && (
          <>
            <p className="text-center text-sm text-muted">{doneSteps} de {t.steps.length} passos · um de cada vez</p>
            <ul className="mt-3 space-y-2">
              {t.steps.map((step, i) => {
                const on = !!state.stepDone[stepKey(i)];
                return (
                  <li key={i}>
                    <button onClick={() => toggleStep(i)} aria-pressed={on}
                      className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-3 text-left ${on ? "border-transparent bg-card opacity-60" : "border-line bg-card"}`}>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${on ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>
                        {on ? "✓" : ""}
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
          Feito ✔
        </button>
        <button className="btn btn-secondary"
          onClick={() => update((s) => ({ ...s, snooze: { ...s.snooze, [key]: Date.now() + TASK_SNOOZE_MIN * 60000 } }))}>
          Agora não ({TASK_SNOOZE_MIN} min)
        </button>
      </div>
    );
  } else {
    const left = todayDoses(state).filter((d) => !d.status).length +
      todayTasks(state).filter((t) => !t.done && (!low || t.task.essential)).length;
    main = (
      <div className="card bg-soft px-5 py-6 text-center">
        <p className="my-1 text-3xl font-bold">{left ? "Tudo certo por ora 🌿" : "Tudo feito por hoje 🎉"}</p>
        {upcoming && <p>Próximo remédio: <b>{upcoming.med.name}</b> às {upcoming.time}</p>}
        <p className="text-sm text-muted">Você não precisa fazer mais nada agora.</p>
      </div>
    );
  }

  return (
    <>
      {header}
      {low && <LowEnergy state={state} update={update} />}
      {main}
      <details className="card">
        <summary className="min-h-[32px] cursor-pointer font-semibold">Ver o resto do dia</summary>
        <Hoje state={state} update={update} mark={mark} />
      </details>
    </>
  );
}

function LowEnergy({ state, update }: Pick<Props, "state" | "update">) {
  const today = dayKey();
  const ml = state.water[today] ?? 0;
  const kg = state.weights.length ? state.weights[state.weights.length - 1].kg : null;
  const goal = kg ? waterGoal(kg) : 2000;
  return (
    <div className="card bg-warm">
      <p className="font-semibold">Hoje vale só o essencial. Tudo bem.</p>
      <ul className="mt-2 space-y-1 text-[.95rem]">
        <li>💊 Remédios: continuam aparecendo aqui.</li>
        <li>💧 Água: {ml} / {goal} ml</li>
        <li>🍞 Comer alguma coisa, mesmo que simples.</li>
        <li>🛏️ Descansar sem culpa.</li>
      </ul>
      <button className="btn !mt-3"
        onClick={() => update((s) => ({ ...s, water: { ...s.water, [today]: (s.water[today] ?? 0) + 250 } }))}>
        Bebi um copo de água (+250 ml)
      </button>
      <p className="mt-2 text-sm text-muted">Só aparecem as tarefas marcadas como essenciais. O modo desliga sozinho amanhã.</p>
    </div>
  );
}
