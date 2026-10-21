import type { MealId } from "./body";

export type Med = { id: string; name: string; dose: string; times: string[] };
export type DoseStatus = "taken" | "skipped";
export type Sex = "F" | "M" | "O";
export type Activity = "sedentary" | "light" | "moderate" | "high";
export type Goal = "maintain" | "lose_slow" | "lose" | "gain";
export type Profile = {
  name?: string;
  sex: Sex;
  age: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
  targetKg?: number;
};
export type WeightEntry = { date: string; kg: number };
// p/c/f = proteína, carboidrato e gordura em gramas. Registros antigos podem não ter esses campos.
export type Meal = { id: string; name: string; kcal: number; p?: number; c?: number; f?: number; meal?: MealId; foodId?: string; qty?: number };
export type Subject = { id: string; name: string; color: string; weeklyGoalMin: number };
export type StudyTask = { id: string; title: string; subjectId: string; kind: "prova" | "trabalho" | "leitura" | "outro"; due: string; done: boolean };
export type Task = {
  id: string;
  name: string;
  steps: string[];
  days: number[]; // 0 = domingo … 6 = sábado
  time: string; // "" = a qualquer hora do dia
  essential: boolean; // aparece também no modo baixa energia
  once?: string; // tarefa de um dia só (data); se definida, ignora `days`
};
// Pensamento despejado: sem balde = ainda não triado.
export type Thought = { id: string; text: string; created: string; bucket?: "hoje" | "depois" | "nao"; done?: boolean; doneAt?: string };
export type Review = { worked: string; stuck: string; adjust: string };
export type Focus = {
  label: string;
  subjectId?: string;
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
  subjects: Subject[];
  studyLog: Record<string, Record<string, number>>; // dia -> matéria -> minutos
  studyTasks: StudyTask[];
  onboarded: boolean;
  thoughts: Thought[];
  reviews: Record<string, Review>; // semana (domingo) -> revisão
  starts: Record<string, number>; // dia -> vezes que usou "Só 2 minutos"
  notifiedTransitions: Record<string, true>;
  log: Record<string, DoseStatus>;
  snooze: Record<string, number>;
  lastNotified: Record<string, number>;
};
export type Dose = { id: string; med: Med; time: string; at: number; status: DoseStatus | null };

export const KEY = "foco-e-rotina:v1";
export const REPEAT_MIN = 10; // repete o lembrete a cada 10 min até confirmar

export const emptyState = (): State => ({ profile: null, weights: [], water: {}, meals: {}, meds: [], tasks: [], taskDone: {}, stepDone: {}, lowEnergy: {}, focus: null, focusLog: {}, subjects: [], studyLog: {}, studyTasks: [], onboarded: false, thoughts: [], reviews: {}, starts: {}, notifiedTransitions: {}, log: {}, snooze: {}, lastNotified: {} });

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
    .filter((t) => (t.once ? t.once === today : t.days.includes(wd)))
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

export const latestKg = (s: State) => (s.weights.length ? s.weights[s.weights.length - 1].kg : null);

export function dayTotals(s: State, day = dayKey()) {
  const meals = s.meals[day] ?? [];
  return meals.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + (m.p ?? 0), c: a.c + (m.c ?? 0), f: a.f + (m.f ?? 0) }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

// Minutos de estudo na semana atual (domingo a sábado), por matéria.
export function weekStudy(s: State) {
  const out: Record<string, number> = {};
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  for (let i = 0; i < 7; i++) {
    const log = s.studyLog[dayKey(d)] ?? {};
    for (const [k, v] of Object.entries(log)) out[k] = (out[k] ?? 0) + v;
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Domingo da semana de `d`, como chave "AAAA-MM-DD".
export function weekKey(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return dayKey(x);
}

// Tudo o que foi feito num dia, para mostrar conquistas (nunca o que faltou).
export function doneOn(s: State, day: string): string[] {
  const out: string[] = [];
  const meds = Object.entries(s.log).filter(([k, v]) => k.startsWith(day + "|") && v === "taken").length;
  if (meds) out.push(`💊 ${meds === 1 ? "Tomou o remédio" : `Tomou ${meds} remédios`}`);
  for (const key of Object.keys(s.taskDone)) {
    if (!key.startsWith(day + "|")) continue;
    const t = s.tasks.find((x) => x.id === key.split("|")[1]);
    out.push(`🏠 ${t ? t.name : "Tarefa feita"}`);
  }
  const study = Object.values(s.studyLog[day] ?? {}).reduce((a, b) => a + b, 0);
  if (study) out.push(`📚 Estudou ${study} min`);
  const water = s.water[day] ?? 0;
  if (water >= 1000) out.push(`💧 Bebeu ${(water / 1000).toFixed(1).replace(".", ",")} L de água`);
  if ((s.meals[day] ?? []).length) out.push("🍽️ Registrou o que comeu");
  if (s.weights.some((w) => w.date === day)) out.push("⚖️ Registrou o peso");
  for (const t of s.thoughts) if (t.done && t.doneAt === day) out.push(`✨ ${t.text}`);
  if (s.starts[day]) out.push(`🚀 Começou ${s.starts[day] === 1 ? "uma coisa difícil" : `${s.starts[day]} coisas difíceis`}`);
  return out;
}

// Dias com pelo menos uma conquista nos últimos `n` dias, e a sequência atual.
export function activity(s: State, n = 30) {
  let active = 0, streak = 0, counting = true;
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const ok = doneOn(s, dayKey(d)).length > 0;
    if (ok) active++;
    // Hoje ainda sem nada não quebra a sequência.
    if (counting) {
      if (ok) streak++;
      else if (i > 0) counting = false;
    }
    d.setDate(d.getDate() - 1);
  }
  return { active, streak };
}

export function weekStats(s: State, start = weekKey()) {
  const [y, m, dd] = start.split("-").map(Number);
  const d = new Date(y, m - 1, dd);
  let medsTaken = 0, medsTotal = 0, tasks = 0, study = 0, water = 0, active = 0;
  for (let i = 0; i < 7; i++) {
    const day = dayKey(d);
    if (d.getTime() <= Date.now()) {
      medsTotal += s.meds.reduce((a, med) => a + med.times.length, 0);
      medsTaken += Object.entries(s.log).filter(([k, v]) => k.startsWith(day + "|") && v === "taken").length;
      tasks += Object.keys(s.taskDone).filter((k) => k.startsWith(day + "|")).length;
      study += Object.values(s.studyLog[day] ?? {}).reduce((a, b) => a + b, 0);
      water += s.water[day] ?? 0;
      if (doneOn(s, day).length) active++;
    }
    d.setDate(d.getDate() + 1);
  }
  return { medsTaken, medsTotal, tasks, study, water, active };
}
