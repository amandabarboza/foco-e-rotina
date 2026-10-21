import { Activity, Goal, Profile, Sex } from "./store";

export const ACTIVITY: Record<Activity, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: "Pouco ativa (quase sem exercício)" },
  light: { factor: 1.375, label: "Leve (1–3 dias por semana)" },
  moderate: { factor: 1.55, label: "Moderada (3–5 dias por semana)" },
  high: { factor: 1.725, label: "Alta (6–7 dias por semana)" },
};

export const GOALS: Record<Goal, { adjust: number; label: string }> = {
  maintain: { adjust: 0, label: "Manter o peso" },
  lose_slow: { adjust: -0.1, label: "Perder devagar (−10%)" },
  lose: { adjust: -0.2, label: "Perder (−20%)" },
  gain: { adjust: 0.1, label: "Ganhar (+10%)" },
};

export const SEX: Record<Sex, string> = { F: "Feminino", M: "Masculino", O: "Prefiro não informar" };

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
  const target = Math.max(raw, p.goal === "gain" || p.goal === "maintain" ? 0 : floor);
  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    target: Math.round(target / 10) * 10,
    floorApplied: target > raw,
    bmi: kg / (p.heightCm / 100) ** 2,
  };
}

// ~35 ml por kg, arredondado para 50 ml
export const waterGoal = (kg: number) => Math.round((kg * 35) / 50) * 50;
