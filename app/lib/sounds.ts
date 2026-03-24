// ═══════════════════════════════════════════════════════════
// SONS + MUSIQUES — Web Audio API complet (29 sons + 9 musiques)
// ═══════════════════════════════════════════════════════════

class GameSounds {
  private ctx: AudioContext | null = null;
  private muted = false;
  private initialized = false;
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private musicOscs: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private vol = 1; // 0, 0.5, 1
  private currentMusic = "";

  init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.initialized = true;
  }

  cycleVolume(): number { this.vol = this.vol === 1 ? 0.5 : this.vol === 0.5 ? 0 : 1; if (this.vol === 0) this.muted = true; else this.muted = false; return this.vol; }
  getVolIcon(): string { return this.vol === 1 ? "🔊" : this.vol === 0.5 ? "🔉" : "🔇"; }
  isMuted() { return this.muted; }

  private o(freq: number, type: OscillatorType, vol: number, dur: number, delay = 0, freqEnd?: number) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + delay + dur);
    osc.type = type;
    g.gain.setValueAtTime(vol * this.vol, this.ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + dur);
    osc.start(this.ctx.currentTime + delay); osc.stop(this.ctx.currentTime + delay + dur);
  }

  // ─── PAS (4 variantes) ───
  stepGrass() { this.o(180 + Math.random() * 40, "sine", 0.06, 0.04); }
  stepStone() { this.o(800 + Math.random() * 200, "square", 0.08, 0.02); }
  stepSand() { this.o(2000 + Math.random() * 500, "sine", 0.04, 0.05); }
  stepWater() { this.o(300, "sine", 0.06, 0.06); this.o(600, "sine", 0.04, 0.06, 0.02); }

  stepByTile(tile: string) {
    if (tile === "w" || tile === "dw" || tile === "cf") this.stepWater();
    else if (tile === "s" || tile === "dk") this.stepSand();
    else if (tile === "mf" || tile === "mw" || tile === "rs" || tile === "rw" || tile === "cl") this.stepStone();
    else this.stepGrass();
  }

  // ─── RÉCOLTE ───
  harvestWood() { this.o(200, "sawtooth", 0.12, 0.08, 0, 100); }
  harvestStone() { this.o(1200, "square", 0.10, 0.05, 0, 800); }
  harvestHerb() { this.o(4000, "sine", 0.05, 0.04); }
  harvestDone() { this.o(523, "triangle", 0.12, 0.08); this.o(784, "triangle", 0.12, 0.08, 0.08); this.o(1047, "triangle", 0.12, 0.08, 0.16); }

  // ─── COMBAT ───
  gemMatch(combo = 0) { const f = 800 + combo * 150; this.o(f, "triangle", 0.08 + combo * 0.03, 0.1); this.o(f + 200, "triangle", 0.06 + combo * 0.02, 0.1, 0.06); }
  combatHit() { this.o(120, "sawtooth", 0.15, 0.2, 0, 40); }
  combatSpell() { this.o(400, "sine", 0.10, 0.3, 0, 1600); }
  combatVictory() { [523, 659, 784, 1047].forEach((f, i) => this.o(f, "square", 0.10, 0.3, i * 0.12)); }
  combatDefeat() { this.o(400, "sawtooth", 0.12, 0.5, 0, 100); }

  // ─── UI ───
  uiClick() { this.o(600, "square", 0.08, 0.03); }
  uiOpen() { this.o(300, "sine", 0.06, 0.15, 0, 600); }
  uiClose() { this.o(600, "sine", 0.06, 0.15, 0, 300); }
  craft() { [800, 1000, 1200, 1600].forEach((f, i) => this.o(f, "triangle", 0.10, 0.12, i * 0.08)); }
  equip() { this.o(1000, "triangle", 0.08, 0.1); this.o(1500, "triangle", 0.06, 0.1, 0.05); }
  levelUp() { this.o(400, "sine", 0.12, 0.5, 0, 1200); }

  // ─── NARRATION ───
  npcTalk() { [0, 0.08, 0.16].forEach(d => this.o(300, "square", 0.06, 0.05, d)); }
  questAccept() { [392, 494, 587].forEach((f, i) => this.o(f, "triangle", 0.08, 0.1, i * 0.1)); }
  questComplete() { [523, 659, 784, 1047].forEach((f, i) => this.o(f, "triangle", 0.12, 0.15, i * 0.1)); }
  unlock() { [400, 500, 600, 800].forEach((f, i) => this.o(f, "sine", 0.10, 0.3, i * 0.12)); }

  // ─── AMBIANCE ───
  mystery() { this.o(82, "sine", 0.08, 1.5); }
  locked() { this.o(200, "square", 0.12, 0.08); this.o(100, "square", 0.12, 0.1, 0.05); }
  teleport() { this.o(300, "sine", 0.08, 0.4, 0, 2000); }
  ko() { this.o(300, "sawtooth", 0.15, 0.8, 0, 60); }
  collect() { this.o(400, "sine", 0.12, 0.15); this.o(800, "sine", 0.10, 0.15, 0.08); }

  // Shortcuts for backward compat
  step() { this.stepGrass(); }
  hit() { this.combatHit(); }
  victory() { this.combatVictory(); }
  enemyAlert() { this.o(300, "square", 0.10, 0.1); this.o(450, "square", 0.08, 0.15, 0.1); }

  // ─── MUSIQUES ───
  stopMusic() {
    if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; }
    this.musicOscs.forEach(o => { try { o.stop(); } catch {} });
    this.musicOscs = []; this.musicGains.forEach(g => { try { g.disconnect(); } catch {} }); this.musicGains = [];
    this.currentMusic = "";
  }

  private drone(freq: number, vol: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    o.type = "sine"; o.frequency.value = freq; g.gain.value = vol * this.vol;
    o.start(); this.musicOscs.push(o); this.musicGains.push(g);
  }

  playMusic(id: string) {
    if (!this.ctx || this.muted || this.currentMusic === id) return;
    this.stopMusic();
    this.currentMusic = id;

    const configs: Record<string, { drones: [number, number][]; notes: number[]; type: OscillatorType; speed: number; vol: number; extras?: () => void }> = {
      garrigue:   { drones: [[220, 0.03], [330, 0.02]], notes: [440, 523, 659, 523, 440, 392], type: "triangle", speed: 800, vol: 0.05 },
      calanques:  { drones: [[262, 0.03], [392, 0.02]], notes: [523, 659, 784, 659, 523, 784], type: "sine", speed: 1000, vol: 0.04 },
      mines:      { drones: [[165, 0.04]], notes: [165, 196, 220, 196], type: "triangle", speed: 1200, vol: 0.03 },
      mer:        { drones: [[147, 0.03], [220, 0.02]], notes: [294, 349, 440, 523, 440, 349], type: "sine", speed: 900, vol: 0.04 },
      restanques: { drones: [[196, 0.03], [294, 0.02]], notes: [392, 440, 523, 587, 523, 440], type: "sawtooth", speed: 600, vol: 0.04 },
      combat:     { drones: [], notes: [165, 196, 165, 220, 165, 196, 165, 147], type: "sawtooth", speed: 300, vol: 0.06 },
      boss:       { drones: [[82, 0.04]], notes: [196, 233, 262, 294, 262, 233, 196, 147], type: "sawtooth", speed: 200, vol: 0.05 },
      house:      { drones: [[175, 0.02], [262, 0.02]], notes: [349, 440, 523, 440, 349, 262], type: "triangle", speed: 700, vol: 0.05 },
      intro:      { drones: [[220, 0.02], [330, 0.015]], notes: [], type: "sine", speed: 0, vol: 0 },
      theme:      { drones: [[220, 0.03], [330, 0.02], [440, 0.01]], notes: [220, 330, 440, 523, 440, 330], type: "triangle", speed: 1200, vol: 0.05 },
      story:      { drones: [[175, 0.02], [262, 0.015]], notes: [262, 330, 392, 330], type: "sine", speed: 1500, vol: 0.03 },
      ending:     { drones: [[262, 0.03], [392, 0.03], [523, 0.02]], notes: [262, 330, 392, 440, 523, 659, 784], type: "triangle", speed: 800, vol: 0.06 },
      gameover:   { drones: [[110, 0.03]], notes: [330, 262, 220, 175], type: "triangle", speed: 1000, vol: 0.04 },
    };

    const cfg = configs[id] || configs.garrigue;
    cfg.drones.forEach(([f, v]) => this.drone(f, v));

    if (cfg.notes.length > 0 && cfg.speed > 0) {
      let ni = 0;
      this.musicInterval = setInterval(() => {
        if (!this.ctx || this.muted) return;
        this.o(cfg.notes[ni % cfg.notes.length], cfg.type, cfg.vol, cfg.speed / 1000 * 0.9);
        // Combat kick on even beats
        if ((id === "combat" || id === "boss") && ni % 2 === 0) this.o(120, "sine", 0.12, 0.12);
        ni++;
      }, cfg.speed);
    }
  }

  // Backward compat
  playBiomeMusic(biome: string) { this.playMusic(biome); }
  playCombatMusic(boss = false) { this.playMusic(boss ? "boss" : "combat"); }
  playExploreMusic() { this.playMusic("garrigue"); }
  playIntroMusic() { this.playMusic("intro"); }
}

export const sounds = new GameSounds();
