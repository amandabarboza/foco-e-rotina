"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { ACTIVITY, GOALS, SEX, healthyRange, plan, waterGoal } from "@/lib/body";
import { Activity, Goal, Med, Profile, Sex, State, dayKey, latestKg, uid } from "@/lib/store";
import { Option, Stepper, fmtNum } from "./ui";

type Props = { state: State; update: (fn: (s: State) => State) => void };

export const defaultProfile = (s: State): Profile =>
  s.profile ?? { sex: "F", age: 30, heightCm: 165, activity: "light", goal: "maintain" };

// Campos do perfil, usados no passo a passo e em "Editar meus dados".
export function AboutFields({ p, set, kg, setKg }: { p: Profile; set: (x: Partial<Profile>) => void; kg: number; setKg: (v: number) => void }) {
  return (
    <>
      <p className="label">Sexo (usado no cálculo)</p>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(SEX) as Sex[]).map((k) => (
          <button key={k} onClick={() => set({ sex: k })} aria-pressed={p.sex === k}
            className={`mt-2 min-h-[54px] rounded-2xl border-2 px-2 text-[.95rem] ${p.sex === k ? "border-accent bg-soft font-semibold" : "border-line"}`}>
            {SEX[k]}
          </button>
        ))}
      </div>
      <p className="label">Idade</p>
      <Stepper label="Idade" value={p.age} onChange={(age) => set({ age })} min={18} max={100} unit="anos" />
      <p className="label">Altura</p>
      <Stepper label="Altura" value={p.heightCm} onChange={(heightCm) => set({ heightCm })} min={120} max={230} unit="cm" />
      <p className="label">Peso de hoje</p>
      <Stepper label="Peso" value={kg} onChange={setKg} step={0.1} decimals={1} min={30} max={300} unit="kg" />
    </>
  );
}

export function ActivityFields({ p, set }: { p: Profile; set: (x: Partial<Profile>) => void }) {
  const icons: Record<Activity, string> = { sedentary: "🛋️", light: "🚶‍♀️", moderate: "🚴‍♀️", high: "🏋️‍♀️" };
  return (
    <>
      {(Object.keys(ACTIVITY) as Activity[]).map((k) => (
        <Option key={k} selected={p.activity === k} onClick={() => set({ activity: k })}
          title={ACTIVITY[k].label} hint={ACTIVITY[k].hint} icon={icons[k]} />
      ))}
    </>
  );
}

export function GoalFields({ p, set, kg }: { p: Profile; set: (x: Partial<Profile>) => void; kg: number }) {
  const icons: Record<Goal, string> = { maintain: "⚖️", lose_slow: "🐢", lose: "📉", gain: "📈" };
  const range = healthyRange(p.heightCm);
  // Mantém a meta atual só se ela combina com a direção do objetivo.
  const pick = (goal: Goal) => {
    if (goal === "maintain") return set({ goal, targetKg: undefined });
    const gaining = goal === "gain";
    const fits = p.targetKg !== undefined && (gaining ? p.targetKg > kg : p.targetKg < kg);
    const suggested = gaining ? kg + 3 : Math.max(range.min, kg - 5);
    set({ goal, targetKg: fits ? p.targetKg : Math.round(suggested * 2) / 2 });
  };
  return (
    <>
      {(Object.keys(GOALS) as Goal[]).map((k) => (
        <Option key={k} selected={p.goal === k} onClick={() => pick(k)} title={GOALS[k].label} hint={GOALS[k].hint} icon={icons[k]} />
      ))}
      {p.goal !== "maintain" && (
        <>
          <p className="label">Peso que quero atingir</p>
          <Stepper label="Meta de peso" value={p.targetKg ?? kg} onChange={(targetKg) => set({ targetKg })}
            step={0.5} decimals={1} min={30} max={300} unit="kg" />
          <p className="muted mt-2">
            Para sua altura, a faixa de peso recomendada (IMC 18,5–24,9) é de {fmtNum(range.min)} a {fmtNum(range.max)} kg.
            {p.targetKg && p.targetKg < range.min && " Sua meta está abaixo dessa faixa; vale conversar com um profissional."}
          </p>
        </>
      )}
    </>
  );
}

const STEPS = ["Boas-vindas", "Sobre você", "Atividade", "Objetivo", "Remédios", "Pronto"];

export default function Onboarding({ state, update }: Props) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(defaultProfile(state));
  const [kg, setKg] = useState(latestKg(state) ?? 65);
  const [meds, setMeds] = useState<Med[]>(state.meds);
  const set = (x: Partial<Profile>) => setP((old) => ({ ...old, ...x }));

  const finish = () =>
    update((s) => {
      const today = dayKey();
      const weights = latestKg(s) === kg ? s.weights
        : [...s.weights.filter((w) => w.date !== today), { date: today, kg }].sort((a, b) => a.date.localeCompare(b.date));
      return { ...s, profile: p, weights, meds: meds.filter((m) => m.name.trim()), onboarded: true };
    });

  const result = plan(p, kg);
  const next = () => setStep((n) => Math.min(STEPS.length - 1, n + 1));

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col pb-6 pt-4">
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} aria-label="Voltar" className="grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--card-edge)] bg-card">
            <ChevronLeft size={22} />
          </button>
        ) : <span className="w-11" />}
        <div className="flex flex-1 gap-1.5" aria-label={`Passo ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((_, i) => <span key={i} className={`h-2.5 flex-1 rounded-full border-2 border-[#3b2414] ${i <= step ? "bg-[var(--btn)]" : "bg-white/40"}`} />)}
        </div>
        {step < STEPS.length - 1 ? (
          <button onClick={() => update((s) => ({ ...s, onboarded: true }))} className="min-h-[44px] px-2 text-sm font-bold text-white">Pular</button>
        ) : <span className="w-11" />}
      </div>

      <div className="card rise flex-1 !mt-6">
        {step === 0 && (
          <>
            <p className="text-5xl">🏜️</p>
            <h1 className="h1 mt-3">Oi! Que bom te ver aqui.</h1>
            <p className="mt-3 text-lg">Este app te ajuda com <b>remédios</b>, <b>tarefas da casa</b>, <b>estudos</b> e <b>alimentação</b>, mostrando uma coisa de cada vez.</p>
            <p className="mt-2 text-muted">Leva uns 2 minutos para configurar. Dá para mudar tudo depois.</p>
            <label className="label" htmlFor="ob-name">Como quer ser chamada? (opcional)</label>
            <input id="ob-name" className="field" autoComplete="given-name" value={p.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="h1">Sobre você</h1>
            <p className="muted mt-1">Use os botões − e +, ou toque no número para digitar.</p>
            <AboutFields p={p} set={set} kg={kg} setKg={setKg} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="h1">Quanto você se movimenta?</h1>
            <p className="muted mt-1">Pense numa semana comum.</p>
            <ActivityFields p={p} set={set} />
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="h1">Qual é o seu objetivo?</h1>
            <GoalFields p={p} set={set} kg={kg} />
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="h1">Toma algum remédio?</h1>
            <p className="muted mt-1">Eu te lembro na hora. Se não toma, é só seguir.</p>
            {meds.map((m, i) => (
              <div key={m.id} className="card">
                <div className="flex gap-2">
                  <input className="field" placeholder="Nome do remédio" aria-label="Nome do remédio" value={m.name}
                    onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <button aria-label="Remover remédio" className="grid w-12 shrink-0 place-items-center rounded-xl bg-bg"
                    onClick={() => setMeds(meds.filter((_, j) => j !== i))}><Trash2 size={20} /></button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.times.map((t, k) => (
                    <input key={k} type="time" className="field w-auto" value={t} aria-label={`Horário ${k + 1}`}
                      onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, times: x.times.map((y, l) => (l === k ? e.target.value : y)) } : x)))} />
                  ))}
                  <button className="btn btn-small btn-secondary !m-0"
                    onClick={() => setMeds(meds.map((x, j) => (j === i ? { ...x, times: [...x.times, "20:00"] } : x)))}>+ horário</button>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => setMeds([...meds, { id: uid(), name: "", dose: "", times: ["08:00"] }])}>
              <Plus size={20} /> Adicionar remédio
            </button>
          </>
        )}
        {step === 5 && (
          <>
            <p className="text-5xl">🎉</p>
            <h1 className="h1 mt-3">Tudo pronto{p.name ? `, ${p.name}` : ""}!</h1>
            <div className="card bg-soft">
              <p className="muted">Por dia, você pode comer cerca de</p>
              <p className="text-4xl font-bold">{result.target} kcal</p>
              <p className="mt-1 text-sm">Proteína {result.macros.protein} g · Carboidrato {result.macros.carbs} g · Gordura {result.macros.fat} g</p>
              <p className="mt-3 muted">Água por dia</p>
              <p className="text-2xl font-bold">{fmtNum(waterGoal(kg) / 1000, 2)} L</p>
            </div>
            <p className="muted">Na tela inicial você vê o resumo do dia. Em <b>Ajustes</b> dá para gerar alarmes no Calendário do iPhone.</p>
          </>
        )}
      </div>

      <button className="btn" onClick={step === STEPS.length - 1 ? finish : next}>
        {step === 0 ? "Começar" : step === STEPS.length - 1 ? "Ir para o app" : step === 4 && !meds.length ? "Não tomo, seguir" : "Continuar"}
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
