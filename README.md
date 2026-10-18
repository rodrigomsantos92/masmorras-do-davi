# Masmorras do Davi

Jogo de masmorra 3D de ação no navegador, feito com [Three.js](https://threejs.org/). Projeto do Davi, com ajuda do pai.

**Como jogar:** abra o `index.html` no navegador (precisa de internet para carregar o Three.js). Funciona no computador e no celular.

| Computador | Celular |
|---|---|
| WASD ou setas: andar | Joystick: andar |
| Espaço ou clique: atacar | Botão Atacar |
| F: flecha (Arqueiro) | Botão Flecha |
| Q: poção | Botão Poção |
| E: falar com o ferreiro / entrar no portal | Botão Interagir |

Todos os números do jogo (vida, dano, preços, tempos) ficam em `src/config.js`. Mudou ali, mudou no jogo.

---

## Documento de design

### 1. Visão geral

- **Estilo:** masmorra 3D de ação, progressão por ondas e chefes.
- **Objetivo:** explorar o Hub central, comprar armas com o ferreiro, entrar em portais de masmorras, derrotar inimigos e chefes, coletar fragmentos e desbloquear novas masmorras e classes.

### 2. Tela inicial e classes

| Classe | Preço | Visual | Bônus |
|---|---|---|---|
| **Arqueiro** (inicial) | grátis | chapéu verde, pele bege, só olhos (sem boca), cabelo amarelo, roupa e calça verdes com detalhes verde-escuros, botas, arco nas costas | Flecha à distância: 50 de dano a cada 2 s |
| **Anjo** | 25.000 | pele bege, roupa branca com detalhes amarelos, asas | Desbloqueia a Espada do Anjo |

- O jogador começa com **200 de dinheiro** e **200 de HP**. Os 200 iniciais compram automaticamente a Espada Inicial.
- Velocidade de ataque da espada: **1 golpe por segundo**.

### 3. Hub central ("Mini Centro") e loja do ferreiro

Depois de "Jogar", o jogador aparece num mini centro com fonte, bancos e árvores. Há uma loja de madeira do velho ferreiro e um portal para as masmorras.

| Arma | Preço | Dano |
|---|---|---|
| Espada Inicial | 200 | 150 |
| Espada Dupla | 1.500 | 300 |
| Foice | 7.500 | 550 |
| Adaga de Gelo | 15.000 | 1.000 |
| Espada do Anjo | só com a classe Anjo | 1.350 |

O ferreiro também vende **Poção de Vida** (100 de dinheiro, cura 50 HP) e **troca 3 fragmentos por 1 evolução** da arma equipada.

### 4. Masmorras

#### Masmorra 1: Floresta
- **Requisito:** gratuita.
- **Ondas:** 10 Macacos. O próximo macaco aparece a cada 15 s **ou** 3 s depois de matar o anterior (o que vier primeiro).
- **Macaco:** 1.000 de vida, 10 de dano.
- **Chefe — Gorila:** aparece depois dos 10 macacos. 4.000 de vida, 20 de dano. A vida do jogador é restaurada quando o chefe aparece.
  - **Rugido:** a cada 20 s. O gorila bate no peito por 1,2 s e um círculo vermelho aparece no chão; quem estiver dentro quando ele rugir leva 50 de dano. Dá para fugir.
- **Recompensa:** 3.000 de dinheiro · espada equipada evolui +8% (até 5 evoluções por arma) · 1 Fragmento de Masmorra Inicial.

#### Masmorra 2: Gelo
- **Requisito:** 2 Fragmentos de Masmorra Inicial (a Floresta precisa ser vencida pelo menos duas vezes).
- **Ondas:** 15 Pinguins, próximo a cada 13 s ou 3 s depois de uma morte.
- **Pinguim:** 2.300 de vida, 12 de dano.
- **Chefe — Yeti:** 6.000 de vida, 25 de dano.
  - **Pulo:** o yeti se agacha, o círculo aparece onde o jogador está, e ele cai ali. Dentro do círculo: 70 de dano.
- **Recompensa:** 5.000 de dinheiro · 1 Fragmento da Neve · 10% de chance de dropar a Adaga de Gelo.

### 5. Derrota

Se o HP chegar a 0: tela de derrota com **Tente novamente** (reinicia a masmorra) e **Voltar pro centro**.

### 6. Salvamento

Dinheiro, armas, evoluções, fragmentos, classes e vitórias ficam salvos no navegador. "Recomeçar do zero" apaga tudo.

---

## Próximas ideias

- [ ] Masmorra 3 (deserto? vulcão?) com novo chefe
- [ ] Sons e música
- [ ] Mais classes
- [ ] Dash / esquiva
- [ ] Ranking de tempo por masmorra

## Estrutura do código

```
index.html       tela inicial, HUD, controles de toque
src/config.js    TODOS os números do jogo
src/save.js      salvar/carregar progresso
src/scene.js     Three.js, câmera, luzes, modelos em blocos
src/player.js    jogador, espada, flecha, poção
src/enemies.js   inimigos e chefes (com ataque especial)
src/hub.js       mini centro: fonte, ferreiro, portal
src/shop.js      loja do ferreiro e loja de classes
src/dungeon.js   ondas, chefe, recompensas
src/hud.js       barras, mensagens, números flutuantes
src/main.js      telas, entrada (teclado/toque) e loop
```
