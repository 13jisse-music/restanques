// ═══════════════════════════════════════════════════════════
// SONS + MUSIQUE — Web Audio API, zéro fichier
// ═══════════════════════════════════════════════════════════

class GameSounds {
  private ctx: AudioContext | null = null;
  private muted = false;
  private initialized = false;
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private musicOscs: OscillatorNode[] = [];
  private musicGains: GainNode[] = [];
  private volume = 1;

  init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.initialized = true;
  }

  toggleMute() { this.muted = !this.muted; if (this.muted) this.stopMusic(); return this.muted; }
  isMuted() { return this.muted; }

  private osc(freq: number, type: OscillatorType, vol: number, dur: number, delay = 0, freqEnd?: number) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    o.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + delay + dur);
    o.type = type;
    g.gain.setValueAtTime(vol * this.volume, this.ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + dur);
    o.start(this.ctx.currentTime + delay);
    o.stop(this.ctx.currentTime + delay + dur);
  }

  step() { this.osc(200 + Math.random() * 100, "sine", 0.06, 0.05); }
  collect() { this.osc(400, "sine", 0.12, 0.15); this.osc(800, "sine", 0.1, 0.15, 0.08); }
  gemMatch(combo = 0) { const f = 600 + combo * 150; this.osc(f, "triangle", 0.1, 0.15); this.osc(f + 200, "triangle", 0.1, 0.15, 0.08); }
  craft() { [800, 1200, 1600].forEach((f, i) => this.osc(f, "triangle", 0.1, 0.3, i * 0.1)); }
  hit() { this.osc(150, "sawtooth", 0.12, 0.2, 0, 50); }
  victory() { [523, 659, 784, 1047].forEach((f, i) => this.osc(f, "square", 0.06, 0.4, i * 0.15)); }
  locked() { this.osc(200, "square", 0.12, 0.08); this.osc(100, "square", 0.12, 0.1, 0.05); }
  levelUp() { this.osc(400, "sine", 0.1, 0.6, 0, 1200); }
  unlock() { [400, 500, 600, 800].forEach((f, i) => this.osc(f, "sine", 0.08, 0.3, i * 0.12)); }
  enemyAlert() { this.osc(300, "square", 0.1, 0.1); this.osc(450, "square", 0.08, 0.15, 0.1); }

  // ─── MUSIQUE ───
  stopMusic() {
    if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; }
    this.musicOscs.forEach(o => { try { o.stop(); } catch {} });
    this.musicOscs = [];
    this.musicGains.forEach(g => { try { g.disconnect(); } catch {} });
    this.musicGains = [];
  }

  playBiomeMusic(biome: string) {
    if (!this.ctx || this.muted) return;
    this.stopMusic();
    const drone = (freq: number, vol: number) => {
      const o = this.ctx!.createOscillator(); const g = this.ctx!.createGain();
      o.connect(g); g.connect(this.ctx!.destination);
      o.type = "sine"; o.frequency.value = freq; g.gain.value = vol * this.volume;
      o.start(); this.musicOscs.push(o); this.musicGains.push(g);
    };
    const biomeConfig: Record<string, { drones: [number, number][]; notes: number[]; type: OscillatorType; speed: number; vol: number }> = {
      garrigue:   { drones: [[220, 0.03], [330, 0.02]], notes: [440, 523, 659, 523, 440, 392, 440, 523], type: "triangle", speed: 800, vol: 0.04 },
      calanques:  { drones: [[165, 0.02], [247, 0.02]], notes: [659, 784, 880, 784, 659, 587, 523, 587], type: "sine", speed: 1000, vol: 0.03 },
      mines:      { drones: [[110, 0.04], [165, 0.02]], notes: [220, 262, 220, 196, 220, 262, 294, 262], type: "triangle", speed: 900, vol: 0.03 },
      mer:        { drones: [[147, 0.03], [220, 0.02]], notes: [523, 659, 784, 880, 784, 659, 523, 440], type: "sine", speed: 1100, vol: 0.03 },
      restanques: { drones: [[110, 0.04], [220, 0.03]], notes: [330, 392, 440, 523, 440, 392, 330, 294], type: "sawtooth", speed: 600, vol: 0.04 },
    };
    const cfg = biomeConfig[biome] || biomeConfig.garrigue;
    cfg.drones.forEach(([f, v]) => drone(f, v));
    let ni = 0;
    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.muted) return;
      this.osc(cfg.notes[ni % cfg.notes.length], cfg.type, cfg.vol, cfg.speed / 1000 * 0.9);
      ni++;
    }, cfg.speed);
  }

  playExploreMusic() { this.playBiomeMusic("garrigue"); }

  playCombatMusic(boss = false) {
    if (!this.ctx || this.muted) return;
    this.stopMusic();
    const notes = [165, 196, 165, 220, 165, 196, 165, 147];
    const speed = boss ? 150 : 300;
    let b = 0;
    if (boss) {
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.connect(g); g.connect(this.ctx.destination);
      o.type = "sine"; o.frequency.value = 55; g.gain.value = 0.06;
      o.start(); this.musicOscs.push(o); this.musicGains.push(g);
    }
    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.muted) return;
      this.osc(notes[b % notes.length], "sawtooth", 0.05, 0.25);
      if (b % 2 === 0) this.osc(120, "sine", 0.08, 0.12);
      b++;
    }, speed);
  }

  mystery() { this.osc(82, "sine", 0.08, 1.5); }

  playIntroMusic() {
    if (!this.ctx || this.muted) return;
    this.stopMusic();
    const drone = (freq: number, vol: number) => {
      const o = this.ctx!.createOscillator(); const g = this.ctx!.createGain();
      o.connect(g); g.connect(this.ctx!.destination);
      o.type = "sine"; o.frequency.value = freq; g.gain.value = vol;
      o.start(); this.musicOscs.push(o); this.musicGains.push(g);
    };
    drone(220, 0.02);
    drone(330, 0.015);
  }
}

export const sounds = new GameSounds();
