// ============================================================
// player.js — Personnage joueur (agent PNH), contrôles WASD/ZQSD,
// caméra troisième personne pilotée à la souris (pointer lock)
// ============================================================

class Player {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // Stats de progression (utilisées par mission.js et ui.js)
    this.money = 500;
    this.reputation = 10;
    this.level = 1;
    this.health = 100;

    this.position = new THREE.Vector3(-38, 0, -30);
    this.yaw = Math.PI; // orientation horizontale
    this.pitch = -0.15; // inclinaison caméra
    this.moveSpeed = 6.5;

    this.keys = {};
    this.pointerLocked = false;

    this._buildMesh();
    this._bindInput();
  }

  _buildMesh() {
    this.mesh = makeHumanMesh({
      shirt: 0x123a6b,
      pants: 0x101418,
      cap: 0x0b2140,
      skin: 0x4a3223,
      accent: 0xf2c14e,
    });

    // Arme de service (petit cube gris tenu à la main)
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.4), gunMat);
    gun.position.set(-0.32, 1.15, 0.25);
    this.mesh.add(gun);

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  _bindInput() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === "Escape") window.dispatchEvent(new CustomEvent("game:escape"));
      if (e.code === "KeyE") window.dispatchEvent(new CustomEvent("game:interact"));
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    this.domElement.addEventListener("click", () => {
      if (!this.pointerLocked) {
        this.domElement.requestPointerLock();
      } else {
        window.dispatchEvent(new CustomEvent("game:action"));
        this._playActionAnim();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
      window.dispatchEvent(new CustomEvent("game:pointerlock", { detail: this.pointerLocked }));
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.pointerLocked) return;
      this.yaw -= e.movementX * 0.0025;
      this.pitch -= e.movementY * 0.0018;
      this.pitch = Math.max(-0.6, Math.min(0.5, this.pitch));
    });
  }

  _playActionAnim() {
    const arm = this.mesh.userData.armR;
    if (!arm) return;
    arm.rotation.x = -1.2;
    setTimeout(() => {
      arm.rotation.x = 0;
    }, 150);
  }

  update(dt) {
    let moveX = 0;
    let moveZ = 0;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) moveZ -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) moveZ += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) moveX -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      // déplacement relatif à l'orientation de la caméra (yaw)
      const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.sin(this.yaw + Math.PI / 2), 0, Math.cos(this.yaw + Math.PI / 2));

      const move = new THREE.Vector3();
      move.addScaledVector(forward, -moveZ);
      move.addScaledVector(right, moveX);
      move.normalize().multiplyScalar(this.moveSpeed * dt);

      this.position.add(move);
      World.resolveCollision(this.position, 0.5);

      this.mesh.rotation.y = Math.atan2(move.x, move.z) || this.mesh.rotation.y;

      // petite animation de marche
      this._walkClock = (this._walkClock || 0) + dt * 8;
      const swing = Math.sin(this._walkClock) * 0.5;
      if (this.mesh.userData.armL) this.mesh.userData.armL.rotation.x = swing;
      const legs = this.mesh.userData.legsMesh;
      if (legs) legs.rotation.x = swing * 0.3;
    }

    // limites du monde (rester dans la zone jouable)
    this.position.x = Math.max(-115, Math.min(115, this.position.x));
    this.position.z = Math.max(-115, Math.min(115, this.position.z));

    this.mesh.position.copy(this.position);

    this._updateCamera();
  }

  _updateCamera() {
    const distance = 6.5;
    const camOffset = new THREE.Vector3(
      Math.sin(this.yaw) * -distance * Math.cos(this.pitch),
      2.5 + Math.sin(-this.pitch) * distance,
      Math.cos(this.yaw) * -distance * Math.cos(this.pitch)
    );
    const camPos = this.position.clone().add(camOffset);
    camPos.y = Math.max(1.2, camPos.y);
    this.camera.position.copy(camPos);

    const lookAt = this.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    this.camera.lookAt(lookAt);
  }
}
