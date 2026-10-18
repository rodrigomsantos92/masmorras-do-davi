// Progresso do jogador salvo no navegador (localStorage).

const SAVE_KEY = "masmorras-do-davi:save:v1";

function novoSave() {
  return {
    dinheiro: CONFIG.jogador.dinheiroInicial,
    classe: "arqueiro",
    classes: ["arqueiro"],
    armas: {},                 // id -> { evolucoes: n }
    armaEquipada: null,
    pocoes: 0,
    fragmentos: { inicial: 0, neve: 0 },
    vitorias: { floresta: 0, gelo: 0 },
  };
}

function carregarSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return novoSave();
    const s = Object.assign(novoSave(), JSON.parse(raw));
    s.fragmentos = Object.assign({ inicial: 0, neve: 0 }, s.fragmentos);
    s.vitorias = Object.assign({ floresta: 0, gelo: 0 }, s.vitorias);
    return s;
  } catch (e) {
    return novoSave();
  }
}

function salvar(save) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
}

function apagarSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

// Dano atual da arma equipada, já com evoluções.
function danoArma(save) {
  const id = save.armaEquipada;
  if (!id) return 0;
  const base = CONFIG.armas[id].dano;
  const ev = (save.armas[id] && save.armas[id].evolucoes) || 0;
  return Math.round(base * Math.pow(1 + CONFIG.jogador.evolucaoPorcento / 100, ev));
}
