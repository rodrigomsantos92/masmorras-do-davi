// Loja do Ferreiro: armas, poções, troca de fragmentos. E a loja de classes na tela inicial.

const Shop = {
  render(save, el) {
    const dano = danoArma(save);
    const temFrag = save.fragmentos.inicial + save.fragmentos.neve;
    let html = `<h2>Ferreiro</h2>
      <p class="fala">"Olá, jovem. Dinheiro: <b>${save.dinheiro}</b>. Fragmentos: <b>${temFrag}</b>."</p>
      <div class="lista">`;
    for (const [id, a] of Object.entries(CONFIG.armas)) {
      const tem = !!save.armas[id];
      const equipada = save.armaEquipada === id;
      const ev = tem ? save.armas[id].evolucoes : 0;
      const danoAtual = Math.round(a.dano * Math.pow(1 + CONFIG.jogador.evolucaoPorcento / 100, ev));
      let acao;
      if (equipada) acao = `<span class="tag">Equipada</span>`;
      else if (tem) acao = `<button data-equipar="${id}">Equipar</button>`;
      else if (a.soClasse) acao = `<span class="tag bloq">Só para a classe ${CONFIG.classes[a.soClasse].nome}</span>`;
      else acao = `<button data-comprar="${id}" ${save.dinheiro < a.preco ? "disabled" : ""}>Comprar — ${a.preco}</button>`;
      html += `<div class="item ${equipada ? "sel" : ""}">
        <div><b>${a.nome}</b><br><small>Dano ${danoAtual}${ev ? ` (evoluída ${ev}x)` : ""}</small></div>
        <div>${acao}</div></div>`;
    }
    html += `<div class="item"><div><b>Poção de Vida</b><br><small>Cura ${CONFIG.pocao.cura} HP · Você tem ${save.pocoes}</small></div>
      <div><button data-pocao="1" ${save.dinheiro < CONFIG.pocao.preco ? "disabled" : ""}>Comprar — ${CONFIG.pocao.preco}</button></div></div>`;
    const podeTrocar = temFrag >= CONFIG.trocaFragmentos && save.armaEquipada && save.armas[save.armaEquipada].evolucoes < CONFIG.jogador.evolucoesMax;
    html += `<div class="item"><div><b>Trocar fragmentos</b><br><small>${CONFIG.trocaFragmentos} fragmentos = +${CONFIG.jogador.evolucaoPorcento}% de dano na arma equipada (dano atual ${dano})</small></div>
      <div><button data-trocar="1" ${podeTrocar ? "" : "disabled"}>Trocar</button></div></div>`;
    html += `</div><button class="fechar" data-fechar="1">Sair da loja</button>`;
    el.innerHTML = html;

    el.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.comprar) {
        const id = b.dataset.comprar, a = CONFIG.armas[id];
        if (save.dinheiro >= a.preco) { save.dinheiro -= a.preco; save.armas[id] = { evolucoes: 0 }; save.armaEquipada = id; }
      } else if (b.dataset.equipar) save.armaEquipada = b.dataset.equipar;
      else if (b.dataset.pocao) { if (save.dinheiro >= CONFIG.pocao.preco) { save.dinheiro -= CONFIG.pocao.preco; save.pocoes++; } }
      else if (b.dataset.trocar) {
        let n = CONFIG.trocaFragmentos;
        for (const k of ["inicial", "neve"]) { const u = Math.min(n, save.fragmentos[k]); save.fragmentos[k] -= u; n -= u; }
        save.armas[save.armaEquipada].evolucoes++;
      } else if (b.dataset.fechar) { Game.fecharLoja(); return; }
      salvar(save);
      Shop.render(save, el);
      HUD.setDinheiro(save.dinheiro);
    };
  },

  // Tela inicial: escolha/compra de classe
  renderClasses(save, el) {
    let html = "";
    for (const [id, c] of Object.entries(CONFIG.classes)) {
      const tem = save.classes.includes(id);
      const atual = save.classe === id;
      let acao;
      if (atual) acao = `<span class="tag">Selecionada</span>`;
      else if (tem) acao = `<button data-classe="${id}">Selecionar</button>`;
      else acao = `<button data-comprar-classe="${id}" ${save.dinheiro < c.preco ? "disabled" : ""}>Comprar — ${c.preco.toLocaleString("pt-BR")}</button>`;
      const bonus = id === "anjo" ? "Desbloqueia a Espada do Anjo (dano 1.350)" : "Flecha à distância (50 de dano a cada 2 s)";
      html += `<div class="item ${atual ? "sel" : ""}"><div><b>${c.nome}</b><br><small>${bonus}</small></div><div>${acao}</div></div>`;
    }
    el.innerHTML = html;
    el.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.classe) save.classe = b.dataset.classe;
      else if (b.dataset.comprarClasse) {
        const id = b.dataset.comprarClasse, c = CONFIG.classes[id];
        if (save.dinheiro >= c.preco) {
          save.dinheiro -= c.preco; save.classes.push(id); save.classe = id;
          if (id === "anjo") { save.armas.espada_anjo = { evolucoes: 0 }; save.armaEquipada = "espada_anjo"; }
        }
      }
      salvar(save);
      Game.atualizarTitulo();
    };
  },
};
