"use client";

import { useState } from "react";
import { BookHeart, ChevronRight, Droplet, Pencil, Plus, Scale, Target, Trash2, Undo2, Utensils } from "lucide-react";
import { GOALS, MEALS, MealId, bmi, bmiLabel, eta, healthyRange, plan, waterGoal } from "@/lib/body";
import { Meal, Profile, State, dayKey, dayTotals, latestKg } from "@/lib/store";
import FoodPicker from "./FoodPicker";
import Guia from "./Guia";
import { AboutFields, ActivityFields, GoalFields, defaultProfile } from "./Onboarding";
import { Bar, Ring, Sheet, Stepper, fmtNum } from "./ui";

type Props = { state: State; update: (fn: (s: State) => State) => void };

const fmtDate = (d: string) => d.split("-").reverse().join("/");

export default function Corpo({ state, update }: Props) {
  const [guide, setGuide] = useState(false);
  const [editing, setEditing] = useState(false);
  const kg = latestKg(state);
  const p = state.profile;

  if (guide) return <Guia state={state} update={update} onBack={() => setGuide(false)} />;

  return (
    <>
      <h1 className="h1 pt-2">Corpo e alimentação</h1>
      {p && kg ? (
        <PlanCard state={state} profile={p} kg={kg} onGuide={() => setGuide(true)} />
      ) : (
        <div className="card bg-soft border-0">
          <p className="text-lg font-bold">Vamos calcular quanto você pode comer</p>
          <p className="mt-1">Preciso de idade, altura, peso, atividade e objetivo. Leva 1 minuto.</p>
          <button className="btn" onClick={() => setEditing(true)}>Preencher meus dados</button>
        </div>
      )}
      <Meals state={state} update={update} profile={p} kg={kg} />
      <Water state={state} update={update} kg={kg} />
      <Weight state={state} update={update} profile={p} kg={kg} />
      <button className="btn btn-secondary" onClick={() => setGuide(true)}><BookHeart size={20} /> Guia de reeducação alimentar</button>
      <button className="btn btn-secondary" onClick={() => setEditing(true)}><Pencil size={18} /> Editar meus dados e objetivo</button>
      <p className="muted mt-4">
        Estimativas pela fórmula de Mifflin-St Jeor. Não substituem avaliação de médico ou nutricionista. Se comer ou o peso
        estiver te causando sofrimento, vale conversar com um profissional.
      </p>
      {editing && <ProfileEditor state={state} update={update} onClose={() => setEditing(false)} />}
    </>
  );
}

function PlanCard({ state, profile, kg, onGuide }: { state: State; profile: Profile; kg: number; onGuide: () => void }) {
  const [why, setWhy] = useState(false);
  const r = plan(profile, kg);
  const t = dayTotals(state);
  const left = r.target - t.kcal;
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <Ring pct={t.kcal / r.target} color="var(--food)" size={120} stroke={12}>
          <span className="block text-2xl font-bold tabular-nums">{Math.abs(left)}</span>
          <span className="block text-xs text-muted">{left >= 0 ? "kcal restam" : "kcal acima"}</span>
        </Ring>
        <div className="flex-1">
          <p className="muted">Seu limite de hoje</p>
          <p className="text-3xl font-bold tabular-nums">{r.target} <span className="text-base font-normal text-muted">kcal</span></p>
          <p className="muted">Já comeu {t.kcal} kcal</p>
          {left < 0 && <p className="mt-1 text-sm">Um dia não define nada. Amanhã é um novo dia. 💛</p>}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="Proteína" value={t.p} max={r.macros.protein} color="var(--weight)" />
        <Bar label="Carboidrato" value={t.c} max={r.macros.carbs} color="var(--food)" />
        <Bar label="Gordura" value={t.f} max={r.macros.fat} color="var(--water)" />
      </div>
      <button onClick={() => setWhy(!why)} aria-expanded={why} className="mt-3 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-accent">
        Como cheguei nesse número? <ChevronRight size={16} className={why ? "rotate-90" : ""} />
      </button>
      {why && (
        <div className="rounded-xl bg-bg p-3 text-[.95rem]">
          <p>🔥 <b>{r.tmb} kcal</b>: o que seu corpo gasta parado, só para funcionar (TMB).</p>
          <p className="mt-1">🚶‍♀️ <b>{r.tdee} kcal</b>: seu gasto total por dia, com sua atividade.</p>
          <p className="mt-1">🎯 <b>{r.target} kcal</b>: {GOALS[profile.goal].label.toLowerCase()} ({GOALS[profile.goal].hint.toLowerCase()}).</p>
          {r.floorApplied && <p className="mt-1">Subi para o mínimo de segurança. Não recomendo comer menos que isso sem acompanhamento.</p>}
          <p className="mt-2 muted">Macros: proteína {r.macros.protein} g, carboidrato {r.macros.carbs} g, gordura {r.macros.fat} g.</p>
          <button className="btn btn-small btn-secondary" onClick={onGuide}>Ver o guia e um cardápio-modelo</button>
        </div>
      )}
    </div>
  );
}

function Meals({ state, update, profile, kg }: Props & { profile: Profile | null; kg: number | null }) {
  const [picker, setPicker] = useState<MealId | null>(null);
  const today = dayKey();
  const meals = state.meals[today] ?? [];
  const target = profile && kg ? plan(profile, kg).target : null;
  const add = (m: Meal) => update((s) => ({ ...s, meals: { ...s.meals, [today]: [...(s.meals[today] ?? []), m] } }));
  const remove = (id: string) => update((s) => ({ ...s, meals: { ...s.meals, [today]: (s.meals[today] ?? []).filter((m) => m.id !== id) } }));

  return (
    <>
      <h2 className="h2 text-food"><Utensils size={20} /> Refeições de hoje</h2>
      {MEALS.map((ml) => {
        const items = meals.filter((m) => (m.meal ?? "lanche") === ml.id);
        const sum = items.reduce((a, m) => a + m.kcal, 0);
        return (
          <div key={ml.id} className="card !py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{ml.label}</p>
                <p className="muted tabular-nums">{sum} kcal{target ? ` · sugerido ~${Math.round((target * ml.share) / 10) * 10}` : ""}</p>
              </div>
              <button onClick={() => setPicker(ml.id)} aria-label={`Adicionar comida no ${ml.label}`}
                className="grid h-12 w-12 place-items-center rounded-full bg-food-soft text-food active:scale-95"><Plus size={24} /></button>
            </div>
            {items.map((m) => (
              <div key={m.id} className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                <span>{m.qty && m.qty !== 1 ? `${fmtNum(m.qty)}× ` : ""}{m.name}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-muted">{m.kcal}</span>
                  <button onClick={() => remove(m.id)} aria-label={`Remover ${m.name}`} className="grid h-10 w-10 place-items-center rounded-full text-muted"><Trash2 size={18} /></button>
                </span>
              </div>
            ))}
          </div>
        );
      })}
      {picker && <FoodPicker key={picker} open onClose={() => setPicker(null)} meal={picker} state={state} onAdd={add} />}
    </>
  );
}

function Water({ state, update, kg }: Props & { kg: number | null }) {
  const today = dayKey();
  const ml = state.water[today] ?? 0;
  const goal = kg ? waterGoal(kg) : 2000;
  const add = (n: number) => update((s) => ({ ...s, water: { ...s.water, [today]: Math.max(0, (s.water[today] ?? 0) + n) } }));
  const cups = Math.round(goal / 250);
  const drunk = Math.floor(ml / 250);
  return (
    <>
      <h2 className="h2 text-water"><Droplet size={20} /> Água</h2>
      <div className="card">
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold tabular-nums">{fmtNum(ml / 1000, 2)} L</p>
          <p className="muted">meta {fmtNum(goal / 1000, 2)} L {kg ? "" : "(padrão)"}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`${drunk} de ${cups} copos`}>
          {Array.from({ length: cups }, (_, i) => (
            <span key={i} className={`h-8 w-6 rounded-b-lg rounded-t-sm border-2 ${i < drunk ? "border-water bg-water" : "border-line"}`} aria-hidden />
          ))}
        </div>
        <p className="muted mt-2">{ml >= goal ? "Meta batida! 🎉" : `Faltam ${Math.max(0, cups - drunk)} copos de 250 ml.`}</p>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {[250, 500, 750].map((n) => (
            <button key={n} className="btn !bg-water !text-white" onClick={() => add(n)}>+{n} ml</button>
          ))}
        </div>
        {ml > 0 && <button className="btn btn-secondary" onClick={() => add(-250)}><Undo2 size={18} /> Desfazer 250 ml</button>}
      </div>
    </>
  );
}

function Weight({ state, update, profile, kg }: Props & { profile: Profile | null; kg: number | null }) {
  const [val, setVal] = useState(kg ?? 65);
  const [showAll, setShowAll] = useState(false);
  const today = dayKey();
  const list = state.weights;
  const first = list[0];
  const save = () =>
    update((s) => ({
      ...s,
      weights: [...s.weights.filter((w) => w.date !== today), { date: today, kg: val }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  const e = profile && kg ? eta(profile, kg) : null;
  const b = profile && kg ? bmi(kg, profile.heightCm) : null;
  const range = profile ? healthyRange(profile.heightCm) : null;

  return (
    <>
      <h2 className="h2 text-weight"><Scale size={20} /> Peso</h2>
      <div className="card">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-3xl font-bold tabular-nums">{kg ? `${fmtNum(kg)} kg` : "Sem registro"}</p>
          {kg && first && list.length > 1 && (
            <p className="muted">{kg - first.kg <= 0 ? "−" : "+"}{fmtNum(Math.abs(kg - first.kg))} kg desde {fmtDate(first.date)}</p>
          )}
        </div>

        {profile?.targetKg && kg && (
          <div className="mt-3 rounded-xl bg-weight-soft p-3">
            <p className="flex items-center gap-2 font-semibold"><Target size={18} /> Meta: {fmtNum(profile.targetKg)} kg</p>
            {e?.kind === "reached" && <p className="mt-1">Você chegou na meta! 🎉</p>}
            {e?.kind === "eta" && (
              <p className="mt-1">
                Faltam <b>{fmtNum(Math.abs(kg - profile.targetKg))} kg</b>. Seguindo o plano (~{fmtNum(e.kgPerWeek, 2)} kg por semana),
                você chega lá por volta de <b>{e.date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b> (≈ {e.weeks} semanas).
              </p>
            )}
            {e?.kind === "mismatch" && <p className="mt-1">Seu objetivo atual não leva até essa meta. Ajuste em “Editar meus dados”.</p>}
          </div>
        )}

        {b && range && (
          <p className="muted mt-3">
            IMC {fmtNum(b)}: {bmiLabel(b)}. Faixa recomendada para sua altura: {fmtNum(range.min)}–{fmtNum(range.max)} kg.
            O IMC é só uma referência e não mede saúde sozinho.
          </p>
        )}

        {list.length >= 2 && <Chart data={list.slice(-30)} target={profile?.targetKg} />}

        <p className="label">Registrar peso de hoje</p>
        <Stepper label="Peso de hoje" value={val} onChange={setVal} step={0.1} decimals={1} min={30} max={300} unit="kg" />
        <button className="btn !bg-weight !text-white" onClick={save}>Salvar peso</button>

        {list.length > 0 && (
          <>
            <button onClick={() => setShowAll(!showAll)} aria-expanded={showAll} className="mt-3 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-accent">
              Histórico ({list.length}) <ChevronRight size={16} className={showAll ? "rotate-90" : ""} />
            </button>
            {showAll && [...list].reverse().map((w) => (
              <div key={w.date} className="flex items-center justify-between border-t border-line py-2">
                <span>{fmtDate(w.date)}</span>
                <span className="flex items-center gap-2"><b className="tabular-nums">{fmtNum(w.kg)} kg</b>
                  <button aria-label={`Remover registro de ${fmtDate(w.date)}`} className="grid h-10 w-10 place-items-center text-muted"
                    onClick={() => update((s) => ({ ...s, weights: s.weights.filter((x) => x.date !== w.date) }))}><Trash2 size={18} /></button>
                </span>
              </div>
            ))}
          </>
        )}
        <p className="muted mt-3">O peso varia de um dia para o outro. Olhe a tendência, não um número isolado. Pese-se no mesmo horário, de preferência ao acordar.</p>
      </div>
    </>
  );
}

function Chart({ data, target }: { data: { date: string; kg: number }[]; target?: number }) {
  const W = 320, H = 130, P = 10;
  const ys = data.map((d) => d.kg).concat(target ? [target] : []);
  const min = Math.min(...ys) - 0.5, max = Math.max(...ys) + 0.5;
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - 2 * P);
  const pts = data.map((d, i) => [P + (i * (W - 2 * P)) / (data.length - 1), y(d.kg)]);
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico do peso nos últimos registros">
        {target && (
          <>
            <line x1={P} x2={W - P} y1={y(target)} y2={y(target)} stroke="var(--weight)" strokeDasharray="5 5" strokeWidth="1.5" opacity=".7" />
            <text x={W - P} y={y(target) - 4} textAnchor="end" fontSize="11" fill="var(--weight)">meta</text>
          </>
        )}
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--weight)" strokeWidth="3" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--weight)" />)}
      </svg>
      <div className="flex justify-between text-xs text-muted"><span>{fmtDate(data[0].date)}</span><span>{fmtDate(data[data.length - 1].date)}</span></div>
    </div>
  );
}

function ProfileEditor({ state, update, onClose }: Props & { onClose: () => void }) {
  const [p, setP] = useState<Profile>(defaultProfile(state));
  const [kg, setKg] = useState(latestKg(state) ?? 65);
  const set = (x: Partial<Profile>) => setP((o) => ({ ...o, ...x }));
  const save = () => {
    const today = dayKey();
    update((s) => ({
      ...s,
      profile: p,
      weights: latestKg(s) === kg ? s.weights
        : [...s.weights.filter((w) => w.date !== today), { date: today, kg }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="Meus dados e objetivo">
      <AboutFields p={p} set={set} kg={kg} setKg={setKg} />
      <h3 className="h2">Atividade</h3>
      <ActivityFields p={p} set={set} />
      <h3 className="h2">Objetivo</h3>
      <GoalFields p={p} set={set} kg={kg} />
      <div className="card bg-soft border-0 text-center">
        <p className="muted">Com esses dados, seu limite fica em</p>
        <p className="text-3xl font-bold">{plan(p, kg).target} kcal/dia</p>
      </div>
      <button className="btn" onClick={save}>Salvar</button>
    </Sheet>
  );
}
