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
      },
      borderRadius: { card: "18px" },
    },
  },
  plugins: [],
};

export default config;
