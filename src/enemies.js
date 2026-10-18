// Inimigos comuns e chefes. Perseguem o jogador e batem quando chegam perto.
// O chefe tem um ataque especial com aviso visual (anel no chão) antes de acertar.

class Enemy {
  constructor(cfg, scene, pos, ehChefe = false) {
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.hpMax = cfg.hp;
    this.vivo = true;
    this.ehChefe = ehChefe;
    this.mesh = Scene3D.inimigo(cfg);
    this.mesh.position.copy(pos);
    scene.add(this.mesh);
    this.scene = scene;
    this.pos = this.mesh.position;
    this.cd = 1.0;              // espera 1 s antes do primeiro golpe
    this.andando = Math.random() * 6;
    this.flash = 0;
    // especial do chefe
    this.especial = cfg.especial ? { ...cfg.especial } : null;
    this.tEspecial = this.especial ? this.especial.intervalo : 0;
    this.avisando = 0;          // tempo restante do aviso
    this.anel = null;
    this.puloAlvo = null;
    this.puloT = 0;
  }

  // Retorna lista de eventos: {tipo:"dano", valor}, {tipo:"especial", nome}
  update(dt, player) {
    const eventos = [];
    if (!this.vivo) {
      this.mesh.position.y -= dt * 2; // afunda no chão
      if (this.mesh.position.y < -3) this.scene.remove(this.mesh);
      return eventos;
    }
    this.cd -= dt;
    if (this.flash > 0) { this.flash -= dt; if (this.flash <= 0) this.corNormal(); }

    const para = player.pos.clone().sub(this.pos).setY(0);
    const dist = para.length();

    // ---- especial do chefe ----
    if (this.especial && player.vivo) {
      if (this.puloAlvo) {
        // Yeti no ar, caindo em direção ao alvo
        this.puloT += dt;
        const k = Math.min(1, this.puloT / 0.6);
        this.pos.lerp(this.puloAlvo, k);
        this.mesh.position.y = Math.sin(k * Math.PI) * 4;
        if (k >= 1) {
          this.mesh.position.y = 0;
          if (player.pos.distanceTo(this.puloAlvo) <= this.especial.raio) eventos.push({ tipo: "dano", valor: this.especial.dano, especial: true });
          eventos.push({ tipo: "impacto", pos: this.puloAlvo.clone(), raio: this.especial.raio });
          this.puloAlvo = null; this.removerAnel();
        }
        return eventos;
      }
      if (this.avisando > 0) {
        this.avisando -= dt;
        // animação de aviso: bate no peito / agacha
        const p = this.mesh.userData.partes;
        p.bracoE.rotation.x = Math.sin(performance.now() / 60) * 1.2;
        p.bracoD.rotation.x = -Math.sin(performance.now() / 60) * 1.2;
        if (this.anel) this.anel.material.opacity = 0.4 + 0.4 * Math.abs(Math.sin(performance.now() / 120));
        if (this.avisando <= 0) {
          if (this.especial.tipo === "rugido") {
            if (dist <= this.especial.raio) eventos.push({ tipo: "dano", valor: this.especial.dano, especial: true });
            eventos.push({ tipo: "impacto", pos: this.pos.clone(), raio: this.especial.raio });
            this.removerAnel();
          } else if (this.especial.tipo === "pulo") {
            this.puloAlvo = player.pos.clone(); this.puloT = 0;
            this.anel.position.set(this.puloAlvo.x, 0.03, this.puloAlvo.z);
          }
        }
        return eventos;
      }
      this.tEspecial -= dt;
      if (this.tEspecial <= 0) {
        this.tEspecial = this.especial.intervalo;
        this.avisando = this.especial.aviso;
        this.anel = Scene3D.anelAviso(this.especial.raio, 0xff3b3b);
        this.anel.position.set(this.pos.x, 0.03, this.pos.z);
        this.scene.add(this.anel);
        eventos.push({ tipo: "aviso", nome: this.especial.nome });
        return eventos;
      }
    }

    // ---- perseguir e bater ----
    if (dist > this.cfg.alcance) {
      para.normalize();
      this.pos.addScaledVector(para, this.cfg.velocidade * dt);
      this.andando += dt * 8;
      const p = this.mesh.userData.partes;
      const sw = Math.sin(this.andando) * 0.6;
      p.pernaE.rotation.x = sw; p.pernaD.rotation.x = -sw; p.bracoE.rotation.x = -sw * 0.6; p.bracoD.rotation.x = sw * 0.6;
    } else if (this.cd <= 0 && player.vivo) {
      this.cd = this.cfg.cooldown;
      eventos.push({ tipo: "dano", valor: this.cfg.dano });
      const p = this.mesh.userData.partes;
      p.bracoD.rotation.x = -1.6;
    }
    if (dist > 0.01) this.mesh.rotation.y = Math.atan2(para.x, para.z);
    // empurra para não ficar dentro do jogador
    if (dist < 1.0 && dist > 0.01) this.pos.addScaledVector(para.clone().normalize(), -(1.0 - dist));
    return eventos;
  }

  receberDano(d) {
    if (!this.vivo) return false;
    this.hp -= d;
    this.flash = 0.12;
    this.mesh.traverse(o => { if (o.material) { o.userData.cor = o.userData.cor || o.material.color.getHex(); o.material = o.material.clone(); o.material.color.set(0xffffff); } });
    if (this.hp <= 0) {
      this.hp = 0; this.vivo = false;
      this.mesh.rotation.x = Math.PI / 2;
      this.removerAnel();
      return true; // morreu
    }
    return false;
  }

  corNormal() {
    this.mesh.traverse(o => { if (o.material && o.userData.cor != null) o.material.color.set(o.userData.cor); });
  }

  removerAnel() { if (this.anel) { this.scene.remove(this.anel); this.anel = null; } }
}
