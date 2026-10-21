"use client";

import { useEffect, useMemo, useState } from "react";
import { Rocket, Shuffle } from "lucide-react";
import { tinyStep } from "@/lib/breakdown";
import { State, dayKey, todayTasks } from "@/lib/store";
import { Ring, Sheet } from "./ui";

type Props = { state: State; update: (fn: (s: State) => State) => void; onClose: () => void };
type Idea = { from: string; step: string };

// Sugestões de onde começar, da mais urgente para a menos.
function ideas(s: State): Idea[] {
  const out: Idea[] = [];
  for (const t of todayTasks(s)) {
    if (t.done) continue;
    const i = t.task.steps.findIndex((_, k) => !s.stepDone[`${t.key}|${k}`]);
    out.push({ from: t.task.name, step: i >= 0 ? t.task.steps[i] : tinyStep(t.task.name) });
  }
  for (const th of s.thoughts) if (th.bucket === "hoje" && !th.done) out.push({ from: th.text, step: tinyStep(th.text) });
  for (const st of [...s.studyTasks].filter((x) => !x.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 2)) {
    out.push({ from: st.title, step: `Abrir o material de “${st.title}” e ler só o título` });
  }
  return out;
}

export default function Arranque({ state, update, onClose }: Props) {
  const list = useMemo(() => ideas(state), [state]);
  const [i, setI] = useState(0);
  const [custom, setCustom] = useState("");
  const [phase, setPhase] = useState<"pick" | "run" | "done">("pick");
  const [mins, setMins] = useState(2);
  const [endsAt, setEndsAt] = useState(0);
  const [, tick] = useState(0);
  const idea: Idea | null = custom.trim() ? { from: custom.trim(), step: tinyStep(custom) } : list[i % Math.max(1, list.length)] ?? null;
  const left = endsAt - Date.now();

  useEffect(() => {
    if (phase !== "run") return;
    const t = setInterval(() => {
      tick((n) => n + 1);
      if (Date.now() >= endsAt) setPhase("done");
    }, 500);
    return () => clearInterval(t);
  }, [phase, endsAt]);

  const start = (m: number) => {
    if (phase === "pick") update((s) => ({ ...s, starts: { ...s.starts, [dayKey()]: (s.starts[dayKey()] ?? 0) + 1 } }));
    setMins(m);
    setEndsAt(Date.now() + m * 60000);
    setPhase("run");
  };
  const fmt = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <Sheet open onClose={onClose} title="Só 2 minutos">
      {phase === "pick" && (
        <div className="rise">
          <p className="mt-3 text-muted">Começar é a parte mais difícil. Você não precisa terminar nada, só fazer <b>isto</b> por 2 minutos.</p>
          {idea ? (
            <div className="card hero border-0 text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-muted">Para: {idea.from}</p>
              <p className="mt-2 text-2xl font-extrabold leading-snug">{idea.step}</p>
            </div>
          ) : (
            <div className="card text-center"><p>Escreva abaixo o que você está adiando e eu te dou o primeiro passo.</p></div>
          )}
          <button className="btn" disabled={!idea} onClick={() => start(2)}><Rocket size={20} /> Começar 2 minutos</button>
          {list.length > 1 && !custom && (
            <button className="btn btn-secondary" onClick={() => setI(i + 1)}><Shuffle size={18} /> Outra coisa</button>
          )}
          <label className="label" htmlFor="ar-custom">Ou: o que você está adiando?</label>
          <input id="ar-custom" className="field" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="ex.: responder o e-mail da faculdade" />
        </div>
      )}
      {phase === "run" && idea && (
        <div className="rise flex flex-col items-center pt-6 text-center">
          <Ring pct={1 - left / (mins * 60000)} color="var(--accent)" size={200} stroke={14}>
            <span className="block text-4xl font-extrabold tabular-nums">{fmt(left)}</span>
          </Ring>
          <p className="mt-5 text-xl font-extrabold">{idea.step}</p>
          <p className="muted mt-1">Só isso. Pode parar quando o tempo acabar.</p>
          <button className="btn" onClick={() => setPhase("done")}>Já comecei! 🎉</button>
        </div>
      )}
      {phase === "done" && (
        <div className="rise pt-6 text-center">
          <p className="text-6xl">🎉</p>
          <p className="mt-3 text-2xl font-extrabold">Você começou!</p>
          <p className="mt-1">Essa era a parte mais difícil. Agora você decide: parar aqui também conta como vitória.</p>
          <button className="btn" onClick={() => start(10)}>Continuar mais 10 min</button>
          <button className="btn btn-secondary" onClick={onClose}>Parar aqui, já valeu 💛</button>
        </div>
      )}
    </Sheet>
  );
}
