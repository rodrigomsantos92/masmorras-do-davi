// Controle geral do jogo: telas, entrada (teclado e toque) e o loop principal.

const Game = {
  save: null,
  estado: "titulo",       // titulo | hub | loja | selecao | masmorra | fim
  hub: null,
  masmorra: null,
  teclas: {},
  joy: { x: 0, z: 0 },
  cliques: { atacar: false, flecha: false, pocao: false },
  ultimo: 0,

  init() {
    this.save = carregarSave();
    if (!this.save.armaEquipada && this.save.dinheiro >= CONFIG.armas.espada_inicial.preco && !Object.keys(this.save.armas).length) {
      // primeiro jogo: o jogador começa com 200 e "compra" a Espada Inicial automaticamente
      this.save.dinheiro -= CONFIG.armas.espada_inicial.preco;
      this.save.armas.espada_inicial = { evolucoes: 0 };
      this.save.armaEquipada = "espada_inicial";
      salvar(this.save);
    }
    Scene3D.init(document.getElementById("c"));
    HUD.init();
    this.ligarEntrada();
    this.atualizarTitulo();
    this.mostrar("titulo");
    requestAnimationFrame(t => this.loop(t));
  },

  // ---------- telas ----------
  mostrar(id) {
    for (const tela of document.querySelectorAll(".tela")) tela.hidden = tela.id !== `tela-${id}`;
    HUD.el.hud.hidden = !(this.estado === "hub" || this.estado === "masmorra");
    document.getElementById("touch").hidden = HUD.el.hud.hidden;
  },

  atualizarTitulo() {
    document.getElementById("tituloDinheiro").textContent = this.save.dinheiro.toLocaleString("pt-BR");
    Shop.renderClasses(this.save, document.getElementById("classes"));
    // boneco de preview na tela inicial
    const cena = Scene3D.novaCena(0x1b1230, 0x2c2250, 8);
    const boneco = Scene3D.personagem(CONFIG.classes[this.save.classe], this.save.armaEquipada);
    cena.add(boneco); this.preview = boneco;
    Scene3D.camera.position.set(0, 2.5, 5.5); Scene3D.camera.lookAt(0, 1.3, 0);
  },

  jogar() {
    this.estado = "hub";
    this.hub = new Hub(this.save);
    HUD.setDinheiro(this.save.dinheiro);
    this.mostrar("nenhuma");
  },

  abrirLoja() {
    this.estado = "loja";
    Shop.render(this.save, document.getElementById("loja"));
    this.mostrar("loja");
  },
  fecharLoja() {
    // troca a arma na mão do boneco, se mudou
    this.hub.scene.remove(this.hub.player.mesh);
    this.hub.player = new Player(this.save, this.hub.scene);
    this.hub.player.pos.copy(this.hub.lojaPos).add(new THREE.Vector3(3, 0, 3));
    this.estado = "hub";
    this.mostrar("nenhuma");
  },

  abrirSelecao() {
    this.estado = "selecao";
    const el = document.getElementById("masmorras");
    let html = "";
    for (const [id, m] of Object.entries(CONFIG.masmorras)) {
      const req = m.requisito;
      const tem = !req || this.save.fragmentos[req.fragmento] >= req.quantidade;
      const reqTxt = req ? `${req.quantidade}x ${CONFIG.fragmentos[req.fragmento].nome} (você tem ${this.save.fragmentos[req.fragmento]})` : "Gratuita";
      html += `<div class="item ${tem ? "" : "bloq"}"><div><b>${m.nome}</b><br>
        <small>${m.quantidade} ${m.inimigo.nome}s + chefe ${m.chefe.nome}<br>Requisito: ${reqTxt}<br>Vitórias: ${this.save.vitorias[id] || 0}</small></div>
        <div>${tem ? `<button data-entrar="${id}">Entrar</button>` : `<span class="tag bloq">Bloqueada</span>`}</div></div>`;
    }
    el.innerHTML = html;
    el.onclick = (e) => { const b = e.target.closest("button"); if (b && b.dataset.entrar) this.entrarMasmorra(b.dataset.entrar); };
    this.mostrar("selecao");
  },

  entrarMasmorra(id) {
    this.estado = "masmorra";
    this.hub = null;
    this.masmorra = new Dungeon(id, this.save);
    HUD.setDinheiro(this.save.dinheiro);
    document.getElementById("btnPronto").hidden = false;
    this.mostrar("nenhuma");
  },

  pronto() { if (this.masmorra) { this.masmorra.pronto(); document.getElementById("btnPronto").hidden = true; } },

  voltarCentro() {
    HUD.limparNumeros();
    if (this.masmorra) { this.masmorra.destruir(); this.masmorra = null; }
    this.jogar();
  },

  tentarNovamente() {
    const id = this.masmorra.id;
    HUD.limparNumeros();
    this.masmorra.destruir();
    this.entrarMasmorra(id);
  },

  fim(res) {
    this.estado = "fim";
    const el = document.getElementById("fimTexto");
    if (res.derrota) {
      document.getElementById("fimTitulo").textContent = "Você foi derrotado";
      el.innerHTML = "";
      document.getElementById("btnTentar").hidden = false;
    } else {
      document.getElementById("fimTitulo").textContent = "Vitória!";
      el.innerHTML = res.linhas.map(l => `<div>${l}</div>`).join("");
      document.getElementById("btnTentar").hidden = true;
    }
    setTimeout(() => this.mostrar("fim"), 900);
  },

  resetar() {
    apagarSave();
    location.reload();
  },

  // ---------- entrada ----------
  ligarEntrada() {
    window.addEventListener("keydown", e => {
      this.teclas[e.key.toLowerCase()] = true;
      if (e.key === " ") { this.cliques.atacar = true; e.preventDefault(); }
      if (e.key.toLowerCase() === "f") this.cliques.flecha = true;
      if (e.key.toLowerCase() === "q") this.cliques.pocao = true;
      if (e.key.toLowerCase() === "e") this.interagir();
      if (e.key === "Escape" && this.estado === "loja") this.fecharLoja();
      if (e.key === "Escape" && this.estado === "selecao") { this.estado = "hub"; this.mostrar("nenhuma"); }
    });
    window.addEventListener("keyup", e => (this.teclas[e.key.toLowerCase()] = false));
    document.getElementById("c").addEventListener("pointerdown", () => { if (this.estado === "masmorra") this.cliques.atacar = true; });

    // joystick de toque
    const joy = document.getElementById("joy"), knob = document.getElementById("knob");
    let ativo = null;
    const mover = (e) => {
      const r = joy.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const max = r.width / 2, d = Math.hypot(dx, dy);
      if (d > max) { dx *= max / d; dy *= max / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.hypot(dx, dy) / max;
      this.joy = m < 0.15 ? { x: 0, z: 0 } : { x: dx / max, z: dy / max };
    };
    joy.addEventListener("pointerdown", e => { ativo = e.pointerId; joy.setPointerCapture(e.pointerId); mover(e); });
    joy.addEventListener("pointermove", e => { if (ativo === e.pointerId) mover(e); });
    const soltar = e => { if (ativo === e.pointerId) { ativo = null; this.joy = { x: 0, z: 0 }; knob.style.transform = ""; } };
    joy.addEventListener("pointerup", soltar); joy.addEventListener("pointercancel", soltar);

    document.getElementById("bAtacar").addEventListener("pointerdown", e => { e.preventDefault(); this.cliques.atacar = true; });
    document.getElementById("bFlecha").addEventListener("pointerdown", e => { e.preventDefault(); this.cliques.flecha = true; });
    document.getElementById("bPocao").addEventListener("pointerdown", e => { e.preventDefault(); this.cliques.pocao = true; });
    document.getElementById("bInteragir").addEventListener("pointerdown", e => { e.preventDefault(); this.interagir(); });
  },

  movimento() {
    let x = 0, z = 0;
    if (this.teclas["w"] || this.teclas["arrowup"]) z -= 1;
    if (this.teclas["s"] || this.teclas["arrowdown"]) z += 1;
    if (this.teclas["a"] || this.teclas["arrowleft"]) x -= 1;
    if (this.teclas["d"] || this.teclas["arrowright"]) x += 1;
    if (!x && !z) { x = this.joy.x; z = this.joy.z; }
    const l = Math.hypot(x, z);
    return l > 1 ? { x: x / l, z: z / l } : { x, z };
  },

  interagir() {
    if (this.estado !== "hub") return;
    const perto = this.hub.pertoDe();
    if (perto === "loja") this.abrirLoja();
    else if (perto === "portal") this.abrirSelecao();
  },

  // ---------- loop ----------
  loop(t) {
    requestAnimationFrame(tt => this.loop(tt));
    const dt = Math.min(0.05, (t - this.ultimo) / 1000 || 0);
    this.ultimo = t;

    if (this.estado === "titulo") {
      if (this.preview) this.preview.rotation.y += dt * 0.8;
    } else if (this.estado === "hub") {
      this.hub.update(dt, this.movimento());
      const perto = this.hub.pertoDe();
      const dica = document.getElementById("dica");
      dica.hidden = !perto;
      dica.textContent = perto === "loja" ? "Falar com o Ferreiro  [E]" : "Entrar no Portal  [E]";
      document.getElementById("bInteragir").hidden = !perto;
      document.getElementById("bAtacar").hidden = true; document.getElementById("bFlecha").hidden = true; document.getElementById("bPocao").hidden = true;
    } else if (this.estado === "masmorra") {
      document.getElementById("dica").hidden = true;
      document.getElementById("bInteragir").hidden = true;
      document.getElementById("bAtacar").hidden = false;
      document.getElementById("bFlecha").hidden = !CONFIG.classes[this.save.classe].temFlecha;
      document.getElementById("bPocao").hidden = false;
      const res = this.masmorra.update(dt, { mov: this.movimento(), ...this.cliques });
      HUD.update(dt);
      if (res) this.fim(res);
    } else if (this.estado === "fim" && this.masmorra) {
      this.masmorra.update(dt, { mov: { x: 0, z: 0 }, atacar: false, flecha: false, pocao: false });
      HUD.update(dt);
    }
    this.cliques = { atacar: false, flecha: false, pocao: false };
    if (Scene3D.scene) Scene3D.renderer.render(Scene3D.scene, Scene3D.camera);
  },
};

window.addEventListener("DOMContentLoaded", () => Game.init());
