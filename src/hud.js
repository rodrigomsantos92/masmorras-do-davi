// HUD: barra de vida, dinheiro, fase, barra do chefe, mensagens e números flutuantes.

const HUD = {
  el: {},
  numeros: [],
  init() {
    for (const id of ["hud", "hpBar", "hpTxt", "dinheiro", "fase", "chefeBox", "chefeBar", "chefeNome", "msg", "pocoes", "numeros"]) {
      this.el[id] = document.getElementById(id);
    }
  },
  setHp(hp, max) { this.el.hpBar.style.width = `${(100 * hp) / max}%`; this.el.hpTxt.textContent = `${Math.ceil(hp)} / ${max}`; },
  setDinheiro(v) { this.el.dinheiro.textContent = v.toLocaleString("pt-BR"); },
  setPocoes(n) { this.el.pocoes.textContent = n; },
  setFase(t) { this.el.fase.textContent = t; },
  setChefe(chefe) {
    if (!chefe) { this.el.chefeBox.hidden = true; return; }
    this.el.chefeBox.hidden = false;
    this.el.chefeNome.textContent = `${chefe.cfg.nome} — ${Math.max(0, chefe.hp)} / ${chefe.hpMax}`;
    this.el.chefeBar.style.width = `${(100 * Math.max(0, chefe.hp)) / chefe.hpMax}%`;
  },
  mensagem(t, tipo = "") {
    const m = this.el.msg; m.textContent = t; m.className = `msg ${tipo}`; m.hidden = false;
    clearTimeout(this._tm); this._tm = setTimeout(() => (m.hidden = true), 2200);
  },
  tremer() { document.body.classList.remove("tremer"); void document.body.offsetWidth; document.body.classList.add("tremer"); },

  // Número flutuante projetado da posição 3D para a tela.
  numero(pos3, texto, tipo, altura = 2.4) {
    const d = document.createElement("div");
    d.className = `num ${tipo}`; d.textContent = texto;
    this.el.numeros.appendChild(d);
    this.numeros.push({ d, pos: pos3.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, altura, 0)), t: 0 });
  },
  update(dt) {
    const cam = Scene3D.camera, w = window.innerWidth, h = window.innerHeight;
    for (const n of this.numeros) {
      n.t += dt; n.pos.y += dt * 1.2;
      const p = n.pos.clone().project(cam);
      n.d.style.transform = `translate(${(p.x * 0.5 + 0.5) * w}px, ${(-p.y * 0.5 + 0.5) * h}px)`;
      n.d.style.opacity = Math.max(0, 1 - n.t / 1.0);
      if (n.t > 1) n.d.remove();
    }
    this.numeros = this.numeros.filter(n => n.t <= 1);
  },
  limparNumeros() { for (const n of this.numeros) n.d.remove(); this.numeros = []; },
};
