/* COMP 2611 Code Lab — effects: synthesized sound, pixel confetti, floating text and celebration overlays.
   Everything here is decoration: it respects reduced motion, pauses when the tab is hidden, and never blocks the page. */
(function (CL) {
  "use strict";
  var FX = CL.FX = {};
  var esc = CL.esc;
  function reduce() { return !!CL.reduceMotion; }
  FX.PALETTE = ["#ffd23f", "#5b8ff5", "#5fd38d", "#ff6b6b", "#f78fb3", "#4fd1c5"];

  // ---------------------------------------------------------------- where the last tap was (floating text starts there)
  var lastPt = { x: 0, y: 0, t: 0 };
  document.addEventListener("pointerdown", function (e) { lastPt = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  FX.point = function () {
    if (Date.now() - lastPt.t < 6000) return { x: lastPt.x, y: lastPt.y };
    return { x: window.innerWidth / 2, y: Math.min(180, window.innerHeight / 3) };
  };

  // ---------------------------------------------------------------- sound: tiny synthesized blips, no audio files
  var actx = null, master = null;
  FX.soundOn = function () { return !(CL.store && CL.store.g && CL.store.g.sound === false); };
  function ctx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { actx = new AC(); } catch (e) { return null; }
      master = actx.createGain();
      master.gain.value = 0.085;
      master.connect(actx.destination);
    }
    if (actx.state === "suspended") { try { actx.resume(); } catch (e) { /* needs a gesture */ } }
    return actx;
  }
  function tone(f, t0, dur, type, vol, slideTo) {
    var c = ctx();
    if (!c) return;
    var now = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f, now);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol || 0.8, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(master);
    o.start(now);
    o.stop(now + dur + 0.03);
  }
  var SFX = {
    right: function (combo) { var b = 620 * Math.pow(1.0595, Math.min(combo || 0, 14)); tone(b, 0, 0.09, "triangle", 0.9); tone(b * 1.4983, 0.07, 0.16, "triangle", 0.75); },
    wrong: function () { tone(210, 0, 0.2, "sawtooth", 0.3, 120); },
    soft: function () { tone(520, 0, 0.06, "sine", 0.4); },
    level: function () { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { tone(f, i * 0.085, 0.22, "triangle", 0.8); }); tone(1567.98, 0.47, 0.6, "sine", 0.6); },
    ach: function () { [987.77, 1318.5, 1760].forEach(function (f, i) { tone(f, i * 0.07, 0.2, "sine", 0.7); }); },
    click: function () { tone(880, 0, 0.035, "square", 0.18); },
    tick: function () { tone(1250, 0, 0.025, "square", 0.14); },
    pop: function (k) { tone(400 + 90 * (k || 0), 0, 0.07, "triangle", 0.55, 900 + 90 * (k || 0)); },
    over: function () { [392, 329.63, 261.63, 196].forEach(function (f, i) { tone(f, i * 0.13, 0.22, "triangle", 0.6); }); },
    chest: function () { [523.25, 783.99, 1046.5, 1567.98, 2093].forEach(function (f, i) { tone(f, i * 0.06, 0.28, "triangle", 0.7); }); },
    go: function () { tone(440, 0, 0.12, "square", 0.25); tone(440, 0.25, 0.12, "square", 0.25); tone(880, 0.5, 0.3, "square", 0.3); }
  };
  var BUZZ = { right: 12, wrong: [40, 30, 40], level: [30, 40, 30, 40, 80], ach: [20, 30, 20], chest: [20, 20, 20, 20, 60], over: [60] };
  FX.sfx = function (name, arg) {
    if (!FX.soundOn() || !SFX[name]) return;
    try { SFX[name](arg); } catch (e) { /* audio is optional */ }
    // a short buzz on phones that support it (it follows the same sound switch)
    if (BUZZ[name] && navigator.vibrate) { try { navigator.vibrate(BUZZ[name]); } catch (e) { /* not allowed yet */ } }
  };

  // ---------------------------------------------------------------- confetti: one shared canvas, created on demand
  var cv = null, cx = null, parts = [], raf = 0;
  function ensureCanvas() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.className = "fx-confetti";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    cx = cv.getContext("2d");
    size();
  }
  function size() {
    if (!cv) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = window.innerWidth * dpr;
    cv.height = window.innerHeight * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", size);
  function frame() {
    raf = 0;
    if (!cx) return;
    cx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < window.innerHeight + 40; });
    parts.forEach(function (p) {
      p.vy += p.g;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      cx.save();
      cx.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
      cx.translate(p.x, p.y);
      cx.rotate(Math.round(p.rot / (Math.PI / 2)) * (Math.PI / 2));
      cx.fillStyle = p.c;
      // square pixels, two sizes
      var z = p.shape === 0 ? 8 : 5;
      cx.fillRect(-z / 2, -z / 2, z, z);
      cx.restore();
    });
    if (parts.length) raf = requestAnimationFrame(frame);
    else cx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
  // burst(x, y, n, {spread, power, colors, up})
  FX.burst = function (x, y, n, o) {
    if (reduce()) return;
    o = o || {};
    ensureCanvas();
    var cols = o.colors || FX.PALETTE, spread = o.spread || Math.PI * 2, power = o.power || 7, base = o.up ? -Math.PI / 2 : 0;
    for (var i = 0; i < (n || 40); i++) {
      var a = base + (o.up ? (Math.random() - 0.5) * spread : Math.random() * spread), v = power * (0.45 + Math.random() * 0.75);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up ? 0 : 2), g: 0.16 + Math.random() * 0.08, s: 6 + Math.random() * 7,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length], life: 70 + Math.random() * 50, shape: i % 3 });
    }
    if (!raf) raf = requestAnimationFrame(frame);
  };
  // a celebration across the whole screen: bursts from both lower corners and the middle
  FX.celebrate = function (big) {
    if (reduce()) return;
    var w = window.innerWidth, h = window.innerHeight;
    FX.burst(w * 0.12, h * 0.9, big ? 70 : 40, { up: true, spread: 1.1, power: big ? 17 : 14 });
    FX.burst(w * 0.88, h * 0.9, big ? 70 : 40, { up: true, spread: 1.1, power: big ? 17 : 14 });
    if (big) setTimeout(function () { FX.burst(w / 2, h * 0.35, 90, { power: 10 }); }, 250);
  };

  // ---------------------------------------------------------------- floating text (+15 XP, COMBO x5 ...)
  FX.float = function (html, cls, x, y) {
    var pt = x === undefined ? FX.point() : { x: x, y: y };
    var el = document.createElement("div");
    el.className = "fx-float " + (cls || "");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = html;
    el.style.left = Math.max(40, Math.min(window.innerWidth - 40, pt.x)) + "px";
    el.style.top = Math.max(60, pt.y - 10) + "px";
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1500);
    return el;
  };

  // ---------------------------------------------------------------- toasts that stack in the corner (achievements, quests)
  var stack = null;
  FX.toast = function (html, cls, ms) {
    if (!stack) { stack = document.createElement("div"); stack.className = "fx-toasts"; stack.setAttribute("role", "status"); stack.setAttribute("aria-live", "polite"); document.body.appendChild(stack); }
    var el = document.createElement("div");
    el.className = "fx-toast " + (cls || "");
    el.innerHTML = html;
    stack.appendChild(el);
    var gone = false;
    function close() { if (gone) return; gone = true; el.classList.add("out"); setTimeout(function () { el.remove(); }, 400); }
    el.addEventListener("click", close);
    setTimeout(close, ms || 4800);
    return el;
  };

  // ---------------------------------------------------------------- a full-screen celebration card (level up, chest opened)
  FX.overlay = function (html, o) {
    o = o || {};
    var ov = document.createElement("div");
    ov.className = "fx-overlay " + (o.cls || "");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", o.label || "Celebration");
    ov.innerHTML = '<div class="fx-rays" aria-hidden="true"></div><div class="fx-card">' + html + '<button type="button" class="btn primary fx-ok">' + esc(o.button || "Keep going") + "</button></div>";
    document.body.appendChild(ov);
    var prev = document.activeElement;
    var ok = ov.querySelector(".fx-ok");
    function close() {
      if (!ov.parentNode) return;
      ov.classList.add("out");
      document.removeEventListener("keydown", key);
      setTimeout(function () { ov.remove(); if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) { /* gone */ } } }, 300);
      if (o.onClose) o.onClose();
    }
    function key(e) { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); close(); } }
    ok.addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", key);
    setTimeout(function () { try { ok.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50);
    if (o.ms) setTimeout(close, o.ms);
    return { el: ov, close: close };
  };

  // ---------------------------------------------------------------- count a number up (for scores and XP)
  FX.countUp = function (el, from, to, ms) {
    if (reduce() || !el) { if (el) el.textContent = to.toLocaleString(); return; }
    var t0 = performance.now();
    function step(t) {
      var k = Math.min(1, (t - t0) / (ms || 700)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString();
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

})(CL);
