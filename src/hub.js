// Hub central ("Mini Centro"): fonte, bancos, loja do ferreiro e portal.

const HUB_RAIO = 14;

class Hub {
  constructor(save) {
    this.save = save;
    this.scene = Scene3D.novaCena(0xbfe4ff, 0x8fbf6a, HUB_RAIO);
    this.montar();
    this.player = new Player(save, this.scene);
    this.player.pos.set(0, 0, 5);
    this.player.hp = CONFIG.jogador.hpMax;
    this.t = 0;
    HUD.setFase("Mini Centro");
    HUD.setChefe(null);
  }

  montar() {
    const s = this.scene;
    // calçada central
    const praca = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshLambertMaterial({ color: 0xcfc3a8 }));
    praca.rotation.x = -Math.PI / 2; praca.position.y = 0.01; praca.receiveShadow = true; s.add(praca);
    // fonte
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 0.6, 24), new THREE.MeshLambertMaterial({ color: 0x9a9a9a }));
    base.position.y = 0.3; base.castShadow = true; s.add(base);
    const agua = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 24), new THREE.MeshLambertMaterial({ color: 0x4fb3e8 }));
    agua.position.y = 0.5; s.add(agua); this.agua = agua;
    const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 12), new THREE.MeshLambertMaterial({ color: 0x9a9a9a }));
    coluna.position.y = 1.2; s.add(coluna);
    this.gotas = [];
    for (let i = 0; i < 12; i++) {
      const g = Scene3D.box(0.12, 0.12, 0.12, 0x9fdcff); s.add(g); this.gotas.push({ m: g, a: (i / 12) * Math.PI * 2, f: Math.random() });
    }
    // bancos
    for (const a of [0.6, 2.5, 3.8, 5.6]) {
      const b = new THREE.Group();
      const assento = Scene3D.box(1.8, 0.15, 0.6, 0x8a5a2a); assento.position.y = 0.55; b.add(assento);
      for (const sx of [-0.7, 0.7]) { const pe = Scene3D.box(0.15, 0.55, 0.5, 0x444444); pe.position.set(sx, 0.27, 0); b.add(pe); }
      b.position.set(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5); b.rotation.y = -a + Math.PI / 2; s.add(b);
    }
    // loja de madeira do ferreiro
    this.lojaPos = new THREE.Vector3(-8, 0, -4);
    const loja = new THREE.Group();
    const parede = Scene3D.box(4, 2.6, 3, 0x9c6b3c); parede.position.y = 1.3; loja.add(parede);
    const telhado = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 4), new THREE.MeshLambertMaterial({ color: 0x5c3a1e }));
    telhado.position.y = 3.4; telhado.rotation.y = Math.PI / 4; telhado.castShadow = true; loja.add(telhado);
    const balcao = Scene3D.box(4.2, 0.9, 0.6, 0x7a5230); balcao.position.set(0, 0.45, 1.8); loja.add(balcao);
    const bigorna = Scene3D.box(0.9, 0.4, 0.4, 0x333333); bigorna.position.set(1.4, 0.75, 1.1); loja.add(bigorna);
    // o velho ferreiro
    const ferreiro = Scene3D.personagem({ cor: 0x6b4a2a, corDetalhe: 0x3a2a1a, corCabelo: 0xdddddd, corChapeu: 0x3a2a1a, corPele: 0xe0b890 }, null);
    ferreiro.position.set(0, 0, 0.9); ferreiro.scale.setScalar(0.95);
    const barba = Scene3D.box(0.5, 0.4, 0.2, 0xdddddd); barba.position.set(0, 1.65, 0.4); ferreiro.add(barba);
    loja.add(ferreiro);
    loja.position.copy(this.lojaPos); loja.rotation.y = 0.6; s.add(loja);
    this.placa("FERREIRO", this.lojaPos.clone().add(new THREE.Vector3(0, 4.6, 0)));

    // portal das masmorras
    this.portalPos = new THREE.Vector3(8, 0, -5);
    const portal = new THREE.Group();
    const arco = new THREE.Mesh(new THREE.TorusGeometry(2, 0.3, 10, 32), new THREE.MeshLambertMaterial({ color: 0x5b4b8a }));
    arco.position.y = 2.2; arco.castShadow = true; portal.add(arco);
    const vortex = new THREE.Mesh(new THREE.CircleGeometry(1.75, 32), new THREE.MeshBasicMaterial({ color: 0xa06bff, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    vortex.position.y = 2.2; portal.add(vortex); this.vortex = vortex;
    for (const sx of [-2.4, 2.4]) { const pilar = Scene3D.box(0.6, 3.2, 0.6, 0x7a7a8a); pilar.position.set(sx, 1.6, 0); portal.add(pilar); }
    portal.position.copy(this.portalPos); portal.rotation.y = -0.7; s.add(portal);
    this.placa("PORTAL", this.portalPos.clone().add(new THREE.Vector3(0, 4.6, 0)));

    // árvores ao redor
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, r = HUB_RAIO + 1 + Math.random() * 3;
      const arv = Scene3D.arvore(0x6b4423, 0x2f7a2a, 1 + Math.random() * 0.6);
      arv.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); s.add(arv);
    }
  }

  placa(texto, pos) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(40,25,10,0.85)"; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = "#ffe9a8"; ctx.font = "bold 36px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(texto, 128, 34);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c) }));
    sp.scale.set(4, 1, 1); sp.position.copy(pos); this.scene.add(sp);
  }

  // Retorna "loja", "portal" ou null conforme a proximidade do jogador.
  pertoDe() {
    const p = this.player.pos;
    if (p.distanceTo(this.lojaPos) < 4.2) return "loja";
    if (p.distanceTo(this.portalPos) < 3.8) return "portal";
    return null;
  }

  update(dt, mov) {
    this.t += dt;
    this.player.update(dt, mov, HUB_RAIO - 0.8, []);
    // não deixa atravessar a fonte
    const d = Math.hypot(this.player.pos.x, this.player.pos.z);
    if (d < 2.8) { this.player.pos.x *= 2.8 / d; this.player.pos.z *= 2.8 / d; }
    for (const g of this.gotas) {
      const k = (this.t * 0.8 + g.f) % 1;
      g.m.position.set(Math.cos(g.a) * (0.4 + k * 1.3), 2 + Math.sin(k * Math.PI) * 1.2 - k * 1.5, Math.sin(g.a) * (0.4 + k * 1.3));
    }
    this.vortex.rotation.z += dt * 2;
    this.vortex.material.opacity = 0.6 + Math.sin(this.t * 3) * 0.15;
    Scene3D.seguirCamera(this.player.pos, dt);
    HUD.setHp(this.player.hp, CONFIG.jogador.hpMax);
    HUD.setPocoes(this.save.pocoes);
  }
}
