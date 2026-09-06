// ============================================================
// main.js — Point d'entrée : initialise Three.js, le monde, le
// joueur, les PNJ, la mission, et fait tourner la boucle de jeu.
// ============================================================

(function () {
  const canvas = document.getElementById("game-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  UI.init();
  World.build(scene);
  const npcs = NPCManager.spawnAll(scene);
  const player = new Player(scene, camera, canvas);
  const mission = new Mission01(UI);

  UI.updateStats(player);

  const INTERACT_RANGE = 3.2;
  const INFORMANT_INFO_RANGE = 3.5;
  let nearestInteractable = null;
  let dialogueQueue = [];

  // -------------------- Overlays (start / pause) --------------------
  const startOverlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");
  const pauseMenu = document.getElementById("pause-menu");
  const resumeBtn = document.getElementById("resume-btn");

  startBtn.addEventListener("click", () => {
    startOverlay.classList.add("hidden");
    canvas.requestPointerLock();
    UI.toast("Bienvenue, Agent. Rendez-vous au poste de police (marqueur bleu).");
  });

  function togglePause(forceState) {
    const willShow = forceState !== undefined ? forceState : pauseMenu.classList.contains("hidden");
    pauseMenu.classList.toggle("hidden", !willShow);
    if (willShow && document.pointerLockElement) document.exitPointerLock();
  }
  resumeBtn.addEventListener("click", () => {
    togglePause(false);
    canvas.requestPointerLock();
  });
  window.addEventListener("game:escape", () => {
    if (!startOverlay.classList.contains("hidden")) return;
    togglePause();
  });

  // -------------------- Logique d'interaction --------------------
  function findNearestInteractable() {
    const p = player.position;

    // Poste de police (entrée)
    const distStation = p.distanceTo(World.stationEntrance);
    if (distStation < 9) {
      if (mission.state === MissionState.NOT_STARTED) {
        return { type: "station_brief", label: "Réceptionniste PNH" };
      }
      if (mission.state === MissionState.TARGET_NEUTRALIZED) {
        return { type: "station_return", label: "Réceptionniste PNH" };
      }
    }

    // Informateur
    if (mission.state === MissionState.BRIEFED) {
      const d = NPCManager.informant.distanceTo(p);
      if (d < INFORMANT_INFO_RANGE) {
        return { type: "informant", label: NPCManager.informant.name };
      }
    }
    if (mission.state === MissionState.SEEKING_INFORMANT) {
      const d = NPCManager.informant.distanceTo(p);
      if (d < INFORMANT_INFO_RANGE) {
        return { type: "informant_info", label: NPCManager.informant.name };
      }
    }

    // Cible
    if (
      (mission.state === MissionState.INFO_OBTAINED || mission.state === MissionState.TARGET_ENGAGED) &&
      NPCManager.target.active
    ) {
      const d = NPCManager.target.distanceTo(p);
      if (d < INTERACT_RANGE) {
        return { type: "target", label: NPCManager.target.name };
      }
    }

    // Civils / autres PNJ = petit dialogue d'ambiance
    for (const n of npcs) {
      if (n.role === "civil" && n.distanceTo(p) < 2.2) {
        return { type: "civil_chat", label: "Habitant du quartier", npc: n };
      }
    }

    return null;
  }

  const CIVIL_LINES = [
    "Cheche laverite a, ou tande? Nou bezwen sekirite isit la.",
    "Fè atansyon, gen moun sispèk bò makèt la.",
    "Mèsi paske w ap pwoteje katye a, Ajan.",
    "Yo di gen yon gang k ap fè zak sou lòt bò a.",
  ];

  function handleInteract(target) {
    if (UI.isDialogueOpen()) {
      UI.hideDialogue();
      return;
    }
    if (!target) return;

    switch (target.type) {
      case "station_brief":
        UI.showDialogue(
          "Réceptionniste PNH",
          "Agent, un informateur a repéré des activités suspectes dans le quartier. Trouvez-le et obtenez des informations sur un membre de gang. Bonne chance."
        );
        mission.acceptBriefing();
        break;

      case "informant":
        UI.showDialogue(
          NPCManager.informant.name,
          "Psst... Agent. J'ai vu quelque chose d'important. Interagissez encore avec moi pour que je vous donne les détails."
        );
        mission.talkToInformant();
        break;

      case "informant_info":
        UI.showDialogue(
          NPCManager.informant.name,
          "Un membre du gang, surnommé 'Ti Malo', traîne au sud-est du quartier près des entrepôts. Il porte un bandana jaune. Soyez prudent."
        );
        mission.receiveInfo();
        NPCManager.target.setHighlighted(true);
        break;

      case "target":
        mission.engageTarget();
        UI.showDialogue(
          NPCManager.target.name,
          "Ki sa w vle, Ajan?! Mwen pa fè anyen mal!"
        );
        break;

      case "civil_chat":
        UI.showDialogue("Habitant", CIVIL_LINES[Math.floor(Math.random() * CIVIL_LINES.length)]);
        break;

      case "station_return":
        UI.showDialogue(
          "Réceptionniste PNH",
          "Excellent travail, Agent. Grâce à vous, le quartier est un peu plus sûr aujourd'hui."
        );
        mission.completeMission(player);
        break;
    }
  }

  window.addEventListener("game:interact", () => {
    if (pauseMenu && !pauseMenu.classList.contains("hidden")) return;
    handleInteract(nearestInteractable);
  });

  // Clic gauche = action (arrêter la cible si suffisamment proche et engagée)
  window.addEventListener("game:action", () => {
    if (mission.state === MissionState.TARGET_ENGAGED && NPCManager.target.active) {
      const d = NPCManager.target.distanceTo(player.position);
      if (d < INTERACT_RANGE + 1) {
        NPCManager.target.setHighlighted(false);
        NPCManager.target.remove();
        UI.hideDialogue();
        mission.neutralizeTarget();
      }
    }
  });

  // -------------------- Boucle de jeu --------------------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    const paused = !pauseMenu.classList.contains("hidden") || !startOverlay.classList.contains("hidden");

    if (!paused) {
      player.update(dt);
      NPCManager.update(dt);
      World.updateVehicles(dt);

      nearestInteractable = findNearestInteractable();
      UI.showInteractPrompt(!!nearestInteractable && !UI.isDialogueOpen());

      // Points affichés sur la mini-carte
      const mapPoints = [
        { x: World.markers.policeStation.x, z: World.markers.policeStation.z, color: "#3d7bff", radius: 6 },
        ...(World.markers.school ? [{ x: World.markers.school.x, z: World.markers.school.z, color: "#7de37d", radius: 5 }] : []),
        { x: World.markers.market.x, z: World.markers.market.z, color: "#f2c14e", radius: 4 },
      ];
      if (mission.state === MissionState.BRIEFED || mission.state === MissionState.NOT_STARTED) {
        mapPoints.push({ x: NPCManager.informant.mesh.position.x, z: NPCManager.informant.mesh.position.z, color: "#2f8f5b", radius: 5, pulse: mission.state === MissionState.BRIEFED });
      }
      if (
        (mission.state === MissionState.INFO_OBTAINED || mission.state === MissionState.TARGET_ENGAGED) &&
        NPCManager.target.active
      ) {
        mapPoints.push({ x: NPCManager.target.mesh.position.x, z: NPCManager.target.mesh.position.z, color: "#ff3b3b", radius: 6, pulse: true });
      }
      UI.drawMinimap(player, mapPoints);
    }

    renderer.render(scene, camera);
  }

  animate();
})();
