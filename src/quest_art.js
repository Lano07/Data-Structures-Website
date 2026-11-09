/* COMP 2611 Code Lab — Quest art: 16-bit sprites drawn from text grids (each letter is a palette colour; outlines are
   added automatically), and pixel landscapes painted on a small canvas and scaled up with crisp edges. */
(function (CL) {
  "use strict";
  var A = CL.QArt = {};

  var PAL = {
    k: "#1a1423", w: "#ffffff", s: "#f1c27d", S: "#d29a5f", d: "#a0673a", D: "#6e4021", h: "#7a4b23", H: "#4a2b12",
    a: "#2a1a10", y: "#ffd23f", Y: "#d99a1e", r: "#e63946", R: "#9d1c27", g: "#43aa5b", G: "#2b7a3e", l: "#9be564",
    b: "#3d7dd8", B: "#24497f", c: "#5ce1e6", C: "#2a9fa6", p: "#9b5de5", P: "#5e2e8f", o: "#f77f00", O: "#b45309",
    n: "#8a8fa3", N: "#4a4e69", e: "#e6e6ee", E: "#b8b8c8", t: "#c9a26b", T: "#8a6a3a", m: "#ff8fab", z: "#141414"
  };
  A.PAL = PAL;

  // fill-only drawings (16 x 16); outlines are drawn around them by outline()
  var SPR = {
    you: [
      "................",
      "................",
      ".....hhhhhh.....",
      "....hhhhhhhh....",
      "....HHHHHHHH....",
      "..hhhhhhhhhhhh..",
      "....aassssaa....",
      "....assssssa....",
      "....swzsszws....",
      "....ssssSsss....",
      "....sssrrsss....",
      ".....ssssss.....",
      "......SSSS......",
      "...tttrRRrttt...",
      "..tttttRRttttt..",
      "..ttTtttttttTt.."
    ],
    marco: [
      "................",
      ".....wwwwww.....",
      "....wwwwwwww....",
      "....wwwyywww....",
      "....bbbbbbbb....",
      "...BBBBBBBBBB...",
      "....dddddddd....",
      "....dwzddzwd....",
      "....ddddDddd....",
      "....aaddddaa....",
      "....aaarraaa....",
      ".....aaaaaa.....",
      "......aaaa......",
      "...BBBBwwBBBB...",
      "..BBBBBwwBBBBB..",
      "..BByBBwwBByBB.."
    ],
    pip: [
      "................",
      "......gggg......",
      ".....gggggg.....",
      "....ggggwwgg....",
      "....gggwzwgoo...",
      "....ggggwwgooo..",
      ".....ggggggoo...",
      "....yygggggg....",
      "...yyggggggg....",
      "...yggrrrgggg...",
      "...ggrrrrgggg...",
      "....grrrrggg....",
      ".....gggggg.....",
      "......bbbb......",
      ".......bb.......",
      "......o..o......"
    ],
    prof: [
      "......aaaa......",
      ".....aaaaaa.....",
      ".....aaaaaa.....",
      "....aaaaaaaa....",
      "...aaaSSSSaaa...",
      "...aaSSSSSSaa...",
      "...aNNNSSNNNa...",
      "...aNcwNNwcNa...",
      "...aNNNSSNNNa...",
      "....SSSSdSSS....",
      "....SSSmmSSS....",
      ".....SSSSSS.....",
      "......dddd......",
      "...ppppyyyppp...",
      "..ppppppypppppp.",
      "..pppppppppppp.."
    ],
    silas: [
      "................",
      "....eeeeeeee....",
      "...eeeeeeeeee...",
      "...eeEEEEEEee...",
      "...eEssssssEe...",
      "....ssssssss....",
      "....sNzssNzs....",
      "....ssssSsss....",
      "....ssssssss....",
      "....ssRRRRss....",
      ".....seeees.....",
      "......eeee......",
      "......SSSS......",
      "...zzzwrrwzzz...",
      "..zzzzwrrwzzzz..",
      "..zzzzzrrzzzzz.."
    ],
    narrator: [
      "................",
      "......yyyy......",
      "....yyYYYYyy....",
      "...yYYwwwwYYy...",
      "...yYwbbbbwYy...",
      "..yYwbbccbbwYy..",
      "..yYwbcwwcbwYy..",
      "..yYwbcwwcbwYy..",
      "..yYwbbccbbwYy..",
      "...yYwbbbbwYy...",
      "...yYYwwwwYYy...",
      "....yyYYYYyy....",
      "......yyyy......",
      "......TTTT......",
      ".....TTTTTT.....",
      "....TTTTTTTT...."
    ],
    heart: [
      "................",
      "................",
      "..rrrr....rrrr..",
      ".rrwwrr..rrrrrr.",
      ".rwwrrrrrrrrrrr.",
      ".rrrrrrrrrrrrrr.",
      ".rrrrrrrrrrrrRr.",
      "..rrrrrrrrrrRr..",
      "...rrrrrrrrRr...",
      "....rrrrrrRr....",
      ".....rrrrRr.....",
      "......rrRr......",
      ".......rr.......",
      "................",
      "................",
      "................"
    ],
    star: [
      "................",
      ".......y........",
      ".......y........",
      "......yyy.......",
      "......yyy.......",
      ".yyyyyywyyyyyy..",
      "..yyyyywyyyyy...",
      "...yyyyyyyyy....",
      "....yyyyyyy.....",
      "....yyyYyyy.....",
      "...yyyYYYyyy....",
      "...yyY...Yyy....",
      "..yyY.....Yyy...",
      "..yY.......Yy...",
      "................",
      "................"
    ],
    key: [
      "................",
      "................",
      "...yyyy.........",
      "..yYYYYy........",
      ".yY....Yy.......",
      ".yY....Yyyyyyyy.",
      ".yY....YyYYYYYY.",
      "..yYYYYy...yY.yY",
      "...yyyy....yY.yY",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    chest: [
      "................",
      "................",
      "...hhhhhhhhhh...",
      "..hHHHHHHHHHHh..",
      "..hHhhhhhhhhHh..",
      "..yyyyyyyyyyyy..",
      "..hhhhhyyhhhhh..",
      "..hHHHHyyHHHHh..",
      "..hhhhhhhhhhhh..",
      "..hHHHHHHHHHHh..",
      "..hhhhhhhhhhhh..",
      "..yyyyyyyyyyyy..",
      "................",
      "................",
      "................",
      "................"
    ],
    journal: [
      "................",
      "...RRRRRRRRRR...",
      "...RrrrrrrrrRw..",
      "...RryyyyyyrRw..",
      "...RrrrrrrrrRw..",
      "...RrrrrrrrrRw..",
      "...RrrrrrrrrRw..",
      "...RrryyyyrrRw..",
      "...RrryRRyrrRw..",
      "...RrryyyyrrRw..",
      "...RrrrrrrrrRw..",
      "...RrrrrrrrrRw..",
      "...RRRRRRRRRRw..",
      "....wwwwwwwwww..",
      "................",
      "................"
    ],
    relic: [
      "................",
      ".......w........",
      ".......y........",
      "...w..yyy..w....",
      "....yyyyyyy.....",
      "....ycccccy.....",
      "..wyyccwccyyw...",
      "....ycccccy.....",
      "....yyyyyyy.....",
      "...w..yyy..w....",
      ".......y........",
      ".......w........",
      "................",
      "................",
      "................",
      "................"
    ],
    compass: [
      "................",
      ".....yyyyyy.....",
      "....yYYYYYYy....",
      "...yYwwrwwwYy...",
      "..yYwwwrwwwwYy..",
      "..yYwwwrrwwwYy..",
      "..yYwwwzzwwwYy..",
      "..yYwwwwbwwwYy..",
      "..yYwwwwbwwwYy..",
      "...yYwwwwbwYy...",
      "....yYYYYYYy....",
      ".....yyyyyy.....",
      "................",
      "................",
      "................",
      "................"
    ],
    lock: [
      "................",
      ".....nnnnnn.....",
      "....nN....Nn....",
      "....n......n....",
      "....n......n....",
      "...yyyyyyyyyy...",
      "...yYYYYYYYYy...",
      "...yYYYzzYYYy...",
      "...yYYYzzYYYy...",
      "...yYYYYzYYYy...",
      "...yYYYYYYYYy...",
      "...yyyyyyyyyy...",
      "................",
      "................",
      "................",
      "................"
    ],
    gem: [
      "................",
      "................",
      ".....cccccc.....",
      "....cwwcccCc....",
      "...cwcccccCCc...",
      "..cccccccccCCc..",
      "...cccccccCCc...",
      "....cccccCCc....",
      ".....cccCCc.....",
      "......cCCc......",
      ".......cc.......",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  };
  A.SPR = SPR;
  // skin and outfit choices for the player's explorer
  A.SKINS = { a: ["#f1c27d", "#d29a5f"], b: ["#d9a066", "#b0763c"], c: ["#a0673a", "#6e4021"], d: ["#6b3e1e", "#4a2812"] };
  A.OUTFITS = { khaki: ["#c9a26b", "#8a6a3a"], teal: ["#2a9d8f", "#1c6b61"], maroon: ["#9d1c27", "#6a1018"], navy: ["#3d5a99", "#24365e"] };
  A.HATS = { brown: ["#7a4b23", "#4a2b12"], black: ["#3a3a46", "#1e1e28"], straw: ["#e0c070", "#a8883c"], red: ["#c0392b", "#7f2318"] };

  function outline(grid) {
    var H = grid.length, W = grid[0].length, out = grid.map(function (r) { return r.split(""); });
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      if (grid[y][x] !== ".") continue;
      var near = false;
      for (var dy = -1; dy <= 1 && !near; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
        var yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < H && xx >= 0 && xx < W && grid[yy][xx] !== ".") { near = true; break; }
      }
      if (near) out[y][x] = "k";
    }
    return out;
  }
  var cache = {};
  // a sprite as a data URL; opts.scale (default 4), opts.pal overrides colours, opts.flip mirrors it
  A.sprite = function (name, opts) {
    opts = opts || {};
    var scale = opts.scale || 4, key = name + "|" + scale + "|" + JSON.stringify(opts.pal || {}) + "|" + (opts.flip ? 1 : 0) + "|" + (opts.noOutline ? 1 : 0);
    if (cache[key]) return cache[key];
    var g = SPR[name] || SPR.narrator, cells = opts.noOutline ? g.map(function (r) { return r.split(""); }) : outline(g);
    var pal = Object.assign({}, PAL, opts.pal || {});
    var c = document.createElement("canvas");
    c.width = 16 * scale; c.height = 16 * scale;
    var x2 = c.getContext("2d");
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var ch = cells[y][opts.flip ? 15 - x : x];
      if (ch === "." || !pal[ch]) continue;
      x2.fillStyle = pal[ch];
      x2.fillRect(x * scale, y * scale, scale, scale);
    }
    try { cache[key] = c.toDataURL(); } catch (e) { cache[key] = ""; }
    return cache[key];
  };
  A.img = function (name, opts, alt) {
    var o = opts || {};
    return '<img class="px-spr" src="' + A.sprite(name, o) + '" width="' + 16 * (o.scale || 4) + '" height="' + 16 * (o.scale || 4) + '" alt="' + (alt || "") + '"' + (alt ? "" : ' aria-hidden="true"') + ">";
  };
  // the player's look (saved in the quest progress)
  A.youPal = function (look) {
    look = look || {};
    var sk = A.SKINS[look.skin] || A.SKINS.b, of = A.OUTFITS[look.outfit] || A.OUTFITS.khaki, ht = A.HATS[look.hat] || A.HATS.brown;
    return { s: sk[0], S: sk[1], t: of[0], T: of[1], h: ht[0], H: ht[1] };
  };

  // ---------------------------------------------------------------- pixel landscapes (192 x 96, scaled up)
  var W = 192, H = 96;
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function P(c) {
    var x = c.getContext("2d");
    return {
      x: x,
      rect: function (a, b, w, h, col) { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); },
      px: function (a, b, col) { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), 1, 1); }
    };
  }
  // sky in bands, dithered where two bands meet
  function sky(p, cols) {
    var band = H / cols.length;
    cols.forEach(function (col, i) { p.rect(0, i * band, W, band + 1, col); });
    for (var i = 1; i < cols.length; i++) {
      var y0 = Math.round(i * band);
      for (var x = 0; x < W; x += 2) { p.px(x + (i % 2), y0 - 1, cols[i]); p.px(x + 1 - (i % 2), y0, cols[i - 1]); }
    }
  }
  function disc(p, cx, cy, r, col) { for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) p.px(cx + x, cy + y, col); }
  function stars(p, n, col, seed, maxY) { var R = rng(seed); for (var i = 0; i < n; i++) p.px(Math.floor(R() * W), Math.floor(R() * (maxY || 50)), col); }
  function ridge(p, base, peaks, col, snow) {
    // peaks: [[x, height], ...] joined by straight slopes
    for (var x = 0; x < W; x++) {
      var h = 0;
      peaks.forEach(function (pk) { var hh = pk[1] - Math.abs(x - pk[0]) * (pk[2] || 0.9); if (hh > h) h = hh; });
      if (h <= 0) continue;
      p.rect(x, base - h, 1, h + 1, col);
      if (snow) peaks.forEach(function (pk) { var hh = pk[1] - Math.abs(x - pk[0]) * (pk[2] || 0.9); if (hh > pk[1] - 7 && hh >= h - 0.5) p.rect(x, base - h, 1, Math.min(4, hh - (pk[1] - 7)), snow); });
    }
  }
  function sea(p, y, a, b, seed) {
    p.rect(0, y, W, H - y, a);
    var R = rng(seed || 7);
    for (var r = y + 2; r < H; r += 3) for (var x = Math.floor(R() * 6); x < W; x += 6 + Math.floor(R() * 8)) p.rect(x, r, 3, 1, b);
  }
  function ground(p, y, a, b, seed) {
    p.rect(0, y, W, H - y, a);
    var R = rng(seed || 3);
    for (var i = 0; i < 70; i++) p.px(Math.floor(R() * W), y + 1 + Math.floor(R() * (H - y - 1)), b);
  }
  function palm(p, x, y, h, trunk, leaf) {
    for (var i = 0; i < h; i++) p.rect(x + Math.round(Math.sin(i / 4) * 1.5), y - i, 2, 1, trunk);
    var tx = x + Math.round(Math.sin(h / 4) * 1.5), ty = y - h;
    [[-7, 2], [-5, -1], [0, -3], [5, -1], [7, 2], [-3, 1], [3, 1]].forEach(function (d) {
      var steps = 7;
      for (var s = 0; s <= steps; s++) p.rect(tx + Math.round(d[0] * s / steps), ty + Math.round(d[1] * s / steps + (s * s) / 14), 2, 1, leaf);
    });
  }
  function stepPyramid(p, cx, base, w, steps, a, b, door) {
    var sh = 4;
    for (var i = 0; i < steps; i++) { var ww = w - i * (w / (steps + 1)); p.rect(cx - ww / 2, base - (i + 1) * sh, ww, sh, i % 2 ? a : b); }
    p.rect(cx - 3, base - steps * sh - 6, 6, 6, a);
    p.rect(cx - 1, base - steps * sh - 4, 2, 4, door || "#1a1423");
    for (var j = 0; j < steps * sh; j++) p.rect(cx - 2, base - j - 1, 4, 1, j % 2 ? b : a);
  }
  function pyramid(p, cx, base, half, a, b) { for (var i = 0; i < half; i++) { p.rect(cx - half + i, base - i, (half - i), 1, a); p.rect(cx, base - i, half - i, 1, b); } }
  function building(p, x, y, w, h, col, win, seed) {
    p.rect(x, y, w, h, col);
    var R = rng(seed || x + 1);
    for (var yy = y + 3; yy < y + h - 3; yy += 5) for (var xx = x + 2; xx < x + w - 2; xx += 4) if (R() > 0.35) p.rect(xx, yy, 2, 2, win);
  }
  function cloud(p, x, y, col) { p.rect(x, y, 16, 3, col); p.rect(x + 3, y - 2, 9, 2, col); p.rect(x + 6, y - 3, 4, 1, col); }
  function ship(p, x, y, hull, sail) {
    p.rect(x, y, 22, 3, hull); p.rect(x + 2, y + 3, 18, 2, hull);
    p.rect(x + 10, y - 16, 1, 16, "#4a2b12");
    for (var i = 0; i < 12; i++) p.rect(x + 11, y - 15 + i, Math.round(i * 0.8), 1, sail);
    for (var j = 0; j < 9; j++) p.rect(x + 9 - Math.round(j * 0.6), y - 12 + j, Math.round(j * 0.6), 1, sail);
  }
  function ceiba(p, cx, base, trunk, leaf, leaf2) {
    p.rect(cx - 4, base - 30, 8, 30, trunk);
    p.rect(cx - 8, base - 4, 16, 4, trunk);
    [[-16, -30, 13], [16, -32, 12], [0, -44, 16], [-10, -40, 11], [11, -42, 11]].forEach(function (b) { disc(p, cx + b[0], base + b[1], b[2], leaf); });
    [[-12, -36, 6], [12, -38, 5], [2, -48, 7]].forEach(function (b) { disc(p, cx + b[0], base + b[1], b[2], leaf2); });
    for (var i = 0; i < 14; i++) { p.px(cx - 4 - i, base - 30 + Math.round(i / 2), trunk); p.px(cx + 4 + i, base - 31 + Math.round(i / 2), trunk); }
  }
  function arches(p, x, y, n, w, h, col, dark) {
    for (var i = 0; i < n; i++) {
      var ax = x + i * (w + 3);
      p.rect(ax, y, w, h, col);
      p.rect(ax + 2, y + 4, w - 4, h - 4, dark);
      for (var k = 0; k < (w - 4) / 2; k++) p.rect(ax + 2 + k, y + 4 - Math.round(Math.sqrt(Math.max(0, ((w - 4) / 2) * ((w - 4) / 2) - (k - (w - 4) / 2) * (k - (w - 4) / 2))) / 2), 1, 1, dark);
    }
  }
  function gear(p, cx, cy, r, col, hole) {
    disc(p, cx, cy, r, col);
    for (var i = 0; i < 8; i++) { var t = i * Math.PI / 4; p.rect(cx + Math.round(Math.cos(t) * (r + 1)) - 1, cy + Math.round(Math.sin(t) * (r + 1)) - 1, 3, 3, col); }
    disc(p, cx, cy, Math.max(1, Math.round(r / 3)), hole);
  }
  function bridge(p, x1, x2, y, col) {
    var w = x2 - x1;
    for (var x = 0; x <= w; x++) { var t = x / w, yy = y - Math.round(Math.sin(t * Math.PI) * 6); p.rect(x1 + x, yy, 1, 2, col); if (x % 6 === 0) p.rect(x1 + x, yy, 1, y + 6 - yy, col); }
  }

  var SCENES = {
    office: function (p) {
      p.rect(0, 0, W, H, "#3b2a4f");
      for (var i = 0; i < 5; i++) { p.rect(8 + i * 18, 14, 14, 62, "#5a3b22"); for (var s = 0; s < 5; s++) { p.rect(9 + i * 18, 18 + s * 12, 12, 1, "#3a2414"); var R = rng(i * 9 + s); for (var bk = 0; bk < 4; bk++) p.rect(10 + i * 18 + bk * 3, 12 + s * 12 + Math.floor(R() * 2), 2, 6 - Math.floor(R() * 2), ["#e63946", "#3d7dd8", "#ffd23f", "#43aa5b", "#9b5de5"][(bk + s + i) % 5]); } }
      p.rect(112, 12, 66, 44, "#7dc4e4"); p.rect(112, 40, 66, 16, "#43aa5b");
      palm(p, 126, 55, 26, "#7a4b23", "#2b7a3e"); palm(p, 162, 55, 20, "#7a4b23", "#43aa5b");
      p.rect(110, 10, 70, 2, "#5a3b22"); p.rect(110, 56, 70, 2, "#5a3b22"); p.rect(110, 10, 2, 48, "#5a3b22"); p.rect(178, 10, 2, 48, "#5a3b22"); p.rect(144, 10, 2, 48, "#5a3b22");
      p.rect(0, 76, W, 20, "#6b4a2f"); p.rect(100, 70, 86, 8, "#8a5a32"); p.rect(104, 78, 4, 18, "#5a3b22"); p.rect(176, 78, 4, 18, "#5a3b22");
      p.rect(130, 64, 16, 6, "#e6e6ee"); p.rect(150, 62, 10, 8, "#9d1c27"); p.rect(118, 66, 6, 4, "#ffd23f");
    },
    harbor: function (p) {
      sky(p, ["#1d1a4a", "#4b2a6b", "#a2456e", "#f08a5d", "#f9c74f"]);
      disc(p, 150, 58, 10, "#ffe08a");
      sea(p, 62, "#1e5f8c", "#4fa3d1", 3);
      for (var i = 0; i < 6; i++) building(p, 6 + i * 16, 50 + (i % 3) * 3, 12, 26, i % 2 ? "#8c6a4f" : "#a48262", "#3a2a1a", i);
      p.rect(0, 70, 100, 2, "#123a57");
      ship(p, 120, 64, "#5a3b22", "#f1e9d0");
      cloud(p, 20, 14, "#f3a6b8"); cloud(p, 92, 22, "#f6b98f");
    },
    andes: function (p) {
      sky(p, ["#3a7bd5", "#5b9be0", "#8cc0ec", "#c3e3f7"]);
      ridge(p, 70, [[30, 46, 1.1], [86, 58, 1], [150, 50, 1.05], [190, 40, 1]], "#6c6f8a", "#ffffff");
      ridge(p, 80, [[10, 22, 0.8], [70, 30, 0.7], [130, 26, 0.75], [184, 30, 0.8]], "#4f7a3a");
      ground(p, 80, "#7aa34c", "#5f8a3a", 5);
      for (var t = 0; t < 4; t++) p.rect(0, 82 + t * 4, W, 1, "#5f7d32");
      for (var x = 20; x < 180; x += 3) p.px(x, 88 - Math.round(Math.sin(x / 18) * 4), "#d9c08a");
      p.rect(140, 66, 10, 8, "#9b8a6a"); p.rect(139, 64, 12, 2, "#7a4b23");
    },
    chichen: function (p) {
      sky(p, ["#2e8bc0", "#58a9d6", "#8fd0ec", "#c6ecf7"]);
      disc(p, 30, 18, 8, "#fff3b0");
      ground(p, 78, "#4f8a35", "#3c6e28", 9);
      for (var i = 0; i < 12; i++) disc(p, 6 + i * 17, 78, 7 + (i % 3), i % 2 ? "#2f6b2a" : "#3d7d32");
      stepPyramid(p, 112, 80, 96, 9, "#c9b183", "#b49a6a");
      cloud(p, 150, 16, "#ffffff"); cloud(p, 60, 24, "#ffffff");
    },
    panama: function (p) {
      sky(p, ["#4ea8de", "#74c0e6", "#a8dbf0", "#d7f0f8"]);
      ridge(p, 58, [[20, 18, 0.6], [90, 24, 0.5], [170, 20, 0.6]], "#3e7a46");
      p.rect(0, 58, W, 38, "#6b6b74");
      p.rect(0, 62, W, 24, "#2d6f9e"); for (var x = 2; x < W; x += 9) p.rect(x, 66 + (x % 3) * 5, 4, 1, "#5fa8d8");
      p.rect(60, 54, 6, 34, "#3a3a46"); p.rect(126, 54, 6, 34, "#3a3a46");
      ship(p, 78, 62, "#9d1c27", "#e6e6ee"); p.rect(80, 58, 20, 4, "#e6e6ee"); p.rect(86, 52, 6, 6, "#e6e6ee"); p.rect(88, 46, 2, 6, "#1a1423");
      for (var m = 0; m < 3; m++) { p.rect(10 + m * 18, 52, 8, 5, "#e0c070"); p.rect(10 + m * 18, 57, 2, 2, "#1a1423"); p.rect(16 + m * 18, 57, 2, 2, "#1a1423"); }
    },
    ceiba: function (p) {
      sky(p, ["#0f2a3d", "#1d4e5f", "#2f7a6a", "#5aa37a"]);
      stars(p, 24, "#d7f5e8", 4, 30);
      ground(p, 82, "#2b4a2a", "#1f3a1e", 11);
      ceiba(p, 96, 84, "#7a6a5a", "#2f7a3e", "#43aa5b");
      p.rect(20, 64, 26, 20, "#3a3a46"); p.rect(26, 70, 14, 14, "#141414");
      p.rect(150, 66, 24, 18, "#3a3a46"); p.rect(155, 71, 13, 13, "#141414");
      for (var f = 0; f < 10; f++) { var R = rng(f + 30); p.px(10 + Math.floor(R() * 170), 50 + Math.floor(R() * 30), "#e9ff70"); }
    },
    seville: function (p) {
      sky(p, ["#f4a259", "#f7c58b", "#fbe0b5", "#fdf0d5"]);
      p.rect(0, 30, W, 50, "#d8b98a");
      p.rect(0, 26, W, 6, "#b8956a");
      arches(p, 8, 40, 9, 16, 26, "#e4cba0", "#5a3b22");
      for (var i = 0; i < 9; i++) for (var s = 0; s < 4; s++) p.rect(12 + i * 19, 48 + s * 5, 8, 2, ["#9d1c27", "#24497f", "#2b7a3e", "#c99a2e"][(i + s) % 4]);
      p.rect(0, 80, W, 16, "#8a6a3a"); for (var t = 0; t < W; t += 12) p.rect(t, 80, 1, 16, "#6b5230");
      p.rect(86, 4, 20, 24, "#c7a46f"); p.rect(92, 0, 8, 6, "#c7a46f"); p.rect(94, 10, 4, 6, "#5a3b22");
    },
    giza: function (p) {
      sky(p, ["#f2a65a", "#f6c177", "#f9dc9c", "#fdf1c7"]);
      disc(p, 160, 22, 11, "#fff6cf");
      ground(p, 76, "#e2b85f", "#c99a3e", 13);
      pyramid(p, 64, 76, 46, "#e8c27a", "#c79b4a");
      pyramid(p, 132, 76, 34, "#e8c27a", "#c79b4a");
      pyramid(p, 176, 76, 18, "#e8c27a", "#c79b4a");
      for (var c = 0; c < 4; c++) { p.rect(20 + c * 9, 70, 6, 3, "#8a6a3a"); p.rect(23 + c * 9, 67, 2, 3, "#8a6a3a"); }
    },
    bletchley: function (p) {
      sky(p, ["#0b1026", "#141a3a", "#1f2752", "#2b3466"]);
      stars(p, 40, "#e6e6ff", 21, 46);
      disc(p, 34, 18, 7, "#f5f3ce"); disc(p, 37, 16, 6, "#141a3a");
      ground(p, 78, "#24402a", "#1b3220", 17);
      p.rect(70, 36, 80, 42, "#7a5a4a"); p.rect(70, 30, 80, 6, "#4a3a3a"); p.rect(100, 22, 20, 14, "#7a5a4a"); p.rect(106, 16, 8, 8, "#4a3a3a");
      for (var x = 76; x < 146; x += 10) for (var y = 42; y < 72; y += 12) p.rect(x, y, 5, 7, (x + y) % 3 ? "#ffd166" : "#3a2a2a");
      for (var hut = 0; hut < 3; hut++) { p.rect(6 + hut * 20, 66, 16, 12, "#5a6a4a"); p.rect(5 + hut * 20, 63, 18, 3, "#3a4a32"); p.rect(10 + hut * 20, 70, 3, 4, "#ffd166"); }
    },
    bridges: function (p) {
      sky(p, ["#7fb3d5", "#a9cce3", "#d4e6f1", "#eaf2f8"]);
      p.rect(0, 50, W, 46, "#7f8c8d");
      p.rect(0, 56, W, 30, "#2e86c1"); for (var x = 0; x < W; x += 7) p.rect(x, 62 + (x % 5) * 4, 3, 1, "#85c1e9");
      p.rect(70, 60, 52, 18, "#58a05a"); p.rect(74, 56, 44, 4, "#6cb46e"); p.rect(90, 46, 12, 10, "#c0392b"); p.rect(94, 40, 4, 6, "#7b241c");
      bridge(p, 40, 70, 60, "#5d4037"); bridge(p, 122, 152, 60, "#5d4037"); bridge(p, 96, 112, 86, "#5d4037");
      bridge(p, 20, 46, 86, "#5d4037"); bridge(p, 150, 176, 86, "#5d4037");
      for (var b = 0; b < 5; b++) building(p, 4 + b * 9, 34, 7, 16, "#a04000", "#f7dc6f", b + 50);
      for (var b2 = 0; b2 < 5; b2++) building(p, 146 + b2 * 9, 36, 7, 14, "#935116", "#f7dc6f", b2 + 70);
    },
    census: function (p) {
      p.rect(0, 0, W, H, "#2b2340");
      for (var i = 0; i < 6; i++) p.rect(0, i * 16, W, 1, "#3a3156");
      gear(p, 40, 30, 12, "#b08d57", "#2b2340"); gear(p, 62, 46, 8, "#c9a26b", "#2b2340"); gear(p, 160, 28, 14, "#b08d57", "#2b2340"); gear(p, 140, 50, 7, "#d4b483", "#2b2340");
      p.rect(80, 30, 36, 46, "#5a3b22"); p.rect(84, 34, 28, 18, "#e6e6ee"); for (var r = 0; r < 4; r++) for (var c = 0; c < 7; c++) if ((r * 3 + c) % 4) p.rect(86 + c * 4, 36 + r * 4, 2, 2, "#1a1423");
      p.rect(84, 56, 28, 4, "#ffd23f"); p.rect(84, 62, 28, 10, "#3a2414");
      p.rect(0, 76, W, 20, "#4a3a2a"); for (var k = 0; k < 8; k++) p.rect(10 + k * 22, 70, 14, 6, "#e6e6ee");
    },
    pitch: function (p) {
      sky(p, ["#2d1b4e", "#5a2a5e", "#a8445e", "#e9805a", "#f6b26b"]);
      disc(p, 96, 60, 14, "#ffcf70");
      p.rect(0, 62, W, 34, "#1b1b22");
      for (var x = 0; x < W; x += 5) p.rect(x, 64 + (x % 4) * 6, 3, 1, "#3a3a4a");
      for (var i = 0; i < 6; i++) disc(p, 20 + i * 30, 72 + (i % 2) * 8, 3, "#2a2a36");
      palm(p, 14, 62, 22, "#4a2b12", "#1f4a2a"); palm(p, 178, 62, 26, "#4a2b12", "#1f4a2a");
      p.rect(84, 76, 24, 16, "#b08d57"); p.rect(88, 80, 16, 12, "#4a2b12"); disc(p, 96, 86, 3, "#ffd23f");
    },
    vault: function (p) {
      p.rect(0, 0, W, H, "#141221");
      for (var y = 0; y < H; y += 8) for (var x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) p.rect(x, y, 15, 7, "#1e1a33");
      disc(p, 96, 48, 30, "#b08d57"); disc(p, 96, 48, 24, "#8a6a3a"); disc(p, 96, 48, 6, "#ffd23f");
      for (var i = 0; i < 8; i++) { var t = i * Math.PI / 4; p.rect(96 + Math.round(Math.cos(t) * 16) - 1, 48 + Math.round(Math.sin(t) * 16) - 1, 3, 3, "#ffd23f"); }
    }
  };
  A.SCENES = Object.keys(SCENES);
  var sceneCache = {};
  // a scene as a data URL (192 x 96 pixels: show it with image-rendering: pixelated)
  A.scene = function (id) {
    if (sceneCache[id]) return sceneCache[id];
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var p = P(c);
    (SCENES[id] || SCENES.office)(p);
    try { sceneCache[id] = c.toDataURL(); } catch (e) { sceneCache[id] = ""; }
    return sceneCache[id];
  };
})(CL);
