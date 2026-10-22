"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { CATS, FOODS, Food, FoodCat, foodById, searchFoods } from "@/lib/foods";
import { MEALS, MealId } from "@/lib/body";
import { Meal, State, uid } from "@/lib/store";
import { Chips, Sheet, Stepper } from "./ui";

type Props = {
  open: boolean;
  onClose: () => void;
  meal: MealId;
  state: State;
  onAdd: (m: Meal) => void;
};

export default function FoodPicker({ open, onClose, meal: initialMeal, state, onAdd }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<FoodCat | "todos">("todos");
  const [picked, setPicked] = useState<Food | null>(null);
  const [qty, setQty] = useState(1);
  const [meal, setMeal] = useState<MealId>(initialMeal);
  const [manual, setManual] = useState(false);
  const [mName, setMName] = useState("");
  const [mKcal, setMKcal] = useState("");

  // Alimentos usados recentemente, para adicionar em dois toques.
  const recent = useMemo(() => {
    const ids: string[] = [];
    for (const day of Object.keys(state.meals).sort().reverse()) {
      for (const m of state.meals[day]) if (m.foodId && !ids.includes(m.foodId)) ids.push(m.foodId);
      if (ids.length >= 6) break;
    }
    return ids.map(foodById).filter(Boolean) as Food[];
  }, [state.meals]);

  const reset = () => { setPicked(null); setQty(1); setManual(false); setQ(""); setMName(""); setMKcal(""); };
  const close = () => { reset(); onClose(); };
  const list = searchFoods(q).filter((f) => cat === "todos" || f.cat === cat);

  const mealChips = (
    <>
      <p className="label">Refeição</p>
      <Chips options={MEALS.map((m) => m.id)} value={meal} onChange={setMeal} render={(id) => MEALS.find((m) => m.id === id)!.label} />
    </>
  );

  let body;
  if (picked) {
    const r = (v: number) => Math.round(v * qty * 10) / 10;
    body = (
      <>
        <button onClick={() => setPicked(null)} className="mt-3 flex min-h-[44px] items-center gap-1 text-accent"><ChevronLeft size={20} /> Voltar à lista</button>
        <p className="mt-2 text-2xl font-bold">{picked.name}</p>
        <p className="muted">1 porção = {picked.portion}</p>
        <p className="label">Quantas porções?</p>
        <Stepper label="Porções" value={qty} onChange={setQty} step={0.5} min={0.5} max={10} decimals={1} />
        {mealChips}
        <div className="card bg-food-soft text-center">
          <p className="text-3xl font-bold">{Math.round(picked.kcal * qty)} kcal</p>
          <p className="text-sm">Proteína {r(picked.p)} g · Carbo {r(picked.c)} g · Gordura {r(picked.f)} g</p>
        </div>
        <button className="btn" onClick={() => {
          onAdd({ id: uid(), name: picked.name, foodId: picked.id, qty, meal, kcal: Math.round(picked.kcal * qty), p: r(picked.p), c: r(picked.c), f: r(picked.f) });
          close();
        }}>Adicionar</button>
      </>
    );
  } else if (manual) {
    body = (
      <>
        <button onClick={() => setManual(false)} className="mt-3 flex min-h-[44px] items-center gap-1 text-accent"><ChevronLeft size={20} /> Voltar à lista</button>
        <label className="label" htmlFor="fp-name">O que comeu</label>
        <input id="fp-name" className="field" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="ex.: marmita do restaurante" />
        <label className="label" htmlFor="fp-kcal">Calorias (veja no rótulo)</label>
        <input id="fp-kcal" className="field" inputMode="numeric" value={mKcal} onChange={(e) => setMKcal(e.target.value.replace(/\D/g, ""))} placeholder="ex.: 550" />
        {mealChips}
        <button className="btn" disabled={!mName.trim() || !mKcal} onClick={() => {
          onAdd({ id: uid(), name: mName.trim(), meal, kcal: Number(mKcal) });
          close();
        }}>Adicionar</button>
      </>
    );
  } else {
    body = (
      <>
        <div className="sticky top-0 z-10 bg-card pb-2 pt-3">
          <div className="flex items-center gap-2 rounded-xl border-2 border-line bg-bg px-3">
            <Search size={20} className="text-muted" />
            <input className="min-h-[48px] flex-1 bg-transparent outline-none" placeholder="Buscar alimento…" aria-label="Buscar alimento"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
            {(["todos", ...Object.keys(CATS)] as (FoodCat | "todos")[]).map((c) => (
              <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                className={`min-h-[44px] shrink-0 rounded-full px-3 text-sm ${cat === c ? "bg-food font-semibold text-[var(--on-color)]" : "border-2 border-line"}`}>
                {c === "todos" ? "Todos" : CATS[c]}
              </button>
            ))}
          </div>
        </div>
        {!q && cat === "todos" && recent.length > 0 && (
          <>
            <p className="mt-2 text-sm font-semibold text-muted">USADOS RECENTEMENTE</p>
            {recent.map((f) => <FoodRow key={f.id} f={f} onPick={() => setPicked(f)} />)}
            <p className="mt-4 text-sm font-semibold text-muted">TODOS</p>
          </>
        )}
        {list.map((f) => <FoodRow key={f.id} f={f} onPick={() => setPicked(f)} />)}
        {!list.length && <p className="mt-4 text-center">Não achei “{q}”.</p>}
        <button className="btn btn-secondary" onClick={() => { setManual(true); setMName(q); }}>Não achei: digitar as calorias</button>
        <p className="muted mt-2 text-center">Valores aproximados ({FOODS.length} alimentos, base Tabela TACO).</p>
      </>
    );
  }

  return <Sheet open={open} onClose={close} title="Adicionar comida">{body}</Sheet>;
}

function FoodRow({ f, onPick }: { f: Food; onPick: () => void }) {
  return (
    <button onClick={onPick} className="flex min-h-[60px] w-full items-center justify-between gap-3 border-b border-line py-2 text-left">
      <span><span className="block font-semibold">{f.name}</span><span className="muted block">{f.portion}</span></span>
      <span className="shrink-0 font-semibold tabular-nums text-food">{f.kcal} kcal</span>
    </button>
  );
}
