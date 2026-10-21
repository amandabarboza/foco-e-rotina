"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { State, activity, dayKey, doneOn } from "@/lib/store";

// Mostra o que foi feito (nunca o que faltou). Perder um dia não zera nada.
export default function Conquistas({ state, onStart }: { state: State; onStart: () => void }) {
  const [all, setAll] = useState(false);
  const done = doneOn(state, dayKey());
  const { active, streak } = activity(state, 30);
  const shown = all ? done : done.slice(0, 4);
  return (
    <div className="card">
      <p className="flex items-center gap-2 text-lg font-extrabold"><Sparkles size={20} className="text-accent" /> Você já fez hoje</p>
      {done.length ? (
        <ul className="mt-2 space-y-1.5">
          {shown.map((d, i) => <li key={i} className="rise rounded-xl bg-bg px-3 py-2" style={{ animationDelay: `${i * 40}ms` }}>{d}</li>)}
        </ul>
      ) : (
        <>
          <p className="mt-1">Ainda nada, e tudo bem. Que tal começar com só 2 minutos?</p>
          <button className="btn btn-small" onClick={onStart}>Só 2 minutos</button>
        </>
      )}
      {done.length > 4 && (
        <button className="mt-2 flex min-h-[44px] items-center gap-1 text-sm font-bold text-accent" onClick={() => setAll(!all)}>
          {all ? "Ver menos" : `Ver todas (${done.length})`} <ChevronRight size={16} className={all ? "-rotate-90" : "rotate-90"} />
        </button>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-soft p-3">
          <p className="text-2xl font-extrabold text-accent">{streak}</p>
          <p className="text-xs text-muted">{streak === 1 ? "dia seguido" : "dias seguidos"} se cuidando</p>
        </div>
        <div className="rounded-2xl bg-med-soft p-3">
          <p className="text-2xl font-extrabold text-med">{active}</p>
          <p className="text-xs text-muted">dias ativos nos últimos 30</p>
        </div>
      </div>
    </div>
  );
}
