/* SpaceCat — efectos de sonido sencillos generados con WebAudio (sin archivos).
 * Más adelante se pueden reemplazar por tus propios audios en assets/audio/. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};

  var ctx = null;
  var muted = false;

  function ensure() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    var c = ctx;
    var o = c.createOscillator();
    var g = c.createGain();
    var t0 = c.currentTime + start;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  var SOUNDS = {
    jump: function () { tone(360, 0, 0.14, 'sine', 0.05, 640); },
    star: function () { tone(880, 0, 0.09, 'triangle', 0.05); tone(1320, 0.07, 0.15, 'triangle', 0.05); },
    hurt: function () { tone(260, 0, 0.30, 'triangle', 0.07, 110); },
    check: function () { tone(660, 0, 0.12, 'sine', 0.05); tone(990, 0.10, 0.22, 'sine', 0.05); },
    start: function () { tone(523, 0, 0.10, 'sine', 0.05); tone(784, 0.09, 0.18, 'sine', 0.05); },
    win: function () {
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) tone(notes[i], i * 0.12, 0.32, 'triangle', 0.055);
    }
  };

  SC.Sfx = {
    play: function (name) {
      if (muted) return;
      var c = ensure();
      if (!c) return;
      if (c.state === 'suspended' && c.resume) c.resume();
      var s = SOUNDS[name];
      if (s) { try { s(); } catch (e) { /* el audio nunca debe romper el juego */ } }
    },
    toggle: function () { muted = !muted; return muted; },
    isMuted: function () { return muted; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
