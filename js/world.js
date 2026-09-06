// ============================================================
// world.js — Construit le quartier haïtien (rues, bâtiments,
// poste de police, commerces, panneaux) + véhicules en circulation
// ============================================================

const World = {
  collidables: [], // {x, z, radius} — obstacles simples (cercles)
  markers: {},      // points d'intérêt nommés pour la mini-carte
  vehicles: [],
  scene: null,

  build(scene) {
    this.scene = scene;

    this._buildGround();
    this._buildRoads();
    this._buildBuildings();
    this._buildPoliceStation();
    this._buildMarketStalls();
    this._buildSigns();
    this._buildProps();
    this._buildVehicles();
    this._buildLighting();
  },

  _buildLighting() {
    const hemi = new THREE.HemisphereLight(0xfff2d0, 0x2a2f1a, 0.9);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe3a8, 1.1);
    sun.position.set(-60, 90, 40);
    sun.castShadow = false;
    this.scene.add(sun);

    this.scene.fog = new THREE.Fog(0x9aa9b8, 60, 220);
    this.scene.background = new THREE.Color(0x8fa3b3);
  },

  _buildGround() {
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x6b6f5c });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
  },

  _buildRoads() {
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2e });
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x9a9a8f });

    // Route principale horizontale + verticale (croisement)
    const roadH = new THREE.Mesh(new THREE.PlaneGeometry(240, 14), roadMat);
    roadH.rotation.x = -Math.PI / 2;
    roadH.position.set(0, 0.01, 0);
    this.scene.add(roadH);

    const roadV = new THREE.Mesh(new THREE.PlaneGeometry(14, 240), roadMat);
    roadV.rotation.x = -Math.PI / 2;
    roadV.position.set(0, 0.01, 0);
    this.scene.add(roadV);

    // Trottoirs le long des routes
    [-9, 9].forEach((offset) => {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(240, 2.5), sidewalkMat);
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(0, 0.015, offset);
      this.scene.add(sw);

      const swV = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 240), sidewalkMat);
      swV.rotation.x = -Math.PI / 2;
      swV.position.set(offset, 0.015, 0);
      this.scene.add(swV);
    });

    // Marquage central en pointillés
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffe27a });
    for (let x = -110; x < 110; x += 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.4), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.02, 0);
      this.scene.add(dash);
    }
    for (let z = -110; z < 110; z += 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, z);
      this.scene.add(dash);
    }
  },

  // Bâtiment haïtien coloré simple : corps + toit tôle + petit balcon
  _makeBuilding(x, z, w, d, h, color, roofColor = 0x555555) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2;
    group.add(body);

    const roofGeo = new THREE.BoxGeometry(w * 1.05, 0.4, d * 1.05);
    const roofMat = new THREE.MeshLambertMaterial({ color: roofColor });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 0.2;
    group.add(roof);

    // fenêtres simples (bandes plus sombres)
    const winMat = new THREE.MeshLambertMaterial({ color: 0x203040 });
    for (let i = 0; i < 2; i++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.5, h * 0.25), winMat);
      win.position.set(0, h * (0.4 + i * 0.3), d / 2 + 0.01);
      group.add(win);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.collidables.push({ x, z, radius: Math.max(w, d) / 2 + 0.6 });
    return group;
  },

  _buildBuildings() {
    // Palette de couleurs inspirée de l'architecture haïtienne
    const palette = [0xd9724b, 0x3f9b8c, 0xe8c657, 0xc85c8e, 0x4f7fbf, 0xe0895a];
    const layout = [
      // quadrant nord-ouest (marché / commerces)
      { x: -30, z: -30, w: 10, d: 8, h: 6 },
      { x: -18, z: -32, w: 8, d: 7, h: 5 },
      { x: -34, z: -18, w: 7, d: 9, h: 7 },

      // quadrant nord-est
      { x: 30, z: -28, w: 9, d: 9, h: 8 },
      { x: 42, z: -20, w: 8, d: 8, h: 5 },
      { x: 28, z: -42, w: 10, d: 6, h: 6 },

      // quadrant sud-ouest (zone résidentielle)
      { x: -28, z: 28, w: 8, d: 8, h: 5 },
      { x: -42, z: 22, w: 7, d: 7, h: 4 },
      { x: -22, z: 42, w: 9, d: 7, h: 6 },

      // quadrant sud-est (zone gang / cible)
      { x: 30, z: 30, w: 9, d: 9, h: 6 },
      { x: 44, z: 40, w: 8, d: 8, h: 5 },
      { x: 22, z: 46, w: 7, d: 9, h: 7 },
    ];

    layout.forEach((b, i) => {
      const color = palette[i % palette.length];
      this._makeBuilding(b.x, b.z, b.w, b.d, b.h, color);
    });
  },

  _buildPoliceStation() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf4f1e8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 12), bodyMat);
    body.position.y = 3.5;
    group.add(body);

    // Bande bleu/rouge façon drapeau
    const stripeMat1 = new THREE.MeshLambertMaterial({ color: 0x00209f });
    const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(16.1, 0.8, 12.1), stripeMat1);
    stripe1.position.y = 6.6;
    group.add(stripe1);

    const roofMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(17, 0.5, 13), roofMat);
    roof.position.y = 7.2;
    group.add(roof);

    // Porte d'entrée (marqueur d'interaction)
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x2a1d12 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.3), doorMat);
    door.position.set(0, 1.6, 6.05);
    group.add(door);

    group.position.set(-42, 0, -42);
    this.scene.add(group);

    this.collidables.push({ x: -42, z: -42, radius: 9 });

    // Panneau texte
    this._addSign(-42, -42 + 7, "POLICE NATIONALE D'HAÏTI", 0x00209f);

    this.markers.policeStation = { x: -42, z: -42 - 8, label: "Poste" };
    this.stationEntrance = new THREE.Vector3(-42, 0, -35);
  },

  _buildMarketStalls() {
    // Petit marché coloré près du centre (zone informateur)
    const stallColors = [0xdb5461, 0xf2c14e, 0x3f9b8c, 0xe8895a];
    const positions = [
      [10, -6], [14, -8], [10, -10], [6, -8],
    ];
    positions.forEach(([x, z], i) => {
      const mat = new THREE.MeshLambertMaterial({ color: stallColors[i % stallColors.length] });
      const tarp = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.6, 4), mat);
      tarp.rotation.y = Math.PI / 4;
      tarp.position.set(x, 2.4, z);
      this.scene.add(tarp);

      const legMat = new THREE.MeshLambertMaterial({ color: 0x5b4636 });
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8), legMat);
      leg.position.set(x, 0.9, z);
      this.scene.add(leg);

      this.collidables.push({ x, z, radius: 1.6 });
    });

    this.markers.market = { x: 10, z: -8, label: "Marché" };
  },

  _addSign(x, z, text, color = 0xffffff) {
    // Panneau simple : poteau + plaque colorée (texte non rendu en 3D pour rester léger)
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3), poleMat);
    pole.position.set(x, 1.5, z);
    this.scene.add(pole);

    const plateMat = new THREE.MeshLambertMaterial({ color });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.1), plateMat);
    plate.position.set(x, 3.2, z);
    this.scene.add(plate);
  },

  _buildSigns() {
    this._addSign(20, -2, "BIENVENUE / BYENVENI", 0x1b3a6b);
    this._addSign(-10, 25, "PWOPRIYETE PRIVE", 0xc8102e);
    this._addSign(38, 10, "MACHANN / COMMERCE", 0xe8c657);
  },

  _buildProps() {
    // Petits éléments de décor : poubelles, bidons, palmiers stylisés
    const palmTrunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
    const palmLeafMat = new THREE.MeshLambertMaterial({ color: 0x3f7d3f });
    const palmSpots = [
      [-6, -20], [6, 20], [-20, 6], [20, -20], [36, 26], [-36, -8],
    ];
    palmSpots.forEach(([x, z]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 4), palmTrunkMat);
      trunk.position.set(x, 2, z);
      this.scene.add(trunk);

      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.6, 6, 6), palmLeafMat);
      leaves.scale.set(1, 0.5, 1);
      leaves.position.set(x, 4.2, z);
      this.scene.add(leaves);

      this.collidables.push({ x, z, radius: 0.8 });
    });

    // Bidons colorés (couleur typique) empilés
    const drumColors = [0x1b3a6b, 0xc8102e, 0xf2c14e];
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.MeshLambertMaterial({ color: drumColors[i % drumColors.length] });
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2), mat);
      drum.position.set(-6 + i * 1.2, 0.6, -34);
      this.scene.add(drum);
    }
  },

  // Génère un véhicule simple selon type ('taptap' | 'moto' | 'voiture')
  _makeVehicle(type, color) {
    const group = new THREE.Group();

    if (type === "taptap") {
      const bodyMat = new THREE.MeshLambertMaterial({ color });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 5), bodyMat);
      body.position.y = 1.1;
      group.add(body);

      const roofMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const roofRack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 5.1), roofMat);
      roofRack.position.y = 2.1;
      group.add(roofRack);

      const stripeMat = new THREE.MeshLambertMaterial({ color: 0xf2c14e });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 5.1), stripeMat);
      stripe.position.y = 1.5;
      group.add(stripe);
    } else if (type === "moto") {
      const bodyMat = new THREE.MeshLambertMaterial({ color });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.6), bodyMat);
      body.position.y = 0.6;
      group.add(body);
      const riderMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const riderGeo =
        typeof THREE.CapsuleGeometry === "function"
          ? new THREE.CapsuleGeometry(0.25, 0.6, 4, 8)
          : new THREE.CylinderGeometry(0.25, 0.25, 1.2);
      const rider = new THREE.Mesh(riderGeo, riderMat);
      rider.position.y = 1.2;
      group.add(rider);
    } else {
      const bodyMat = new THREE.MeshLambertMaterial({ color });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 4), bodyMat);
      body.position.y = 0.8;
      group.add(body);
      const cabinMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2), cabinMat);
      cabin.position.set(0, 1.6, -0.2);
      group.add(cabin);
    }

    this.scene.add(group);
    return group;
  },

  _buildVehicles() {
    // Boucle rectangulaire sur les routes principales
    const loop = [
      new THREE.Vector3(-100, 0, -4.5),
      new THREE.Vector3(100, 0, -4.5),
      new THREE.Vector3(100, 0, 4.5),
      new THREE.Vector3(-100, 0, 4.5),
    ];
    const loopV = [
      new THREE.Vector3(4.5, 0, -100),
      new THREE.Vector3(4.5, 0, 100),
      new THREE.Vector3(-4.5, 0, 100),
      new THREE.Vector3(-4.5, 0, -100),
    ];

    const defs = [
      { type: "taptap", color: 0xd9724b, path: loop, speed: 6, t: 0 },
      { type: "taptap", color: 0x3f9b8c, path: loopV, speed: 5, t: 0.5 },
      { type: "voiture", color: 0xc8c8c8, path: loop, speed: 9, t: 0.3 },
      { type: "voiture", color: 0x334455, path: loopV, speed: 8, t: 0.7 },
      { type: "moto", color: 0xe8c657, path: loop, speed: 13, t: 0.15 },
      { type: "moto", color: 0x222222, path: loopV, speed: 14, t: 0.85 },
    ];

    defs.forEach((def) => {
      const mesh = this._makeVehicle(def.type, def.color);
      this.vehicles.push({ mesh, ...def });
    });
  },

  updateVehicles(dt) {
    this.vehicles.forEach((v) => {
      const path = v.path;
      const segCount = path.length;
      const totalLen = path.reduce((sum, p, i) => sum + p.distanceTo(path[(i + 1) % segCount]), 0);
      v.t += (v.speed * dt) / totalLen;
      v.t %= 1;

      // trouver la position le long du chemin
      let dist = v.t * totalLen;
      for (let i = 0; i < segCount; i++) {
        const a = path[i];
        const b = path[(i + 1) % segCount];
        const segLen = a.distanceTo(b);
        if (dist <= segLen) {
          const pos = a.clone().lerp(b, dist / segLen);
          v.mesh.position.copy(pos);
          const dir = b.clone().sub(a).normalize();
          v.mesh.rotation.y = Math.atan2(dir.x, dir.z);
          break;
        }
        dist -= segLen;
      }
    });
  },

  // Vérifie collision joueur/décor (cercle simple), retourne position corrigée
  resolveCollision(pos, radius = 0.5) {
    for (const c of this.collidables) {
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = c.radius + radius;
      if (dist < minDist && dist > 0.0001) {
        const push = (minDist - dist) / dist;
        pos.x += dx * push;
        pos.z += dz * push;
      }
    }
    return pos;
  },
};
