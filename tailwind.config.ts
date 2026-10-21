import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        soft: "var(--soft)",
        warm: "var(--warm)",
        line: "var(--line)",
        med: "var(--med)",
        "med-soft": "var(--med-soft)",
        water: "var(--water)",
        "water-soft": "var(--water-soft)",
        food: "var(--food)",
        "food-soft": "var(--food-soft)",
        study: "var(--study)",
        "study-soft": "var(--study-soft)",
        weight: "var(--weight)",
        "weight-soft": "var(--weight-soft)",
      },
      borderRadius: { card: "18px" },
    },
  },
  plugins: [],
};

export default config;
