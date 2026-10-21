"use client";

import { useEffect } from "react";
import { Hourglass } from "lucide-react";
import { State, todayDoses, todayTasks } from "@/lib/store";

const WINDOW_MIN = 10;

// Próxima coisa com horário que começa nos próximos 10 minutos.
export function upcoming(s: State, now = Date.now()) {
  const items = [
    ...todayDoses(s).filter((d) => !d.status).map((d) => ({ id: d.id, at: d.at, label: `💊 ${d.med.name}` })),
    ...todayTasks(s).filter((t) => !t.done && t.at !== null).map((t) => ({ id: t.key, at: t.at!, label: `🏠 ${t.task.name}` })),
  ].filter((x) => x.at > now && x.at - now <= WINDOW_MIN * 60000);
  return items.sort((a, b) => a.at - b.at)[0] ?? null;
}

// Aviso no topo antes de uma troca de atividade, para a mudança não pegar de surpresa.
export default function Transicao({ state, update }: { state: State; update: (fn: (s: State) => State) => void }) {
  const next = upcoming(state);

  useEffect(() => {
    if (!next || state.notifiedTransitions[next.id]) return;
    update((s) => ({ ...s, notifiedTransitions: { ...s.notifiedTransitions, [next.id]: true } }));
    if ("Notification" in window && Notification.permission === "granted") {
      const min = Math.ceil((next.at - Date.now()) / 60000);
      navigator.serviceWorker?.getRegistration().then((r) =>
        r?.showNotification(`Em ${min} min: ${next.label}`, { body: "Vá fechando o que está fazendo, sem pressa.", tag: `tr-${next.id}` }));
    }
  }, [next, state.notifiedTransitions, update]);

  if (!next) return null;
  const min = Math.max(1, Math.ceil((next.at - Date.now()) / 60000));
  const pct = 1 - (next.at - Date.now()) / (WINDOW_MIN * 60000);
  return (
    <div className="rise sticky top-[calc(8px+env(safe-area-inset-top))] z-30 mx-auto mb-2 max-w-[560px] overflow-hidden rounded-2xl bg-warm shadow-md" role="status">
      <div className="flex items-center gap-3 px-4 py-3">
        <Hourglass size={20} className="shrink-0 text-food" />
        <p className="flex-1 text-[.95rem]"><b>Em {min} min:</b> {next.label}. Vá fechando o que está fazendo.</p>
      </div>
      <div className="h-1.5 bg-food/20"><div className="h-full bg-food transition-all" style={{ width: `${pct * 100}%` }} /></div>
    </div>
  );
}
