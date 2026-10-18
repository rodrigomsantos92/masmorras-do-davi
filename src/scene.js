// Cena 3D: renderer, câmera, luzes e "fábricas" de modelos low-poly.

const Scene3D = {
  renderer: null, camera: null, scene: null,
  camOffset: new THREE.Vector3(0, 9, 11),

  init(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },

  novaCena(corCeu, corChao, tamanho) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(corCeu);
    scene.fog = new THREE.Fog(corCeu, tamanho * 0.9, tamanho * 2.2);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 0.7));
    const sol = new THREE.DirectionalLight(0xffffff, 0.9);
    sol.position.set(12, 20, 8);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    const sc = tamanho + 5;
    Object.assign(sol.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: 60 });
    scene.add(sol);

    const chao = new THREE.Mesh(new THREE.CircleGeometry(tamanho, 48), new THREE.MeshLambertMaterial({ color: corChao }));
    chao.rotation.x = -Math.PI / 2;
    chao.receiveShadow = true;
    scene.add(chao);

    this.scene = scene;
    return scene;
  },

  seguirCamera(alvo, dt) {
    const desejado = alvo.clone().add(this.camOffset);
    this.camera.position.lerp(desejado, Math.min(1, dt * 5));
    this.camera.lookAt(alvo.x, alvo.y + 1, alvo.z);
  },

  // ---------- fábricas ----------
  box(w, h, d, cor, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: cor, ...opts }));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  },

  // Personagem em blocos. Retorna um Group com partes nomeadas para animar.
  personagem(cfgClasse, armaId) {
    const g = new THREE.Group();
    const corpo = this.box(0.8, 0.9, 0.5, cfgClasse.cor); corpo.position.y = 1.1; g.add(corpo);
    const faixa = this.box(0.84, 0.18, 0.54, cfgClasse.corDetalhe); faixa.position.y = 0.85; g.add(faixa);
    const pernaE = this.box(0.32, 0.6, 0.4, cfgClasse.cor); pernaE.position.set(-0.22, 0.35, 0); g.add(pernaE);
    const pernaD = this.box(0.32, 0.6, 0.4, cfgClasse.cor); pernaD.position.set(0.22, 0.35, 0); g.add(pernaD);
    const botaE = this.box(0.34, 0.14, 0.44, cfgClasse.corDetalhe); botaE.position.set(-0.22, 0.07, 0); g.add(botaE);
    const botaD = this.box(0.34, 0.14, 0.44, cfgClasse.corDetalhe); botaD.position.set(0.22, 0.07, 0); g.add(botaD);
    const cabeca = this.box(0.7, 0.7, 0.7, cfgClasse.corPele); cabeca.position.y = 1.95; g.add(cabeca);
    const cabelo = this.box(0.74, 0.22, 0.74, cfgClasse.corCabelo); cabelo.position.y = 2.25; g.add(cabelo);
    // olhos (sem boca, como no desenho do Davi)
    for (const sx of [-0.16, 0.16]) {
      const olho = this.box(0.1, 0.12, 0.05, 0x222222); olho.position.set(sx, 1.98, 0.36); g.add(olho);
    }
    // chapéu
    const chapeu = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 4), new THREE.MeshLambertMaterial({ color: cfgClasse.corChapeu }));
    chapeu.position.y = 2.65; chapeu.rotation.y = Math.PI / 4; chapeu.castShadow = true; g.add(chapeu);
    const aba = this.box(0.95, 0.08, 0.95, cfgClasse.corChapeu); aba.position.y = 2.33; g.add(aba);
    // braços
    const bracoE = this.box(0.26, 0.8, 0.26, cfgClasse.cor); bracoE.position.set(-0.55, 1.1, 0); g.add(bracoE);
    const bracoD = this.box(0.26, 0.8, 0.26, cfgClasse.cor); bracoD.position.set(0.55, 1.1, 0); g.add(bracoD);
    // arco nas costas (arqueiro)
    if (cfgClasse.temFlecha) {
      const arco = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 16, Math.PI), new THREE.MeshLambertMaterial({ color: 0x5a3a1a }));
      arco.position.set(0, 1.2, -0.35); arco.rotation.z = Math.PI / 2; arco.rotation.y = Math.PI / 2; g.add(arco);
    }
    // asas (anjo)
    if (cfgClasse.asas) {
      for (const s of [-1, 1]) {
        const asa = this.box(0.9, 1.1, 0.08, 0xffffff); asa.position.set(s * 0.7, 1.4, -0.35); asa.rotation.z = s * -0.4; g.add(asa);
        asa.name = "asa";
      }
    }
    // arma na mão direita
    const arma = this.arma(armaId);
    arma.position.set(0.55, 1.2, 0.3);
    bracoD.name = "bracoD"; arma.name = "arma";
    g.add(arma);
    g.userData.partes = { pernaE, pernaD, bracoD, bracoE, arma };
    return g;
  },

  arma(id) {
    const g = new THREE.Group();
    if (!id) return g;
    const cfg = CONFIG.armas[id];
    const lamina = this.box(0.12, 1.1, 0.05, cfg.cor, { emissive: cfg.cor, emissiveIntensity: 0.15 });
    lamina.position.y = 0.55; g.add(lamina);
    const cabo = this.box(0.1, 0.35, 0.1, cfg.corDetalhe || 0x5a3a1a); cabo.position.y = -0.1; g.add(cabo);
    const guarda = this.box(0.4, 0.08, 0.1, cfg.corDetalhe || 0xb08a40); guarda.position.y = 0.1; g.add(guarda);
    if (cfg.dupla) { const l2 = lamina.clone(); l2.position.x = 0.2; g.add(l2); lamina.position.x = -0.08; }
    if (id === "foice") { lamina.scale.set(1, 1.5, 1); const cabeca = this.box(0.8, 0.12, 0.05, cfg.cor); cabeca.position.set(0.35, 1.3, 0); g.add(cabeca); }
    return g;
  },

  // Inimigo genérico em blocos (macaco, pinguim) ou chefe (gorila, yeti).
  inimigo(cfg) {
    const g = new THREE.Group();
    const t = cfg.tamanho;
    const corpo = this.box(t, t * 1.1, t * 0.8, cfg.cor); corpo.position.y = t * 0.9; g.add(corpo);
    const cabeca = this.box(t * 0.7, t * 0.7, t * 0.7, cfg.cor); cabeca.position.y = t * 1.75; g.add(cabeca);
    const corRosto = cfg.nome === "Pinguim" ? 0xffffff : (cfg.nome === "Yeti" ? 0x9fb3c8 : 0xd9a677);
    const rosto = this.box(t * 0.5, t * 0.45, 0.05, corRosto); rosto.position.set(0, t * 1.72, t * 0.36); g.add(rosto);
    for (const sx of [-0.15, 0.15]) {
      const olho = this.box(t * 0.1, t * 0.1, 0.05, 0x111111); olho.position.set(sx * t, t * 1.82, t * 0.4); g.add(olho);
    }
    if (cfg.nome === "Pinguim") {
      const barriga = this.box(t * 0.7, t * 0.9, 0.05, 0xffffff); barriga.position.set(0, t * 0.9, t * 0.41); g.add(barriga);
      const bico = this.box(t * 0.2, t * 0.12, t * 0.3, 0xf5a623); bico.position.set(0, t * 1.68, t * 0.5); g.add(bico);
    }
    const bracoE = this.box(t * 0.25, t * 0.9, t * 0.25, cfg.cor); bracoE.position.set(-t * 0.65, t * 0.9, 0); g.add(bracoE);
    const bracoD = this.box(t * 0.25, t * 0.9, t * 0.25, cfg.cor); bracoD.position.set(t * 0.65, t * 0.9, 0); g.add(bracoD);
    const pernaE = this.box(t * 0.3, t * 0.4, t * 0.3, cfg.cor); pernaE.position.set(-t * 0.25, t * 0.2, 0); g.add(pernaE);
    const pernaD = this.box(t * 0.3, t * 0.4, t * 0.3, cfg.cor); pernaD.position.set(t * 0.25, t * 0.2, 0); g.add(pernaD);
    if (cfg.nome === "Macaco") {
      const rabo = this.box(0.08, 0.08, 0.9, cfg.cor); rabo.position.set(0, t * 0.6, -t * 0.7); rabo.rotation.x = -0.6; g.add(rabo);
    }
    g.userData.partes = { pernaE, pernaD, bracoE, bracoD, corpo };
    g.userData.altura = t * 2.2;
    return g;
  },

  arvore(corTronco, corCopa, escala = 1) {
    const g = new THREE.Group();
    const tronco = this.box(0.5 * escala, 1.6 * escala, 0.5 * escala, corTronco); tronco.position.y = 0.8 * escala; g.add(tronco);
    const copa = new THREE.Mesh(new THREE.ConeGeometry(1.4 * escala, 2.6 * escala, 6), new THREE.MeshLambertMaterial({ color: corCopa }));
    copa.position.y = 2.6 * escala; copa.castShadow = true; g.add(copa);
    return g;
  },

  // Círculo no chão para mostrar área do ataque especial do chefe.
  anelAviso(raio, cor) {
    const m = new THREE.Mesh(new THREE.RingGeometry(raio - 0.25, raio, 48), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.03;
    return m;
  },
};
