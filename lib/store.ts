export type Med = { id: string; name: string; dose: string; times: string[] };
export type DoseStatus = "taken" | "skipped";
export type Sex = "F" | "M" | "O";
export type Activity = "sedentary" | "light" | "moderate" | "high";
export type Goal = "maintain" | "lose_slow" | "lose" | "gain";
export type Profile = { sex: Sex; age: number; heightCm: number; activity: Activity; goal: Goal };
export type WeightEntry = { date: string; kg: number };
export type Meal = { id: string; name: string; kcal: number };
export type Task = {
  id: string;
  name: string;
  steps: string[];
  days: number[]; // 0 = domingo … 6 = sábado
  time: string; // "" = a qualquer hora do dia
  essential: boolean; // aparece também no modo baixa energia
};
export type Focus = {
  label: string;
  phase: "focus" | "break";
  minutes: number;
  endsAt: number | null; // null = pausado
  leftMs: number; // tempo restante quando pausado
};

export type State = {
  profile: Profile | null;
  weights: WeightEntry[];
  water: Record<string, number>; // dia -> ml
  meals: Record<string, Meal[]>; // dia -> refeições
  meds: Med[];
  tasks: Task[];
  taskDone: Record<string, true>; // "dia|tarefa"
  stepDone: Record<string, true>; // "dia|tarefa|passo"
  lowEnergy: Record<string, true>; // dia -> modo baixa energia ligado
  focus: Focus | null;
  focusLog: Record<string, number>; // dia -> minutos de foco
  log: Record<string, DoseStatus>;
  snooze: Record<string, number>;
  lastNotified: Record<string, number>;
};
export type Dose = { id: string; med: Med; time: string; at: number; status: DoseStatus | null };

export const KEY = "foco-e-rotina:v1";
export const REPEAT_MIN = 10; // repete o lembrete a cada 10 min até confirmar

export const emptyState = (): State => ({ profile: null, weights: [], water: {}, meals: {}, meds: [], tasks: [], taskDone: {}, stepDone: {}, lowEnergy: {}, focus: null, focusLog: {}, log: {}, snooze: {}, lastNotified: {} });

export function loadState(): State {
  try {
    return { ...emptyState(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return emptyState();
  }
}

export function saveState(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function todayDoses(s: State): Dose[] {
  const today = dayKey();
  const out: Dose[] = [];
  for (const med of s.meds) {
    for (const time of med.times) {
      const id = `${today}|${med.id}|${time}`;
      const [h, m] = time.split(":").map(Number);
      const at = new Date();
      at.setHours(h, m, 0, 0);
      out.push({ id, med, time, at: at.getTime(), status: s.log[id] ?? null });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

export function nextPending(s: State, now = Date.now()) {
  const pending = todayDoses(s).filter((d) => !d.status && !(s.snooze[d.id] > now));
  return {
    due: pending.find((d) => d.at <= now) ?? null,
    upcoming: pending.find((d) => d.at > now) ?? null,
  };
}

type CalEvent = { uid: string; time: string; summary: string; alarmsMin: number[] };

function ics(events: CalEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const d = new Date();
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Foco e Rotina//PT", "CALSCALE:GREGORIAN"];
  for (const e of events) {
    const [h, mi] = e.time.split(":").map(Number);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@foco-e-rotina`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${ymd}T${pad(h)}${pad(mi)}00`,
      "DURATION:PT10M",
      "RRULE:FREQ=DAILY",
      `SUMMARY:${e.summary}`,
    );
    for (const m of e.alarmsMin) {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${e.summary}`, `TRIGGER:PT${m}M`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function buildICS(s: State): string {
  return ics(
    s.meds.flatMap((m) =>
      m.times.map((t) => ({
        uid: `${m.id}-${t.replace(":", "")}`,
        time: t,
        summary: `💊 ${m.name}${m.dose ? " — " + m.dose : ""}`,
        alarmsMin: [0, 10],
      })),
    ),
  );
}

// Um lembrete de água a cada `everyH` horas entre `from` e `to`.
export function buildWaterICS(from: string, to: string, everyH: number): string {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const events: CalEvent[] = [];
  for (let m = toMin(from); m <= toMin(to); m += everyH * 60) {
    const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    events.push({ uid: `agua-${t.replace(":", "")}`, time: t, summary: "💧 Beber água", alarmsMin: [0] });
  }
  return ics(events);
}

export function download(name: string, type: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export type TaskToday = { key: string; task: Task; at: number | null; done: boolean };

export function todayTasks(s: State): TaskToday[] {
  const today = dayKey();
  const wd = new Date().getDay();
  return s.tasks
    .filter((t) => t.days.includes(wd))
    .map((task) => {
      let at: number | null = null;
      if (task.time) {
        const [h, m] = task.time.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        at = d.getTime();
      }
      const key = `${today}|${task.id}`;
      return { key, task, at, done: !!s.taskDone[key] };
    })
    .sort((a, b) => (a.at ?? Infinity) - (b.at ?? Infinity));
}

// Próxima tarefa a fazer agora: horário já passou (ou sem horário), não feita, não adiada.
export function nextTask(s: State, now = Date.now()): TaskToday | null {
  const low = !!s.lowEnergy[dayKey()];
  return (
    todayTasks(s).find(
      (t) => !t.done && (t.at === null || t.at <= now) && !(s.snooze[t.key] > now) && (!low || t.task.essential),
    ) ?? null
  );
}
