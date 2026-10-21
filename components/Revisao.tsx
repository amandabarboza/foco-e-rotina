"use client";

import { useState } from "react";
import { CalendarHeart } from "lucide-react";
import { Review, State, weekKey, weekStats } from "@/lib/store";
import { Sheet } from "./ui";

type Props = { state: State; update: (fn: (s: State) => State) => void };

// Semana a revisar: a que acabou (no domingo e na segunda) ou a atual nos outros dias.
export const reviewWeek = () => {
  const d = new Date();
  return d.getDay() <= 1 ? weekKey(new Date(d.getTime() - (d.getDay() + 1) * 86400000)) : weekKey(d);
};
const fmtWeek = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  const a = new Date(y, m - 1, d), b = new Date(y, m - 1, d + 6);
  const f = (x: Date) => x.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return `${f(a)} a ${f(b)}`;
};

// Último "ajuste" combinado, para mostrar como foco da semana.
export function weekFocus(s: State) {
  const keys = Object.keys(s.reviews).sort();
  const last = keys[keys.length - 1];
  return last ? s.reviews[last].adjust : "";
}

export function RevisaoCard({ state, update }: Props) {
  const [open, setOpen] = useState(false);
  const wk = reviewWeek();
  const isReviewDay = new Date().getDay() <= 1;
  if (!isReviewDay || state.reviews[wk]) return open ? <RevisaoSheet state={state} update={update} onClose={() => setOpen(false)} /> : null;
  return (
    <div className="card hero border-0">
      <p className="flex items-center gap-2 text-lg font-extrabold"><CalendarHeart size={20} className="text-accent" /> Revisão da semana</p>
      <p className="mt-1">5 minutinhos para ver o que funcionou e ajustar a próxima semana.</p>
      <button className="btn" onClick={() => setOpen(true)}>Fazer revisão</button>
      {open && <RevisaoSheet state={state} update={update} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function RevisaoSheet({ state, update, onClose }: Props & { onClose: () => void }) {
  const wk = reviewWeek();
  const st = weekStats(state, wk);
  const [r, setR] = useState<Review>(state.reviews[wk] ?? { worked: "", stuck: "", adjust: "" });
  const tiles = [
    { v: st.medsTotal ? `${Math.round((st.medsTaken / st.medsTotal) * 100)}%` : "—", l: "remédios tomados", c: "text-med" },
    { v: String(st.tasks), l: "tarefas feitas", c: "text-accent" },
    { v: `${st.study} min`, l: "de estudo", c: "text-study" },
    { v: `${st.active}/7`, l: "dias ativos", c: "text-food" },
  ];
  return (
    <Sheet open onClose={onClose} title="Revisão da semana">
      <p className="mt-3 text-muted">{fmtWeek(wk)}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-2xl bg-bg p-3 text-center">
            <p className={`text-2xl font-extrabold ${t.c}`}>{t.v}</p><p className="text-xs text-muted">{t.l}</p>
          </div>
        ))}
      </div>
      <p className="muted mt-2">Números são só informação, não nota. Qualquer coisa feita conta.</p>
      <label className="label" htmlFor="rv-w">💚 O que funcionou?</label>
      <textarea id="rv-w" rows={2} className="field py-2" value={r.worked} onChange={(e) => setR({ ...r, worked: e.target.value })} placeholder="ex.: estudar logo depois do almoço" />
      <label className="label" htmlFor="rv-s">🧱 Onde travou?</label>
      <textarea id="rv-s" rows={2} className="field py-2" value={r.stuck} onChange={(e) => setR({ ...r, stuck: e.target.value })} placeholder="ex.: lavar louça à noite, já estava cansada" />
      <label className="label" htmlFor="rv-a">🎯 Um ajuste pequeno para a próxima semana</label>
      <textarea id="rv-a" rows={2} className="field py-2" value={r.adjust} onChange={(e) => setR({ ...r, adjust: e.target.value })} placeholder="ex.: lavar a louça logo depois do jantar" />
      <button className="btn" onClick={() => { update((s) => ({ ...s, reviews: { ...s.reviews, [wk]: r } })); onClose(); }}>Salvar revisão</button>
    </Sheet>
  );
}
