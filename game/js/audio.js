// Ember & Oak — synthesized sound effects (WebAudio, no audio files).
// Every sound is an oscillator or filtered noise burst built at run time.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzle = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  blip(freq, dur, type, vol, slideTo) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, vol, filterFreq) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq || 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
  }

  click() { this.blip(660, 0.06, 'square', 0.05); }
  pickup() { this.blip(420, 0.08, 'triangle', 0.09, 640); }
  place() { this.blip(300, 0.09, 'triangle', 0.09, 210); }
  chop() { this.noise(0.09, 0.22, 900); this.blip(180, 0.07, 'square', 0.08, 120); }
  chopPerfect() { this.chop(); this.blip(880, 0.12, 'sine', 0.1, 1320); }
  ding() { this.blip(880, 0.35, 'sine', 0.12); this.blip(1320, 0.3, 'sine', 0.07); }
  serve() { this.ding(); }
  coin() { this.blip(990, 0.1, 'sine', 0.1, 1480); }
  error() { this.blip(160, 0.18, 'sawtooth', 0.09, 110); }
  burn() { this.noise(0.4, 0.18, 500); this.blip(220, 0.4, 'sawtooth', 0.07, 90); }
  leave() { this.blip(330, 0.25, 'triangle', 0.08, 180); }
  rush() { this.blip(520, 0.12, 'square', 0.08, 780); this.blip(780, 0.12, 'square', 0.08, 1040); }
  wood() { this.noise(0.15, 0.14, 700); }
  vent() { this.noise(0.35, 0.1, 2400); }

  startSizzle() {
    if (this.muted || this.sizzle) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 4200;
    f.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.015;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start();
    this.sizzle = { src, g };
  }

  stopSizzle() {
    if (!this.sizzle) return;
    try { this.sizzle.src.stop(); } catch (e) { /* already stopped */ }
    this.sizzle = null;
  }

  setSizzleLevel(level) {
    if (this.sizzle) this.sizzle.g.gain.value = 0.008 + level * 0.03;
  }
}
