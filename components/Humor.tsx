"use client";

import { State, dayKey } from "@/lib/store";
import { Face, MOODS } from "./Faces";

type Props = { state: State; update: (fn: (s: State) => State) => void };

const REPLIES: Record<number, string> = {
  1: "Sinto muito. Hoje vale só o essencial; que tal ligar o modo baixa energia ou o modo calma?",
  2: "Obrigada por perceber. Vá com calma hoje.",
  3: "Tudo bem estar mais ou menos. Um passo de cada vez.",
  4: "Que bom! Aproveite a energia, sem exagerar.",
  5: "Que dia bom! Registre o que está ajudando. 💛",
};

// Check-in de humor: ajuda a perceber como o corpo e a cabeça estão.
export default function Humor({ state, update }: Props) {
  const today = dayKey();
  const current = state.moods?.[today];
  return (
    <div className="card">
      <p className="display text-xl">Como você está agora?</p>
      <div className="mt-3 flex justify-between" role="radiogroup" aria-label="Como você está">
        {MOODS.map((m) => (
          <button key={m.level} role="radio" aria-checked={current === m.level} aria-label={m.label}
            onClick={() => update((s) => ({ ...s, moods: { ...(s.moods ?? {}), [today]: m.level } }))}
            className={`grid h-14 w-14 place-items-center rounded-full transition ${current === m.level ? "-translate-y-1 scale-110 bg-soft ring-2 ring-[var(--btn-edge)]" : current ? "opacity-50" : ""}`}>
            <Face level={m.level} size={46} />
          </button>
        ))}
      </div>
      {current ? <p className="rise mt-3 text-[.95rem]"><b>{MOODS[current - 1].label}.</b> {REPLIES[current]}</p>
        : <p className="muted mt-2">Toque na carinha que mais combina. Não existe resposta errada.</p>}
    </div>
  );
}
