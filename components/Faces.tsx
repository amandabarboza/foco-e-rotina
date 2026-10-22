// Carinhas de humor desenhadas em SVG (1 = muito mal … 5 = ótimo).
export const MOODS = [
  { level: 1, label: "Muito mal", color: "#5b8fd6" },
  { level: 2, label: "Mal", color: "#5fb3a8" },
  { level: 3, label: "Mais ou menos", color: "#f2c94c" },
  { level: 4, label: "Bem", color: "#f39a3d" },
  { level: 5, label: "Ótimo", color: "#ef7aa0" },
];

const MOUTHS: Record<number, string> = {
  1: "M14 31 Q20 25 26 31",
  2: "M14 30 Q20 27 26 30",
  3: "M14 29 L26 29",
  4: "M14 27 Q20 32 26 27",
  5: "M13 26 Q20 35 27 26 Z",
};

export function Face({ level, size = 44 }: { level: number; size?: number }) {
  const m = MOODS[level - 1];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="18" fill={m.color} stroke="#3b2414" strokeWidth="2.5" />
      {level === 1 && <path d="M11 14 l5 2 M29 14 l-5 2" stroke="#3b2414" strokeWidth="2" strokeLinecap="round" />}
      {level === 5 ? (
        <>
          <path d="M11 18 Q14 14 17 18 M23 18 Q26 14 29 18" fill="none" stroke="#3b2414" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="10" cy="24" r="2.5" fill="#fff" opacity=".45" />
          <circle cx="30" cy="24" r="2.5" fill="#fff" opacity=".45" />
        </>
      ) : (
        <>
          <circle cx="14" cy="19" r="2.4" fill="#3b2414" />
          <circle cx="26" cy="19" r="2.4" fill="#3b2414" />
        </>
      )}
      <path d={MOUTHS[level]} fill={level === 5 ? "#3b2414" : "none"} stroke="#3b2414" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {level === 1 && <path d="M28 22 q1.5 3 0 4.5 q-1.5 -1.5 0 -4.5" fill="#bfe3ff" />}
    </svg>
  );
}
