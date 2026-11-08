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
        for (var i = 0; i < btns.length; i++) bindButton(btns[i]);
        var pb = doc.getElementById('pauseBtn');
        if (pb) {
          pb.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            Input.pausePressed = true;
          });
        }
      }
    },

    // Se llama una vez al inicio de cada frame.
    poll: function () {
      Input.left = !!(keys.ArrowLeft || keys.KeyA || touch.left);
      Input.right = !!(keys.ArrowRight || keys.KeyD || touch.right);
      Input.jump = !!(keys.ArrowUp || keys.KeyW || keys.Space || touch.jump);
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
    if (KEYMAP[code] === 'jump') Input.jumpPressed = true;
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

  function bindButton(btn) {
    var action = btn.getAttribute('data-action');
    function on(e) {
      e.preventDefault();
      touch[action] = true;
      btn.classList.add('active');
      if (action === 'jump') Input.jumpPressed = true;
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
