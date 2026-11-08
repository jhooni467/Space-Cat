/* SpaceCat — entrada: teclado + botones táctiles. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};

  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump'
  };
  var keys = {};
  var touch = { left: false, right: false, jump: false };
  var jumpLatch = 0; // instante hasta el que un toque cuenta como "salto mantenido"
  function now() { return global.performance ? global.performance.now() : Date.now(); }
  function pressJump() { Input.jumpPressed = true; jumpLatch = now() + SC.CONFIG.JUMP_LATCH * 1000; }

  var Input = SC.Input = {
    left: false,
    right: false,
    jump: false,            // salto mantenido
    jumpPressed: false,     // salto recién pulsado (solo ese frame)
    actionPressed: false,   // Enter / Espacio / toque: empezar, continuar
    pausePressed: false,
    mutePressed: false,

    init: function (canvas) {
      global.addEventListener('keydown', onKeyDown);
      global.addEventListener('keyup', onKeyUp);
      global.addEventListener('blur', releaseAll);
      if (canvas && canvas.addEventListener) {
        canvas.addEventListener('pointerdown', function () { Input.actionPressed = true; });
      }
      var doc = global.document;
      if (doc && doc.querySelectorAll) {
        var btns = doc.querySelectorAll('[data-action]');
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].getAttribute('data-action') === 'jump') bindButton(btns[i]);
        }
        var dpad = doc.querySelector('#touch .pad');
        if (dpad) bindDpad(dpad);
        // Evita el menú de pulsación larga de Android, que cancela el botón mantenido.
        doc.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        var pb = doc.getElementById('pauseBtn');
        if (pb) {
          pb.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            Input.pausePressed = true;
          });
        }
      }
    },

    releaseAll: function () { releaseAll(); },

    // Se llama una vez al inicio de cada frame.
    poll: function () {
      Input.left = !!(keys.ArrowLeft || keys.KeyA || touch.left);
      Input.right = !!(keys.ArrowRight || keys.KeyD || touch.right);
      Input.jump = !!(keys.ArrowUp || keys.KeyW || keys.Space || touch.jump) || now() < jumpLatch;
    },

    // Se llama al final de cada frame: borra los "recién pulsado".
    endFrame: function () {
      Input.jumpPressed = false;
      Input.actionPressed = false;
      Input.pausePressed = false;
      Input.mutePressed = false;
    }
  };

  function codeOf(e) {
    if (e.code) return e.code;
    return e.key === ' ' ? 'Space' : e.key;
  }

  function onKeyDown(e) {
    var code = codeOf(e);
    var handled = KEYMAP[code] || code === 'Enter' || code === 'Escape' || code === 'KeyP' || code === 'KeyM';
    if (handled && e.preventDefault) e.preventDefault();
    if (e.repeat) return;
    keys[code] = true;
    if (KEYMAP[code] === 'jump') pressJump();
    if (code === 'Enter' || code === 'Space') Input.actionPressed = true;
    if (code === 'Escape' || code === 'KeyP') Input.pausePressed = true;
    if (code === 'KeyM') Input.mutePressed = true;
  }

  function onKeyUp(e) {
    keys[codeOf(e)] = false;
  }

  function releaseAll() {
    keys = {};
    touch.left = touch.right = touch.jump = false;
  }

  // Cruceta ◀ ▶: un solo dedo; puedes deslizarlo de un lado a otro sin soltar.
  function bindDpad(pad) {
    var pid = null;
    var btnL = pad.querySelector('[data-action=left]');
    var btnR = pad.querySelector('[data-action=right]');
    function apply(e) {
      var r = pad.getBoundingClientRect();
      var left = (e.clientX - r.left) < r.width / 2;
      touch.left = left; touch.right = !left;
      btnL.classList.toggle('active', left);
      btnR.classList.toggle('active', !left);
    }
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      touch.left = touch.right = false;
      btnL.classList.remove('active'); btnR.classList.remove('active');
    }
    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (pid !== null) return;
      pid = e.pointerId;
      try { pad.setPointerCapture(pid); } catch (err) { /* sin captura, no pasa nada */ }
      Input.actionPressed = true;
      apply(e);
    });
    pad.addEventListener('pointermove', function (e) { if (e.pointerId === pid) apply(e); });
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('lostpointercapture', end);
  }

  function bindButton(btn) {
    var action = btn.getAttribute('data-action');
    function on(e) {
      e.preventDefault();
      touch[action] = true;
      btn.classList.add('active');
      if (action === 'jump') pressJump();
      Input.actionPressed = true;
      if (btn.setPointerCapture && e.pointerId !== undefined) {
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* sin captura, no pasa nada */ }
      }
    }
    function off() {
      touch[action] = false;
      btn.classList.remove('active');
    }
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('lostpointercapture', off);
  }
})(typeof window !== 'undefined' ? window : globalThis);
