import { useEffect, useRef, useState } from "react";
import { Focus, State, dayKey } from "@/lib/store";

type Props = { state: State; update: (fn: (s: State) => State) => void };

const LABELS = ["Estudo", "Trabalho", "Casa", "Outro"];
const FOCUS_MIN = [15, 25, 45];
const BREAK_MIN = [5, 10, 15];

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function Foco({ state, update }: Props) {
  const [label, setLabel] = useState("Estudo");
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [finished, setFinished] = useState<Focus["phase"] | null>(null);
  const [, setTick] = useState(0);
  const audio = useRef<AudioContext | null>(null);

  const f = state.focus;
  const left = f ? (f.endsAt ? f.endsAt - Date.now() : f.leftMs) : 0;

  useEffect(() => {
    if (!f?.endsAt) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [f?.endsAt]);

  // Fim do bloco: registra minutos de foco, avisa e volta para a tela inicial.
  useEffect(() => {
    if (!f?.endsAt || left > 0) return;
    const phase = f.phase;
    update((s) => {
      if (!s.focus) return s;
      const today = dayKey();
      const focusLog = phase === "focus" ? { ...s.focusLog, [today]: (s.focusLog[today] ?? 0) + s.focus.minutes } : s.focusLog;
      return { ...s, focus: null, focusLog };
    });
    setFinished(phase);
    chime(audio.current);
    const title = phase === "focus" ? "Bloco de foco concluído 🎉" : "Pausa acabou";
    const body = phase === "focus" ? "Hora de uma pausa: levanta, bebe água, alonga." : "Quando quiser, comece outro bloco.";
    if ("Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker?.getRegistration().then((r) => r?.showNotification(title, { body, tag: "foco" }));
    }
  }, [f?.endsAt, f?.phase, left, update]);

  const start = (phase: Focus["phase"], minutes: number, lbl = label) => {
    // O áudio só pode ser liberado em um toque do usuário (iOS).
    try {
      audio.current ??= new AudioContext();
      audio.current.resume();
    } catch {}
    setFinished(null);
    update((s) => ({ ...s, focus: { label: lbl, phase, minutes, endsAt: Date.now() + minutes * 60000, leftMs: 0 } }));
  };
  const pause = () => update((s) => (s.focus ? { ...s, focus: { ...s.focus, endsAt: null, leftMs: left } } : s));
  const resume = () => update((s) => (s.focus ? { ...s, focus: { ...s.focus, endsAt: Date.now() + s.focus.leftMs } } : s));
  const stop = () => {
    if (!confirm("Encerrar este bloco?")) return;
    const done = f && f.phase === "focus" ? Math.floor((f.minutes * 60000 - left) / 60000) : 0;
    update((s) => {
      const today = dayKey();
      return { ...s, focus: null, focusLog: done > 0 ? { ...s.focusLog, [today]: (s.focusLog[today] ?? 0) + done } : s.focusLog };
    });
  };

  const todayMin = state.focusLog[dayKey()] ?? 0;

  if (f) {
    const total = f.minutes * 60000;
    const pct = Math.min(1, Math.max(0, 1 - left / total));
    const warnAt = (f.minutes >= 25 ? 5 : 2) * 60000;
    const R = 90, C = 2 * Math.PI * R;
    return (
      <>
        <h1 className="mb-1 text-2xl font-bold">{f.phase === "focus" ? f.label : "Pausa"}</h1>
        <div className="card bg-soft px-5 py-6 text-center">
          <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[260px]" role="img" aria-label={`Faltam ${fmt(left)}`}>
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--card)" strokeWidth="16" />
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--accent)" strokeWidth="16" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * pct} transform="rotate(-90 110 110)" />
            <text x="110" y="122" textAnchor="middle" fontSize="40" fontWeight="700" fill="var(--ink)">{fmt(left)}</text>
          </svg>
          {f.phase === "focus" && left <= warnAt && left > 0 && (
            <p className="mt-2 rounded-xl bg-warm p-2">Faltam poucos minutos: hora de ir fechando o que está fazendo.</p>
          )}
          {f.phase === "break" && <p className="mt-2">Levanta, bebe água, olha pela janela. 🌿</p>}
          {f.endsAt ? (
            <button className="btn" onClick={pause}>Pausar</button>
          ) : (
            <button className="btn" onClick={resume}>Continuar</button>
          )}
          <button className="btn btn-secondary" onClick={stop}>Encerrar</button>
        </div>
        <p className="text-sm text-muted">
          No iPhone, o aviso de fim só toca com o app aberto. Se sair do app, ao voltar o tempo estará certo.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Foco</h1>
      {finished === "focus" && (
        <div className="card bg-soft text-center">
          <p className="text-xl font-bold">Bloco concluído 🎉</p>
          <p>Seu cérebro merece uma pausa.</p>
          <button className="btn" onClick={() => start("break", breakMin)}>Pausa de {breakMin} min</button>
          <button className="btn btn-secondary" onClick={() => setFinished(null)}>Agora não</button>
        </div>
      )}
      {finished === "break" && (
        <div className="card bg-soft text-center">
          <p className="text-xl font-bold">Pausa concluída</p>
          <button className="btn" onClick={() => start("focus", focusMin)}>Mais um bloco de {focusMin} min</button>
          <button className="btn btn-secondary" onClick={() => setFinished(null)}>Parar por hoje</button>
        </div>
      )}
      <div className="card">
        <p className="font-semibold">No que vou focar?</p>
        <Chips options={LABELS} value={label} onChange={setLabel} render={(x) => x} />
        <p className="mt-4 font-semibold">Duração do foco</p>
        <Chips options={FOCUS_MIN} value={focusMin} onChange={setFocusMin} render={(x) => `${x} min`} />
        <p className="mt-4 font-semibold">Duração da pausa</p>
        <Chips options={BREAK_MIN} value={breakMin} onChange={setBreakMin} render={(x) => `${x} min`} />
        <button className="btn" onClick={() => start("focus", focusMin)}>Começar</button>
      </div>
      <p className="text-center text-muted">Hoje: {todayMin} min de foco</p>
      <p className="mt-2 text-sm text-muted">Dica: antes de começar, deixe água por perto e o celular no silencioso. Se travar, comece com 15 min.</p>
    </>
  );
}

function Chips<T extends string | number>({ options, value, onChange, render }: {
  options: T[]; value: T; onChange: (v: T) => void; render: (v: T) => string;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} aria-pressed={value === o}
          className={`min-h-[44px] rounded-full px-4 ${value === o ? "bg-accent font-semibold text-accent-ink" : "border-2 border-line"}`}>
          {render(o)}
        </button>
      ))}
    </div>
  );
}

// Som curto e suave (duas notas), sem susto.
function chime(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    [660, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.35;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.05);
      g.gain.linearRampToValueAtTime(0, t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.65);
    });
  } catch {}
}
