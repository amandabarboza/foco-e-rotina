// Quebra uma tarefa grande em passos pequenos, por palavras-chave (sem IA).
export type Step = { text: string; min: number };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const RULES: { keys: string[]; steps: (t: string) => Step[] }[] = [
  {
    keys: ["prova", "estudar", "estudo", "materia", "revisar", "simulado", "concurso", "vestibular"],
    steps: () => [
      { text: "Separar o material (caderno, livro, link) na mesa", min: 3 },
      { text: "Listar os tópicos que vão cair", min: 5 },
      { text: "Escolher só o primeiro tópico", min: 1 },
      { text: "Estudar esse tópico por 25 min", min: 25 },
      { text: "Pausa: água e alongar", min: 5 },
      { text: "Fazer 5 exercícios ou perguntas sobre ele", min: 15 },
      { text: "Anotar o que ficou difícil para revisar depois", min: 3 },
    ],
  },
  {
    keys: ["tcc", "trabalho", "relatorio", "artigo", "monografia", "redacao", "texto", "apresentacao", "slide"],
    steps: () => [
      { text: "Abrir o arquivo (ou criar um em branco)", min: 1 },
      { text: "Escrever o objetivo em uma frase", min: 3 },
      { text: "Listar as partes/tópicos em tópicos soltos", min: 10 },
      { text: "Escolher a parte mais fácil", min: 1 },
      { text: "Escrever um rascunho feio dessa parte, sem corrigir", min: 25 },
      { text: "Pausa", min: 5 },
      { text: "Anotar o próximo passo para a próxima sessão", min: 2 },
    ],
  },
  {
    keys: ["email", "e-mail", "mensagem", "responder", "whatsapp"],
    steps: () => [
      { text: "Abrir a conversa ou o e-mail", min: 1 },
      { text: "Escrever em uma frase o que precisa dizer", min: 2 },
      { text: "Escrever a resposta curta, sem caprichar", min: 5 },
      { text: "Ler uma vez e enviar", min: 2 },
    ],
  },
  {
    keys: ["ligar", "telefonar", "ligacao", "marcar consulta", "agendar"],
    steps: () => [
      { text: "Achar o número ou o site", min: 2 },
      { text: "Escrever um roteiro de 3 frases do que vou falar", min: 5 },
      { text: "Separar documentos/datas que podem pedir", min: 3 },
      { text: "Ligar (ou agendar pelo site/WhatsApp)", min: 10 },
      { text: "Anotar data e hora combinadas", min: 1 },
    ],
  },
  {
    keys: ["limpar", "faxina", "arrumar", "organizar", "quarto", "casa", "cozinha", "banheiro", "guarda-roupa"],
    steps: () => [
      { text: "Colocar uma música ou podcast", min: 1 },
      { text: "Pegar um saco para lixo e uma caixa para “não é daqui”", min: 2 },
      { text: "Recolher só o lixo", min: 5 },
      { text: "Recolher só as roupas", min: 5 },
      { text: "Levar a louça para a pia", min: 3 },
      { text: "Limpar uma superfície (mesa ou pia)", min: 5 },
      { text: "Guardar a caixa “não é daqui”", min: 10 },
    ],
  },
  {
    keys: ["documento", "imposto", "declaracao", "formulario", "visto", "passaporte", "banco", "boleto", "conta", "burocracia", "inscricao"],
    steps: () => [
      { text: "Descobrir o que precisa (site oficial, lista de documentos)", min: 10 },
      { text: "Criar uma pasta (no celular ou física) para isso", min: 2 },
      { text: "Juntar os documentos que já tenho", min: 10 },
      { text: "Listar o que falta", min: 3 },
      { text: "Fazer só o primeiro item que falta", min: 15 },
      { text: "Anotar o prazo final na agenda", min: 2 },
    ],
  },
  {
    keys: ["mercado", "compras", "comprar", "feira"],
    steps: () => [
      { text: "Olhar a geladeira e o armário", min: 3 },
      { text: "Escrever a lista no celular", min: 5 },
      { text: "Separar sacolas e carteira", min: 2 },
      { text: "Ir (ou pedir pelo app)", min: 40 },
      { text: "Guardar só o que vai na geladeira primeiro", min: 5 },
    ],
  },
  {
    keys: ["cozinhar", "marmita", "comida", "jantar", "almoco", "refeicao"],
    steps: () => [
      { text: "Escolher uma receita simples que já sei fazer", min: 2 },
      { text: "Separar os ingredientes na bancada", min: 5 },
      { text: "Preparar (cortar, temperar)", min: 15 },
      { text: "Cozinhar", min: 25 },
      { text: "Separar em potes para os próximos dias", min: 5 },
    ],
  },
  {
    keys: ["roupa", "lavar", "passar"],
    steps: () => [
      { text: "Juntar as roupas sujas num lugar só", min: 3 },
      { text: "Separar claras e escuras", min: 3 },
      { text: "Colocar na máquina e ligar", min: 3 },
      { text: "Estender (ou colocar na secadora)", min: 10 },
      { text: "Dobrar só as roupas de baixo e meias", min: 5 },
    ],
  },
  {
    keys: ["exercicio", "academia", "treino", "caminhar", "correr", "yoga"],
    steps: () => [
      { text: "Vestir a roupa de exercício", min: 3 },
      { text: "Encher a garrafinha de água", min: 1 },
      { text: "Fazer 5 min de aquecimento", min: 5 },
      { text: "Fazer o treino ou caminhada (vale menos tempo)", min: 20 },
      { text: "Alongar", min: 5 },
    ],
  },
];

const GENERIC: Step[] = [
  { text: "Escrever como fica quando estiver “pronto”", min: 3 },
  { text: "Separar o que preciso (objetos, arquivos, links)", min: 5 },
  { text: "Fazer só a primeira ação física possível", min: 5 },
  { text: "Trabalhar nisso por 15 min", min: 15 },
  { text: "Pausa", min: 5 },
  { text: "Decidir o próximo passo e anotar", min: 2 },
];

export function breakdown(task: string): { steps: Step[]; matched: boolean } {
  const t = norm(task);
  const rule = RULES.find((r) => r.keys.some((k) => t.includes(norm(k))));
  return rule ? { steps: rule.steps(task), matched: true } : { steps: GENERIC, matched: false };
}

// O menor primeiro passo possível para "Só 2 minutos".
export function tinyStep(task: string): string {
  return breakdown(task).steps[0].text;
}
