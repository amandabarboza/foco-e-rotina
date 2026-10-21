"use client";

import { useCallback, useEffect, useState } from "react";
import { DoseStatus, Med, REPEAT_MIN, State, loadState, nextPending, saveState } from "@/lib/store";
import { BookOpen, HeartPulse, House, ListChecks, Settings } from "lucide-react";
import Inicio, { Tab } from "./Agora";
import Rotina from "./Rotina";
import Estudos from "./Estudos";
import Ajustes from "./Ajustes";
import Corpo from "./Corpo";
import Onboarding from "./Onboarding";
import Transicao from "./Transicao";

const TABS: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: "inicio", label: "Início", Icon: House },
  { id: "rotina", label: "Rotina", Icon: ListChecks },
  { id: "estudos", label: "Estudos", Icon: BookOpen },
  { id: "corpo", label: "Corpo", Icon: HeartPulse },
  { id: "ajustes", label: "Ajustes", Icon: Settings },
];

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState<Tab>("inicio");
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
  if (!state.onboarded) return <Onboarding state={state} update={update} />;

  const go = (t: Tab) => {
    setTab(t);
    window.scrollTo(0, 0);
  };

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
      <main className="mx-auto max-w-[560px] pt-2">
        <Transicao state={state} update={update} />
        {tab === "inicio" && <Inicio state={state} update={update} mark={mark} snooze={snooze} go={go} />}
        {tab === "rotina" && <Rotina state={state} update={update} saveMed={saveMed} deleteMed={deleteMed} />}
        {tab === "estudos" && <Estudos state={state} update={update} />}
        {tab === "corpo" && <Corpo state={state} update={update} />}
        {tab === "ajustes" && <Ajustes state={state} replaceAll={replaceAll} update={update} />}
      </main>
      <nav className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[540px] rounded-[30px] border border-line bg-card/90 px-1 shadow-[0_12px_40px_-12px_rgba(120,60,90,.35)] backdrop-blur-xl" aria-label="Navegação">
        <div className="grid grid-cols-5">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => go(id)} aria-current={tab === id ? "page" : undefined}
              className={`flex min-h-[62px] flex-col items-center justify-center gap-0.5 text-[.72rem] ${tab === id ? "font-extrabold text-accent" : "text-muted"}`}>
              <span className={`grid h-8 w-12 place-items-center rounded-full transition ${tab === id ? "bg-soft" : ""}`}>
                <Icon size={21} strokeWidth={tab === id ? 2.4 : 1.9} />
              </span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
