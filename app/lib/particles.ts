// ═══ PARTICULES & ANIMATIONS ═══
// Tout en vanilla JS, zéro dépendance

export function spawnGemParticles(x: number, y: number, color: string) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 30;
    const el = document.createElement("div");
    const size = 4 + Math.random() * 4;
    el.style.cssText = `
      position:fixed; left:${x}px; top:${y}px; width:${size}px; height:${size}px;
      background:${color}; border-radius:50%; pointer-events:none; z-index:999;
      --px:${Math.cos(angle) * dist}px; --py:${Math.sin(angle) * dist}px;
      animation: particleFly 500ms ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }
}

export function spawnLevelUpParticles() {
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    const el = document.createElement("div");
    const isEmoji = i % 5 === 0;
    const size = isEmoji ? 16 : (4 + Math.random() * 4);
    el.style.cssText = `
      position:fixed; left:${cx}px; top:${cy}px; width:${size}px; height:${size}px;
      ${isEmoji ? `font-size:14px; line-height:${size}px; text-align:center;` : `background:#FFD700; border-radius:50%;`}
      pointer-events:none; z-index:999;
      --px:${Math.cos(angle) * dist}px; --py:${Math.sin(angle) * dist}px;
      animation: levelUpParticle 800ms ease-out forwards;
      animation-delay: ${Math.random() * 200}ms;
    `;
    if (isEmoji) el.textContent = "✨";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
  // Flash doré
  const flash = document.createElement("div");
  flash.style.cssText = "position:fixed;inset:0;z-index:998;pointer-events:none;animation:levelUpFlash 600ms ease-out forwards;";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 700);
}

export function spawnQuestConfetti() {
  const colors = ["#FFD700", "#4CAF50", "#2196F3", "#E91E63", "#FF9800"];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position:fixed; top:-10px; left:${Math.random() * 100}vw;
      width:8px; height:8px; pointer-events:none; z-index:500;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      animation: confetti 1.5s ease-out forwards;
      animation-delay: ${Math.random() * 500}ms;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  }
}

export function spawnCraftSparkles(x: number, y: number) {
  for (let i = 0; i < 8; i++) {
    const el = document.createElement("div");
    const startX = (Math.random() - 0.5) * 80;
    const startY = (Math.random() - 0.5) * 80;
    el.style.cssText = `
      position:fixed; left:${x}px; top:${y}px; width:6px; height:6px;
      background:#FFD700; border-radius:50%; pointer-events:none; z-index:999;
      --startX:${startX}px; --startY:${startY}px;
      animation: craftSparkle 500ms ease-in forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }
}

export function shakeScreen(duration = 300) {
  const el = document.getElementById("game-container");
  if (el) {
    el.classList.add("screen-shake");
    setTimeout(() => el.classList.remove("screen-shake"), duration);
  }
}

export function damageFlash() {
  const el = document.getElementById("game-container");
  if (el) {
    el.classList.add("damage-flash");
    setTimeout(() => el.classList.remove("damage-flash"), 400);
  }
}

export function spawnDamageText(x: number, y: number, text: string, type: "damage" | "heal" | "received" = "damage") {
  const el = document.createElement("div");
  const color = type === "heal" ? "#4CAF50" : type === "received" ? "#FF4444" : "#FFD700";
  el.style.cssText = `
    position:fixed; left:${x}px; top:${y}px;
    color:${color}; font-size:22px; font-weight:bold;
    font-family:'Crimson Text',serif; text-shadow:2px 2px 4px rgba(0,0,0,0.8);
    pointer-events:none; z-index:999;
    animation: combatDamageFloat 800ms ease-out forwards;
  `;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
