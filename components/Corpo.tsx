import { useState } from "react";
import { ACTIVITY, GOALS, SEX, plan, waterGoal } from "@/lib/body";
import { Activity, Goal, Profile, Sex, State, dayKey, uid } from "@/lib/store";

type Props = { state: State; update: (fn: (s: State) => State) => void };
type Sub = "agua" | "comida" | "peso" | "plano";

const SUBS: { id: Sub; label: string }[] = [
  { id: "agua", label: "Água" },
  { id: "comida", label: "Comida" },
  { id: "peso", label: "Peso" },
  { id: "plano", label: "Meu plano" },
];

const latestKg = (s: State) => (s.weights.length ? s.weights[s.weights.length - 1].kg : null);

export default function Corpo({ state, update }: Props) {
  const [sub, setSub] = useState<Sub>("agua");
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Corpo</h1>
      <div className="grid grid-cols-4 gap-1 rounded-[14px] bg-soft p-1" role="tablist">
        {SUBS.map((t) => (
          <button key={t.id} role="tab" aria-selected={sub === t.id} onClick={() => setSub(t.id)}
            className={`min-h-[44px] rounded-[10px] text-sm ${sub === t.id ? "bg-card font-bold text-accent" : "text-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {sub === "agua" && <Agua state={state} update={update} />}
      {sub === "comida" && <Comida state={state} update={update} goPlan={() => setSub("plano")} />}
      {sub === "peso" && <Peso state={state} update={update} />}
      {sub === "plano" && <Plano state={state} update={update} />}
    </>
  );
}

function Agua({ state, update }: Props) {
  const today = dayKey();
  const ml = state.water[today] ?? 0;
  const kg = latestKg(state);
  const goal = kg ? waterGoal(kg) : 2000;
  const add = (n: number) =>
    update((s) => ({ ...s, water: { ...s.water, [today]: Math.max(0, (s.water[today] ?? 0) + n) } }));
  const pct = Math.min(100, Math.round((ml / goal) * 100));
  return (
    <>
      <div className="card bg-soft px-5 py-6 text-center">
        <p className="text-lg text-muted">Hoje</p>
        <p className="my-1 text-3xl font-bold">{ml} / {goal} ml</p>
        <div className="mx-auto my-3 h-3 w-full overflow-hidden rounded-full bg-card" role="progressbar"
          aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted">
          {ml >= goal ? "Meta batida 🎉" : "Cada gole conta. Sem pressa."}
          {!kg && " Meta padrão de 2 L: registre seu peso para ajustar."}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[200, 300, 500].map((n) => (
          <button key={n} className="btn !mt-0" onClick={() => add(n)}>+{n} ml</button>
        ))}
      </div>
      <button className="btn btn-secondary" onClick={() => add(-200)} disabled={!ml}>Desfazer 200 ml</button>
    </>
  );
}

function Comida({ state, update, goPlan }: Props & { goPlan: () => void }) {
  const today = dayKey();
  const meals = state.meals[today] ?? [];
  const eaten = meals.reduce((a, m) => a + m.kcal, 0);
  const kg = latestKg(state);
  const target = state.profile && kg ? plan(state.profile, kg).target : null;
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");

  const add = () => {
    const k = Number(kcal);
    if (!name.trim() || !(k >= 0) || kcal === "") return alert("Informe o que comeu e as calorias.");
    update((s) => ({ ...s, meals: { ...s.meals, [today]: [...(s.meals[today] ?? []), { id: uid(), name: name.trim(), kcal: Math.round(k) }] } }));
    setName("");
    setKcal("");
  };
  const remove = (id: string) =>
    update((s) => ({ ...s, meals: { ...s.meals, [today]: (s.meals[today] ?? []).filter((m) => m.id !== id) } }));

  return (
    <>
      <div className="card bg-soft px-5 py-6 text-center">
        <p className="text-lg text-muted">Hoje</p>
        <p className="my-1 text-3xl font-bold">{eaten} kcal</p>
        {target ? (
          <p>{eaten <= target ? `Ainda cabem ${target - eaten} kcal dentro do seu plano` : `${eaten - target} kcal acima do plano. Um dia não define nada; amanhã é um novo dia.`}</p>
        ) : (
          <p className="text-sm text-muted">Configure “Meu plano” para ver quantas calorias cabem no dia.</p>
        )}
        {!target && <button className="btn btn-secondary" onClick={goPlan}>Configurar meu plano</button>}
      </div>

      {meals.map((m) => (
        <div key={m.id} className="card flex items-center justify-between gap-3">
          <div><b>{m.name}</b><br /><span className="text-sm text-muted">{m.kcal} kcal</span></div>
          <button className="btn btn-small btn-secondary" onClick={() => remove(m.id)} aria-label={`Remover ${m.name}`}>Remover</button>
        </div>
      ))}

      <div className="card">
        <label className="block text-[.95rem] font-semibold" htmlFor="m-name">O que comi</label>
        <input id="m-name" className="field" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="ex.: arroz, feijão e frango" />
        <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="m-kcal">Calorias (kcal)</label>
        <input id="m-kcal" className="field" inputMode="numeric" value={kcal}
          onChange={(e) => setKcal(e.target.value.replace(/\D/g, ""))} placeholder="ex.: 550" />
        <button className="btn" onClick={add}>Adicionar</button>
      </div>
      <p className="text-sm text-muted">Você digita as calorias; o app não estima o valor dos alimentos.</p>
    </>
  );
}

function Peso({ state, update }: Props) {
  const [kg, setKg] = useState("");
  const today = dayKey();
  const list = state.weights;
  const last = list[list.length - 1];

  const save = () => {
    const v = Number(kg.replace(",", "."));
    if (!(v >= 20 && v <= 400)) return alert("Informe um peso válido em kg.");
    update((s) => ({
      ...s,
      weights: [...s.weights.filter((w) => w.date !== today), { date: today, kg: Math.round(v * 10) / 10 }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setKg("");
  };

  return (
    <>
      <div className="card bg-soft px-5 py-6 text-center">
        <p className="text-lg text-muted">Último registro</p>
        <p className="my-1 text-3xl font-bold">{last ? `${last.kg.toFixed(1)} kg` : "—"}</p>
        {last && <p className="text-sm text-muted">{fmtDate(last.date)}</p>}
      </div>
      {list.length >= 2 && <Chart data={list.slice(-30)} />}
      <div className="card">
        <label className="block text-[.95rem] font-semibold" htmlFor="w-kg">Peso de hoje (kg)</label>
        <input id="w-kg" className="field" inputMode="decimal" value={kg} placeholder="ex.: 68,4"
          onChange={(e) => setKg(e.target.value.replace(/[^\d.,]/g, ""))} />
        <button className="btn" onClick={save}>Salvar</button>
      </div>
      {[...list].reverse().slice(0, 14).map((w) => (
        <div key={w.date} className="card flex items-center justify-between !my-2">
          <span>{fmtDate(w.date)}</span>
          <span className="flex items-center gap-3">
            <b>{w.kg.toFixed(1)} kg</b>
            <button className="btn btn-small btn-secondary !m-0" aria-label={`Remover registro de ${fmtDate(w.date)}`}
              onClick={() => update((s) => ({ ...s, weights: s.weights.filter((x) => x.date !== w.date) }))}>×</button>
          </span>
        </div>
      ))}
      <p className="text-sm text-muted">O peso oscila ao longo do dia. A tendência importa mais que um número isolado.</p>
    </>
  );
}

function Chart({ data }: { data: { date: string; kg: number }[] }) {
  const W = 320, H = 120, P = 8;
  const ys = data.map((d) => d.kg);
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  const pts = data.map((d, i) => [P + (i * (W - 2 * P)) / (data.length - 1), H - P - ((d.kg - min) / span) * (H - 2 * P)]);
  return (
    <div className="card">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Peso de ${min.toFixed(1)} a ${max.toFixed(1)} kg nos últimos registros`}>
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--accent)" />)}
      </svg>
      <div className="flex justify-between text-sm text-muted"><span>{min.toFixed(1)} kg</span><span>{max.toFixed(1)} kg</span></div>
    </div>
  );
}

function Plano({ state, update }: Props) {
  const kg = latestKg(state);
  const [draft, setDraft] = useState<Profile>(
    state.profile ?? { sex: "F", age: 30, heightCm: 165, activity: "light", goal: "maintain" },
  );
  const [age, setAge] = useState(String(draft.age));
  const [height, setHeight] = useState(String(draft.heightCm));
  const result = state.profile && kg ? plan(state.profile, kg) : null;

  const save = () => {
    const a = Number(age), h = Number(height);
    if (!(a >= 18 && a <= 100)) return alert("Este cálculo é para maiores de 18 anos (idade entre 18 e 100).");
    if (!(h >= 120 && h <= 230)) return alert("Informe a altura em cm (120 a 230).");
    update((s) => ({ ...s, profile: { ...draft, age: a, heightCm: h } }));
  };

  const select = "field";
  return (
    <>
      {result && (
        <div className="card bg-soft px-5 py-6">
          <p className="text-center text-lg text-muted">Estimativas com {kg!.toFixed(1)} kg</p>
          <dl className="mt-2 space-y-3">
            <Row label="Gasto em repouso (TMB)" value={`${result.tmb} kcal`} hint="o que seu corpo gasta só para funcionar" />
            <Row label="Gasto total por dia" value={`${result.tdee} kcal`} hint="com sua rotina de atividade" />
            <Row label="Calorias para comer por dia" value={`${result.target} kcal`} hint={GOALS[state.profile!.goal].label} strong />
          </dl>
          {result.floorApplied && (
            <p className="mt-3 text-sm">Subi o valor para o mínimo de segurança. Não recomendo comer menos que isso sem acompanhamento profissional.</p>
          )}
        </div>
      )}
      {state.profile && !kg && (
        <div className="card bg-warm"><p>Falta registrar seu peso na aba <b>Peso</b> para calcular.</p></div>
      )}

      <div className="card">
        <label className="block text-[.95rem] font-semibold" htmlFor="p-sex">Sexo (usado na fórmula)</label>
        <select id="p-sex" className={select} value={draft.sex} onChange={(e) => setDraft({ ...draft, sex: e.target.value as Sex })}>
          {Object.entries(SEX).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="p-age">Idade</label>
        <input id="p-age" className="field" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} />
        <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="p-h">Altura (cm)</label>
        <input id="p-h" className="field" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, ""))} />
        <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="p-act">Atividade física</label>
        <select id="p-act" className={select} value={draft.activity} onChange={(e) => setDraft({ ...draft, activity: e.target.value as Activity })}>
          {Object.entries(ACTIVITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="p-goal">Objetivo</label>
        <select id="p-goal" className={select} value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value as Goal })}>
          {Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className="btn" onClick={save}>Salvar e calcular</button>
      </div>
      <p className="text-sm text-muted">
        Estimativa pela fórmula de Mifflin-St Jeor, sem substituir avaliação de médico ou nutricionista. Se comer ou o peso estiver
        te causando sofrimento, vale conversar com um profissional.
      </p>
    </>
  );
}

function Row({ label, value, hint, strong }: { label: string; value: string; hint: string; strong?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt>{label}</dt>
        <dd className={strong ? "text-2xl font-bold" : "text-xl font-semibold"}>{value}</dd>
      </div>
      <p className="text-sm text-muted">{hint}</p>
    </div>
  );
}

const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
