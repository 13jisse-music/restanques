// ═══════════════════════════════════════════════════════════
// SONS — Web Audio API, zéro fichier
// ═══════════════════════════════════════════════════════════

class GameSounds {
  private ctx: AudioContext | null = null;
  private muted = false;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.initialized = true;
  }

  toggleMute() { this.muted = !this.muted; return this.muted; }
  isMuted() { return this.muted; }

  private osc(freq: number, type: OscillatorType, vol: number, dur: number, delay = 0, freqEnd?: number) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    o.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + delay + dur);
    o.type = type;
    g.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + dur);
    o.start(this.ctx.currentTime + delay);
    o.stop(this.ctx.currentTime + delay + dur);
  }

  step() { this.osc(200 + Math.random() * 100, "sine", 0.08, 0.05); }

  collect() { this.osc(300, "sine", 0.15, 0.2, 0, 800); }

  gemMatch(combo = 0) {
    const f = 600 + combo * 150;
    this.osc(f, "triangle", 0.12, 0.15);
    this.osc(f + 200, "triangle", 0.12, 0.15, 0.08);
  }

  craft() {
    [800, 1200, 1600].forEach((f, i) => this.osc(f, "triangle", 0.12, 0.3, i * 0.1));
  }

  hit() { this.osc(150, "sawtooth", 0.15, 0.2, 0, 50); }

  victory() {
    [523, 659, 784, 1047].forEach((f, i) => this.osc(f, "square", 0.08, 0.4, i * 0.15));
  }

  locked() { this.osc(200, "square", 0.15, 0.15); this.osc(100, "square", 0.15, 0.1, 0.05); }

  levelUp() { this.osc(400, "sine", 0.12, 0.6, 0, 1200); }

  unlock() {
    [400, 500, 600, 800].forEach((f, i) => this.osc(f, "sine", 0.1, 0.3, i * 0.12));
  }

  enemyAlert() {
    this.osc(300, "square", 0.12, 0.1);
    this.osc(450, "square", 0.1, 0.15, 0.1);
  }
}

export const sounds = new GameSounds();
