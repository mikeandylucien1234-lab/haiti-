// ============================================================
// npc.js — Personnages non-joueurs : civils, policiers, gang,
// informateur et cible de la mission. IA très simple (aller-retour).
// ============================================================

function makeHumanMesh({ shirt = 0x4477aa, pants = 0x222831, skin = 0x6b4a35, cap = null, accent = null }) {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshLambertMaterial({ color: skin });
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirt });
  const pantsMat = new THREE.MeshLambertMaterial({ color: pants });

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 8), pantsMat);
  legs.position.y = 0.45;
  group.add(legs);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.9, 8), shirtMat);
  torso.position.y = 1.35;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), skinMat);
  head.position.y = 1.95;
  group.add(head);

  if (cap) {
    const capMat = new THREE.MeshLambertMaterial({ color: cap });
    const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.14, 10), capMat);
    capMesh.position.y = 2.1;
    group.add(capMesh);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 10), capMat);
    brim.position.set(0, 2.04, 0.08);
    group.add(brim);
  }

  if (accent) {
    // écharpe/bandana ou gilet distinctif
    const accentMat = new THREE.MeshLambertMaterial({ color: accent });
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.05, 6, 12), accentMat);
    sash.rotation.x = Math.PI / 2;
    sash.position.y = 1.5;
    group.add(sash);
  }

  const armMat = shirtMat;
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 6);
  const armL = new THREE.Mesh(armGeo, armMat);
  armL.position.set(0.32, 1.4, 0);
  armL.name = "armL";
  group.add(armL);
  const armR = new THREE.Mesh(armGeo, armMat);
  armR.position.set(-0.32, 1.4, 0);
  armR.name = "armR";
  group.add(armR);

  group.userData.legsMesh = legs;
  group.userData.armL = armL;
  group.userData.armR = armR;
  return group;
}

class NPC {
  constructor(scene, { x, z, waypoints, speed = 1.2, appearance, name, role }) {
    this.scene = scene;
    this.name = name;
    this.role = role; // 'civil' | 'gang' | 'police' | 'informant' | 'target'
    this.mesh = makeHumanMesh(appearance);
    this.mesh.position.set(x, 0, z);
    scene.add(this.mesh);

    this.waypoints = waypoints && waypoints.length ? waypoints : [new THREE.Vector3(x, 0, z)];
    this.targetIndex = 0;
    this.speed = speed;
    this.walkClock = Math.random() * 10;
    this.active = true; // false = retiré du jeu (ex: cible arrêtée)
    this.highlighted = false;
    this._buildHighlightRing();
  }

  _buildHighlightRing() {
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffcc33, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.65, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.visible = false;
    this.mesh.add(ring);
    this.ring = ring;
  }

  setHighlighted(v) {
    this.highlighted = v;
    this.ring.visible = v;
  }

  update(dt) {
    if (!this.active) return;

    if (this.waypoints.length > 1) {
      const target = this.waypoints[this.targetIndex];
      const pos = this.mesh.position;
      const dir = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
      const dist = dir.length();
      if (dist < 0.3) {
        this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      } else {
        dir.normalize();
        pos.x += dir.x * this.speed * dt;
        pos.z += dir.z * this.speed * dt;
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }

    // animation de marche simple (balancement des bras/jambes)
    this.walkClock += dt * 6;
    const swing = Math.sin(this.walkClock) * 0.4;
    if (this.mesh.userData.armL) this.mesh.userData.armL.rotation.x = swing;
    if (this.mesh.userData.armR) this.mesh.userData.armR.rotation.x = -swing;
  }

  distanceTo(vec3) {
    return this.mesh.position.distanceTo(vec3);
  }

  remove() {
    this.active = false;
    this.scene.remove(this.mesh);
  }
}

const NPCManager = {
  list: [],

  spawnAll(scene) {
    this.list = [];

    // --- Civils qui marchent dans le quartier ---
    const civilShirts = [0xd9724b, 0x3f9b8c, 0xe8c657, 0xc85c8e, 0x4f7fbf, 0xffffff];
    const civilRoutes = [
      [[-20, -10], [-5, -10], [-5, 5], [-20, 5]],
      [[15, 10], [30, 10], [30, 25], [15, 25]],
      [[-30, 15], [-15, 15]],
      [[5, -25], [20, -25], [20, -15]],
      [[-10, -34], [10, -34]],
      [[35, -10], [35, 15]],
    ];
    civilRoutes.forEach((route, i) => {
      const wp = route.map(([x, z]) => new THREE.Vector3(x, 0, z));
      this.list.push(
        new NPC(scene, {
          x: wp[0].x,
          z: wp[0].z,
          waypoints: wp,
          speed: 1 + Math.random() * 0.6,
          appearance: { shirt: civilShirts[i % civilShirts.length], skin: 0x6b4a35 },
          name: "Civil",
          role: "civil",
        })
      );
    });

    // --- Policiers en patrouille près du poste ---
    const policeRoute = [
      [-46, -46], [-38, -46], [-38, -38], [-46, -38],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z));
    for (let i = 0; i < 2; i++) {
      this.list.push(
        new NPC(scene, {
          x: policeRoute[0].x,
          z: policeRoute[0].z,
          waypoints: policeRoute,
          speed: 1.1,
          appearance: { shirt: 0x1b3a6b, pants: 0x10192b, cap: 0x0c1730, skin: 0x4a3223 },
          name: "Agent PNH",
          role: "police",
        })
      );
    }

    // --- Membres de gang qui traînent ---
    const gangSpots = [
      { x: 34, z: 34, wp: [[34, 34], [40, 34], [40, 40]] },
      { x: 46, z: 44, wp: [[46, 44], [46, 36]] },
    ];
    gangSpots.forEach((g) => {
      const wp = g.wp.map(([x, z]) => new THREE.Vector3(x, 0, z));
      this.list.push(
        new NPC(scene, {
          x: g.x,
          z: g.z,
          waypoints: wp,
          speed: 0.9,
          appearance: { shirt: 0x8a1c1c, pants: 0x1a1a1a, accent: 0xdd2222, skin: 0x4a3223 },
          name: "Membre de gang",
          role: "gang",
        })
      );
    });

    // --- Informateur (point fixe, près du marché) ---
    this.informant = new NPC(scene, {
      x: 12,
      z: -6,
      waypoints: [],
      appearance: { shirt: 0x2f8f5b, pants: 0x333333, skin: 0x4a3223 },
      name: "Ti Jean (Informateur)",
      role: "informant",
    });
    this.list.push(this.informant);

    // --- Cible du gang (patrouille dans le sud-est jusqu'à localisation) ---
    const targetRoute = [
      [30, 34], [40, 34], [40, 44], [30, 44],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z));
    this.target = new NPC(scene, {
      x: targetRoute[0].x,
      z: targetRoute[0].z,
      waypoints: targetRoute,
      speed: 1.3,
      appearance: { shirt: 0x111111, pants: 0x222222, accent: 0xffcc33, skin: 0x4a3223 },
      name: "Ti Malo (Cible)",
      role: "target",
    });
    this.list.push(this.target);

    return this.list;
  },

  update(dt) {
    this.list.forEach((n) => n.update(dt));
  },
};
