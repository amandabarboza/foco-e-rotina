"use client";

import { useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { MEALS, MealId, plan } from "@/lib/body";
import { foodById } from "@/lib/foods";
import { State, dayKey, latestKg, uid } from "@/lib/store";
import { fmtNum } from "./ui";

type Props = { state: State; update: (fn: (s: State) => State) => void; onBack: () => void };

// Modelo de cada refeição: [alimento, porções base, escala com as calorias?]
const MENU: Record<MealId, [string, number, boolean][]> = {
  cafe: [["pao-frances", 1, true], ["ovo", 1, true], ["cafe-leite", 1, false], ["mamao", 1, true]],
  almoco: [["arroz", 3, true], ["feijao", 1, true], ["frango", 1, true], ["salada", 1, false], ["legumes", 1, false], ["azeite", 0.5, false]],
  lanche: [["iogurte", 1, true], ["banana", 1, true], ["aveia", 1, true]],
  jantar: [["arroz", 2, true], ["feijao", 1, true], ["peixe", 1, true], ["salada", 1, false], ["brocolis", 1, false], ["azeite", 0.5, false]],
};

function buildMeal(meal: MealId, kcalTarget: number) {
  const base = MENU[meal].map(([id, qty, flex]) => ({ food: foodById(id)!, qty, flex }));
  const fixed = base.filter((b) => !b.flex).reduce((a, b) => a + b.food.kcal * b.qty, 0);
  const flexKcal = base.filter((b) => b.flex).reduce((a, b) => a + b.food.kcal * b.qty, 0);
  const factor = Math.max(0.3, (kcalTarget - fixed) / flexKcal);
  const items = base.map((b) => ({ ...b, qty: b.flex ? Math.max(0.5, Math.round(b.qty * factor * 2) / 2) : b.qty }));
  return { items, kcal: Math.round(items.reduce((a, b) => a + b.food.kcal * b.qty, 0)) };
}

const SWAPS = [
  ["Refrigerante", "Água com gás e limão, ou suco natural sem açúcar"],
  ["Pão branco todo dia", "Pão integral ou cuscuz em alguns dias"],
  ["Fritura", "Assado, grelhado ou na airfryer"],
  ["Doce depois do almoço", "Uma fruta; o doce pode ficar para o fim de semana, sem culpa"],
  ["Salgadinho no lanche", "Pipoca de panela, castanhas ou iogurte com fruta"],
  ["Pular refeição", "Uma refeição pequena e simples é melhor que ficar sem comer"],
];

export default function Guia({ state, update, onBack }: Props) {
  const [added, setAdded] = useState<MealId[]>([]);
  const kg = latestKg(state);
  const p = state.profile;
  const r = p && kg ? plan(p, kg) : null;
  const target = r?.target ?? 1800;

  const addMeal = (meal: MealId) => {
    const { items } = buildMeal(meal, target * MEALS.find((m) => m.id === meal)!.share);
    const today = dayKey();
    update((s) => ({
      ...s,
      meals: {
        ...s.meals,
        [today]: [
          ...(s.meals[today] ?? []),
          ...items.map(({ food: f, qty }) => ({
            id: uid(), name: f.name, foodId: f.id, qty, meal,
            kcal: Math.round(f.kcal * qty), p: Math.round(f.p * qty * 10) / 10, c: Math.round(f.c * qty * 10) / 10, f: Math.round(f.f * qty * 10) / 10,
          })),
        ],
      },
    }));
    setAdded([...added, meal]);
  };

  return (
    <>
      <button onClick={onBack} className="mt-2 flex min-h-[44px] items-center gap-1 font-bold text-white"><ChevronLeft size={20} /> Corpo</button>
      <h1 className="h1">Guia de reeducação alimentar</h1>
      <p className="card !py-3">Reeducar é mudar aos poucos, não fazer dieta perfeita. Escolha <b>uma</b> coisa por semana para ajustar.</p>

      <h2 className="h2">1. Seu número do dia</h2>
      <div className="card">
        {r ? (
          <>
            <p className="text-3xl font-bold">{r.target} kcal</p>
            <ul className="mt-2 space-y-1">
              <li>🥩 <b>Proteína {r.macros.protein} g</b>: cerca de {Math.max(2, Math.round(r.macros.protein / 30))} porções do tamanho da palma da mão (carne, frango, ovos, peixe).</li>
              <li>🍚 <b>Carboidrato {r.macros.carbs} g</b>: arroz, pão, massa, batata, frutas.</li>
              <li>🥑 <b>Gordura {r.macros.fat} g</b>: azeite, castanhas, abacate, queijos.</li>
            </ul>
          </>
        ) : <p>Preencha seus dados em Corpo para ver seus números. Abaixo uso 1.800 kcal como exemplo.</p>}
      </div>

      <h2 className="h2">2. Monte o prato</h2>
      <div className="card flex items-center gap-4">
        <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label="Prato: metade verduras, um quarto proteína, um quarto carboidrato">
          <circle cx="60" cy="60" r="58" fill="var(--line)" />
          <path d="M60 6 A54 54 0 0 0 60 114 Z" fill="var(--study)" />
          <path d="M60 6 A54 54 0 0 1 114 60 L60 60 Z" fill="var(--weight)" />
          <path d="M114 60 A54 54 0 0 1 60 114 L60 60 Z" fill="var(--food)" />
        </svg>
        <ul className="space-y-1 text-[.95rem]">
          <li><span className="font-bold text-study">½ verduras e legumes</span>: salada, cenoura, brócolis</li>
          <li><span className="font-bold text-weight">¼ proteína</span>: frango, carne, ovo, peixe, feijão</li>
          <li><span className="font-bold text-food">¼ carboidrato</span>: arroz, batata, macarrão</li>
        </ul>
      </div>

      <h2 className="h2">3. Cardápio-modelo para {target} kcal</h2>
      <p className="muted">Um exemplo pronto. Toque em “Usar hoje” para lançar no seu dia.</p>
      {MEALS.map((m) => {
        const { items, kcal } = buildMeal(m.id, target * m.share);
        return (
          <div key={m.id} className="card">
            <div className="flex items-baseline justify-between">
              <p className="font-bold">{m.label}</p>
              <p className="muted tabular-nums">≈ {kcal} kcal</p>
            </div>
            <ul className="mt-2 space-y-1">
              {items.map(({ food: f, qty }) => (
                <li key={f.id} className="flex justify-between gap-2">
                  <span>{f.name}</span><span className="muted text-right">{fmtNum(qty)}× {f.portion}</span>
                </li>
              ))}
            </ul>
            <button className="btn btn-small btn-secondary" disabled={added.includes(m.id)} onClick={() => addMeal(m.id)}>
              {added.includes(m.id) ? <><Check size={18} /> Lançado</> : "Usar hoje"}
            </button>
          </div>
        );
      })}

      <h2 className="h2">4. Horários</h2>
      <div className="card">
        <p>Comer em horários parecidos todo dia ajuda o corpo e diminui a fome “do nada”. Uma sugestão:</p>
        <ul className="mt-2 space-y-1">
          <li>☕ Café da manhã: até 1 h depois de acordar</li>
          <li>🍽️ Almoço: 4–5 h depois</li>
          <li>🍎 Lanche: no meio da tarde</li>
          <li>🌙 Jantar: 2–3 h antes de dormir</li>
        </ul>
        <p className="muted mt-2">Dica: em Rotina, o modelo “Comer uma refeição” cria lembretes com passos.</p>
      </div>

      <h2 className="h2">5. Trocas que ajudam</h2>
      <div className="card">
        {SWAPS.map(([a, b]) => (
          <div key={a} className="border-t border-line py-2 first:border-0">
            <p className="text-muted line-through decoration-1">{a}</p>
            <p>→ {b}</p>
          </div>
        ))}
      </div>

      <h2 className="h2">6. Do seu jeito</h2>
      <div className="card space-y-2">
        <p>🧩 <b>Tudo bem repetir.</b> Ter 3–4 refeições “seguras” que você gosta e repete é uma ótima estratégia.</p>
        <p>👅 <b>Texturas e cheiros importam.</b> Se um alimento incomoda, troque por outro do mesmo grupo do prato.</p>
        <p>🍱 <b>Cozinhe uma vez, coma várias.</b> Prepare arroz, feijão e uma proteína para 3 dias e guarde em potes.</p>
        <p>⏰ <b>Fome pode não avisar.</b> Use os lembretes; comer no horário evita exagero depois.</p>
        <p>💧 <b>Sede às vezes parece fome.</b> Beba um copo de água e espere uns minutos.</p>
        <p>💛 <b>Sem culpa.</b> Um dia fora do plano não estraga nada; o que conta é a média das semanas.</p>
      </div>
      <p className="muted mt-4">Orientações gerais, não substituem nutricionista. Com diabetes, gestação, doença renal ou histórico de transtorno alimentar, procure acompanhamento.</p>
      <button className="btn btn-secondary" onClick={onBack}><ChevronLeft size={20} /> Voltar</button>
    </>
  );
}
