"use client";

import { ReactNode, useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, decimals = 0, unit, label }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number;
  decimals?: number; unit?: string; label: string;
}) {
  const [typing, setTyping] = useState<string | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10 ** decimals) / 10 ** decimals));
  const fmt = (v: number) => v.toFixed(decimals).replace(".", ",");
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-bg p-1.5" role="group" aria-label={label}>
      <button aria-label={`Diminuir ${label}`} onClick={() => onChange(clamp(value - step))}
        className="grid h-14 w-14 place-items-center rounded-xl bg-card shadow-sm active:scale-95"><Minus size={22} /></button>
      {typing !== null ? (
        <input autoFocus inputMode={decimals ? "decimal" : "numeric"} value={typing} aria-label={label}
          className="w-24 bg-transparent text-center text-3xl font-bold outline-none"
          onChange={(e) => setTyping(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={() => {
            const v = Number(typing.replace(",", "."));
            if (typing && !Number.isNaN(v)) onChange(clamp(v));
            setTyping(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
      ) : (
        <button className="min-h-[44px] min-w-24 text-center" onClick={() => setTyping(fmt(value))} aria-label={`${label}: ${fmt(value)} ${unit ?? ""}. Toque para digitar`}>
          <span className="text-3xl font-bold tabular-nums">{fmt(value)}</span>
          {unit && <span className="ml-1 text-muted">{unit}</span>}
        </button>
      )}
      <button aria-label={`Aumentar ${label}`} onClick={() => onChange(clamp(value + step))}
        className="grid h-14 w-14 place-items-center rounded-xl bg-card shadow-sm active:scale-95"><Plus size={22} /></button>
    </div>
  );
}

export function Ring({ pct, color, size = 76, stroke = 9, children }: {
  pct: number; color: string; size?: number; stroke?: number; children?: ReactNode;
}) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, pct));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - p)} style={{ transition: "stroke-dashoffset .4s" }} />
      </svg>
      <div className="relative text-center leading-tight">{children}</div>
    </div>
  );
}

export function Bar({ value, max, color, label, unit = "g" }: { value: number; max: number; color: string; label: string; unit?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="font-semibold">{label}</span>
        <span className="tabular-nums text-muted">{Math.round(value)} / {max} {unit}</span></div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-bg" role="progressbar" aria-label={label}
        aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width .4s" }} />
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[600px] flex-col rounded-t-[26px] bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-full bg-bg"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

export function Option({ selected, onClick, title, hint, icon }: {
  selected: boolean; onClick: () => void; title: string; hint?: string; icon?: ReactNode;
}) {
  return (
    <button onClick={onClick} aria-pressed={selected}
      className={`mt-2 flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${selected ? "border-accent bg-soft" : "border-line bg-card"}`}>
      {icon && <span className="text-2xl" aria-hidden>{icon}</span>}
      <span className="flex-1"><span className="block font-semibold">{title}</span>{hint && <span className="muted block">{hint}</span>}</span>
      <span className={`h-6 w-6 shrink-0 rounded-full border-2 ${selected ? "border-accent bg-accent shadow-[inset_0_0_0_3px_var(--card)]" : "border-line"}`} />
    </button>
  );
}

export function Chips<T extends string | number>({ options, value, onChange, render }: {
  options: T[]; value: T; onChange: (v: T) => void; render?: (v: T) => string;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} aria-pressed={value === o}
          className={`min-h-[44px] rounded-full px-4 ${value === o ? "bg-accent font-semibold text-accent-ink" : "border-2 border-line"}`}>
          {render ? render(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

export const fmtNum = (v: number, d = 1) => v.toFixed(d).replace(".", ",");
