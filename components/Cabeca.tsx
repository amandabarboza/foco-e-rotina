"use client";

import { useState } from "react";
import { Brain, Check, ChevronRight, Scissors } from "lucide-react";
import { State, Thought, dayKey, uid } from "@/lib/store";
import Quebrar from "./Quebrar";
import { Sheet } from "./ui";

type Props = { state: State; update: (fn: (s: State) => State) => void };

const setThought = (update: Props["update"], id: string, patch: Partial<Thought>) =>
  update((s) => ({ ...s, thoughts: s.thoughts.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

// Cartão da tela inicial: despejar, organizar e a lista "para hoje".
export default function CabecaCard({ state, update }: Props) {
  const [capture, setCapture] = useState(false);
  const [triage, setTriage] = useState(false);
  const [showLater, setShowLater] = useState(false);
  const untriaged = state.thoughts.filter((t) => !t.bucket);
  const today = state.thoughts.filter((t) => t.bucket === "hoje" && (!t.done || t.doneAt === dayKey()));
  const later = state.thoughts.filter((t) => t.bucket === "depois" && !t.done);

  return (
    <div className="card">
      <p className="flex items-center gap-2 text-lg font-extrabold"><Brain size={20} className="text-med" /> Cabeça cheia?</p>
      <p className="muted">Tire tudo da cabeça sem organizar. Depois a gente separa junto.</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <button className="btn !bg-med !text-[var(--on-color)]" onClick={() => setCapture(true)}>Despejar</button>
        <button className="btn btn-secondary" disabled={!untriaged.length} onClick={() => setTriage(true)}>
          Organizar{untriaged.length ? ` (${untriaged.length})` : ""}
        </button>
      </div>

      {today.length > 0 && (
        <>
          <p className="mt-4 text-sm font-extrabold uppercase tracking-wide text-muted">Para hoje</p>
          {today.map((t) => (
            <button key={t.id} onClick={() => setThought(update, t.id, t.done ? { done: false, doneAt: undefined } : { done: true, doneAt: dayKey() })}
              className={`mt-2 flex min-h-[48px] w-full items-center gap-3 rounded-2xl bg-bg px-3 text-left ${t.done ? "opacity-60" : ""}`} aria-pressed={!!t.done}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${t.done ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>
                {t.done && <Check size={16} />}
              </span>
              <span className={t.done ? "line-through" : ""}>{t.text}</span>
            </button>
          ))}
        </>
      )}
      {later.length > 0 && (
        <>
          <button onClick={() => setShowLater(!showLater)} aria-expanded={showLater} className="mt-3 flex min-h-[44px] items-center gap-1 text-sm font-bold text-accent">
            Outro dia ({later.length}) <ChevronRight size={16} className={showLater ? "rotate-90" : ""} />
          </button>
          {showLater && later.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 border-t border-line py-2">
              <span>{t.text}</span>
              <button className="btn btn-small btn-secondary !m-0 shrink-0" onClick={() => setThought(update, t.id, { bucket: "hoje", created: dayKey() })}>Para hoje</button>
            </div>
          ))}
        </>
      )}
      {capture && <CaptureSheet update={update} onClose={() => setCapture(false)} onDone={() => { setCapture(false); setTriage(true); }} />}
      {triage && <TriageSheet state={state} update={update} onClose={() => setTriage(false)} />}
    </div>
  );
}

function CaptureSheet({ update, onClose, onDone }: Pick<Props, "update"> & { onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const save = (organize: boolean) => {
    update((s) => ({ ...s, thoughts: [...s.thoughts, ...lines.map((l) => ({ id: uid(), text: l, created: dayKey() }))] }));
    if (organize) onDone();
    else onClose();
  };
  return (
    <Sheet open onClose={onClose} title="Despejar pensamentos">
      <p className="mt-3 text-muted">Escreva tudo o que está ocupando sua cabeça. <b>Uma coisa por linha.</b> Não precisa fazer sentido nem estar em ordem.</p>
      <textarea autoFocus rows={8} className="field mt-3 py-3" value={text} onChange={(e) => setText(e.target.value)} aria-label="Pensamentos, um por linha"
        placeholder={"pagar o boleto\nresponder a professora\ncomprar ração\nmarcar dentista"} />
      <p className="muted mt-1">{lines.length} {lines.length === 1 ? "item" : "itens"}</p>
      <button className="btn !bg-med !text-[var(--on-color)]" disabled={!lines.length} onClick={() => save(true)}>Salvar e organizar</button>
      <button className="btn btn-secondary" disabled={!lines.length} onClick={() => save(false)}>Só salvar (organizo depois)</button>
    </Sheet>
  );
}

function TriageSheet({ state, update, onClose }: Props & { onClose: () => void }) {
  const [breaking, setBreaking] = useState<Thought | null>(null);
  const queue = state.thoughts.filter((t) => !t.bucket);
  const total = queue.length;
  const t = queue[0];
  if (breaking) {
    return <Quebrar initial={breaking.text} update={update} onClose={() => setBreaking(null)}
      onSaved={() => {
        // Virou tarefa com passos; sai do despejo para não aparecer duas vezes.
        update((s) => ({ ...s, thoughts: s.thoughts.filter((x) => x.id !== breaking.id) }));
        setBreaking(null);
      }} />;
  }
  return (
    <Sheet open onClose={onClose} title="Organizar">
      {t ? (
        <div className="rise" key={t.id}>
          <p className="mt-3 text-center text-sm font-bold text-muted">Faltam {total}</p>
          <div className="card hero border-0 py-8 text-center"><p className="text-2xl font-extrabold">{t.text}</p></div>
          <p className="text-center font-bold">Quando isso precisa acontecer?</p>
          <button className="btn" onClick={() => setThought(update, t.id, { bucket: "hoje", created: dayKey() })}>☀️ Hoje</button>
          <button className="btn btn-secondary" onClick={() => setThought(update, t.id, { bucket: "depois" })}>🗓️ Outro dia</button>
          <button className="btn btn-secondary" onClick={() => setThought(update, t.id, { bucket: "nao" })}>🍃 Não preciso fazer</button>
          <button className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 font-bold text-accent" onClick={() => setBreaking(t)}>
            <Scissors size={18} /> É grande demais? Quebrar em passos
          </button>
        </div>
      ) : (
        <div className="rise pt-8 text-center">
          <p className="text-6xl">🫧</p>
          <p className="mt-3 text-2xl font-extrabold">Cabeça mais leve!</p>
          <p className="mt-1 text-muted">O que é para hoje está na tela inicial.</p>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
      )}
    </Sheet>
  );
}
