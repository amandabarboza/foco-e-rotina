// Ilustração do topo: céu, sol, dunas, pirâmide, palmeiras e um cacto. Cores mudam com o modo escuro.
export default function Cenario() {
  return (
    <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky1)" />
          <stop offset="1" stopColor="var(--sky2)" />
        </linearGradient>
      </defs>
      <rect width="400" height="230" fill="url(#ceu)" />
      <g fill="#fff" opacity=".55">
        <circle cx="40" cy="30" r="1.6" /><circle cx="120" cy="18" r="1.2" /><circle cx="210" cy="40" r="1.4" /><circle cx="300" cy="22" r="1.2" /><circle cx="370" cy="48" r="1.6" />
      </g>
      <circle cx="352" cy="44" r="22" fill="var(--sun)" opacity=".9" />
      <circle cx="352" cy="44" r="34" fill="var(--sun)" opacity=".18" />
      <g fill="#fff" opacity=".35">
        <ellipse cx="80" cy="70" rx="34" ry="8" /><ellipse cx="102" cy="64" rx="20" ry="7" />
      </g>
      <path d="M0 150 Q70 118 150 138 T300 128 T400 136 V230 H0 Z" fill="var(--dune1)" />
      <path d="M298 150 L340 92 L382 150 Z" fill="var(--pyr1)" stroke="#3b2414" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M340 92 L382 150 L352 150 Z" fill="var(--pyr2)" />
      <path d="M311 132 H370 M322 116 H358" stroke="#3b2414" strokeWidth="1.2" opacity=".35" />
      <g className="bob">
        <path d="M266 162 Q270 128 262 100" stroke="var(--trunk)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M262 100 Q244 88 228 98 Q246 92 262 102 Q256 80 242 74 Q260 80 264 100 Q274 78 292 76 Q276 86 264 102 Q284 92 298 104 Q280 98 262 102Z" fill="var(--palm)" stroke="#2a3f22" strokeWidth="1.5" />
      </g>
      <path d="M0 176 Q90 146 200 168 T400 160 V230 H0 Z" fill="var(--dune2)" />
      <g>
        <rect x="206" y="160" width="10" height="30" rx="5" fill="var(--palm)" stroke="#2a3f22" strokeWidth="1.5" />
        <path d="M206 174 h-6 a4 4 0 0 1 -4 -4 v-8" stroke="var(--palm)" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M216 170 h6 a4 4 0 0 0 4 -4 v-6" stroke="var(--palm)" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
      <path d="M120 178 v-18 l12 5 l-12 5" fill="#e86a4a" stroke="#3b2414" strokeWidth="1.5" />
      <path d="M0 200 Q110 178 230 196 T400 192 V230 H0 Z" fill="var(--dune3)" />
    </svg>
  );
}
