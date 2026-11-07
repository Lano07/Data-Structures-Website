/* COMP 2611 Code Lab — appearance settings: theme, text size and motion. Applied before the first page is drawn. */
(function (CL) {
  "use strict";
  var KEY = "comp2611-prefs-v1";
  var P = { theme: "system", size: 100, motion: "system", tutorMode: "guide" };
  try { var s = localStorage.getItem(KEY); if (s) Object.assign(P, JSON.parse(s)); } catch (e) { /* storage unavailable */ }
  var SIZES = [90, 100, 112.5, 125, 137.5];
  if (SIZES.indexOf(+P.size) < 0) P.size = 100;
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function apply() {
    var root = document.documentElement;
    if (P.theme === "light" || P.theme === "dark") root.setAttribute("data-theme", P.theme);
    else root.removeAttribute("data-theme");
    root.style.fontSize = P.size + "%";
    var reduce = P.motion === "reduce" || (P.motion === "system" && mq && mq.matches);
    root.classList.toggle("reduce-motion", !!reduce);
    CL.reduceMotion = !!reduce;
    // the code editor lays its text over a highlighted copy, so its line height must track the text size exactly
    CL.edLineH = Math.round(20 * P.size / 100);
    root.style.setProperty("--ed-lh", CL.edLineH + "px");
  }
  CL.prefs = P;
  CL.TEXT_SIZES = SIZES;
  CL.setPref = function (k, v) {
    P[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ }
    apply();
    if (CL.onPrefs) CL.onPrefs(k, v);
  };
  if (mq && mq.addEventListener) mq.addEventListener("change", apply);
  // with reduced motion on, scrolling jumps instead of gliding, wherever the page asks for a smooth scroll
  var sIV = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (o) {
    if (CL.reduceMotion && o && typeof o === "object") o = Object.assign({}, o, { behavior: "auto" });
    return sIV.call(this, o);
  };
  var sTo = window.scrollTo;
  window.scrollTo = function (a, b) {
    if (CL.reduceMotion && a && typeof a === "object") a = Object.assign({}, a, { behavior: "auto" });
    return b === undefined ? sTo.call(window, a) : sTo.call(window, a, b);
  };
  apply();
})(CL);
