"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { State, activity, dayKey, doneOn, weekKey } from "@/lib/store";
import { Face } from "./Faces";

// Mostra o que foi feito (nunca o que faltou). Perder um dia não zera nada.
export default function Conquistas({ state, onStart }: { state: State; onStart: () => void }) {
  const [all, setAll] = useState(false);
  const done = doneOn(state, dayKey());
  const { active, streak } = activity(state, 30);
  const shown = all ? done : done.slice(0, 4);
  return (
    <div className="card">
      <p className="display flex items-center gap-2 text-xl"><Sparkles size={20} className="text-accent" /> Você já fez hoje</p>
      {done.length ? (
        <ul className="mt-2 space-y-1.5">
          {shown.map((d, i) => <li key={i} className="rise rounded-2xl border border-[var(--card-edge)] bg-bg px-3 py-2" style={{ animationDelay: `${i * 40}ms` }}>{d}</li>)}
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
      <Jornada state={state} />
      <p className="mt-2 text-center text-sm font-bold">
        {streak} {streak === 1 ? "dia seguido" : "dias seguidos"} se cuidando · {active} dias ativos no mês
      </p>
    </div>
  );
}

const DAY = ["D", "S", "T", "Q", "Q", "S", "S"];
const PTS: [number, number][] = [[36, 150], [104, 160], [168, 128], [118, 92], [62, 62], [140, 34], [236, 46]];

// A semana como um caminho no mapa: cada pedra é um dia.
function Jornada({ state }: { state: State }) {
  const [y, m, d] = weekKey().split("-").map(Number);
  const today = dayKey();
  const days = PTS.map((_, i) => dayKey(new Date(y, m - 1, d + i)));
  const path = `M${PTS.map((p) => p.join(" ")).join(" L")}`;
  const label = days.map((day, i) => {
    const ok = doneOn(state, day).length > 0;
    return `${["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][i]}: ${day > today ? "ainda não chegou" : ok ? "ativo" : "sem registro"}`;
  }).join("; ");
  return (
    <div className="mt-3 overflow-hidden rounded-[18px] border-2 border-[var(--card-edge)]" style={{ background: "var(--dune1)" }}>
      <svg viewBox="0 0 300 204" className="w-full" role="img" aria-label={`Sua semana: ${label}`}>
        <path d="M0 120 Q60 100 120 118 T300 104 V204 H0Z" fill="var(--dune2)" opacity=".5" />
        <g transform="translate(250 120)" opacity=".9">
          <path d="M0 40 L22 0 L44 40Z" fill="var(--pyr1)" stroke="#3b2414" strokeWidth="2" strokeLinejoin="round" />
          <path d="M22 0 L44 40 L30 40Z" fill="var(--pyr2)" />
        </g>
        <path d={path} fill="none" stroke="var(--card)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#3b2414" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
        {PTS.map(([px, py], i) => {
          const day = days[i];
          const future = day > today;
          const ok = !future && doneOn(state, day).length > 0;
          const mood = state.moods?.[day];
          return (
            <g key={i} transform={`translate(${px} ${py})`}>
              {day === today && (
                <g className="bob">
                  <path d="M10 -30 v-22 l14 6 l-14 6" fill="#e86a4a" stroke="#3b2414" strokeWidth="1.5" />
                </g>
              )}
              <ellipse cx="0" cy="4" rx="19" ry="7" fill="#3b2414" opacity=".2" />
              {mood && !future ? (
                <svg x="-17" y="-17" width="34" height="34" viewBox="0 0 40 40"><Face level={mood} size={34} /></svg>
              ) : (
                <>
                  <circle r="16" fill={ok ? "#7cc28a" : future ? "var(--card)" : "#d6c08a"} stroke="#3b2414" strokeWidth="2.5" strokeDasharray={future ? "4 4" : undefined} />
                  {ok && <path d="M-7 0 l5 5 l9 -10" fill="none" stroke="#3b2414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                </>
              )}
              <text y="32" textAnchor="middle" fontSize="12" fontWeight="800" fill="#3b2414">{DAY[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
