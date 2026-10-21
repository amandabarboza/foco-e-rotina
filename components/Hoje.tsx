import { DoseStatus, State, todayDoses } from "@/lib/store";

const LABEL = { taken: "Tomado", skipped: "Pulado" };

type Props = { state: State; mark: (id: string, status: DoseStatus | null) => void };

export default function Hoje({ state, mark }: Props) {
  const doses = todayDoses(state);
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Hoje</h1>
      {!doses.length && <div className="card"><p>Nada agendado.</p></div>}
      {doses.map((d) => (
        <div key={d.id} className={`card ${d.status ? "opacity-60" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <b>{d.time}</b> · {d.med.name}
              <br />
              <span className="text-sm text-muted">{d.med.dose}</span>
            </div>
            <span className={`pill ${d.status ? "" : "bg-warm"}`}>{d.status ? LABEL[d.status] : "A tomar"}</span>
          </div>
          {d.status ? (
            <button className="btn btn-small btn-secondary" onClick={() => mark(d.id, null)}>Desfazer</button>
          ) : (
            <button className="btn btn-small" onClick={() => mark(d.id, "taken")}>Tomei</button>
          )}
        </div>
      ))}
    </>
  );
}
