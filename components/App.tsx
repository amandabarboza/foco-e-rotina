"use client";

import { useCallback, useEffect, useState } from "react";
import { DoseStatus, Med, REPEAT_MIN, State, loadState, nextPending, saveState } from "@/lib/store";
import Agora from "./Agora";
import Hoje from "./Hoje";
import Remedios from "./Remedios";
import Ajustes from "./Ajustes";
import Corpo from "./Corpo";

const TABS = [
  { id: "agora", label: "Agora" },
  { id: "hoje", label: "Hoje" },
  { id: "remedios", label: "Remédios" },
  { id: "corpo", label: "Corpo" },
  { id: "ajustes", label: "Ajustes" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState<Tab>("agora");
  const [, setNow] = useState(0);

  useEffect(() => {
    setState(loadState());
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);

  const update = useCallback((fn: (s: State) => State) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      saveState(next);
      return next;
    });
  }, []);

  // Lembretes enquanto o app está aberto; também re-renderiza para atualizar "Agora".
  useEffect(() => {
    if (!state) return;
    const tick = async () => {
      setNow(Date.now());
      const { due } = nextPending(state);
      if (due && "Notification" in window && Notification.permission === "granted") {
        const last = state.lastNotified[due.id] ?? 0;
        if (Date.now() - last >= REPEAT_MIN * 60000) {
          update((s) => ({ ...s, lastNotified: { ...s.lastNotified, [due.id]: Date.now() } }));
          const opts = { body: due.med.dose || "Hora do remédio", tag: due.id };
          const reg = await navigator.serviceWorker?.getRegistration();
          if (reg) reg.showNotification(`💊 ${due.med.name}`, opts);
          else new Notification(`💊 ${due.med.name}`, opts);
        }
      }
    };
    tick();
    const t = setInterval(tick, 30000);
    const vis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", vis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [state, update]);

  if (!state) return null;

  const mark = (id: string, status: DoseStatus | null) =>
    update((s) => {
      const log = { ...s.log };
      if (status) log[id] = status;
      else delete log[id];
      const snooze = { ...s.snooze };
      delete snooze[id];
      return { ...s, log, snooze };
    });
  const snooze = (id: string) =>
    update((s) => ({ ...s, snooze: { ...s.snooze, [id]: Date.now() + REPEAT_MIN * 60000 } }));
  const saveMed = (med: Med) =>
    update((s) => ({
      ...s,
      meds: s.meds.some((m) => m.id === med.id) ? s.meds.map((m) => (m.id === med.id ? med : m)) : [...s.meds, med],
    }));
  const deleteMed = (id: string) => update((s) => ({ ...s, meds: s.meds.filter((m) => m.id !== id) }));
  const replaceAll = (next: State) => update(() => next);

  return (
    <>
      <main className="mx-auto max-w-[560px] pt-5" aria-live="polite">
        {tab === "agora" && <Agora state={state} mark={mark} snooze={snooze} goAdd={() => setTab("remedios")} />}
        {tab === "hoje" && <Hoje state={state} mark={mark} />}
        {tab === "remedios" && <Remedios state={state} saveMed={saveMed} deleteMed={deleteMed} />}
        {tab === "corpo" && <Corpo state={state} update={update} />}
        {tab === "ajustes" && <Ajustes state={state} replaceAll={replaceAll} />}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`min-h-[60px] text-sm ${tab === t.id ? "font-bold text-accent" : "text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
