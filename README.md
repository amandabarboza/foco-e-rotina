# Foco e Rotina

PWA para iPhone: lembretes de remédio e rotina, simples e sem culpa. Feito para autismo/TDAH.

- Next.js (App Router) + TypeScript + Tailwind.
- Abas: Agora (uma coisa por vez + modo baixa energia), Rotina (tarefas com passos e remédios), Foco (timer), Corpo (água, comida, peso, plano), Ajustes.
- Dados só no aparelho (localStorage). Sem banco, sem login.
- Rodar: `npm install && npm run dev`
- Deploy: importar o repositório na Vercel (detecta Next.js sozinha).
- Instalar no iPhone: Safari → Compartilhar → Adicionar à Tela de Início.
- Alarmes confiáveis: Ajustes → Gerar alarmes (.ics) de remédios e de água → Adicionar ao Calendário.

Notificações do app só disparam com o app aberto/instalado e não são garantidas no iOS; use o .ics para o remédio.
