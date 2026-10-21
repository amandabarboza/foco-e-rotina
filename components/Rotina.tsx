import { useState } from "react";
import { Scissors } from "lucide-react";
import { Med, State, Task, dayKey, uid } from "@/lib/store";
import Quebrar from "./Quebrar";
import Remedios from "./Remedios";

type Props = {
  state: State;
  update: (fn: (s: State) => State) => void;
  saveMed: (m: Med) => void;
  deleteMed: (id: string) => void;
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

// Modelos prontos para não ter que pensar nos passos do zero.
const TEMPLATES: Omit<Task, "id">[] = [
  { name: "Lavar a louça", steps: ["Juntar a louça na pia", "Ensaboar", "Enxaguar", "Deixar no escorredor"], days: EVERY_DAY, time: "20:00", essential: false },
  { name: "Arrumar a cama", steps: ["Esticar o lençol", "Ajeitar o travesseiro", "Puxar a coberta"], days: EVERY_DAY, time: "", essential: false },
  { name: "Lavar roupa", steps: ["Separar roupas claras e escuras", "Colocar na máquina com sabão", "Ligar a máquina", "Estender quando terminar"], days: [6], time: "10:00", essential: false },
  { name: "Tirar o lixo", steps: ["Fechar o saco", "Levar até a lixeira", "Colocar saco novo"], days: [1, 3, 5], time: "19:00", essential: false },
  { name: "Comer uma refeição", steps: ["Escolher algo simples", "Preparar ou esquentar", "Comer sentada, sem tela se der"], days: EVERY_DAY, time: "12:30", essential: true },
  { name: "Banho", steps: ["Separar a toalha e a roupa", "Tomar banho", "Vestir roupa confortável"], days: EVERY_DAY, time: "", essential: true },
];

export default function Rotina(props: Props) {
  const [sub, setSub] = useState<"tarefas" | "remedios">("tarefas");
  return (
    <>
      <h1 className="h1 mb-3 pt-2">Rotina</h1>
      <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-soft p-1" role="tablist">
        {(["tarefas", "remedios"] as const).map((id) => (
          <button key={id} role="tab" aria-selected={sub === id} onClick={() => setSub(id)}
            className={`min-h-[44px] rounded-[10px] text-sm ${sub === id ? "bg-card font-bold text-accent" : "text-muted"}`}>
            {id === "tarefas" ? "Tarefas da casa" : "Remédios"}
          </button>
        ))}
      </div>
      {sub === "tarefas" ? (
        <Tarefas state={props.state} update={props.update} />
      ) : (
        <Remedios state={props.state} saveMed={props.saveMed} deleteMed={props.deleteMed} />
      )}
    </>
  );
}

type Draft = Task & { stepsText: string };

function Tarefas({ state, update }: Pick<Props, "state" | "update">) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const toDraft = (t: Task): Draft => ({ ...t, stepsText: t.steps.join("\n") });

  if (editing) {
    const isNew = !state.tasks.some((t) => t.id === editing.id);
    const set = (patch: Partial<Draft>) => setEditing({ ...editing, ...patch });
    const toggleDay = (d: number) =>
      set({ days: editing.days.includes(d) ? editing.days.filter((x) => x !== d) : [...editing.days, d].sort() });
    const save = () => {
      const name = editing.name.trim();
      if (!name) return alert("Dê um nome para a tarefa.");
      if (!editing.once && !editing.days.length) return alert("Escolha pelo menos um dia.");
      const { stepsText, ...rest } = editing;
      const task: Task = { ...rest, name, steps: stepsText.split("\n").map((s) => s.trim()).filter(Boolean) };
      update((s) => ({
        ...s,
        tasks: s.tasks.some((t) => t.id === task.id) ? s.tasks.map((t) => (t.id === task.id ? task : t)) : [...s.tasks, task],
      }));
      setEditing(null);
    };
    return (
      <>
        <h2 className="mt-5 text-lg font-bold">{isNew ? "Nova tarefa" : "Editar tarefa"}</h2>
        <div className="card">
          <label className="block text-[.95rem] font-semibold" htmlFor="t-name">Nome</label>
          <input id="t-name" className="field" autoComplete="off" value={editing.name} onChange={(e) => set({ name: e.target.value })} />
          <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="t-steps">Passos (um por linha)</label>
          <textarea id="t-steps" rows={5} className="field py-2" value={editing.stepsText}
            onChange={(e) => set({ stepsText: e.target.value })} placeholder={"Juntar os pratos\nEnsaboar\nEnxaguar"} />
          <p className="text-sm text-muted">Passos pequenos ajudam a começar. Pode deixar vazio.</p>
          {editing.once ? (
            <>
              <label className="label" htmlFor="t-once">Dia</label>
              <input id="t-once" type="date" className="field" value={editing.once} onChange={(e) => set({ once: e.target.value })} />
            </>
          ) : (
            <>
          <label className="mt-3 block text-[.95rem] font-semibold">Dias</label>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {DAYS.map((d, i) => (
              <button key={d} onClick={() => toggleDay(i)} aria-pressed={editing.days.includes(i)}
                className={`min-h-[44px] rounded-lg text-sm ${editing.days.includes(i) ? "bg-accent font-semibold text-accent-ink" : "border-2 border-line"}`}>
                {d}
              </button>
            ))}
          </div>
            </>
          )}
          <label className="mt-3 block text-[.95rem] font-semibold" htmlFor="t-time">Horário (opcional)</label>
          <div className="flex gap-2">
            <input id="t-time" type="time" className="field" value={editing.time} onChange={(e) => set({ time: e.target.value })} />
            {editing.time && <button className="btn btn-small btn-secondary !m-0" onClick={() => set({ time: "" })}>Sem horário</button>}
          </div>
          <label className="mt-4 flex min-h-[44px] items-center gap-3">
            <input type="checkbox" className="h-6 w-6 accent-[var(--accent)]" checked={editing.essential}
              onChange={(e) => set({ essential: e.target.checked })} />
            <span>Essencial (aparece mesmo no modo baixa energia)</span>
          </label>
          <button className="btn" onClick={save}>Salvar</button>
          <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
          {!isNew && (
            <button className="btn btn-secondary" onClick={() => {
              if (confirm("Excluir esta tarefa?")) {
                update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== editing.id) }));
                setEditing(null);
              }
            }}>Excluir</button>
          )}
        </div>
      </>
    );
  }

  const [breaking, setBreaking] = useState(false);
  const unused = TEMPLATES.filter((tpl) => !state.tasks.some((t) => t.name === tpl.name));
  const today = dayKey();
  const visible = state.tasks.filter((t) => !t.once || t.once >= today);
  return (
    <>
      <button onClick={() => setBreaking(true)} className="card hero mt-4 flex w-full items-center gap-3 border-0 text-left">
        <Scissors size={22} className="shrink-0 text-accent" />
        <span><span className="block font-extrabold">Quebrar uma tarefa grande</span>
          <span className="muted block">Transforma “fazer o TCC” em passos pequenos com tempo.</span></span>
      </button>
      {breaking && <Quebrar update={update} onClose={() => setBreaking(false)} />}
      {!visible.length && <div className="card"><p>Nenhuma tarefa ainda. Comece por um modelo abaixo ou crie a sua.</p></div>}
      {visible.map((t) => (
        <div key={t.id} className="card flex items-center justify-between gap-3">
          <div>
            <b>{t.name}</b>{t.essential && <span className="pill ml-2">essencial</span>}
            <br />
            <span className="text-sm text-muted">
              {t.once ? (t.once === today ? "Só hoje" : `Só em ${t.once.split("-").reverse().slice(0, 2).join("/")}`)
                : t.days.length === 7 ? "Todo dia" : t.days.map((d) => DAYS[d]).join(", ")}
              {t.time && ` · ${t.time}`} · {t.steps.length} passos
            </span>
          </div>
          <button className="btn btn-small btn-secondary" onClick={() => setEditing(toDraft(t))}>Editar</button>
        </div>
      ))}
      <button className="btn"
        onClick={() => setEditing(toDraft({ id: uid(), name: "", steps: [], days: EVERY_DAY, time: "", essential: false }))}>
        + Nova tarefa
      </button>
      {unused.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-bold">Modelos prontos</h2>
          <p className="text-sm text-muted">Toque para adicionar; dá para ajustar depois.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unused.map((tpl) => (
              <button key={tpl.name} className="btn btn-small btn-secondary !m-0"
                onClick={() => update((s) => ({ ...s, tasks: [...s.tasks, { ...tpl, id: uid() }] }))}>
                + {tpl.name}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
