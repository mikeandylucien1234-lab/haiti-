// ============================================================
// mission.js — Structure de mission simple + progression joueur
// Conçu pour être étendu plus tard avec de nouvelles missions,
// quartiers, gangs, armes, etc. (voir GameData en bas du fichier)
// ============================================================

const MissionState = {
  NOT_STARTED: "NOT_STARTED",
  BRIEFED: "BRIEFED",                 // instructions reçues au poste
  SEEKING_INFORMANT: "SEEKING_INFORMANT",
  INFO_OBTAINED: "INFO_OBTAINED",     // cible localisée sur la carte
  TARGET_ENGAGED: "TARGET_ENGAGED",   // joueur est proche de la cible
  TARGET_NEUTRALIZED: "TARGET_NEUTRALIZED",
  COMPLETE: "COMPLETE",
};

class Mission01 {
  constructor(ui) {
    this.ui = ui;
    this.state = MissionState.NOT_STARTED;

    this.objectives = [
      { id: "brief", label: "Recevoir les instructions", done: false },
      { id: "informant", label: "Trouver l'informateur", done: false },
      { id: "info", label: "Obtenir les informations", done: false },
      { id: "locate", label: "Localiser la cible", done: false },
      { id: "arrest", label: "Arrêter la cible", done: false },
      { id: "return", label: "Retourner au poste", done: false },
    ];

    this.ui.renderObjectives(this.objectives);
  }

  markDone(id) {
    const obj = this.objectives.find((o) => o.id === id);
    if (obj) obj.done = true;
    this.ui.renderObjectives(this.objectives);
  }

  activeObjectiveId() {
    const next = this.objectives.find((o) => !o.done);
    return next ? next.id : null;
  }

  acceptBriefing() {
    if (this.state !== MissionState.NOT_STARTED) return;
    this.state = MissionState.BRIEFED;
    this.markDone("brief");
    this.ui.toast("Mission acceptée : trouvez l'informateur dans le quartier.");
  }

  talkToInformant() {
    if (this.state !== MissionState.BRIEFED) return;
    this.state = MissionState.SEEKING_INFORMANT;
    this.markDone("informant");
    this.ui.toast("Informateur localisé. Discussion en cours...");
  }

  receiveInfo() {
    if (this.state !== MissionState.SEEKING_INFORMANT) return;
    this.state = MissionState.INFO_OBTAINED;
    this.markDone("info");
    this.markDone("locate");
    this.ui.toast("Information obtenue : la cible a été repérée sur la carte !");
  }

  engageTarget() {
    if (this.state !== MissionState.INFO_OBTAINED) return;
    this.state = MissionState.TARGET_ENGAGED;
  }

  neutralizeTarget() {
    if (
      this.state !== MissionState.TARGET_ENGAGED &&
      this.state !== MissionState.INFO_OBTAINED
    )
      return;
    this.state = MissionState.TARGET_NEUTRALIZED;
    this.markDone("arrest");
    this.ui.toast("Cible arrêtée ! Retournez au poste de police.");
  }

  completeMission(player) {
    if (this.state !== MissionState.TARGET_NEUTRALIZED) return;
    this.state = MissionState.COMPLETE;
    this.markDone("return");

    const reward = { money: 150, reputation: 15 };
    player.money += reward.money;
    player.reputation += reward.reputation;
    if (player.reputation >= 25 && player.level < 2) {
      player.level = 2;
      this.ui.toast("NIVEAU SUPÉRIEUR ! Vous êtes maintenant AGENT 02.");
    }

    this.ui.toast(`Mission réussie ! +${reward.money} G, +${reward.reputation} réputation.`);
    this.ui.updateStats(player);
  }
}

// ------------------------------------------------------------
// GameData — squelette de progression pour les futures versions.
// Rien de tout ceci n'est utilisé activement dans ce prototype,
// mais la structure est prête pour être branchée plus tard.
// ------------------------------------------------------------
const GameData = {
  quartiers: ["Carrefour-Feuilles (démo)"],
  armesDisponibles: ["Pistolet de service"],
  vehiculesDisponibles: ["À pied"],
  gangsConnus: ["Gang local sans nom (démo)"],
  missionsDisponibles: ["Mission 01 — Enquêter sur le quartier"],
};
