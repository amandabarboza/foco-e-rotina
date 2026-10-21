"use client";

import { useEffect, useState } from "react";

// Modo calma: tela escura, sem som, só respiração e o essencial.
const PHASES = [
  { label: "Inspire pelo nariz", secs: 4, scale: 1 },
  { label: "Segure", secs: 4, scale: 1 },
  { label: "Solte devagar pela boca", secs: 6, scale: 0.55 },
];
const TIPS = ["Fone ou abafador de ruído", "Diminuir a luz", "Um copo de água", "Um lugar quieto", "Cobertor ou algo com peso", "Avisar alguém de confiança"];

export default function Calma({ onClose }: { onClose: () => void }) {
  const [{ i, left }, setT] = useState({ i: 0, left: PHASES[0].secs });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const t = setInterval(() => {
      setT(({ i, left }) => (left > 1 ? { i, left: left - 1 } : { i: (i + 1) % PHASES.length, left: PHASES[(i + 1) % PHASES.length].secs }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const p = PHASES[i];
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center overflow-y-auto bg-[#141016] px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(32px+env(safe-area-inset-top))] text-[#d9cfdc]"
      role="dialog" aria-modal="true" aria-label="Modo calma">
      <p className="text-sm opacity-70">Você está segura. Respire comigo.</p>
      <div className="relative my-10 grid h-64 w-64 place-items-center">
        <div className="absolute inset-0 rounded-full bg-[#3a2c42]"
          style={{ transform: `scale(${mounted ? p.scale : 0.55})`, transition: `transform ${p.secs}s ease-in-out`, opacity: 0.8 }} />
        <div className="relative text-center">
          <p className="text-xl font-bold">{p.label}</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums opacity-80">{left}</p>
        </div>
      </div>
      <div className="w-full max-w-[420px] rounded-3xl bg-[#1e1822] p-5">
        <p className="font-bold">Se ajudar:</p>
        <ul className="mt-2 space-y-1.5 opacity-90">{TIPS.map((t) => <li key={t}>· {t}</li>)}</ul>
      </div>
      <button onClick={onClose} className="mt-8 min-h-[54px] w-full max-w-[420px] rounded-full bg-[#2a2130] font-bold">Estou melhor</button>
    </div>
  );
}
