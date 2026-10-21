export type Med = { id: string; name: string; dose: string; times: string[] };
export type DoseStatus = "taken" | "skipped";
export type Sex = "F" | "M" | "O";
export type Activity = "sedentary" | "light" | "moderate" | "high";
export type Goal = "maintain" | "lose_slow" | "lose" | "gain";
export type Profile = { sex: Sex; age: number; heightCm: number; activity: Activity; goal: Goal };
export type WeightEntry = { date: string; kg: number };
export type Meal = { id: string; name: string; kcal: number };

export type State = {
  profile: Profile | null;
  weights: WeightEntry[];
  water: Record<string, number>; // dia -> ml
  meals: Record<string, Meal[]>; // dia -> refeições
  meds: Med[];
  log: Record<string, DoseStatus>;
  snooze: Record<string, number>;
  lastNotified: Record<string, number>;
};
export type Dose = { id: string; med: Med; time: string; at: number; status: DoseStatus | null };

export const KEY = "foco-e-rotina:v1";
export const REPEAT_MIN = 10; // repete o lembrete a cada 10 min até confirmar

export const emptyState = (): State => ({ profile: null, weights: [], water: {}, meals: {}, meds: [], log: {}, snooze: {}, lastNotified: {} });

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

export function buildICS(s: State): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const d = new Date();
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Foco e Rotina//PT", "CALSCALE:GREGORIAN"];
  for (const m of s.meds) {
    for (const t of m.times) {
      const [h, mi] = t.split(":").map(Number);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${m.id}-${t.replace(":", "")}@foco-e-rotina`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${ymd}T${pad(h)}${pad(mi)}00`,
        "DURATION:PT10M",
        "RRULE:FREQ=DAILY",
        `SUMMARY:💊 ${m.name}${m.dose ? " — " + m.dose : ""}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${m.name}`, "TRIGGER:PT0S", "END:VALARM",
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${m.name} (lembrete)`, "TRIGGER:PT10M", "END:VALARM",
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function download(name: string, type: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
