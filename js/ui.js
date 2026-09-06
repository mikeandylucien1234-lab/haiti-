// ============================================================
// ui.js — Gestion du HUD, dialogues, toasts, et mini-carte
// ============================================================

const UI = {
  init() {
    this.objectiveListEl = document.getElementById("objective-list");
    this.moneyEl = document.getElementById("money-value");
    this.repEl = document.getElementById("rep-value");
    this.levelEl = document.getElementById("level-value");
    this.healthBarEl = document.getElementById("health-bar");
    this.interactPromptEl = document.getElementById("interact-prompt");
    this.dialogueBoxEl = document.getElementById("dialogue-box");
    this.dialogueNameEl = document.getElementById("dialogue-name");
    this.dialogueTextEl = document.getElementById("dialogue-text");
    this.toastContainerEl = document.getElementById("toast-container");
    this.minimapEl = document.getElementById("minimap");
    this.minimapCtx = this.minimapEl.getContext("2d");
  },

  renderObjectives(objectives) {
    this.objectiveListEl.innerHTML = "";
    let activeFound = false;
    objectives.forEach((o) => {
      const li = document.createElement("li");
      const box = o.done ? "☑" : "☐";
      li.innerHTML = `<span class="box">${box}</span> ${o.label}`;
      if (o.done) li.classList.add("done");
      else if (!activeFound) {
        li.classList.add("active");
        activeFound = true;
      }
      this.objectiveListEl.appendChild(li);
    });
  },

  updateStats(player) {
    this.moneyEl.textContent = player.money;
    this.repEl.textContent = player.reputation;
    this.levelEl.textContent = player.level;
    const pct = Math.max(0, Math.min(100, player.health));
    this.healthBarEl.style.width = pct + "%";
  },

  showInteractPrompt(show) {
    this.interactPromptEl.classList.toggle("hidden", !show);
  },

  showDialogue(name, text) {
    this.dialogueNameEl.textContent = name;
    this.dialogueTextEl.textContent = text;
    this.dialogueBoxEl.classList.remove("hidden");
  },

  hideDialogue() {
    this.dialogueBoxEl.classList.add("hidden");
  },

  isDialogueOpen() {
    return !this.dialogueBoxEl.classList.contains("hidden");
  },

  toast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    this.toastContainerEl.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  // Dessine la mini-carte circulaire centrée sur le joueur
  drawMinimap(player, points) {
    const ctx = this.minimapCtx;
    const size = this.minimapEl.width;
    const range = 70; // portée en unités monde affichée sur la carte
    const scale = (size / 2 - 10) / range;

    ctx.clearRect(0, 0, size, size);

    // fond
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#12301f";
    ctx.fillRect(0, 0, size, size);

    // grille simple façon rues
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    for (let i = -3; i <= 3; i++) {
      const offset = size / 2 + i * scale * 15;
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(size, offset);
      ctx.stroke();
    }

    const toMap = (x, z) => {
      const dx = (x - player.position.x) * scale;
      const dz = (z - player.position.z) * scale;
      // rotation inverse selon l'orientation du joueur pour un rendu "GTA-like"
      const cos = Math.cos(-player.yaw);
      const sin = Math.sin(-player.yaw);
      const rx = dx * cos - dz * sin;
      const rz = dx * sin + dz * cos;
      return [size / 2 + rx, size / 2 + rz];
    };

    points.forEach((p) => {
      const [mx, my] = toMap(p.x, p.z);
      if (mx < -6 || mx > size + 6 || my < -6 || my > size + 6) return;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(mx, my, p.radius || 5, 0, Math.PI * 2);
      ctx.fill();
      if (p.pulse) {
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.arc(mx, my, (p.radius || 5) + 3 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();

    // joueur toujours au centre, orienté vers le haut
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.moveTo(size / 2, size / 2 - 7);
    ctx.lineTo(size / 2 - 5, size / 2 + 6);
    ctx.lineTo(size / 2 + 5, size / 2 + 6);
    ctx.closePath();
    ctx.fill();

    // bordure
    ctx.beginPath();
    ctx.strokeStyle = "rgba(242,193,78,0.6)";
    ctx.lineWidth = 2;
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  },
};
