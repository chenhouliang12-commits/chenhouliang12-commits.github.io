/* ============================================================
   audio.js —— 用 WebAudio 合成音效，不依赖任何音频文件
   所有方法都做 try/catch，音频不可用时静默降级。
   ============================================================ */
(function () {
  'use strict';

  class AudioSys {
    constructor() {
      this.ctx = null;
      this.enabled = true;      // 音效总开关（由设置控制）
      this.ambientOn = false;   // 环境氛围音（默认关）
      this.ambientNodes = null;
      this.unlocked = false;
    }

    _ensure() {
      if (this.ctx) return true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        return true;
      } catch (e) {
        return false;
      }
    }

    // 在用户首次手势时解锁
    unlock() {
      if (!this._ensure()) return;
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch (e) {}
      }
      this.unlocked = true;
    }

    _tone(freq, dur, type, gainVal, when) {
      if (!this.enabled || !this._ensure()) return;
      try {
        const t0 = (when || this.ctx.currentTime);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gainVal || 0.15, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      } catch (e) {}
    }

    click()   { this._tone(520, 0.06, 'triangle', 0.08); }
    pickup()  { this._tone(660, 0.09, 'sine', 0.12); this._tone(880, 0.14, 'sine', 0.10, this.ctx ? this.ctx.currentTime + 0.06 : 0); }
    combine() { this._tone(440, 0.08, 'square', 0.07); this._tone(587, 0.1, 'square', 0.07, this.ctx ? this.ctx.currentTime + 0.07 : 0); }
    unlock()  { this._tone(523, 0.1, 'sine', 0.14); this._tone(659, 0.1, 'sine', 0.14, this.ctx ? this.ctx.currentTime + 0.09 : 0); this._tone(784, 0.18, 'sine', 0.14, this.ctx ? this.ctx.currentTime + 0.18 : 0); }
    error()   { this._tone(220, 0.12, 'sawtooth', 0.06); this._tone(180, 0.14, 'sawtooth', 0.06, this.ctx ? this.ctx.currentTime + 0.09 : 0); }
    step()    { this._tone(700, 0.05, 'triangle', 0.06); }
    win() {
      const notes = [523, 659, 784, 1047, 784, 1047];
      const now = this.ctx ? this.ctx.currentTime : 0;
      notes.forEach((f, i) => this._tone(f, 0.22, 'sine', 0.14, now + i * 0.14));
    }

    ambientStart() {
      if (!this._ensure() || this.ambientOn) return;
      try {
        const ctx = this.ctx;
        const t0 = ctx.currentTime;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.035, t0 + 2.5);

        // 低沉的底噪 + 缓慢呼吸的滤波
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 55;
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 110;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 240;
        filter.Q.value = 0.6;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.08;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 120;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        osc.start(); osc2.start(); lfo.start();

        this.ambientNodes = { g, osc, osc2, filter, lfo, lfoGain };
        this.ambientOn = true;
      } catch (e) {}
    }

    ambientStop() {
      if (!this.ctx || !this.ambientNodes) { this.ambientOn = false; return; }
      try {
        const n = this.ambientNodes;
        const t0 = this.ctx.currentTime;
        n.g.gain.cancelScheduledValues(t0);
        n.g.gain.setValueAtTime(n.g.gain.value || 0.03, t0);
        n.g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
        setTimeout(() => {
          try { n.osc.stop(); n.osc2.stop(); n.lfo.stop(); } catch (e) {}
        }, 1400);
      } catch (e) {}
      this.ambientNodes = null;
      this.ambientOn = false;
    }

    setEnabled(v) { this.enabled = !!v; }
    setAmbient(v) { if (v) { this.ambientStart(); } else { this.ambientStop(); } }
  }

  window.AudioFX = new AudioSys();
  window.AudioSys = AudioSys;
})();