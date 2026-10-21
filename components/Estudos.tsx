"use client";

import { useEffect, useState } from "react";
import { BookOpen, CalendarClock, Check, GraduationCap, Pause, Pencil, Play, Plus, Square, Trash2 } from "lucide-react";
import { Focus, State, StudyTask, Subject, dayKey, uid, weekStudy } from "@/lib/store";
import { Bar, Chips, Ring, Sheet, Stepper } from "./ui";

type Props = { state: State; update: (fn: (s: State) => State) => void };

const COLORS = ["#c2577f", "#8f6fd6", "#4c9bd6", "#e0794d", "#4f9a75", "#d0679a", "#b08a3e"];
const GENERAL = "_geral";
const FOCUS_MIN = [15, 25, 45];
const BREAK_MIN = [5, 10, 15];
const KINDS: Record<StudyTask["kind"], string> = { prova: "📝 Prova", trabalho: "📄 Trabalho", leitura: "📖 Leitura", outro: "📌 Outro" };

// Um único AudioContext, liberado no toque de "Começar" (exigência do iOS).
let audioCtx: AudioContext | null = null;
function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    audioCtx.resume();
  } catch {}
}

const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}` : `${m} min`);

function dueLabel(due: string) {
  const [y, m, d] = due.split("-").map(Number);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(y, m - 1, d).getTime() - t.getTime()) / 86400000);
  if (days === 0) return { text: "hoje", urgent: true };
  if (days === 1) return { text: "amanhã", urgent: true };
  if (days < 0) return { text: `passou há ${-days} ${-days === 1 ? "dia" : "dias"}`, urgent: true };
  return { text: `em ${days} dias`, urgent: days <= 3 };
}

export default function Estudos({ state, update }: Props) {
  if (state.focus) return <Timer state={state} update={update} />;
  return <Home state={state} update={update} />;
}

function logMinutes(s: State, f: Focus, minutes: number): State {
  if (minutes <= 0 || f.phase !== "focus") return s;
  const today = dayKey();
  const key = f.subjectId ?? GENERAL;
  const day = s.studyLog[today] ?? {};
  return {
    ...s,
    focusLog: { ...s.focusLog, [today]: (s.focusLog[today] ?? 0) + minutes },
    studyLog: { ...s.studyLog, [today]: { ...day, [key]: (day[key] ?? 0) + minutes } },
  };
}

function Home({ state, update }: Props) {
  const [picked, setSubject] = useState<string | null>(null);
  // Sem escolha explícita, usa a primeira matéria (ou "Geral" se não houver nenhuma).
  const subject = picked && (picked === GENERAL || state.subjects.some((s) => s.id === picked)) ? picked : state.subjects[0]?.id ?? GENERAL;
  const [focusMin, setFocusMin] = useState(25);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editTask, setEditTask] = useState<StudyTask | null>(null);
  const [showDone, setShowDone] = useState(false);
  const week = weekStudy(state);
  const weekTotal = Object.values(week).reduce((a, b) => a + b, 0);
  const weekGoal = state.subjects.reduce((a, s) => a + s.weeklyGoalMin, 0);
  const today = Object.values(state.studyLog[dayKey()] ?? {}).reduce((a, b) => a + b, 0);
  const subjectName = (id: string) => state.subjects.find((s) => s.id === id)?.name ?? "Geral";
  const pending = state.studyTasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due));
  const done = state.studyTasks.filter((t) => t.done);

  const start = () => {
    unlockAudio();
    update((s) => ({
      ...s,
      focus: { label: subjectName(subject), subjectId: subject, phase: "focus", minutes: focusMin, endsAt: Date.now() + focusMin * 60000, leftMs: 0 },
    }));
  };

  return (
    <>
      <h1 className="h1 pt-2">Estudos</h1>
      <div className="card flex items-center gap-4">
        <Ring pct={weekGoal ? weekTotal / weekGoal : 0} color="var(--study)" size={96} stroke={10}>
          <span className="block text-xl font-bold tabular-nums">{weekTotal}</span>
          <span className="block text-[.7rem] text-muted">min na semana</span>
        </Ring>
        <div>
          <p className="font-semibold">Hoje: {fmtMin(today)}</p>
          <p className="muted">{weekGoal ? `Meta da semana: ${fmtMin(weekGoal)}` : "Crie matérias com meta semanal para acompanhar."}</p>
          {pending[0] && <p className="mt-1 text-sm">Próxima entrega: <b>{pending[0].title}</b> ({dueLabel(pending[0].due).text})</p>}
        </div>
      </div>

      <div className="card border-0 bg-study-soft">
        <p className="flex items-center gap-2 text-lg font-bold text-study"><Play size={20} /> Estudar agora</p>
        <p className="label !mt-2">Matéria</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...state.subjects.map((s) => ({ id: s.id, name: s.name, color: s.color })), { id: GENERAL, name: "Geral / trabalho", color: "var(--muted)" }].map((s) => (
            <button key={s.id} onClick={() => setSubject(s.id)} aria-pressed={subject === s.id}
              className={`flex min-h-[44px] items-center gap-2 rounded-full px-4 ${subject === s.id ? "bg-card font-semibold shadow" : "border-2 border-line"}`}>
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.name}
            </button>
          ))}
        </div>
        <p className="label">Por quanto tempo</p>
        <Chips options={FOCUS_MIN} value={focusMin} onChange={setFocusMin} render={(x) => `${x} min`} />
        <button className="btn !bg-study !text-[var(--on-color)]" onClick={start}><Play size={20} /> Começar {focusMin} min</button>
        <p className="muted mt-2">Travou para começar? Escolha 15 min e só abra o material. Às vezes isso basta.</p>
      </div>

      <h2 className="h2"><CalendarClock size={20} /> Provas e entregas</h2>
      {!pending.length && <div className="card"><p>Nada pendente. Adicione provas, trabalhos e leituras com data para eu te mostrar o que está chegando.</p></div>}
      {pending.map((t) => {
        const due = dueLabel(t.due);
        const subj = state.subjects.find((s) => s.id === t.subjectId);
        return (
          <div key={t.id} className="card flex items-center gap-3 !py-3">
            <button aria-label={`Marcar ${t.title} como feito`} onClick={() => update((s) => ({ ...s, studyTasks: s.studyTasks.map((x) => (x.id === t.id ? { ...x, done: true } : x)) }))}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-line"><Check size={18} className="opacity-30" /></button>
            <button className="flex-1 text-left" onClick={() => setEditTask(t)}>
              <span className="block font-semibold">{t.title}</span>
              <span className="muted block">{KINDS[t.kind]}{subj ? ` · ${subj.name}` : ""}</span>
            </button>
            <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${due.urgent ? "bg-warm" : "bg-soft"}`}>{due.text}</span>
          </div>
        );
      })}
      <button className="btn btn-secondary" onClick={() => setEditTask({ id: uid(), title: "", subjectId: state.subjects[0]?.id ?? GENERAL, kind: "prova", due: dayKey(new Date(Date.now() + 7 * 86400000)), done: false })}>
        <Plus size={20} /> Adicionar prova ou entrega
      </button>
      {done.length > 0 && (
        <button className="mt-2 min-h-[44px] text-sm font-semibold text-accent" onClick={() => setShowDone(!showDone)}>
          {showDone ? "Esconder" : "Ver"} concluídas ({done.length})
        </button>
      )}
      {showDone && done.map((t) => (
        <div key={t.id} className="flex items-center justify-between border-t border-line py-2 opacity-70">
          <span className="line-through">{t.title}</span>
          <button className="btn btn-small btn-secondary !m-0" onClick={() => update((s) => ({ ...s, studyTasks: s.studyTasks.map((x) => (x.id === t.id ? { ...x, done: false } : x)) }))}>Desfazer</button>
        </div>
      ))}

      <h2 className="h2"><GraduationCap size={20} /> Matérias</h2>
      {state.subjects.map((s) => (
        <div key={s.id} className="card !py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.name}</p>
            <button aria-label={`Editar ${s.name}`} onClick={() => setEditSubject(s)} className="grid h-11 w-11 place-items-center rounded-full text-muted"><Pencil size={18} /></button>
          </div>
          <div className="mt-1"><Bar label="Esta semana" value={week[s.id] ?? 0} max={s.weeklyGoalMin} color={s.color} unit="min" /></div>
        </div>
      ))}
      <button className="btn btn-secondary" onClick={() => setEditSubject({ id: uid(), name: "", color: COLORS[state.subjects.length % COLORS.length], weeklyGoalMin: 120 })}>
        <Plus size={20} /> Adicionar matéria
      </button>

      {editSubject && <SubjectSheet subject={editSubject} state={state} update={update} onClose={() => setEditSubject(null)} />}
      {editTask && <TaskSheet task={editTask} state={state} update={update} onClose={() => setEditTask(null)} />}
    </>
  );
}

function SubjectSheet({ subject, state, update, onClose }: Props & { subject: Subject; onClose: () => void }) {
  const [s, setS] = useState(subject);
  const isNew = !state.subjects.some((x) => x.id === s.id);
  return (
    <Sheet open onClose={onClose} title={isNew ? "Nova matéria" : "Editar matéria"}>
      <label className="label" htmlFor="sj-name">Nome</label>
      <input id="sj-name" className="field" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} placeholder="ex.: Inglês, Cálculo, Concurso" />
      <p className="label">Cor</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {COLORS.map((c) => (
          <button key={c} aria-label={`Cor ${c}`} aria-pressed={s.color === c} onClick={() => setS({ ...s, color: c })}
            className={`h-11 w-11 rounded-full ${s.color === c ? "ring-4 ring-line ring-offset-2" : ""}`} style={{ background: c }} />
        ))}
      </div>
      <p className="label">Meta por semana</p>
      <Stepper label="Meta semanal" value={s.weeklyGoalMin} onChange={(weeklyGoalMin) => setS({ ...s, weeklyGoalMin })} step={30} min={30} max={2400} unit="min" />
      <p className="muted mt-1">{fmtMin(s.weeklyGoalMin)} por semana ≈ {Math.round(s.weeklyGoalMin / 5)} min por dia útil.</p>
      <button className="btn !bg-study !text-[var(--on-color)]" disabled={!s.name.trim()} onClick={() => {
        update((st) => ({ ...st, subjects: isNew ? [...st.subjects, { ...s, name: s.name.trim() }] : st.subjects.map((x) => (x.id === s.id ? { ...s, name: s.name.trim() } : x)) }));
        onClose();
      }}>Salvar</button>
      {!isNew && (
        <button className="btn btn-secondary" onClick={() => {
          if (!confirm(`Excluir a matéria ${s.name}? O histórico de minutos continua no total.`)) return;
          update((st) => ({ ...st, subjects: st.subjects.filter((x) => x.id !== s.id) }));
          onClose();
        }}><Trash2 size={18} /> Excluir</button>
      )}
    </Sheet>
  );
}

function TaskSheet({ task, state, update, onClose }: Props & { task: StudyTask; onClose: () => void }) {
  const [t, setT] = useState(task);
  const isNew = !state.studyTasks.some((x) => x.id === t.id);
  return (
    <Sheet open onClose={onClose} title={isNew ? "Nova prova ou entrega" : "Editar"}>
      <p className="label">Tipo</p>
      <Chips options={Object.keys(KINDS) as StudyTask["kind"][]} value={t.kind} onChange={(kind) => setT({ ...t, kind })} render={(k) => KINDS[k]} />
      <label className="label" htmlFor="st-title">O que é</label>
      <input id="st-title" className="field" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="ex.: Prova de inglês, unidades 1 a 3" />
      {state.subjects.length > 0 && (
        <>
          <p className="label">Matéria</p>
          <Chips options={[...state.subjects.map((s) => s.id), GENERAL]} value={t.subjectId} onChange={(subjectId) => setT({ ...t, subjectId })}
            render={(id) => state.subjects.find((s) => s.id === id)?.name ?? "Nenhuma"} />
        </>
      )}
      <label className="label" htmlFor="st-due">Data</label>
      <input id="st-due" type="date" className="field" value={t.due} onChange={(e) => setT({ ...t, due: e.target.value })} />
      <button className="btn !bg-study !text-[var(--on-color)]" disabled={!t.title.trim() || !t.due} onClick={() => {
        update((s) => ({ ...s, studyTasks: isNew ? [...s.studyTasks, { ...t, title: t.title.trim() }] : s.studyTasks.map((x) => (x.id === t.id ? { ...t, title: t.title.trim() } : x)) }));
        onClose();
      }}>Salvar</button>
      {!isNew && (
        <button className="btn btn-secondary" onClick={() => { update((s) => ({ ...s, studyTasks: s.studyTasks.filter((x) => x.id !== t.id) })); onClose(); }}>
          <Trash2 size={18} /> Excluir
        </button>
      )}
    </Sheet>
  );
}

function Timer({ state, update }: Props) {
  const f = state.focus!;
  const [, setTick] = useState(0);
  const [finished, setFinished] = useState<Focus | null>(null);
  const [breakMin, setBreakMin] = useState(5);
  const left = f.endsAt ? f.endsAt - Date.now() : f.leftMs;

  useEffect(() => {
    if (!f.endsAt) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [f.endsAt]);

  // Fim do bloco: registra os minutos, toca um som suave e avisa.
  useEffect(() => {
    if (!f.endsAt || left > 0 || finished) return;
    setFinished(f);
    chime(audioCtx);
    const title = f.phase === "focus" ? "Bloco concluído 🎉" : "Pausa acabou";
    if ("Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker?.getRegistration().then((r) => r?.showNotification(title, { body: f.phase === "focus" ? "Hora de uma pausa." : "Quando quiser, comece outro bloco.", tag: "foco" }));
    }
  }, [f, left, finished]);

  const close = (next: Focus | null) => {
    update((s) => ({ ...logMinutes(s, f, f.minutes), focus: next }));
    setFinished(null);
  };

  if (finished) {
    return (
      <>
        <h1 className="h1 pt-2">{f.phase === "focus" ? "Bloco concluído 🎉" : "Pausa concluída"}</h1>
        <div className="card bg-study-soft border-0 text-center">
          {f.phase === "focus" ? (
            <>
              <p className="text-lg">Você estudou <b>{f.minutes} min</b> de {f.label}.</p>
              <p className="label">Pausa de</p>
              <Chips options={BREAK_MIN} value={breakMin} onChange={setBreakMin} render={(x) => `${x} min`} />
              <button className="btn !bg-study !text-[var(--on-color)]" onClick={() => (unlockAudio(), close({ ...f, phase: "break", minutes: breakMin, endsAt: Date.now() + breakMin * 60000 }))}>Começar pausa</button>
              <button className="btn btn-secondary" onClick={() => close(null)}>Parar por agora</button>
            </>
          ) : (
            <>
              <p className="text-lg">Pronta para mais um bloco?</p>
              <button className="btn !bg-study !text-[var(--on-color)]" onClick={() => (unlockAudio(), close({ ...f, phase: "focus", minutes: 25, endsAt: Date.now() + 25 * 60000 }))}>Mais 25 min de {f.label}</button>
              <button className="btn btn-secondary" onClick={() => close(null)}>Parar por hoje</button>
            </>
          )}
        </div>
      </>
    );
  }

  const total = f.minutes * 60000;
  const pct = 1 - left / total;
  const warnAt = (f.minutes >= 25 ? 5 : 2) * 60000;
  const stop = () => {
    if (!confirm("Encerrar este bloco?")) return;
    const doneMin = Math.floor((total - left) / 60000);
    update((s) => ({ ...logMinutes(s, f, doneMin), focus: null }));
  };
  return (
    <>
      <p className="muted pt-2">{f.phase === "focus" ? "Estudando" : "Pausa"}</p>
      <h1 className="h1 flex items-center gap-2"><BookOpen size={26} /> {f.phase === "focus" ? f.label : "Respira 🌿"}</h1>
      <div className="card flex flex-col items-center border-0 bg-study-soft py-8">
        <Ring pct={pct} color="var(--study)" size={240} stroke={18}>
          <span className="block text-5xl font-bold tabular-nums">{fmtClock(left)}</span>
          <span className="block text-sm text-muted">{f.endsAt ? "restantes" : "pausado"}</span>
        </Ring>
        {f.phase === "focus" && left <= warnAt && left > 0 && (
          <p className="mt-4 rounded-xl bg-warm px-3 py-2 text-center">Faltam poucos minutos. Vá fechando o que está fazendo.</p>
        )}
        {f.phase === "break" && <p className="mt-4 text-center">Levanta, bebe água, olha pela janela.</p>}
      </div>
      {f.endsAt ? (
        <button className="btn !bg-study !text-[var(--on-color)]" onClick={() => update((s) => ({ ...s, focus: { ...f, endsAt: null, leftMs: left } }))}><Pause size={20} /> Pausar</button>
      ) : (
        <button className="btn !bg-study !text-[var(--on-color)]" onClick={() => update((s) => ({ ...s, focus: { ...f, endsAt: Date.now() + f.leftMs } }))}><Play size={20} /> Continuar</button>
      )}
      <button className="btn btn-secondary" onClick={stop}><Square size={18} /> Encerrar</button>
      <p className="muted mt-3">No iPhone, o som do fim só toca com o app aberto. Se sair, ao voltar o tempo estará certo.</p>
    </>
  );
}

// Som curto e suave (duas notas), sem susto.
function chime(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    ctx.resume();
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
