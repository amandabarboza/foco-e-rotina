import { useEffect, useState } from "react";
import { Bell, CalendarHeart, CalendarPlus, Download, Droplet, Pill, RotateCcw, Smartphone, Upload } from "lucide-react";
import { State, buildICS, buildWaterICS, download, emptyState } from "@/lib/store";
import { Chips } from "./ui";
import { RevisaoSheet } from "./Revisao";

type Props = { state: State; replaceAll: (s: State) => void; update: (fn: (s: State) => State) => void };

export default function Ajustes({ state, replaceAll, update }: Props) {
  const [perm, setPerm] = useState("…");
  const [review, setReview] = useState(false);
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
        replaceAll({ ...emptyState(), onboarded: true, ...JSON.parse(await i.files![0].text()) });
      } catch {
        alert("Arquivo inválido.");
      }
    };
    i.click();
  };

  const permLabel: Record<string, string> = { granted: "ativadas", denied: "bloqueadas", default: "ainda não ativadas" };

  return (
    <>
      <h1 className="h1 pt-2">Ajustes</h1>

      <h2 className="h2"><CalendarPlus size={20} /> Alarmes no Calendário do iPhone</h2>
      <div className="card">
        <p className="muted mb-3">O jeito mais confiável: o iPhone toca mesmo com o app fechado. Baixe o arquivo e toque em “Adicionar tudo”.</p>
        <p className="flex items-center gap-2 font-semibold text-med"><Pill size={18} /> Remédios</p>
        <p className="muted">{state.meds.length ? `${state.meds.length} remédio(s), com um segundo aviso 10 min depois.` : "Cadastre remédios em Rotina primeiro."}</p>
        <button className="btn" disabled={!state.meds.length} onClick={() => download("remedios.ics", "text/calendar", buildICS(state))}>
          Gerar alarmes de remédios
        </button>
      </div>
      <div className="card">
        <p className="flex items-center gap-2 font-semibold text-water"><Droplet size={18} /> Água</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-sm font-semibold">Das<input type="time" className="field" value={wFrom} onChange={(e) => setWFrom(e.target.value)} /></label>
          <label className="text-sm font-semibold">Até<input type="time" className="field" value={wTo} onChange={(e) => setWTo(e.target.value)} /></label>
        </div>
        <p className="label">A cada</p>
        <Chips options={[1, 2, 3]} value={wEvery} onChange={setWEvery} render={(h) => `${h} h`} />
        <button className="btn" onClick={() => {
          if (!wFrom || !wTo || wFrom > wTo) return alert("Confira os horários: o início deve ser antes do fim.");
          download("agua.ics", "text/calendar", buildWaterICS(wFrom, wTo, wEvery));
        }}>Gerar lembretes de água</button>
      </div>

      <h2 className="h2"><Bell size={20} /> Notificações do app</h2>
      <div className="card">
        <p>Estado: <b>{permLabel[perm] ?? perm}</b></p>
        <p className="muted">No iPhone, só funcionam com o app instalado na Tela de Início, e podem atrasar. Use como reforço dos alarmes acima.</p>
        <button className="btn btn-secondary" onClick={async () => {
          if ("Notification" in window) setPerm(await Notification.requestPermission());
        }}>Ativar notificações</button>
      </div>

      <h2 className="h2"><Download size={20} /> Backup</h2>
      <div className="card">
        <p className="muted">Seus dados ficam só neste aparelho. Exporte de vez em quando e guarde no Arquivos ou iCloud.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-secondary" onClick={() => download(`foco-e-rotina-${new Date().toISOString().slice(0, 10)}.json`, "application/json", JSON.stringify(state))}>
            <Download size={18} /> Exportar
          </button>
          <button className="btn btn-secondary" onClick={importFile}><Upload size={18} /> Importar</button>
        </div>
      </div>

      <h2 className="h2"><Smartphone size={20} /> Instalar no iPhone</h2>
      <div className="card">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Abra o site no <b>Safari</b>.</li>
          <li>Toque em <b>Compartilhar</b> (quadrado com seta).</li>
          <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
          <li>Abra sempre pelo ícone.</li>
        </ol>
      </div>

      <button className="btn btn-secondary" onClick={() => setReview(true)}><CalendarHeart size={18} /> Revisão da semana</button>
      {review && <RevisaoSheet state={state} update={update} onClose={() => setReview(false)} />}
      <button className="btn btn-secondary" onClick={() => update((s) => ({ ...s, onboarded: false }))}>
        <RotateCcw size={18} /> Refazer o passo a passo inicial
      </button>
    </>
  );
}
