import { REPEAT_MIN, State, nextPending, todayDoses } from "@/lib/store";

type Props = {
  state: State;
  mark: (id: string, status: "taken" | "skipped") => void;
  snooze: (id: string) => void;
  goAdd: () => void;
};

export default function Agora({ state, mark, snooze, goAdd }: Props) {
  const { due, upcoming } = nextPending(state);

  if (!state.meds.length) {
    return (
      <>
        <h1 className="mb-1 text-2xl font-bold">Olá 👋</h1>
        <div className="card bg-soft px-5 py-6 text-center">
          <p className="my-1 text-3xl font-bold">Vamos começar?</p>
          <p>Cadastre seu primeiro remédio e eu te lembro na hora certa.</p>
          <button className="btn" onClick={goAdd}>Adicionar remédio</button>
        </div>
      </>
    );
  }

  if (due) {
    const late = Date.now() - due.at > 30 * 60000;
    return (
      <>
        <h1 className="mb-1 text-2xl font-bold">Agora</h1>
        <div className={`card px-5 py-6 text-center ${late ? "bg-warm" : "bg-soft"}`}>
          <p className="text-lg text-muted">{due.time}{late ? " · sem pressa, ainda dá tempo" : ""}</p>
          <p className="my-1 text-3xl font-bold">{due.med.name}</p>
          {due.med.dose && <p>{due.med.dose}</p>}
          <button className="btn" onClick={() => mark(due.id, "taken")}>Tomei ✔</button>
          <button className="btn btn-secondary" onClick={() => snooze(due.id)}>Daqui a {REPEAT_MIN} min</button>
          <button className="btn btn-secondary" onClick={() => mark(due.id, "skipped")}>Pular hoje</button>
        </div>
      </>
    );
  }

  const left = todayDoses(state).filter((d) => !d.status).length;
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Agora</h1>
      <div className="card bg-soft px-5 py-6 text-center">
        <p className="my-1 text-3xl font-bold">{left ? "Tudo certo por ora 🌿" : "Tudo feito por hoje 🎉"}</p>
        {upcoming && <p>Próximo: <b>{upcoming.med.name}</b> às {upcoming.time}</p>}
        <p className="text-sm text-muted">Você não precisa fazer mais nada agora.</p>
      </div>
    </>
  );
}
