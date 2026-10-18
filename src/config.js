// =====================================================================
//  CONFIG — todos os números do jogo ficam aqui.
//  Davi: pode mexer à vontade nesses valores sem tocar no resto do código.
// =====================================================================

const CONFIG = {
  jogador: {
    hpMax: 200,
    dinheiroInicial: 200,
    velocidade: 6,          // unidades por segundo
    alcanceEspada: 2.2,     // distância para acertar com a espada
    cooldownEspada: 1.0,    // segundos entre golpes
    flecha: { dano: 50, cooldown: 2.0, alcance: 14, velocidade: 18 },
    regen: { espera: 3, porSegundo: 4 },   // 3 s sem levar dano → recupera 4 HP por segundo
    empurrao: 0.7,          // quanto o inimigo é empurrado ao ser acertado pela espada
    atordoar: 0.9,          // ao ser acertado, o inimigo comum leva pelo menos 0,9 s para atacar de novo
    evolucoesMax: 5,        // limite de evoluções por espada (+8% cada)
    evolucaoPorcento: 8,
  },

  classes: {
    arqueiro: { nome: "Arqueiro", preco: 0,     temFlecha: true,  cor: 0x3f8f3a, corDetalhe: 0x235c20, corCabelo: 0xf2d13a, corChapeu: 0x3f8f3a, corPele: 0xe8c9a0 },
    anjo:     { nome: "Anjo",     preco: 25000, temFlecha: false, cor: 0xf4f4f4, corDetalhe: 0xf0c419, corCabelo: 0xfff2b0, corChapeu: 0xf0c419, corPele: 0xe8c9a0, asas: true },
  },

  armas: {
    espada_inicial: { nome: "Espada Inicial", preco: 200,   dano: 150,  cor: 0xb0b0b0 },
    espada_dupla:   { nome: "Espada Dupla",   preco: 1500,  dano: 300,  cor: 0x8ab4ff, dupla: true },
    foice:          { nome: "Foice",          preco: 7500,  dano: 550,  cor: 0x9b5de5 },
    adaga_gelo:     { nome: "Adaga de Gelo",  preco: 15000, dano: 1000, cor: 0x7fe3ff },
    espada_anjo:    { nome: "Espada do Anjo", preco: null,  dano: 1350, cor: 0xffffff, corDetalhe: 0xf0c419, soClasse: "anjo" },
  },

  pocao: { preco: 100, cura: 50 },

  fragmentos: {
    inicial: { nome: "Fragmento de Masmorra Inicial" },
    neve:    { nome: "Fragmento da Neve" },
  },
  trocaFragmentos: 3, // 3 fragmentos de qualquer tipo = 1 evolução no ferreiro

  masmorras: {
    floresta: {
      nome: "Floresta",
      requisito: null,
      corChao: 0x4f8a3a, corCeu: 0xa8d8f0, corArvore: 0x2f6b2a, corTronco: 0x6b4423,
      inimigo: { nome: "Macaco", hp: 1000, dano: 10, velocidade: 3.2, cor: 0x7a4e2d, tamanho: 0.8, alcance: 1.6, cooldown: 1.8 },
      quantidade: 10,
      intervaloSpawn: 15,      // segundos até o próximo spawn...
      spawnAposMorte: 3,       // ...ou 3 s depois de matar o anterior (o que vier primeiro)
      chefe: {
        nome: "Gorila", hp: 4000, dano: 20, velocidade: 2.6, cor: 0x2b2b2b, tamanho: 1.8, alcance: 2.4, cooldown: 2.5,
        especial: { tipo: "rugido", nome: "Rugido", intervalo: 20, aviso: 1.2, raio: 5, dano: 50 },
      },
      recompensa: { dinheiro: 3000, evolucao: true, fragmento: "inicial" },
    },
    gelo: {
      nome: "Gelo",
      requisito: { fragmento: "inicial", quantidade: 2 },
      corChao: 0xdfeefa, corCeu: 0xcfe0ee, corArvore: 0x9fc9d8, corTronco: 0x7a8a95,
      inimigo: { nome: "Pinguim", hp: 2300, dano: 12, velocidade: 3.0, cor: 0x1c1c1c, tamanho: 0.8, alcance: 1.6, cooldown: 1.8 },
      quantidade: 15,
      intervaloSpawn: 13,
      spawnAposMorte: 3,
      chefe: {
        nome: "Yeti", hp: 6000, dano: 25, velocidade: 2.8, cor: 0xf2f6ff, tamanho: 2.0, alcance: 2.6, cooldown: 2.5,
        especial: { tipo: "pulo", nome: "Pulo", intervalo: 14, aviso: 1.0, raio: 3.5, dano: 70 },
      },
      recompensa: { dinheiro: 5000, evolucao: false, fragmento: "neve", dropArma: { id: "adaga_gelo", chance: 0.10 } },
    },
  },
};
