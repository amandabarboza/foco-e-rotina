import { Activity, Goal, Profile, Sex } from "./store";

export const ACTIVITY: Record<Activity, { factor: number; label: string; hint: string }> = {
  sedentary: { factor: 1.2, label: "Pouco ativa", hint: "Fico mais sentada, quase sem exercício" },
  light: { factor: 1.375, label: "Leve", hint: "Caminho ou me exercito 1–3 dias por semana" },
  moderate: { factor: 1.55, label: "Moderada", hint: "Exercício 3–5 dias por semana" },
  high: { factor: 1.725, label: "Alta", hint: "Exercício intenso 6–7 dias por semana" },
};

export const GOALS: Record<Goal, { adjust: number; label: string; hint: string }> = {
  maintain: { adjust: 0, label: "Manter o peso", hint: "Comer o quanto gasto" },
  lose_slow: { adjust: -0.1, label: "Perder devagar", hint: "Menos 10% — mais fácil de manter" },
  lose: { adjust: -0.2, label: "Perder", hint: "Menos 20% — resultado mais rápido" },
  gain: { adjust: 0.1, label: "Ganhar", hint: "Mais 10%" },
};

export const SEX: Record<Sex, string> = { F: "Feminino", M: "Masculino", O: "Prefiro não dizer" };

// Mifflin-St Jeor. Para "O" usa a média das duas constantes.
export function bmr(p: Profile, kg: number): number {
  const base = 10 * kg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === "M" ? 5 : p.sex === "F" ? -161 : -78);
}

export function plan(p: Profile, kg: number) {
  const tmb = bmr(p, kg);
  const tdee = tmb * ACTIVITY[p.activity].factor;
  const raw = tdee * (1 + GOALS[p.goal].adjust);
  const floor = p.sex === "M" ? 1500 : 1200; // piso de segurança
  const losing = p.goal === "lose" || p.goal === "lose_slow";
  const target = Math.round(Math.max(raw, losing ? floor : 0) / 10) * 10;
  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    target,
    floorApplied: losing && floor > raw,
    macros: macros(p, kg, target),
  };
}

// Proteína por kg (limitada ao peso de IMC 25), gordura 28% das calorias, carboidrato o restante.
export function macros(p: Profile, kg: number, kcal: number) {
  const refKg = Math.min(kg, 25 * (p.heightCm / 100) ** 2);
  const protein = Math.round(refKg * (p.goal === "maintain" ? 1.2 : 1.6));
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat };
}

export const bmi = (kg: number, heightCm: number) => kg / (heightCm / 100) ** 2;

export function bmiLabel(v: number) {
  if (v < 18.5) return "abaixo da faixa recomendada";
  if (v < 25) return "dentro da faixa recomendada";
  if (v < 30) return "um pouco acima da faixa recomendada";
  return "acima da faixa recomendada";
}

// Faixa de peso com IMC entre 18,5 e 24,9.
export const healthyRange = (heightCm: number) => {
  const h2 = (heightCm / 100) ** 2;
  return { min: Math.round(18.5 * h2 * 10) / 10, max: Math.round(24.9 * h2 * 10) / 10 };
};

// Estimativa de quando chega à meta: ~7700 kcal por kg.
export type Eta = { kind: "reached" } | { kind: "mismatch" } | { kind: "eta"; weeks: number; kgPerWeek: number; date: Date };

export function eta(p: Profile, kg: number): Eta | null {
  if (!p.targetKg) return null;
  const diff = p.targetKg - kg;
  if (Math.abs(diff) < 0.1) return { kind: "reached" };
  const { tdee, target } = plan(p, kg);
  const dailyDelta = target - tdee; // negativo = déficit
  if (Math.sign(dailyDelta) !== Math.sign(diff) || dailyDelta === 0) return { kind: "mismatch" };
  const kgPerWeek = Math.abs((dailyDelta * 7) / 7700);
  const weeks = Math.abs(diff) / kgPerWeek;
  const date = new Date(Date.now() + weeks * 7 * 86400000);
  return { kind: "eta", weeks: Math.ceil(weeks), kgPerWeek, date };
}

// ~35 ml por kg, arredondado para 50 ml
export const waterGoal = (kg: number) => Math.round((kg * 35) / 50) * 50;

export const MEALS = [
  { id: "cafe", label: "Café da manhã", share: 0.25 },
  { id: "almoco", label: "Almoço", share: 0.35 },
  { id: "lanche", label: "Lanche", share: 0.15 },
  { id: "jantar", label: "Jantar", share: 0.25 },
] as const;
export type MealId = (typeof MEALS)[number]["id"];
