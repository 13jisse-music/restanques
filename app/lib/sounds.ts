class S {
  private c: AudioContext | null = null;
  private v = 1;
  private a: HTMLAudioElement | null = null;
  private cur = "";
  storyActive = false;
  init() { if (this.c) return; this.c = new AudioContext(); if (this.c.state === "suspended") this.c.resume(); }
  cycleVol() { this.v = this.v === 1 ? .5 : this.v === .5 ? 0 : 1; if (this.a) this.a.volume = this.v * .4; return this.v; }
  volIcon() { return this.v === 1 ? "🔊" : this.v === .5 ? "🔉" : "🔇"; }
  private o(f: number, t: OscillatorType, vol: number, dur: number, d = 0, fe?: number) {
    if (!this.c || this.v === 0 || this.storyActive) return;
    const os = this.c.createOscillator(), g = this.c.createGain();
    os.connect(g); g.connect(this.c.destination);
    os.frequency.setValueAtTime(f, this.c.currentTime + d);
    if (fe) os.frequency.exponentialRampToValueAtTime(fe, this.c.currentTime + d + dur);
    os.type = t; g.gain.setValueAtTime(vol * this.v, this.c.currentTime + d);
    g.gain.exponentialRampToValueAtTime(.001, this.c.currentTime + d + dur);
    os.start(this.c.currentTime + d); os.stop(this.c.currentTime + d + dur);
  }
  step() { this.o(180 + Math.random() * 40, "sine", .05, .04); }
  gemMatch(combo = 0) { this.o(800 + combo * 150, "triangle", .08 + combo * .03, .1); this.o(1000 + combo * 150, "triangle", .06, .1, .06); }
  hit() { this.o(120, "sawtooth", .15, .2, 0, 40); }
  victory() { [523, 659, 784, 1047].forEach((f, i) => this.o(f, "square", .10, .3, i * .12)); }
  defeat() { this.o(400, "sawtooth", .12, .5, 0, 100); }
  click() { this.o(600, "square", .08, .03); }
  open() { this.o(300, "sine", .06, .15, 0, 600); }
  close() { this.o(600, "sine", .06, .15, 0, 300); }
  teleport() { this.o(300, "sine", .08, .4, 0, 2000); this.o(600, "triangle", .06, .3, .1, 1200); }
  craft() { [800, 1000, 1200, 1600].forEach((f, i) => this.o(f, "triangle", .10, .12, i * .08)); }
  equip() { this.o(1000, "triangle", .08, .1); this.o(1500, "triangle", .06, .1, .05); }
  lvlUp() { this.o(400, "sine", .12, .5, 0, 1200); }
  harvest() { this.o(523, "triangle", .12, .08); this.o(784, "triangle", .12, .08, .08); }
  locked() { this.o(200, "square", .10, .15); this.o(150, "square", .10, .15, .1); }
  unlock() { [523, 659, 784].forEach((f, i) => this.o(f, "triangle", .08, .2, i * .1)); }
  ko() { this.o(200, "sawtooth", .12, .8, 0, 50); }
  playMusic(id: string) {
    if (this.cur === id) return; this.stopMusic(); this.cur = id;
    try { this.a = new Audio(`/music/${id}.mp3`); this.a.loop = true; this.a.volume = this.v * .4; this.a.play().catch(() => {}); } catch {}
  }
  stopMusic() { if (this.a) { this.a.pause(); this.a = null; } this.cur = ""; }
}
export const sounds = new S();
