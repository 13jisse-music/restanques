// ═══ SONS + MUSIQUES — Web Audio + MP3 ═══
class GameSounds {
  private ctx: AudioContext | null = null;
  private initialized = false;
  private vol = 1;
  private audioEl: HTMLAudioElement | null = null;
  private currentMusic = "";
  storyActive = false;

  init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.initialized = true;
  }

  cycleVolume(): number {
    this.vol = this.vol === 1 ? 0.5 : this.vol === 0.5 ? 0 : 1;
    if (this.audioEl) this.audioEl.volume = this.vol * 0.5;
    return this.vol;
  }
  getVolIcon(): string { return this.vol === 1 ? "🔊" : this.vol === 0.5 ? "🔉" : "🔇"; }

  private o(freq: number, type: OscillatorType, vol: number, dur: number, delay = 0, freqEnd?: number) {
    if (!this.ctx || this.vol === 0 || this.storyActive) return;
    const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + delay + dur);
    osc.type = type;
    g.gain.setValueAtTime(vol * this.vol, this.ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + dur);
    osc.start(this.ctx.currentTime + delay); osc.stop(this.ctx.currentTime + delay + dur);
  }

  // Steps
  stepGrass() { this.o(180 + Math.random() * 40, "sine", 0.06, 0.04); }
  stepStone() { this.o(800 + Math.random() * 200, "square", 0.08, 0.02); }
  stepSand() { this.o(2000 + Math.random() * 500, "sine", 0.04, 0.05); }
  step() { this.stepGrass(); }

  // Combat
  gemMatch(combo = 0) { const f = 800 + combo * 150; this.o(f, "triangle", 0.08 + combo * 0.03, 0.1); this.o(f + 200, "triangle", 0.06, 0.1, 0.06); }
  combatHit() { this.o(120, "sawtooth", 0.15, 0.2, 0, 40); }
  combatVictory() { [523, 659, 784, 1047].forEach((f, i) => this.o(f, "square", 0.10, 0.3, i * 0.12)); }
  combatDefeat() { this.o(400, "sawtooth", 0.12, 0.5, 0, 100); }

  // UI
  uiClick() { this.o(600, "square", 0.08, 0.03); }
  uiOpen() { this.o(300, "sine", 0.06, 0.15, 0, 600); }
  uiClose() { this.o(600, "sine", 0.06, 0.15, 0, 300); }
  craft() { [800, 1000, 1200, 1600].forEach((f, i) => this.o(f, "triangle", 0.10, 0.12, i * 0.08)); }
  equip() { this.o(1000, "triangle", 0.08, 0.1); this.o(1500, "triangle", 0.06, 0.1, 0.05); }
  levelUp() { this.o(400, "sine", 0.12, 0.5, 0, 1200); }
  harvestDone() { this.o(523, "triangle", 0.12, 0.08); this.o(784, "triangle", 0.12, 0.08, 0.08); }
  locked() { this.o(200, "square", 0.10, 0.15); this.o(150, "square", 0.10, 0.15, 0.1); }
  unlock() { [523, 659, 784].forEach((f, i) => this.o(f, "triangle", 0.08, 0.2, i * 0.1)); }
  mystery() { this.o(82, "sine", 0.08, 0.8); }
  enemyAlert() { this.o(300, "sawtooth", 0.06, 0.1); }
  ko() { this.o(200, "sawtooth", 0.12, 0.8, 0, 50); }

  // Music (MP3)
  playMusic(id: string) {
    if (this.currentMusic === id) return;
    this.stopMusic();
    this.currentMusic = id;
    try {
      this.audioEl = new Audio(`/music/${id}.mp3`);
      this.audioEl.loop = true;
      this.audioEl.volume = this.vol * 0.4;
      this.audioEl.play().catch(() => {});
    } catch { /* no mp3 available */ }
  }
  stopMusic() {
    if (this.audioEl) { this.audioEl.pause(); this.audioEl = null; }
    this.currentMusic = "";
  }
  playBiomeMusic(biome: string) { this.playMusic(biome); }
  playIntroMusic() { this.playMusic("story"); }
}

export const sounds = new GameSounds();
