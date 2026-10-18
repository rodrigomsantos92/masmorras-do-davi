// Jogador: movimento, ataque com espada, flecha (arqueiro) e poções.

class Player {
  constructor(save, scene) {
    this.save = save;
    this.cfg = CONFIG.jogador;
    this.classe = CONFIG.classes[save.classe];
    this.hp = this.cfg.hpMax;
    this.mesh = Scene3D.personagem(this.classe, save.armaEquipada);
    scene.add(this.mesh);
    this.pos = this.mesh.position;
    this.dir = new THREE.Vector3(0, 0, 1);
    this.cdEspada = 0;
    this.cdFlecha = 0;
    this.andando = 0;
    this.golpeAnim = 0;
    this.vivo = true;
  }

  get dano() { return danoArma(this.save); }

  // mov: vetor {x, z} normalizado (ou zero). limite: raio da arena.
  update(dt, mov, limite, inimigos) {
    this.cdEspada = Math.max(0, this.cdEspada - dt);
    this.cdFlecha = Math.max(0, this.cdFlecha - dt);
    if (!this.vivo) return;
    // regeneração: depois de alguns segundos sem levar dano, a vida volta devagar
    this.semDano = (this.semDano || 0) + dt;
    if (this.semDano >= this.cfg.regen.espera && this.hp < this.cfg.hpMax) this.hp = Math.min(this.cfg.hpMax, this.hp + this.cfg.regen.porSegundo * dt);

    const v = this.cfg.velocidade;
    if (mov.x || mov.z) {
      this.pos.x += mov.x * v * dt;
      this.pos.z += mov.z * v * dt;
      this.dir.set(mov.x, 0, mov.z).normalize();
      this.andando += dt * 10;
    } else {
      // parado: vira para o inimigo mais próximo
      const alvo = this.inimigoMaisProximo(inimigos, 10);
      if (alvo) this.dir.copy(alvo.pos).sub(this.pos).setY(0).normalize();
      this.andando = 0;
    }
    const d = Math.hypot(this.pos.x, this.pos.z);
    if (d > limite) { this.pos.x *= limite / d; this.pos.z *= limite / d; }

    this.mesh.rotation.y = Math.atan2(this.dir.x, this.dir.z);
    const p = this.mesh.userData.partes;
    const sw = Math.sin(this.andando) * 0.5;
    p.pernaE.rotation.x = sw; p.pernaD.rotation.x = -sw; p.bracoE.rotation.x = -sw;
    // animação do golpe
    if (this.golpeAnim > 0) {
      this.golpeAnim = Math.max(0, this.golpeAnim - dt * 5);
      p.bracoD.rotation.x = -Math.sin(this.golpeAnim * Math.PI) * 2.2;
      p.arma.rotation.x = -Math.sin(this.golpeAnim * Math.PI) * 2.2;
    } else { p.bracoD.rotation.x = sw; p.arma.rotation.x = 0; }
    const asas = this.mesh.children.filter(c => c.name === "asa");
    asas.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (-0.4 + Math.sin(performance.now() / 300) * 0.15); });
  }

  inimigoMaisProximo(inimigos, maxDist) {
    let melhor = null, md = maxDist;
    for (const e of inimigos) {
      if (!e.vivo) continue;
      const d = e.pos.distanceTo(this.pos);
      if (d < md) { md = d; melhor = e; }
    }
    return melhor;
  }

  // Golpe de espada: acerta todo inimigo dentro do alcance e na frente do jogador.
  atacarEspada(inimigos) {
    if (this.cdEspada > 0 || !this.vivo || !this.save.armaEquipada) return [];
    this.cdEspada = this.cfg.cooldownEspada;
    this.golpeAnim = 1;
    const acertos = [];
    for (const e of inimigos) {
      if (!e.vivo) continue;
      const para = e.pos.clone().sub(this.pos).setY(0);
      const dist = para.length() - e.cfg.tamanho * 0.5;
      if (dist <= this.cfg.alcanceEspada && para.normalize().dot(this.dir) > 0.2) {
        acertos.push({ inimigo: e, dano: this.dano });
      }
    }
    return acertos;
  }

  // Flecha (só arqueiro). Retorna um projétil ou null.
  atirarFlecha(inimigos) {
    if (!this.classe.temFlecha || this.cdFlecha > 0 || !this.vivo) return null;
    const alvo = this.inimigoMaisProximo(inimigos, this.cfg.flecha.alcance);
    if (!alvo) return null;
    this.cdFlecha = this.cfg.flecha.cooldown;
    const dir = alvo.pos.clone().sub(this.pos).setY(0).normalize();
    this.dir.copy(dir);
    return new Projetil(this.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), dir, this.cfg.flecha.velocidade, this.cfg.flecha.dano, this.cfg.flecha.alcance);
  }

  usarPocao() {
    if (this.save.pocoes <= 0 || this.hp >= this.cfg.hpMax || !this.vivo) return false;
    this.save.pocoes--;
    this.hp = Math.min(this.cfg.hpMax, this.hp + CONFIG.pocao.cura);
    salvar(this.save);
    return true;
  }

  receberDano(d) {
    if (!this.vivo) return;
    this.hp -= d;
    this.semDano = 0;
    if (this.hp <= 0) { this.hp = 0; this.vivo = false; this.mesh.rotation.x = -Math.PI / 2; }
  }

  curarTudo() { this.hp = this.cfg.hpMax; }
}

class Projetil {
  constructor(pos, dir, vel, dano, alcance) {
    this.pos = pos; this.dir = dir; this.vel = vel; this.dano = dano;
    this.restante = alcance; this.vivo = true;
    this.mesh = Scene3D.box(0.08, 0.08, 0.7, 0x8a5a2a);
    this.mesh.position.copy(pos);
    this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
  }
  update(dt, inimigos) {
    const passo = this.vel * dt;
    this.pos.addScaledVector(this.dir, passo);
    this.mesh.position.copy(this.pos);
    this.restante -= passo;
    if (this.restante <= 0) { this.vivo = false; return null; }
    for (const e of inimigos) {
      if (!e.vivo) continue;
      if (e.pos.distanceTo(new THREE.Vector3(this.pos.x, 0, this.pos.z)) < e.cfg.tamanho * 0.8) {
        this.vivo = false;
        return { inimigo: e, dano: this.dano, flecha: true };
      }
    }
    return null;
  }
}
