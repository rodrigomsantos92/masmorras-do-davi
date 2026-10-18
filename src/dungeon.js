// Masmorra: arena, ondas de inimigos, chefe, derrota e recompensas.

const ARENA_RAIO = 16;

class Dungeon {
  constructor(id, save) {
    this.id = id;
    this.cfg = CONFIG.masmorras[id];
    this.save = save;
    this.scene = Scene3D.novaCena(this.cfg.corCeu, this.cfg.corChao, ARENA_RAIO);
    this.decorar();
    this.player = new Player(save, this.scene);
    this.player.pos.set(0, 0, 4);
    this.inimigos = [];
    this.projeteis = [];
    this.fase = "preparando";       // preparando | ondas | chefe | vitoria | derrota
    this.spawnados = 0;
    this.mortos = 0;
    this.tProximoSpawn = 0;
    this.chefe = null;
    this.efeitos = [];
    HUD.setFase(`${this.cfg.nome} — aperte Pronto para começar`);
    HUD.setChefe(null);
  }

  decorar() {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + Math.random() * 0.2;
      const r = ARENA_RAIO + 1 + Math.random() * 3;
      const arv = Scene3D.arvore(this.cfg.corTronco, this.cfg.corArvore, 1 + Math.random() * 0.8);
      arv.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      this.scene.add(arv);
    }
    if (this.id === "gelo") {
      for (let i = 0; i < 10; i++) {
        const c = Scene3D.box(1 + Math.random(), 0.6 + Math.random(), 1 + Math.random(), 0xbfe3f5);
        const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 8;
        c.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r); c.rotation.y = a;
        this.scene.add(c);
      }
    }
  }

  pronto() {
    if (this.fase !== "preparando") return;
    this.fase = "ondas";
    this.tProximoSpawn = 0;
    HUD.setFase(`${this.cfg.inimigo.nome}s: 0 / ${this.cfg.quantidade}`);
  }

  posicaoSpawn() {
    const a = Math.random() * Math.PI * 2;
    const r = ARENA_RAIO - 2;
    return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
  }

  spawnInimigo() {
    const e = new Enemy(this.cfg.inimigo, this.scene, this.posicaoSpawn());
    this.inimigos.push(e);
    this.spawnados++;
    this.tProximoSpawn = this.cfg.intervaloSpawn;
  }

  spawnChefe() {
    this.fase = "chefe";
    this.player.curarTudo();
    this.chefe = new Enemy(this.cfg.chefe, this.scene, new THREE.Vector3(0, 0, -ARENA_RAIO + 3), true);
    this.inimigos.push(this.chefe);
    HUD.setFase(`CHEFE: ${this.cfg.chefe.nome}`);
    HUD.setChefe(this.chefe);
    HUD.mensagem(`${this.cfg.chefe.nome} apareceu! Vida restaurada.`, "chefe");
  }

  // entrada: { mov:{x,z}, atacar:bool, flecha:bool, pocao:bool }
  update(dt, entrada) {
    const vivos = this.inimigos.filter(e => e.vivo);

    // --- jogador ---
    this.player.update(dt, entrada.mov, ARENA_RAIO - 0.8, vivos);
    if (entrada.pocao && this.player.usarPocao()) {
      HUD.numero(this.player.pos, `+${CONFIG.pocao.cura}`, "cura");
    }
    if (entrada.atacar) {
      for (const a of this.player.atacarEspada(vivos)) this.aplicarDano(a);
    }
    if (entrada.flecha) {
      const p = this.player.atirarFlecha(vivos);
      if (p) { this.projeteis.push(p); this.scene.add(p.mesh); }
    }
    for (const p of this.projeteis) {
      const a = p.update(dt, vivos);
      if (a) this.aplicarDano(a);
      if (!p.vivo) this.scene.remove(p.mesh);
    }
    this.projeteis = this.projeteis.filter(p => p.vivo);

    // --- inimigos ---
    for (const e of this.inimigos) {
      for (const ev of e.update(dt, this.player)) {
        if (ev.tipo === "dano") {
          this.player.receberDano(ev.valor);
          HUD.numero(this.player.pos, `-${ev.valor}`, ev.especial ? "especial" : "dano");
          HUD.tremer();
        } else if (ev.tipo === "aviso") {
          HUD.mensagem(`${e.cfg.nome} vai usar ${ev.nome}! Saia do círculo!`, "aviso");
        } else if (ev.tipo === "impacto") {
          this.efeitoImpacto(ev.pos, ev.raio);
        }
      }
    }
    this.inimigos = this.inimigos.filter(e => e.vivo || e.mesh.position.y > -3);

    // --- efeitos ---
    for (const f of this.efeitos) { f.t -= dt; f.mesh.scale.setScalar(1 + (1 - f.t / 0.4) * 0.6); f.mesh.material.opacity = f.t / 0.4; if (f.t <= 0) this.scene.remove(f.mesh); }
    this.efeitos = this.efeitos.filter(f => f.t > 0);

    // --- ondas ---
    if (this.fase === "ondas") {
      this.tProximoSpawn -= dt;
      const vivosAgora = this.inimigos.filter(e => e.vivo).length;
      if (this.spawnados < this.cfg.quantidade && (this.tProximoSpawn <= 0 || vivosAgora === 0)) this.spawnInimigo();
      if (this.spawnados >= this.cfg.quantidade && this.mortos >= this.cfg.quantidade) this.spawnChefe();
    } else if (this.fase === "chefe" && this.chefe && !this.chefe.vivo) {
      this.fase = "vitoria";
      return this.recompensar();
    }

    if (!this.player.vivo && this.fase !== "derrota") { this.fase = "derrota"; return { derrota: true }; }

    HUD.setHp(this.player.hp, CONFIG.jogador.hpMax);
    HUD.setPocoes(this.save.pocoes);
    if (this.chefe) HUD.setChefe(this.chefe);
    Scene3D.seguirCamera(this.player.pos, dt);
    return null;
  }

  aplicarDano(a) {
    const morreu = a.inimigo.receberDano(a.dano);
    if (!morreu && !a.inimigo.ehChefe && !a.flecha) {
      const dir = a.inimigo.pos.clone().sub(this.player.pos).setY(0).normalize();
      a.inimigo.pos.addScaledVector(dir, CONFIG.jogador.empurrao);
      a.inimigo.cd = Math.max(a.inimigo.cd, CONFIG.jogador.atordoar);
    }
    HUD.numero(a.inimigo.pos, `${a.dano}`, "ataque", a.inimigo.mesh.userData.altura);
    if (morreu && !a.inimigo.ehChefe) {
      this.mortos++;
      // próximo inimigo vem logo após a morte, sem esperar os 15 s
      this.tProximoSpawn = Math.min(this.tProximoSpawn, this.cfg.spawnAposMorte);
      HUD.setFase(`${this.cfg.inimigo.nome}s: ${this.mortos} / ${this.cfg.quantidade}`);
    }
  }

  efeitoImpacto(pos, raio) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(raio, 32), new THREE.MeshBasicMaterial({ color: 0xff6a3b, transparent: true, opacity: 1 }));
    m.rotation.x = -Math.PI / 2; m.position.set(pos.x, 0.04, pos.z);
    this.scene.add(m);
    this.efeitos.push({ mesh: m, t: 0.4 });
  }

  recompensar() {
    const r = this.cfg.recompensa;
    const linhas = [];
    const s = this.save;
    s.dinheiro += r.dinheiro; linhas.push(`+${r.dinheiro} de dinheiro`);
    if (r.evolucao && s.armaEquipada) {
      const a = s.armas[s.armaEquipada];
      if (a.evolucoes < CONFIG.jogador.evolucoesMax) {
        a.evolucoes++;
        linhas.push(`Espada evoluiu +${CONFIG.jogador.evolucaoPorcento}% (${a.evolucoes}/${CONFIG.jogador.evolucoesMax}) → dano ${danoArma(s)}`);
      } else linhas.push(`Espada já está no nível máximo de evolução`);
    }
    if (r.fragmento) { s.fragmentos[r.fragmento]++; linhas.push(`+1 ${CONFIG.fragmentos[r.fragmento].nome}`); }
    if (r.dropArma && !s.armas[r.dropArma.id] && Math.random() < r.dropArma.chance) {
      s.armas[r.dropArma.id] = { evolucoes: 0 };
      linhas.push(`RARO! Dropou ${CONFIG.armas[r.dropArma.id].nome}!`);
    }
    s.vitorias[this.id] = (s.vitorias[this.id] || 0) + 1;
    salvar(s);
    return { vitoria: true, linhas };
  }

  destruir() {
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
}
