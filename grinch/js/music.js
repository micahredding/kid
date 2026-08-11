// =============================================================================
// MUSIC — WebAudio: an original sneaky pizzicato loop plus tiny sound effects.
// (An original tune in the *mood* of the special — minor key, tiptoe bass —
//  not the copyrighted song.)
//
// Everything no-ops gracefully when AudioContext is unavailable (headless
// tests) or until the first user gesture starts it.
// =============================================================================

const E2 = 82.41;
const SEMI = Math.pow(2, 1 / 12);
const note = (n) => E2 * Math.pow(SEMI, n); // semitones above E2

// 16-step tiptoe bassline in E minor, with a chromatic creep at the turnaround
const BASS = [0, null, 7, null, 3, null, 7, null, 0, null, 7, null, 10, 9, 8, 7];
// sparse plucked melody two octaves up, answering the bass
const PLUCK = [null, 12, null, null, null, 15, null, 14, null, 12, null, null, 19, null, 15, null];

export class Music {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.playing = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.tempo = 96; // bpm, eighth-note steps
  }

  _ensureContext() {
    if (this.ctx) return true;
    try {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  start() {
    if (!this._ensureContext()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this._schedule(), 60);
  }

  stop() {
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
  }

  _schedule() {
    if (!this.playing || !this.ctx) return;
    const stepDur = 60 / this.tempo / 2; // eighth notes
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      const s = this.step % 16;
      const bass = BASS[s];
      if (bass != null) {
        this._pluck(note(bass), this.nextTime, 0.22, 'triangle', 0.5);
      }
      const high = PLUCK[s];
      if (high != null && Math.floor(this.step / 16) % 2 === 1) {
        this._pluck(note(high + 12), this.nextTime, 0.15, 'square', 0.12);
      }
      this.nextTime += stepDur;
      this.step++;
    }
  }

  _pluck(freq, when, dur, type, gain) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    if (name === 'pop') {
      // collecting a present: quick upward blip
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note(24), t);
      osc.frequency.exponentialRampToValueAtTime(note(31), t + 0.08);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(g); g.connect(this.master);
      osc.start(t); osc.stop(t + 0.14);
    } else if (name === 'chime') {
      // a house lights up: warm bell arpeggio
      [0, 4, 7, 12].forEach((n, i) => {
        this._pluck(note(n + 24), t + i * 0.09, 0.5, 'sine', 0.22);
      });
    } else if (name === 'fanfare') {
      [0, 7, 12].forEach((n, i) => {
        this._pluck(note(n + 12), t + i * 0.12, 0.4, 'triangle', 0.3);
      });
    }
  }
}
