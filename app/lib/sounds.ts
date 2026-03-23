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

  playExploreMusic() {
    if (!this.ctx || this.muted) return;
    this.stopMusic();
    // Drone La + Mi
    const makeDrone = (freq: number, vol: number) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.connect(g); g.connect(this.ctx!.destination);
      o.type = "sine"; o.frequency.value = freq; g.gain.value = vol * this.volume;
      o.start();
      this.musicOscs.push(o); this.musicGains.push(g);
    };
    makeDrone(220, 0.03);
    makeDrone(330, 0.02);
    // Arpège
    const notes = [440, 523, 659, 523, 440, 392, 440, 523];
    let ni = 0;
    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.muted) return;
      this.osc(notes[ni % notes.length], "triangle", 0.04, 0.8);
      ni++;
    }, 800);
  }

  playCombatMusic() {
    if (!this.ctx || this.muted) return;
    this.stopMusic();
    const notes = [165, 196, 165, 220, 165, 196, 165, 147];
    let b = 0;
    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.muted) return;
      this.osc(notes[b % notes.length], "sawtooth", 0.05, 0.25);
      if (b % 2 === 0) {
        this.osc(120, "sine", 0.08, 0.12);
      }
      b++;
    }, 300);
  }
}

export const sounds = new GameSounds();
