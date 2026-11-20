// Synthetische Klänge über die WebAudio-API (keine Audiodateien nötig).

export class Sound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.startWind();
  }

  startWind() {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 380;
    this.windGain = c.createGain();
    this.windGain.gain.value = 0.05;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain).connect(this.windGain.gain);
    src.connect(f).connect(this.windGain).connect(this.master);
    src.start();
    lfo.start();
  }

  tone(type, f0, f1, dur, vol = 0.2, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  burst(filterType, freq, dur, vol = 0.3, delay = 0, q = 1) {
    const c = this.ctx, t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  play(name) {
    if (!this.ctx || !this.enabled) return;
    switch (name) {
      case 'chop': this.burst('bandpass', 700, 0.14, 0.5, 0, 2); this.tone('sine', 140, 60, 0.12, 0.35); break;
      case 'mine': this.burst('highpass', 2500, 0.1, 0.35); this.tone('square', 900, 700, 0.06, 0.06); break;
      case 'hit': this.tone('sine', 160, 50, 0.15, 0.4); this.burst('lowpass', 500, 0.1, 0.3); break;
      case 'swing': this.burst('bandpass', 1200, 0.15, 0.12, 0, 0.8); break;
      case 'pickup': this.tone('sine', 520, 880, 0.12, 0.15); break;
      case 'craft': this.tone('triangle', 440, 440, 0.1, 0.15); this.tone('triangle', 660, 660, 0.15, 0.15, 0.1); break;
      case 'eat': for (let i = 0; i < 3; i++) this.burst('lowpass', 900, 0.07, 0.3, i * 0.12); break;
      case 'drink': for (let i = 0; i < 3; i++) this.tone('sine', 300 + i * 80, 600 + i * 80, 0.08, 0.12, i * 0.12); break;
      case 'hurt': this.tone('sawtooth', 220, 80, 0.25, 0.2); break;
      case 'growl': this.tone('sawtooth', 90, 70, 0.4, 0.12); this.burst('lowpass', 300, 0.35, 0.2); break;
      case 'fall': this.burst('lowpass', 250, 0.6, 0.6); this.tone('sine', 80, 35, 0.5, 0.4, 0.05); break;
      case 'place': this.tone('sine', 200, 120, 0.15, 0.3); this.burst('lowpass', 600, 0.1, 0.2); break;
      case 'bow': this.tone('triangle', 320, 140, 0.18, 0.25); this.burst('bandpass', 2000, 0.08, 0.15, 0, 1.5); break;
      case 'splash': this.burst('lowpass', 1400, 0.35, 0.35); this.tone('sine', 500, 200, 0.15, 0.08); break;
      case 'sizzle': this.burst('highpass', 3000, 0.6, 0.18); break;
      case 'fire': this.burst('highpass', 1800 + Math.random() * 2000, 0.03, 0.08 + Math.random() * 0.08); break;
      case 'chirp': {
        const base = 2500 + Math.random() * 1500;
        const n = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) this.tone('sine', base, base * (1.2 + Math.random() * 0.4), 0.07, 0.04, i * 0.11);
        break;
      }
      case 'cricket': for (let i = 0; i < 3; i++) this.tone('square', 4400, 4300, 0.03, 0.012, i * 0.06); break;
      case 'howl': {
        const c = this.ctx, t = c.currentTime;
        const o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(380, t);
        o.frequency.linearRampToValueAtTime(620, t + 0.8);
        o.frequency.linearRampToValueAtTime(560, t + 2.0);
        o.frequency.linearRampToValueAtTime(420, t + 2.8);
        v.frequency.value = 5; vg.gain.value = 8;
        v.connect(vg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.9);
        o.connect(g).connect(this.master);
        o.start(t); v.start(t); o.stop(t + 3); v.stop(t + 3);
        break;
      }
    }
  }
}
