import { useState } from "react";
import { Med, State, uid } from "@/lib/store";

type Props = { state: State; saveMed: (m: Med) => void; deleteMed: (id: string) => void };

export default function Remedios({ state, saveMed, deleteMed }: Props) {
  const [editing, setEditing] = useState<Med | null>(null);

  if (editing) {
    const isNew = !state.meds.some((m) => m.id === editing.id);
    const set = (patch: Partial<Med>) => setEditing({ ...editing, ...patch });
    const submit = () => {
      const name = editing.name.trim();
      const times = [...new Set(editing.times.filter(Boolean))].sort();
      if (!name || !times.length) return alert("Preencha o nome e ao menos um horário.");
      saveMed({ ...editing, name, dose: editing.dose.trim(), times });
      setEditing(null);
    };
    return (
      <>
        <h2 className="mt-5 text-lg font-bold">{isNew ? "Novo remédio" : "Editar remédio"}</h2>
        <div className="card">
          <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="f-name">Nome</label>
          <input id="f-name" className="field" autoComplete="off" value={editing.name}
            onChange={(e) => set({ name: e.target.value })} />
          <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="f-dose">Dose / observação</label>
          <input id="f-dose" className="field" autoComplete="off" placeholder="ex.: 1 comprimido, com comida"
            value={editing.dose} onChange={(e) => set({ dose: e.target.value })} />
          <label className="mt-3 block text-[.95rem] font-semibold">Horários (todos os dias)</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {editing.times.map((t, i) => (
              <input key={i} type="time" className="field w-auto" value={t} aria-label={`Horário ${i + 1}`}
                onChange={(e) => set({ times: editing.times.map((x, j) => (j === i ? e.target.value : x)) })} />
            ))}
          </div>
          <button className="btn btn-small btn-secondary" onClick={() => set({ times: [...editing.times, "12:00"] })}>
            + horário
          </button>
          <button className="btn" onClick={submit}>Salvar</button>
          <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
          {!isNew && (
            <button className="btn btn-secondary" onClick={() => {
              if (confirm("Excluir este remédio?")) { deleteMed(editing.id); setEditing(null); }
            }}>Excluir</button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {!state.meds.length && <div className="card"><p>Nenhum remédio ainda.</p></div>}
      {state.meds.map((m) => (
        <div key={m.id} className="card flex items-center justify-between gap-3">
          <div>
            <b>{m.name}</b>
            <br />
            <span className="text-sm text-muted">{m.dose} {m.times.join(" · ")}</span>
          </div>
          <button className="btn btn-small btn-secondary" onClick={() => setEditing(m)}>Editar</button>
        </div>
      ))}
      <button className="btn" onClick={() => setEditing({ id: uid(), name: "", dose: "", times: ["08:00"] })}>
        + Adicionar remédio
      </button>
    </>
  );
}
