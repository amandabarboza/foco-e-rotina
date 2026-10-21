import { useEffect, useState } from "react";
import { State, buildICS, download, emptyState } from "@/lib/store";

type Props = { state: State; replaceAll: (s: State) => void };

export default function Ajustes({ state, replaceAll }: Props) {
  const [perm, setPerm] = useState("…");
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
