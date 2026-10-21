import { DoseStatus, State, todayDoses, todayTasks } from "@/lib/store";

const LABEL = { taken: "Tomado", skipped: "Pulado" };

type Props = {
  state: State;
  update: (fn: (s: State) => State) => void;
  mark: (id: string, status: DoseStatus | null) => void;
};

export default function Hoje({ state, update, mark }: Props) {
  const doses = todayDoses(state);
  const tasks = todayTasks(state);
  const setTask = (key: string, done: boolean) =>
    update((s) => {
      const taskDone = { ...s.taskDone };
      if (done) taskDone[key] = true;
      else delete taskDone[key];
      return { ...s, taskDone };
    });

  const items = [
    ...doses.map((d) => ({ at: d.at, node: (
      <div key={d.id} className={`flex items-center justify-between gap-3 border-t border-line py-3 ${d.status ? "opacity-60" : ""}`}>
        <div><b>{d.time}</b> · 💊 {d.med.name}<br /><span className="text-sm text-muted">{d.status ? LABEL[d.status] : "A tomar"}</span></div>
        {d.status ? (
          <button className="btn btn-small btn-secondary !m-0" onClick={() => mark(d.id, null)}>Desfazer</button>
        ) : (
          <button className="btn btn-small !m-0" onClick={() => mark(d.id, "taken")}>Tomei</button>
        )}
      </div>
    ) })),
    ...tasks.map((t) => ({ at: t.at ?? Infinity, node: (
      <div key={t.key} className={`flex items-center justify-between gap-3 border-t border-line py-3 ${t.done ? "opacity-60" : ""}`}>
        <div><b>{t.task.time || "—"}</b> · 🏠 {t.task.name}<br /><span className="text-sm text-muted">{t.done ? "Feito" : "A fazer"}</span></div>
        <button className={`btn btn-small !m-0 ${t.done ? "btn-secondary" : ""}`} onClick={() => setTask(t.key, !t.done)}>
          {t.done ? "Desfazer" : "Feito"}
        </button>
      </div>
    ) })),
  ].sort((a, b) => a.at - b.at);

  if (!items.length) return <p className="mt-2">Nada agendado para hoje.</p>;
  return <div className="mt-2">{items.map((i) => i.node)}</div>;
}
