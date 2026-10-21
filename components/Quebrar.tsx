"use client";

import { useState } from "react";
import { Plus, Scissors, Trash2 } from "lucide-react";
import { Step, breakdown } from "@/lib/breakdown";
import { State, dayKey, uid } from "@/lib/store";
import { Sheet } from "./ui";

type Props = { initial?: string; update: (fn: (s: State) => State) => void; onClose: () => void; onSaved?: () => void };

export default function Quebrar({ initial = "", update, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial);
  const [steps, setSteps] = useState<Step[] | null>(initial ? breakdown(initial).steps : null);
  const [matched, setMatched] = useState(initial ? breakdown(initial).matched : true);
  const [day, setDay] = useState(dayKey());
  const total = (steps ?? []).reduce((a, s) => a + s.min, 0);

  const run = () => {
    const r = breakdown(name);
    setSteps(r.steps);
    setMatched(r.matched);
  };
  const edit = (i: number, patch: Partial<Step>) => setSteps(steps!.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const save = () => {
    const clean = steps!.filter((s) => s.text.trim());
    update((s) => ({
      ...s,
      tasks: [...s.tasks, { id: uid(), name: name.trim(), steps: clean.map((x) => `${x.text.trim()} (${x.min} min)`), days: [], time: "", essential: false, once: day }],
    }));
    onSaved?.();
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title="Quebrar tarefa grande">
      <label className="label" htmlFor="qb-name">Qual é a tarefa que parece enorme?</label>
      <div className="flex gap-2">
        <input id="qb-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: estudar para a prova de inglês"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && run()} />
      </div>
      <button className="btn" disabled={!name.trim()} onClick={run}><Scissors size={18} /> Quebrar em passos</button>

      {steps && (
        <div className="rise">
          {!matched && <p className="muted mt-3">Usei passos genéricos. Edite para ficar do seu jeito.</p>}
          <p className="mt-4 text-sm font-extrabold uppercase tracking-wide text-muted">{steps.length} passos · ~{total} min no total</p>
          {steps.map((s, i) => (
            <div key={i} className="mt-2 flex items-start gap-2">
              <span className="mt-2.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-sm font-bold text-accent">{i + 1}</span>
              <textarea rows={2} className="field flex-1 resize-none py-2 leading-snug" value={s.text} aria-label={`Passo ${i + 1}`} onChange={(e) => edit(i, { text: e.target.value })} />
              <input className="field !min-h-[46px] !w-14 shrink-0 !px-1 text-center" inputMode="numeric" aria-label={`Minutos do passo ${i + 1}`} value={s.min}
                onChange={(e) => edit(i, { min: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
              <button aria-label={`Remover passo ${i + 1}`} className="grid h-11 w-8 shrink-0 place-items-center text-muted" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button className="btn btn-small btn-secondary" onClick={() => setSteps([...steps, { text: "", min: 5 }])}><Plus size={18} /> Passo</button>
          <label className="label" htmlFor="qb-day">Quando vou fazer</label>
          <input id="qb-day" type="date" className="field" value={day} onChange={(e) => setDay(e.target.value)} />
          <button className="btn" disabled={!steps.some((s) => s.text.trim()) || !day} onClick={save}>
            Salvar {day === dayKey() ? "para hoje" : "no dia escolhido"}
          </button>
          <p className="muted mt-2 text-center">Vai aparecer em “Agora”, um passo de cada vez.</p>
        </div>
      )}
    </Sheet>
  );
}
