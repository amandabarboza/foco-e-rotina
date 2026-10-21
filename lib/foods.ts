// Valores aproximados por porção, baseados na Tabela TACO e em rótulos comuns.
export type Food = { id: string; name: string; cat: FoodCat; portion: string; kcal: number; p: number; c: number; f: number };
export type FoodCat = "paes" | "feijoes" | "proteinas" | "leite" | "frutas" | "verduras" | "gorduras" | "bebidas" | "lanches";

export const CATS: Record<FoodCat, string> = {
  paes: "Pães, arroz e massas",
  feijoes: "Feijões",
  proteinas: "Carnes e ovos",
  leite: "Leite e derivados",
  frutas: "Frutas",
  verduras: "Verduras e legumes",
  gorduras: "Gorduras e castanhas",
  bebidas: "Bebidas",
  lanches: "Lanches e doces",
};

const F = (id: string, name: string, cat: FoodCat, portion: string, kcal: number, p: number, c: number, f: number): Food =>
  ({ id, name, cat, portion, kcal, p, c, f });

export const FOODS: Food[] = [
  F("arroz", "Arroz branco", "paes", "1 colher de servir (45 g)", 58, 1.1, 12.6, 0.1),
  F("arroz-int", "Arroz integral", "paes", "1 colher de servir (45 g)", 56, 1.2, 11.6, 0.4),
  F("pao-frances", "Pão francês", "paes", "1 unidade (50 g)", 150, 4, 29, 1.6),
  F("pao-forma", "Pão de forma integral", "paes", "1 fatia (25 g)", 63, 2.4, 12, 0.9),
  F("tapioca", "Tapioca (goma)", "paes", "2 colheres de sopa (30 g)", 72, 0, 18, 0),
  F("cuscuz", "Cuscuz de milho", "paes", "1 pedaço (100 g)", 113, 2.2, 25, 0.7),
  F("macarrao", "Macarrão cozido", "paes", "1 pegador (110 g)", 112, 3.7, 22, 1.3),
  F("aveia", "Aveia em flocos", "paes", "2 colheres de sopa (20 g)", 79, 2.8, 13, 1.7),
  F("batata", "Batata cozida", "paes", "1 média (140 g)", 73, 1.7, 16.6, 0),
  F("batata-doce", "Batata-doce cozida", "paes", "1 média (150 g)", 115, 0.9, 27, 0.1),
  F("mandioca", "Mandioca cozida", "paes", "1 pedaço (100 g)", 125, 0.6, 30, 0.3),
  F("cracker", "Biscoito cream cracker", "paes", "4 unidades (24 g)", 103, 2.4, 16.5, 3.3),
  F("granola", "Granola", "paes", "2 colheres de sopa (20 g)", 85, 1.8, 14, 2.7),

  F("feijao", "Feijão carioca", "feijoes", "1 concha (86 g)", 66, 4.1, 11.7, 0.4),
  F("feijao-preto", "Feijão preto", "feijoes", "1 concha (86 g)", 66, 3.9, 12, 0.5),
  F("lentilha", "Lentilha", "feijoes", "1 concha (90 g)", 84, 5.8, 14.6, 0.4),
  F("grao-bico", "Grão-de-bico", "feijoes", "3 colheres de sopa (60 g)", 98, 5.3, 16, 1.5),

  F("frango", "Peito de frango grelhado", "proteinas", "1 filé (100 g)", 159, 32, 0, 2.5),
  F("coxa", "Coxa de frango assada", "proteinas", "1 unidade (90 g)", 194, 25, 0, 10),
  F("carne-moida", "Carne moída refogada", "proteinas", "3 colheres de sopa (90 g)", 190, 27, 0, 8),
  F("bife", "Bife grelhado", "proteinas", "1 bife (100 g)", 241, 32, 0, 11.6),
  F("ovo", "Ovo cozido", "proteinas", "1 unidade (50 g)", 73, 6.6, 0.3, 5),
  F("ovo-mexido", "Ovos mexidos", "proteinas", "2 ovos", 180, 13, 1, 13),
  F("peixe", "Peixe grelhado (tilápia)", "proteinas", "1 filé (100 g)", 128, 26, 0, 2.7),
  F("atum", "Atum em água", "proteinas", "3 colheres de sopa (60 g)", 70, 15, 0, 0.6),
  F("presunto", "Presunto", "proteinas", "2 fatias (30 g)", 28, 4.2, 0.6, 0.8),

  F("leite", "Leite integral", "leite", "1 copo (200 ml)", 122, 6.2, 9.4, 6.6),
  F("leite-desn", "Leite desnatado", "leite", "1 copo (200 ml)", 70, 6.8, 10, 0.4),
  F("iogurte", "Iogurte natural", "leite", "1 pote (170 g)", 100, 6.5, 8, 5),
  F("iogurte-desn", "Iogurte natural desnatado", "leite", "1 pote (170 g)", 70, 7, 10, 0.3),
  F("minas", "Queijo minas frescal", "leite", "1 fatia (30 g)", 79, 5.2, 1, 6),
  F("mussarela", "Queijo muçarela", "leite", "1 fatia (20 g)", 66, 4.5, 0.6, 5),
  F("requeijao", "Requeijão", "leite", "1 colher de sopa (30 g)", 77, 2.9, 0.7, 7),
  F("whey", "Whey protein", "leite", "1 dose (30 g)", 120, 24, 3, 1.5),

  F("banana", "Banana", "frutas", "1 unidade (70 g)", 69, 0.9, 18, 0.1),
  F("maca", "Maçã", "frutas", "1 unidade (130 g)", 73, 0.4, 19.5, 0),
  F("laranja", "Laranja", "frutas", "1 unidade (140 g)", 52, 1.4, 12.8, 0.1),
  F("mamao", "Mamão papaia", "frutas", "½ unidade (150 g)", 60, 0.8, 15.6, 0.1),
  F("melancia", "Melancia", "frutas", "1 fatia (200 g)", 66, 1.8, 16, 0),
  F("uva", "Uva", "frutas", "1 cacho pequeno (100 g)", 53, 0.7, 13.6, 0.2),
  F("manga", "Manga", "frutas", "1 pequena (140 g)", 101, 0.6, 26, 0.3),
  F("morango", "Morango", "frutas", "10 unidades (120 g)", 36, 1, 8, 0.4),
  F("abacate", "Abacate", "frutas", "2 colheres de sopa (45 g)", 43, 0.6, 2.7, 3.8),

  F("salada", "Salada de folhas", "verduras", "1 prato de sobremesa (50 g)", 8, 0.6, 1.3, 0.1),
  F("tomate", "Tomate", "verduras", "4 rodelas (60 g)", 9, 0.7, 1.9, 0.1),
  F("cenoura", "Cenoura ralada", "verduras", "2 colheres de sopa (30 g)", 10, 0.4, 2.3, 0),
  F("brocolis", "Brócolis cozido", "verduras", "3 colheres de sopa (60 g)", 15, 1.3, 2.6, 0.3),
  F("legumes", "Legumes cozidos", "verduras", "3 colheres de sopa (60 g)", 25, 1, 5, 0.1),
  F("abobrinha", "Abobrinha refogada", "verduras", "3 colheres de sopa (60 g)", 20, 0.7, 2.5, 1),

  F("azeite", "Azeite", "gorduras", "1 colher de sopa (8 ml)", 72, 0, 0, 8),
  F("manteiga", "Manteiga", "gorduras", "1 ponta de faca (5 g)", 36, 0, 0, 4),
  F("castanha", "Castanha-do-pará", "gorduras", "2 unidades (8 g)", 52, 1.1, 1.2, 5.1),
  F("amendoim", "Amendoim torrado", "gorduras", "1 colher de sopa (15 g)", 91, 3.3, 2.8, 7.4),
  F("pasta-amendoim", "Pasta de amendoim", "gorduras", "1 colher de sopa (15 g)", 94, 3.8, 3, 7.5),

  F("cafe", "Café sem açúcar", "bebidas", "1 xícara (50 ml)", 3, 0.1, 0.4, 0),
  F("cafe-leite", "Café com leite sem açúcar", "bebidas", "1 xícara (150 ml)", 46, 2.3, 3.5, 2.5),
  F("suco-laranja", "Suco de laranja natural", "bebidas", "1 copo (200 ml)", 66, 1.4, 15, 0.2),
  F("refri", "Refrigerante", "bebidas", "1 lata (350 ml)", 149, 0, 37, 0),
  F("acucar", "Açúcar", "bebidas", "1 colher de chá (5 g)", 19, 0, 5, 0),

  F("pao-queijo", "Pão de queijo", "lanches", "1 médio (40 g)", 145, 2, 14, 9),
  F("coxinha", "Salgado frito (coxinha)", "lanches", "1 médio (80 g)", 240, 7, 26, 12),
  F("pizza", "Pizza de muçarela", "lanches", "1 fatia (100 g)", 270, 11, 30, 12),
  F("hamburguer", "Hambúrguer simples", "lanches", "1 sanduíche", 250, 13, 30, 9),
  F("batata-frita", "Batata frita", "lanches", "1 porção pequena (100 g)", 270, 3.4, 35, 13),
  F("chocolate", "Chocolate ao leite", "lanches", "4 quadradinhos (25 g)", 135, 1.8, 15, 7.5),
  F("brigadeiro", "Brigadeiro", "lanches", "1 unidade (20 g)", 80, 0.8, 13, 3),
  F("sorvete", "Sorvete", "lanches", "1 bola (60 g)", 120, 2, 16, 5),
  F("mel", "Mel", "lanches", "1 colher de sopa (20 g)", 60, 0, 16, 0),
];

export const foodById = (id: string) => FOODS.find((f) => f.id === id);

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const searchFoods = (q: string) => {
  const n = norm(q.trim());
  return n ? FOODS.filter((f) => norm(f.name).includes(n)) : FOODS;
};
