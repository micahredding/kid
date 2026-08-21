// Small original WebAudio noises. Built on the first tap, because browsers will
// not let a page make sound before you touch it.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  wake() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.22;
    this.out.connect(this.ctx.destination);
  }

  tone(freq, dur, type = 'sine', slideTo = null, vol = 1) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  drop()        { this.tone(190, 0.1, 'triangle', 120, 0.7); }

  // Each rung up the ladder pops a note higher, so the ladder is audible.
  merge(tier)   { const f = 320 * Math.pow(1.09, tier); this.tone(f, 0.16, 'sine', f * 1.6, 0.9); }

  land(force)   { this.tone(90 + force * 40, 0.07, 'triangle', 60, Math.min(0.5, 0.15 + force * 0.3)); }

  chain(n)      { this.tone(520 + n * 90, 0.13, 'square', null, 0.35); }

  newFruit()    { [0, 0.09, 0.18].forEach((d, i) => setTimeout(() => this.tone(520 * Math.pow(1.26, i), 0.16, 'sine', null, 0.5), d * 1000)); }

  fanfare() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.34, 'sine', null, 0.75), i * 110));
  }

  gameover()    { [440, 370, 294, 220].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', null, 0.55), i * 150)); }
}
