import { useEffect, useState } from "react";
import { State, buildICS, buildWaterICS, download, emptyState } from "@/lib/store";

type Props = { state: State; replaceAll: (s: State) => void };

export default function Ajustes({ state, replaceAll }: Props) {
  const [perm, setPerm] = useState("…");
  const [wFrom, setWFrom] = useState("08:00");
  const [wTo, setWTo] = useState("22:00");
  const [wEvery, setWEvery] = useState(2);
  useEffect(() => {
    setPerm("Notification" in window ? Notification.permission : "indisponível");
  }, []);

  const importFile = () => {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = "application/json";
    i.onchange = async () => {
      try {
        replaceAll({ ...emptyState(), ...JSON.parse(await i.files![0].text()) });
      } catch {
        alert("Arquivo inválido.");
      }
    };
    i.click();
  };

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Ajustes</h1>
      <div className="card">
        <b>Alarmes no calendário do iPhone</b>
        <p className="text-sm text-muted">
          Mais confiável que notificações do app: o iPhone toca mesmo com o app fechado. Baixe e toque em “Adicionar tudo”.
        </p>
        <button className="btn" onClick={() => {
          if (!state.meds.length) return alert("Cadastre um remédio primeiro.");
          download("remedios.ics", "text/calendar", buildICS(state));
        }}>Gerar alarmes (.ics)</button>
      </div>
      <div className="card">
        <b>Lembretes de água no calendário</b>
        <p className="text-sm text-muted">Um alarme “💧 Beber água” todos os dias, no intervalo que você escolher.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-sm font-semibold">Das<input type="time" className="field" value={wFrom} onChange={(e) => setWFrom(e.target.value)} /></label>
          <label className="text-sm font-semibold">Até<input type="time" className="field" value={wTo} onChange={(e) => setWTo(e.target.value)} /></label>
        </div>
        <p className="mt-3 text-sm font-semibold">A cada</p>
        <div className="mt-1 flex gap-2">
          {[1, 2, 3].map((h) => (
            <button key={h} onClick={() => setWEvery(h)} aria-pressed={wEvery === h}
              className={`min-h-[44px] rounded-full px-4 ${wEvery === h ? "bg-accent font-semibold text-accent-ink" : "border-2 border-line"}`}>
              {h} h
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => {
          if (!wFrom || !wTo || wFrom > wTo) return alert("Confira os horários: o início deve ser antes do fim.");
          download("agua.ics", "text/calendar", buildWaterICS(wFrom, wTo, wEvery));
        }}>Gerar lembretes de água (.ics)</button>
      </div>
      <div className="card">
        <b>Notificações do app</b>
        <p className="text-sm text-muted">
          Estado: {perm}. No iPhone, só funcionam com o app instalado na Tela de Início e podem atrasar ou não chegar. Use como reforço.
        </p>
        <button className="btn btn-secondary" onClick={async () => {
          if ("Notification" in window) setPerm(await Notification.requestPermission());
        }}>Ativar notificações</button>
      </div>
      <div className="card">
        <b>Backup</b>
        <p className="text-sm text-muted">Seus dados ficam só neste aparelho. Exporte de vez em quando.</p>
        <button className="btn btn-secondary" onClick={() => download("foco-e-rotina-backup.json", "application/json", JSON.stringify(state))}>
          Exportar dados
        </button>
        <button className="btn btn-secondary" onClick={importFile}>Importar dados</button>
      </div>
      <p className="text-sm text-muted">Instalar: Safari → Compartilhar → “Adicionar à Tela de Início”.</p>
    </>
  );
}
