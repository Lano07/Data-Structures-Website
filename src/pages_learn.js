/* COMP 2611 Code Lab — the study pages built on CL.Learn: Progress (the dashboard), Flashcards, the diagnostic
   test and the learning paths. Each page is drawn by app.js's router through CL.pages, with app.js's helpers in CL.ui. */
(function (CL) {
  "use strict";
  var LN = CL.Learn, esc = CL.esc, DAY = 86400000;
  CL.pages = CL.pages || {};
  function S() { return CL.store; }
  function D() { return window.CODELAB_DATA; }
  function topicName(t) { var x = CL.Train.topicById[t]; return x ? x.title : t; }
  function plural(n, w, ws) { return n + " " + (n === 1 ? w : (ws || w + "s")); }
  function fmtDay(t, o) { return new Date(t).toLocaleDateString([], o || { weekday: "short", day: "numeric", month: "short" }); }
  function ago(t) {
    if (!t) return "never";
    var d = Math.floor((LN.dayStart(Date.now()) - LN.dayStart(t)) / DAY);
    return d <= 0 ? "today" : d === 1 ? "yesterday" : d + " days ago";
  }
  function lessonTitle(lid) { var L = D().lessons[lid], i = CL.ui.lessonInfo[lid]; return L ? (i ? i.num + " " : "") + L.title : lid; }
  function firstLesson(cid) { var c = LN.byId[cid]; return c && c.lessons.filter(function (l) { return D().lessons[l]; })[0]; }
  function masteryBar(m) { return '<span class="mbar ' + m.cls + '" aria-hidden="true"><i style="width:' + (m.n ? Math.max(4, m.pct) : 0) + '%"></i></span>'; }
  function chip(m) { return '<span class="mchip ' + m.cls + '">' + m.label + (m.n ? " " + m.pct + "%" : "") + "</span>"; }

  // ---------------------------------------------------------------- what to work on next
  function recommend() {
    var out = [], cnt = LN.counts(), st = S();
    if (cnt.dueQ) out.push({ t: "Review " + plural(cnt.dueQ, "question") + " you got wrong before", d: "They are due now. Spaced reviews are the fastest way to make a fix stick.", act: "review", btn: "Start reviews" });
    if (cnt.dueC) out.push({ t: "Go through " + plural(cnt.dueC, "flashcard") + " that are due", d: "A few minutes of recall keeps definitions and costs fresh.", href: "#cards", btn: "Flashcards" });
    var evidence = LN.concepts.reduce(function (a, c) { return a + LN.mastery(c.id).n; }, 0);
    if (!(st.diag || []).length && evidence < 25) out.push({ t: "Take the diagnostic test", d: "One question on each key concept, about 25 minutes. It shows what is solid and which earlier ideas to fix first.", href: "#diag", btn: "Start the diagnostic" });
    var weak = LN.concepts.filter(function (c) { var m = LN.mastery(c.id); return m.n >= 2 && m.s < 0.65; }).sort(function (a, b) { return LN.need(b.id) - LN.need(a.id); });
    var shown = {};
    weak.slice(0, 4).forEach(function (c) {
      var pre = LN.weakPrereq(c.id);
      var target = pre || c.id;
      if (shown[target]) return;
      shown[target] = 1;
      var m = LN.mastery(target), tc = LN.byId[target], fl = firstLesson(target);
      out.push({ t: (pre ? "Fix " + tc.title + " first" : "Practise " + tc.title),
        d: (pre ? "It is the shaky foundation under " + c.title + ". " : "") + "Mastery now: " + m.label + " (" + m.pct + "% from " + plural(Math.round(m.n), "answer") + ").",
        concept: LN.practiseable(target) ? target : null, lesson: fl, btn: "Practise" });
    });
    LN.concepts.filter(function (c) { return LN.mastery(c.id).stale; }).slice(0, 2).forEach(function (c) {
      out.push({ t: "Refresh " + c.title, d: "You knew it well, but last practised it " + ago(LN.mastery(c.id).t) + ".", concept: LN.practiseable(c.id) ? c.id : null, lesson: firstLesson(c.id), btn: "Practise" });
    });
    var readNotTried = LN.concepts.filter(function (c) { return !LN.mastery(c.id).n && LN.practiseable(c.id) && c.lessons.some(function (l) { return st.done[l]; }); });
    readNotTried.slice(0, 2).forEach(function (c) { out.push({ t: "Try questions on " + c.title, d: "You finished its lesson but have not practised it yet.", concept: c.id, btn: "Practise" }); });
    var pn = CL.pathNext();
    if (pn) out.push({ t: "Next on your plan: " + pn.text, d: pn.plan, href: pn.href, concept: pn.step.k === "practice" ? pn.step.c : null, btn: "Go" });
    if (!out.length) out.push({ t: "Adaptive practice", d: "Nothing urgent. Adaptive practice picks the concept you most need next.", act: "adaptive", btn: "Practise" });
    return out.slice(0, 6);
  }
  function recoList(items) {
    return '<ol class="pg-reco">' + items.map(function (r, i) {
      var a = r.act ? '<button type="button" class="btn small primary" data-act="' + r.act + '">' + esc(r.btn) + "</button>" :
        r.concept ? '<button type="button" class="btn small primary" data-concept="' + r.concept + '">' + esc(r.btn) + "</button>" :
        r.href ? '<a class="btn small primary" href="' + r.href + '">' + esc(r.btn) + "</a>" : "";
      return '<li><div><b>' + esc(r.t) + "</b><span>" + esc(r.d || "") + (r.lesson ? ' <a href="#l-' + r.lesson + '">Lesson ' + esc(lessonTitle(r.lesson)) + "</a>" : "") + '</span></div><div class="pg-reco-a">' + a + "</div></li>";
    }).join("") + "</ol>";
  }
  function wireActions(root) {
    root.addEventListener("click", function (e) {
      var c = e.target.closest("[data-concept]"), a = e.target.closest("[data-act]");
      if (c) { e.preventDefault(); CL.ui.trainConcept(c.getAttribute("data-concept")); }
      else if (a) { e.preventDefault(); S().trainPref.mode = a.getAttribute("data-act"); CL.save(); location.hash = "#train"; }
    });
  }

  // ---------------------------------------------------------------- the progress dashboard
  CL.pages.progress = { nav: "progress", draw: function (ui) {
    var st = S(), p = ui.page("pg-page"), h = ui.h;
    ui.setTutor("home", "Your progress", function () { return ui.progressText() + "\n\nRecommended next steps shown on the page: " + recommend().map(function (r) { return r.t; }).join("; ") + "."; },
      [{ label: "Plan my next study session", prompt: "Using my progress and concept mastery (in the context), plan my next 45-minute study session: what to do, in what order, and why. Keep it short." },
       { label: "Why is my weakest concept weak?", prompt: "Look at my weakest concepts in the context. For the weakest one, ask me two short diagnostic questions to find out what I'm misunderstanding, one at a time." }]);
    var cnt = LN.counts(), streak = CL.Progress.streak(), today = (st.act || {})[CL.Progress.day()] || {};
    var goal = st.goal = st.goal || {}, daily = goal.daily || 20, doneN = (today.q || 0) + (today.c || 0);
    var act30 = 0;
    for (var i = 0; i < 30; i++) if (CL.Progress.dayActive(CL.Progress.day(Date.now() - i * DAY))) act30++;
    var ex = LN.examDate(), d0 = new Date(), days = Math.round((new Date(ex.getFullYear(), ex.getMonth(), ex.getDate()) - new Date(d0.getFullYear(), d0.getMonth(), d0.getDate())) / DAY);
    p.innerHTML = '<div class="eyebrow">Progress</div><h1 class="title">Your progress</h1><p class="lede">What you have mastered, what needs work, and what to do next. Every answer on the site (lesson checks, practice, mock exams, lab predictions and passed exercises) updates the estimate for the concept it tests.</p>' +
      '<div class="pg-tiles">' +
      '<div class="pg-tile"><div class="k">Study streak</div><div class="v">' + plural(streak, "day") + '</div><div class="s">Active on ' + act30 + " of the last 30 days</div></div>" +
      '<div class="pg-tile"><div class="k">Today</div><div class="v">' + doneN + ' <small>of ' + daily + '</small></div><div class="s">questions and flashcards · goal <span class="pg-goal" role="group" aria-label="Daily goal">' + [10, 20, 40, 60].map(function (n) { return '<button type="button" data-goal="' + n + '"' + (n === daily ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + n + "</button>"; }).join("") + "</span></div></div>" +
      '<div class="pg-tile"><div class="k">Reviews due</div><div class="v">' + cnt.due + '</div><div class="s">' + plural(cnt.dueQ, "question") + " · " + plural(cnt.dueC, "flashcard") + (cnt.dueQ ? ' · <button type="button" class="linkbtn" data-act="review">review</button>' : "") + (cnt.dueC ? ' · <a href="#cards">cards</a>' : "") + "</div></div>" +
      '<div class="pg-tile"><div class="k">Final exam</div><div class="v">' + (days > 0 ? plural(days, "day") : days === 0 ? "Today" : "Done") + '</div><div class="s">' + esc(fmtDay(ex, { weekday: "short", day: "numeric", month: "short" })) + ", " + esc(ex.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })) + ' · <button type="button" class="linkbtn" data-edit-exam>change</button></div></div>' +
      "</div>" +
      '<div class="pg-exam-edit" hidden><label>Date <input type="date" class="in" data-exd></label><label>Time <input type="time" class="in" data-ext></label><label>Length (minutes) <input type="number" class="in" min="30" max="240" step="10" data-exm></label><button type="button" class="btn small primary" data-save-exam>Save</button><button type="button" class="btn small ghost" data-reset-exam>Use 15 Dec, 1 pm, 2 hours</button></div>';
    var ed = p.querySelector(".pg-exam-edit");
    function pad(n) { return String(n).padStart(2, "0"); }
    p.querySelector("[data-edit-exam]").addEventListener("click", function () {
      ed.hidden = !ed.hidden;
      ed.querySelector("[data-exd]").value = ex.getFullYear() + "-" + pad(ex.getMonth() + 1) + "-" + pad(ex.getDate());
      ed.querySelector("[data-ext]").value = pad(ex.getHours()) + ":" + pad(ex.getMinutes());
      ed.querySelector("[data-exm]").value = goal.examMin || 120;
    });
    ed.querySelector("[data-save-exam]").addEventListener("click", function () {
      var dv = ed.querySelector("[data-exd]").value, tv = ed.querySelector("[data-ext]").value || "13:00", mv = +ed.querySelector("[data-exm]").value;
      var t = new Date(dv + "T" + tv);
      if (!dv || isNaN(t.getTime())) { ui.toast("Pick a date first."); return; }
      goal.exam = dv + "T" + tv;
      if (mv >= 30 && mv <= 240) goal.examMin = mv;
      CL.save(); ui.route();
    });
    ed.querySelector("[data-reset-exam]").addEventListener("click", function () { delete goal.exam; delete goal.examMin; CL.save(); ui.route(); });
    p.querySelector(".pg-goal").addEventListener("click", function (e) { var b = e.target.closest("[data-goal]"); if (!b) return; goal.daily = +b.getAttribute("data-goal"); CL.save(); ui.route(); });

    // what next
    var nx = h("section", "pg-sec");
    nx.innerHTML = "<h2>What to work on next</h2>" + recoList(recommend());
    p.appendChild(nx);

    // the chosen plan
    var plan = st.path && pathById(st.path);
    var ps = h("section", "pg-sec");
    if (plan) {
      var pr = pathProgress(plan), nxt = pathSteps(plan).filter(function (s) { return !LN.stepDone(s); }).slice(0, 3);
      ps.innerHTML = '<h2>Your plan: ' + esc(plan.title) + '</h2><div class="pg-planbar"><div class="bar"><i style="width:' + pr.pct + '%"></i></div><span>' + pr.done + " of " + pr.total + ' steps</span><a href="#path-' + plan.id + '">Open the plan</a></div>' +
        (nxt.length ? '<ul class="pg-steps">' + nxt.map(function (s) { var si = stepInfo(s); return "<li>" + stepLink(si) + (si.detail ? ' <span class="muted small">' + esc(si.detail) + "</span>" : "") + "</li>"; }).join("") + "</ul>" : "<p>Every step is done. Well done.</p>");
    } else ps.innerHTML = '<h2>Study plans</h2><p class="muted">Pick a plan and the site will tick off each step as you work: <a href="#path-final">final exam revision</a>, <a href="#path-cw2">Coursework 2 and quiz preparation</a>, <a href="#path-beginner">the whole course from the start</a> or <a href="#path-advanced">beyond the course</a>. <a href="#paths">See all plans</a>.</p>';
    p.appendChild(ps);
    wireStepLinks(ps);

    // bookmarks
    var bmHtml = CL.bookmarkList ? CL.bookmarkList(30) : "";
    var bms = h("section", "pg-sec");
    bms.innerHTML = "<h2>Bookmarks</h2>" + (bmHtml || '<p class="small muted">Press the ☆ next to the title of a lesson, lab, exercise or written question to keep it here.</p>');
    p.appendChild(bms);

    // activity heatmap
    var hm = h("section", "pg-sec");
    hm.innerHTML = "<h2>Your activity</h2>" + heatmap(st.act || {}) ;
    p.appendChild(hm);

    // accuracy trend
    var tr = h("section", "pg-sec");
    tr.innerHTML = "<h2>Accuracy over the last 30 days</h2>" + trendChart(st.act || {});
    p.appendChild(tr);

    // concept mastery
    var cs = h("section", "pg-sec");
    var filt = CL.pgFilter || "all";
    function drawConcepts() {
      var topics = [];
      LN.concepts.forEach(function (c) { if (topics.indexOf(c.topic) < 0) topics.push(c.topic); });
      var counts = { m4: 0, m3: 0, m2: 0, m1: 0, m0: 0 };
      LN.concepts.forEach(function (c) { counts[LN.mastery(c.id).cls]++; });
      cs.innerHTML = '<h2>Concept mastery</h2><p class="small muted">' + LN.concepts.length + " concepts: " + counts.m4 + " strong, " + counts.m3 + " good, " + counts.m2 + " learning, " + counts.m1 + " shaky, " + counts.m0 + " not started. Recent answers count more than old ones, so a concept rises as you improve.</p>" +
        '<div class="seg pg-filt" role="group" aria-label="Show concepts"><button type="button" data-f="all"' + (filt === "all" ? ' class="on"' : "") + '>All</button><button type="button" data-f="weak"' + (filt === "weak" ? ' class="on"' : "") + '>Needs work</button><button type="button" data-f="new"' + (filt === "new" ? ' class="on"' : "") + ">Not started</button></div>" +
        topics.map(function (t) {
          var rows = LN.concepts.filter(function (c) {
            if (c.topic !== t) return false;
            var m = LN.mastery(c.id);
            return filt === "all" || (filt === "weak" && m.n && m.s < 0.65) || (filt === "new" && !m.n);
          });
          if (!rows.length) return "";
          return '<div class="pg-topic"><h3>' + esc(topicName(t)) + "</h3>" + rows.map(function (c) {
            var m = LN.mastery(c.id), fl = firstLesson(c.id);
            return '<div class="pg-crow"><div class="pg-cname"><b>' + esc(c.title) + "</b>" + (fl ? '<a href="#l-' + fl + '" class="small">' + esc(lessonTitle(fl)) + "</a>" : "") + "</div>" + masteryBar(m) + chip(m) +
              '<span class="small muted pg-cev">' + (m.n ? plural(Math.round(m.n), "answer") + " · " + ago(m.t) : "") + "</span>" +
              (LN.practiseable(c.id) ? '<button type="button" class="btn small" data-concept="' + c.id + '">Practise</button>' : '<span class="small muted pg-cnone" title="Practised through lesson checks and exercises">lessons</span>') + "</div>";
          }).join("") + "</div>";
        }).join("");
    }
    drawConcepts();
    cs.addEventListener("click", function (e) { var f = e.target.closest("[data-f]"); if (f) { filt = CL.pgFilter = f.getAttribute("data-f"); drawConcepts(); } });
    p.appendChild(cs);

    // mock exams
    if ((st.exams || []).length) {
      var es = h("section", "pg-sec");
      var list = st.exams.slice(0, 12);
      es.innerHTML = "<h2>Mock exams</h2>" + examSpark(st.exams.slice(0, 20).reverse()) + '<div class="tbl-wrap"><table class="pg-tbl"><thead><tr><th>Date</th><th>Paper</th><th>Score</th><th>Time</th></tr></thead><tbody>' +
        list.map(function (e) { var pc = Math.round(100 * e.score / e.max); return "<tr><td>" + esc(fmtDay(e.date)) + "</td><td>" + esc(e.title) + '</td><td><b>' + e.score + "/" + e.max + "</b> (" + pc + "%)</td><td>" + (e.ms ? Math.round(e.ms / 60000) + " min" : "") + "</td></tr>"; }).join("") + "</tbody></table></div>" +
        '<p><a class="btn small" href="#exam">Sit another mock exam</a></p>';
      p.appendChild(es);
    }

    // recent mistakes
    if ((st.miss || []).length) {
      var ms = h("section", "pg-sec");
      var items = st.miss.slice(0, 10).map(function (m) {
        var q = null;
        try { q = m.g === "classic" ? CL.Train.makeClassic(m.s) : CL.Train.make(m.g, m.s); } catch (e) { q = null; }
        return q ? { m: m, q: q } : null;
      }).filter(Boolean);
      ms.innerHTML = '<h2>Recent mistakes</h2><p class="small muted">The last questions you got wrong. Each one is also in your review queue, which brings it back at growing gaps.</p><ul class="pg-miss">' +
        items.map(function (x, i) { return '<li><span class="chip">' + esc(topicName(x.q.topic)) + "</span> <b>" + esc(x.q.title) + '</b> <span class="muted small">' + ago(x.m.t) + '</span> <button type="button" class="btn small ghost" data-retry="' + i + '">Try it again</button></li>'; }).join("") + "</ul>";
      ms.addEventListener("click", function (e) {
        var b = e.target.closest("[data-retry]");
        if (!b) return;
        var x = items[+b.getAttribute("data-retry")];
        CL.trainOne = { g: x.m.g, s: x.m.s };
        location.hash = "#train";
      });
      p.appendChild(ms);
    }

    // the last diagnostic
    if ((st.diag || []).length) {
      var dg = st.diag[0], ds = h("section", "pg-sec");
      ds.innerHTML = "<h2>Diagnostic test</h2><p>Last taken " + esc(ago(dg.date)) + ": <b>" + dg.score + " of " + dg.n + "</b> right. " + '<a href="#diag">See the results or take it again</a>.</p>';
      p.appendChild(ds);
    }
    wireActions(p);
  } };

  // a calendar of the last 18 weeks, one square per day, darker for more practice
  function heatmap(act) {
    var weeks = 18, cell = 13, gap = 3, today = new Date();
    today.setHours(12, 0, 0, 0);
    var dow = (today.getDay() + 6) % 7; // Monday = 0
    var start = new Date(today.getTime() - (dow + (weeks - 1) * 7) * DAY);
    var svg = "", total = 0, activeDays = 0, months = "";
    var lastMonth = -1;
    for (var w = 0; w < weeks; w++) {
      for (var d = 0; d < 7; d++) {
        var t = new Date(start.getTime() + (w * 7 + d) * DAY);
        if (t > today) continue;
        var key = CL.Progress.day(t), a = act[key] || {};
        var score = (a.q || 0) + (a.c || 0) + 3 * (a.l || 0) + 3 * (a.x || 0) + (a.w || 0) * 2;
        var lv = score === 0 ? 0 : score < 10 ? 1 : score < 25 ? 2 : score < 50 ? 3 : 4;
        if (score) { activeDays++; total += (a.q || 0) + (a.c || 0); }
        var tip = fmtDay(t) + ": " + (score ? [a.q ? plural(a.q, "question") : "", a.c ? plural(a.c, "flashcard") : "", a.l ? plural(a.l, "lesson") + " completed" : "", a.x ? plural(a.x, "exercise") + " passed" : "", a.m ? a.m + " active min" : ""].filter(Boolean).join(", ") : "nothing");
        svg += '<rect x="' + (28 + w * (cell + gap)) + '" y="' + (16 + d * (cell + gap)) + '" width="' + cell + '" height="' + cell + '" rx="2" class="hm' + lv + '"><title>' + esc(tip) + "</title></rect>";
      }
      var wt = new Date(start.getTime() + w * 7 * DAY);
      if (wt.getMonth() !== lastMonth) { lastMonth = wt.getMonth(); months += '<text x="' + (28 + w * (cell + gap)) + '" y="10" class="hm-t">' + esc(wt.toLocaleDateString([], { month: "short" })) + "</text>"; }
    }
    var W = 28 + weeks * (cell + gap), H = 16 + 7 * (cell + gap);
    var labels = ["Mon", "", "Wed", "", "Fri", "", "Sun"].map(function (l, i) { return l ? '<text x="0" y="' + (16 + i * (cell + gap) + 10) + '" class="hm-t">' + l + "</text>" : ""; }).join("");
    return '<div class="hm-wrap"><svg class="hm" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Activity over the last 18 weeks: active on ' + activeDays + " days, " + total + ' questions and flashcards">' + months + labels + svg + "</svg></div>" +
      '<div class="hm-key small muted">Less <i class="hm0"></i><i class="hm1"></i><i class="hm2"></i><i class="hm3"></i><i class="hm4"></i> More · active on ' + plural(activeDays, "day") + " in 18 weeks · " + total + " questions and flashcards</div>";
  }
  // questions answered per day (bars) and the share right (line), for days with at least 5 answers
  function trendChart(act) {
    var n = 30, W = 640, H = 190, L = 34, R = 34, T = 12, B = 26, pts = [], maxQ = 0, sumQ = 0, sumR = 0;
    for (var i = n - 1; i >= 0; i--) {
      var t = Date.now() - i * DAY, a = act[CL.Progress.day(t)] || {}, q = a.q || 0, r = a.r || 0;
      pts.push({ t: t, q: q, r: r });
      maxQ = Math.max(maxQ, q); sumQ += q; sumR += r;
    }
    if (!sumQ) return '<p class="muted">No questions answered in the last 30 days yet. Practise a little and your trend appears here.</p>';
    maxQ = Math.max(10, Math.ceil(maxQ / 10) * 10);
    var bw = (W - L - R) / n, svg = "";
    [0, 50, 100].forEach(function (v) { var y = T + (H - T - B) * (1 - v / 100); svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" class="tc-grid"/><text x="' + (W - R + 4) + '" y="' + (y + 4) + '" class="tc-t">' + v + "%</text>"; });
    svg += '<text x="' + (L - 4) + '" y="' + (T + 4) + '" class="tc-t" text-anchor="end">' + maxQ + '</text><text x="' + (L - 4) + '" y="' + (H - B + 4) + '" class="tc-t" text-anchor="end">0</text>';
    var line = [];
    pts.forEach(function (p, i) {
      var x = L + i * bw, bh = (H - T - B) * p.q / maxQ;
      svg += '<rect x="' + (x + 1) + '" y="' + (H - B - bh) + '" width="' + Math.max(1, bw - 2) + '" height="' + bh + '" class="tc-bar"><title>' + esc(fmtDay(p.t)) + ": " + p.q + " answered, " + p.r + " right</title></rect>";
      if (p.q >= 5) line.push([x + bw / 2, T + (H - T - B) * (1 - p.r / p.q), p]);
      if ((n - 1 - i) % 7 === 0) svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" class="tc-t" text-anchor="middle">' + esc(fmtDay(p.t, { day: "numeric", month: "short" })) + "</text>";
    });
    if (line.length > 1) svg += '<polyline points="' + line.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ") + '" class="tc-line"/>';
    line.forEach(function (q) { svg += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.5" class="tc-dot"><title>' + esc(fmtDay(q[2].t)) + ": " + Math.round(100 * q[2].r / q[2].q) + "% right of " + q[2].q + "</title></circle>"; });
    return '<div class="tc-wrap"><svg class="tc" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Last 30 days: ' + sumQ + " questions answered, " + Math.round(100 * sumR / sumQ) + '% right">' + svg + "</svg></div>" +
      '<div class="small muted tc-key"><i class="k-bar"></i> questions answered (left scale) <i class="k-line"></i> share right, on days with 5 or more (right scale) · ' + sumQ + " answered, " + Math.round(100 * sumR / sumQ) + "% right overall</div>";
  }
  function examSpark(list) {
    if (list.length < 2) return "";
    var W = 640, H = 90, L = 30, R = 10, T = 10, B = 18, svg = "";
    [50, 100].forEach(function (v) { var y = T + (H - T - B) * (1 - v / 100); svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" class="tc-grid"/><text x="' + (L - 4) + '" y="' + (y + 4) + '" class="tc-t" text-anchor="end">' + v + "%</text>"; });
    var pts = list.map(function (e, i) { return [L + (W - L - R) * (list.length === 1 ? 0.5 : i / (list.length - 1)), T + (H - T - B) * (1 - e.score / e.max), e]; });
    svg += '<polyline points="' + pts.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ") + '" class="tc-line"/>';
    pts.forEach(function (q) { svg += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.5" class="tc-dot"><title>' + esc(fmtDay(q[2].date) + ", " + q[2].title + ": " + q[2].score + "/" + q[2].max) + "</title></circle>"; });
    return '<div class="tc-wrap"><svg class="tc" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Mock exam scores over time">' + svg + "</svg></div>";
  }

  // ---------------------------------------------------------------- learning paths
  function pathById(id) { return LN.paths().filter(function (p) { return p.id === id; })[0] || null; }
  function pathSteps(p) { var out = []; p.groups.forEach(function (g) { out = out.concat(g.steps); }); return out; }
  function pathProgress(p) { var all = pathSteps(p), done = all.filter(LN.stepDone).length; return { done: done, total: all.length, pct: all.length ? Math.round(100 * done / all.length) : 0 }; }
  function stepInfo(s) {
    var st = S(), D0 = D();
    if (s.k === "lesson") return { text: "Read lesson " + lessonTitle(s.id), href: "#l-" + s.id, detail: LN.stepDone(s) ? "" : "Mark it complete at the end of the lesson" };
    if (s.k === "practice") { var m = LN.mastery(s.c), c = LN.byId[s.c]; return { text: "Practise " + (c ? c.title : s.c) + " until it is Good", concept: s.c, detail: m.n ? "Now: " + m.label + ", " + m.pct + "% from " + plural(Math.round(m.n), "answer") + (m.n < (s.n || 5) ? " (needs " + (s.n || 5) + ")" : "") : "Not started" }; }
    if (s.k === "exam") { var pp = CL.ui.paperById[s.paper]; var best = (st.exams || []).filter(function (e) { return e.paper === s.paper; }).map(function (e) { return Math.round(100 * e.score / e.max); }).sort(function (a, b) { return b - a; })[0]; return { text: "Sit the mock exam: " + (pp ? pp.title : s.paper) + (s.min ? ", scoring at least " + Math.round(s.min * 100) + "%" : ""), href: "#exam", detail: best !== undefined ? "Best so far: " + best + "%" : "" }; }
    if (s.k === "cards") { var srs = LN.srs(), have = LN.cards().filter(function (c) { return (!s.deck || c.deck === s.deck) && srs[c.id] && srs[c.id].reps >= 1; }).length; return { text: "Learn " + (s.n || 10) + " " + (s.deck ? topicName(s.deck) + " " : "") + "flashcards", href: "#cards", deck: s.deck || "all", detail: have + " learned so far" }; }
    if (s.k === "lab") { var lb = CL.ui.labById[s.id], x = (st.lab || {})[s.id] || { n: 0 }; return { text: "Answer " + (s.n || 5) + " Your turn predictions in the " + (lb ? lb.title : s.id), href: "#lab-" + s.id, detail: x.n + " answered so far" }; }
    if (s.k === "gym") { var passed = D0.exercises.filter(function (e) { return e.topic === s.topic && st.ex[e.id] && st.ex[e.id].passed; }).length; return { text: "Pass " + (s.n || 1) + " Code Gym exercise" + ((s.n || 1) > 1 ? "s" : "") + " on " + (CL.ui.topicTitle[s.topic] || s.topic).toLowerCase(), href: "#gym", gym: s.topic, detail: passed + " passed so far" }; }
    if (s.k === "diag") return { text: "Take the diagnostic test", href: "#diag", detail: "" };
    if (s.k === "written") { var wd = Object.keys(st.wr || {}).filter(function (k) { return st.wr[k] && st.wr[k].done; }).length; return { text: "Write and mark " + (s.n || 1) + " exam-style written answers", href: "#written", detail: wd + " done so far" }; }
    return { text: s.k, href: "#home" };
  }
  function stepLink(si) {
    if (si.concept) return '<button type="button" class="linkbtn" data-concept="' + si.concept + '">' + esc(si.text) + "</button>";
    return '<a href="' + si.href + '"' + (si.deck ? ' data-deck="' + si.deck + '"' : "") + (si.gym ? ' data-gym="' + si.gym + '"' : "") + ">" + esc(si.text) + "</a>";
  }
  function wireStepLinks(root) {
    root.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-deck], a[data-gym], [data-concept]");
      if (!a) return;
      if (a.hasAttribute("data-concept")) { e.preventDefault(); e.stopPropagation(); CL.ui.trainConcept(a.getAttribute("data-concept")); return; }
      if (a.hasAttribute("data-deck")) { S().cardDeck = a.getAttribute("data-deck"); CL.save(); }
      if (a.hasAttribute("data-gym")) CL.ui.gymTopic(a.getAttribute("data-gym"));
    });
  }
  CL.stepLinkHtml = function (step) { return stepLink(stepInfo(step)); };
  CL.wireStepLinks = wireStepLinks;
  // the next step of the chosen plan, for the home page and the dashboard
  CL.pathNext = function () {
    var st = S();
    if (!st.path) return null;
    var p = pathById(st.path);
    if (!p) return null;
    var s = pathSteps(p).filter(function (x) { return !LN.stepDone(x); })[0];
    if (!s) return null;
    var si = stepInfo(s);
    return { text: si.text, href: si.concept ? "#train" : si.href, plan: p.title, step: s };
  };
  CL.pages.paths = { nav: "progress", draw: function (ui) {
    var p = ui.page(), st = S();
    ui.setTutor("home", "Study plans", ui.progressText);
    p.innerHTML = '<div class="eyebrow">Progress</div><h1 class="title">Study plans</h1><p class="lede">A plan is a list of steps (lessons, practice to a target, flashcards, labs, exercises and mock exams) that tick themselves off as you work. Choose one to see its next step on the home page.</p>';
    var grid = ui.h("div", "path-grid");
    LN.paths().forEach(function (pt) {
      var pr = pathProgress(pt), mine = st.path === pt.id;
      var c = ui.h("article", "path-card" + (mine ? " mine" : ""));
      c.innerHTML = '<div class="pl">' + esc(pt.sub) + (mine ? ' · <b>your plan</b>' : "") + "</div><h2>" + esc(pt.title) + "</h2><p>" + esc(pt.desc) + '</p><div class="bar"><i style="width:' + pr.pct + '%"></i></div><div class="small muted">' + pr.done + " of " + plural(pr.total, "step") + ' done</div><div class="btns"><a class="btn primary" href="#path-' + pt.id + '">Open</a>' + (mine ? "" : '<button type="button" class="btn" data-pick="' + pt.id + '">Make this my plan</button>') + "</div>";
      grid.appendChild(c);
    });
    grid.addEventListener("click", function (e) { var b = e.target.closest("[data-pick]"); if (!b) return; st.path = b.getAttribute("data-pick"); CL.save(); ui.toast("Plan chosen. Its next step shows on the home page."); ui.route(); });
    p.appendChild(grid);
  } };
  CL.pages["path-"] = { nav: "progress", draw: function (ui, id) {
    var pt = pathById(id);
    if (!pt) return false;
    var p = ui.page("path-page"), st = S(), mine = st.path === pt.id, pr = pathProgress(pt);
    ui.setTutor("home", "Study plan: " + pt.title, function () { return ui.progressText() + "\n\nThe student is looking at the study plan '" + pt.title + "'. Steps not done yet: " + pathSteps(pt).filter(function (s) { return !LN.stepDone(s); }).slice(0, 12).map(function (s) { return stepInfo(s).text; }).join("; ") + "."; });
    p.innerHTML = '<div class="eyebrow"><a href="#paths">Study plans</a></div><h1 class="title">' + esc(pt.title) + '</h1><p class="lede">' + esc(pt.desc) + "</p>" +
      '<div class="pg-planbar"><div class="bar"><i style="width:' + pr.pct + '%"></i></div><span>' + pr.done + " of " + plural(pr.total, "step") + " done</span>" + (mine ? '<span class="mchip m3">Your plan</span><button type="button" class="btn small ghost" data-unpick>Stop following</button>' : '<button type="button" class="btn small primary" data-pick>Make this my plan</button>') + "</div>";
    var now = Date.now(), firstOpen = null;
    pt.groups.forEach(function (g) {
      var sec = ui.h("section", "path-grp" + (g.from && now >= g.from && now < g.to ? " now" : ""));
      var done = g.steps.filter(LN.stepDone).length;
      sec.innerHTML = "<h2>" + esc(g.title) + (g.from && now >= g.from && now < g.to ? ' <span class="mchip m2">this week</span>' : "") + ' <span class="small muted">' + done + "/" + g.steps.length + "</span></h2>" +
        '<ol class="path-steps">' + g.steps.map(function (s) {
          var ok = LN.stepDone(s), si = stepInfo(s);
          if (!ok && !firstOpen) firstOpen = si;
          return '<li class="' + (ok ? "ok" : "") + '"><span class="ps-mk" aria-hidden="true">' + (ok ? "✓" : "") + '</span><span class="ps-t">' + stepLink(si) + (ok ? '<span class="sr-only"> (done)</span>' : "") + (si.detail ? '<span class="small muted">' + esc(si.detail) + "</span>" : "") + "</span></li>";
        }).join("") + "</ol>";
      p.appendChild(sec);
    });
    wireStepLinks(p);
    var pk = p.querySelector("[data-pick]"), up = p.querySelector("[data-unpick]");
    if (pk) pk.addEventListener("click", function () { st.path = pt.id; CL.save(); ui.toast("Plan chosen. Its next step shows on the home page."); ui.route(); });
    if (up) up.addEventListener("click", function () { delete st.path; CL.save(); ui.route(); });
  } };

  // ---------------------------------------------------------------- flashcards
  var KIND = { term: "Term", cost: "Cost of an operation", summary: "Lesson summary", code: "Write the code" };
  CL.pages.cards = { nav: "train", draw: function (ui) {
    var p = ui.page("fc-page"), st = S(), h = ui.h;
    var deck = st.cardDeck || "all";
    var limit = (st.goal && st.goal.newCards) || 15;
    var queue = [], cur = null, shown = false, again = [], sess = { n: 0 };
    p.innerHTML = '<div class="eyebrow">Practice</div><h1 class="title">Flashcards</h1><p class="lede">Active recall with spaced repetition. Answer each card in your head or on paper <i>before</i> you turn it over, then say honestly how well you knew it. Cards you find hard come back soon; cards you know well wait longer.</p>';
    var decks = h("div", "fc-decks");
    var area = h("div", "fc-area");
    var foot = h("div", "fc-foot small muted");
    p.appendChild(decks); p.appendChild(area); p.appendChild(foot);
    ui.setTutor("home", "Flashcards", function () {
      var s = ui.progressText();
      if (cur) s += "\n\nFlashcard on screen (" + KIND[cur.kind] + "): " + ui.plain(cur.front) + (shown ? "\nIts answer (now showing): " + ui.plain(cur.back) : "\nThe student has not turned it over yet: don't reveal the answer.");
      return s;
    });
    function deckCards(d) { return LN.cards().filter(function (c) { return d === "all" || c.deck === d; }); }
    function stats(d) {
      var srs = LN.srs(), now = Date.now(), due = 0, fresh = 0, learned = 0;
      deckCards(d).forEach(function (c) { var it = srs[c.id]; if (!it) fresh++; else { if (it.due <= now) due++; if (it.reps >= 2) learned++; } });
      return { due: due, fresh: fresh, learned: learned, total: deckCards(d).length };
    }
    function newLeft() { return Math.max(0, limit - LN.newToday()); }
    function drawDecks() {
      var ids = ["all"];
      LN.cards().forEach(function (c) { if (ids.indexOf(c.deck) < 0) ids.push(c.deck); });
      var order = CL.Train.topics.map(function (t) { return t.id; });
      ids.sort(function (a, b) { return a === "all" ? -1 : b === "all" ? 1 : order.indexOf(a) - order.indexOf(b); });
      decks.innerHTML = '<div class="tr-modes" role="group" aria-label="Deck">' + ids.map(function (d) {
        var s = stats(d);
        return '<button type="button" class="chip-btn' + (d === deck ? " on" : "") + '" data-d="' + d + '">' + esc(d === "all" ? "All topics" : topicName(d)) + (s.due ? ' <span class="fc-n">' + s.due + "</span>" : "") + "</button>";
      }).join("") + "</div>";
    }
    function build() {
      var srs = LN.srs(), now = Date.now();
      var due = deckCards(deck).filter(function (c) { return srs[c.id] && srs[c.id].due <= now; }).sort(function (a, b) { return srs[a.id].due - srs[b.id].due; });
      var fresh = deckCards(deck).filter(function (c) { return !srs[c.id]; }).slice(0, newLeft());
      queue = due.concat(fresh);
      again = [];
    }
    function drawFoot() {
      var s = stats(deck);
      foot.innerHTML = s.total + " cards in this deck: " + s.learned + " learned, " + s.fresh + " not seen yet. New cards per day: " +
        '<span class="pg-goal" role="group" aria-label="New cards per day">' + [5, 15, 30].map(function (n) { return '<button type="button" data-lim="' + n + '"' + (n === limit ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + n + "</button>"; }).join("") + "</span> · keys: Space to turn over, 1–4 to grade.";
    }
    function backHtml(c) {
      if (c.kind === "summary") { var box = CL.renderMd(c.back, CL.ui.mdHooks({ noRun: true })); return box.innerHTML; }
      if (c.kind === "code") return "";
      if (c.kind === "cost") return '<div class="fc-big">' + esc(c.back) + "</div>";
      return '<div class="fc-def">' + CL.inline(c.back) + "</div>";
    }
    function next() {
      shown = false;
      cur = queue.shift() || again.shift() || null;
      area.innerHTML = "";
      if (!cur) {
        var srs = LN.srs(), nextDue = Object.keys(srs).filter(function (k) { return srs[k].k === "card" && srs[k].due > Date.now(); }).map(function (k) { return srs[k].due; }).sort(function (a, b) { return a - b; })[0];
        var s = stats(deck);
        area.innerHTML = '<div class="fc-done"><h2>' + (sess.n ? "Done for now: " + plural(sess.n, "card") + " reviewed." : "Nothing due in this deck right now.") + "</h2><p>" + (nextDue ? "The next card is due " + esc(fmtWhen(nextDue)) + ". " : "") + (s.fresh && !newLeft() ? "You have reached today's limit of " + limit + " new cards. " : "") + "</p>" +
          '<div class="btns">' + (s.fresh ? '<button type="button" class="btn primary" data-more>Learn 5 more new cards</button>' : "") + '<a class="btn" href="#train">Practise questions</a><a class="btn ghost" href="#progress">Your progress</a></div></div>';
        var mb = area.querySelector("[data-more]");
        if (mb) mb.addEventListener("click", function () { var srs2 = LN.srs(); queue = deckCards(deck).filter(function (c) { return !srs2[c.id]; }).slice(0, 5); next(); });
        drawDecks(); drawFoot();
        return;
      }
      var it = LN.srs()[cur.id];
      var card = h("article", "fc-card");
      card.innerHTML = '<div class="fc-top"><span class="chip">' + esc(topicName(cur.deck)) + '</span><span class="fc-kind">' + esc(KIND[cur.kind]) + "</span>" + (it ? "" : '<span class="mchip m2">new</span>') + '<span class="fc-left small muted">' + (queue.length + again.length + 1) + " left</span></div>" +
        '<div class="fc-front">' + (cur.kind === "term" ? '<div class="fc-term">' + esc(cur.front) + '</div><div class="fc-ask">What does it mean?</div>' :
          cur.kind === "cost" ? '<div class="fc-q">' + esc(cur.front) + '</div><div class="fc-ask">What is its time complexity?</div>' :
          cur.kind === "summary" ? '<div class="fc-q">' + esc(cur.front) + '</div><div class="fc-ask">What are the key points of this lesson? Say them before you turn over.</div>' :
          '<div class="fc-ask">Write this function from memory:</div>') + "</div>";
      if (cur.kind === "code") { var sig = CL.codeBlock(cur.front); sig.classList.add("fc-code"); card.querySelector(".fc-front").appendChild(sig); }
      var back = h("div", "fc-back");
      back.hidden = true;
      back.innerHTML = backHtml(cur);
      if (cur.kind === "code") { var cb = CL.codeBlock(cur.back); cb.classList.add("fc-code"); back.appendChild(cb); }
      if (cur.lesson && D().lessons[cur.lesson]) back.insertAdjacentHTML("beforeend", '<p class="small muted fc-src">From ' + CL.ui.lessonLink(cur.lesson, cur.section) + "</p>");
      card.appendChild(back);
      var acts = h("div", "fc-acts");
      card.appendChild(acts);
      area.appendChild(card);
      CL.ui.wireSectionLinks(card);
      function drawActs() {
        if (!shown) { acts.innerHTML = '<button type="button" class="btn primary fc-show">Show the answer</button>'; acts.querySelector("button").addEventListener("click", reveal); return; }
        var base = it || { iv: 0, ef: 2.5, reps: 0 };
        acts.innerHTML = '<div class="fc-grades" role="group" aria-label="How well did you know it?">' + ["Again", "Hard", "Good", "Easy"].map(function (g, i) { return '<button type="button" class="fc-g g' + i + '" data-g="' + i + '"><b>' + g + "</b><span>" + LN.preview(base, i) + "</span><kbd>" + (i + 1) + "</kbd></button>"; }).join("") + "</div>";
      }
      function reveal() { shown = true; back.hidden = false; drawActs(); var g = acts.querySelector(".fc-g.g2"); if (g) try { g.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
      acts.addEventListener("click", function (e) { var b = e.target.closest("[data-g]"); if (b) grade(+b.getAttribute("data-g")); });
      drawActs();
      card.reveal = reveal;
    }
    function grade(g) {
      if (!cur || !shown) return;
      var isNew = !LN.srs()[cur.id];
      if (isNew) { LN.add(cur.id, "card", { c: cur.id }); CL.Progress.log("nc"); }
      LN.grade(cur.id, g);
      CL.Progress.log("c");
      var cid = cur.lesson ? LN.forLesson(cur.lesson) : null;
      if (cid) LN.record(cid, g >= 2, 0.25);
      if (g === 0) again.push(cur);
      sess.n++;
      CL.save();
      drawDecks();
      next();
    }
    function fmtWhen(t) { var d = t - Date.now(); return d < 3600000 ? "in " + Math.max(1, Math.round(d / 60000)) + " min" : d < DAY ? "in " + Math.round(d / 3600000) + " h" : "on " + fmtDay(t); }
    decks.addEventListener("click", function (e) { var b = e.target.closest("[data-d]"); if (!b) return; deck = st.cardDeck = b.getAttribute("data-d"); CL.save(); drawDecks(); build(); next(); drawFoot(); });
    foot.addEventListener("click", function (e) { var b = e.target.closest("[data-lim]"); if (!b) return; st.goal = st.goal || {}; limit = st.goal.newCards = +b.getAttribute("data-lim"); CL.save(); drawFoot(); if (!cur) { build(); next(); } });
    function onKey(e) {
      if (e.target.closest("input, textarea, select") || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.key === " " || e.key === "Enter") && cur && !shown) { e.preventDefault(); var c = area.querySelector(".fc-card"); if (c && c.reveal) c.reveal(); }
      else if (/^[1-4]$/.test(e.key) && shown) { e.preventDefault(); grade(+e.key - 1); }
    }
    document.addEventListener("keydown", onKey);
    ui.setCurrent({ destroy: function () { document.removeEventListener("keydown", onKey); } });
    drawDecks(); build(); next(); drawFoot();
  } };

  // ---------------------------------------------------------------- the diagnostic test
  CL.pages.diag = { nav: "train", draw: function (ui) {
    var p = ui.page("dg-page"), st = S(), h = ui.h;
    var run = st.diagNow && st.diagNow.plan && st.diagNow.i < st.diagNow.plan.length ? st.diagNow : null;
    var view = null;
    ui.setTutor("home", "Diagnostic test", function () {
      var s = ui.progressText();
      if (run) s += "\n\nThe student is taking the diagnostic test (question " + (run.i + 1) + " of " + run.plan.length + "). Do not give answers to diagnostic questions; it must measure what they know.";
      else if ((st.diag || []).length) s += "\n\nLast diagnostic: " + st.diag[0].score + " of " + st.diag[0].n + ". Wrong on: " + st.diag[0].res.filter(function (r) { return !r.ok; }).map(function (r) { return (LN.byId[r.c] || {}).title; }).join("; ") + ".";
      return s;
    });
    function q(it) { return CL.Train.make(it.g, it.s); }
    function intro() {
      p.innerHTML = '<div class="eyebrow">Practice</div><h1 class="title">Diagnostic test</h1><p class="lede">One question on each key concept of the course, from pointers to sorting. There are no hints and no feedback until the end, so it measures what you know now. Press <b>I don\'t know</b> rather than guessing: a guess that happens to be right hides a gap.</p>' +
        '<div class="dg-facts"><div><b>' + LN.diagPlan().length + "</b> questions</div><div>about <b>25</b> minutes</div><div>results show what to <b>fix first</b></div></div>" +
        '<div class="btns"><button type="button" class="btn primary" data-start>Start the diagnostic</button></div>';
      p.querySelector("[data-start]").addEventListener("click", function () {
        run = st.diagNow = { plan: LN.diagPlan(), i: 0, ans: [], t0: Date.now() };
        CL.save(); ask();
      });
      if ((st.diag || []).length) { var prev = h("div", "dg-prev"); p.appendChild(prev); results(st.diag[0], prev, true); }
    }
    function ask() {
      p.innerHTML = "";
      var it = run.plan[run.i];
      var head = h("div", "dg-head");
      head.innerHTML = '<div class="eyebrow">Diagnostic test</div><div class="dg-prog"><div class="bar"><i style="width:' + Math.round(100 * run.i / run.plan.length) + '%"></i></div><span>Question ' + (run.i + 1) + " of " + run.plan.length + '</span><button type="button" class="btn small ghost" data-quit>Stop and discard</button></div>';
      p.appendChild(head);
      head.querySelector("[data-quit]").addEventListener("click", function (e) {
        var b = e.currentTarget;
        if (!b.classList.contains("confirm")) { b.classList.add("confirm"); b.textContent = "Click again to discard"; return; }
        delete st.diagNow; run = null; CL.save(); intro();
      });
      var host = h("div", "dg-q");
      p.appendChild(host);
      var qq = q(it);
      if (!qq) { run.ans.push({ ok: false, a: null, skip: 1 }); run.i++; CL.save(); return run.i < run.plan.length ? ask() : finish(); }
      view = ui.renderQuestion(qq, host, { mcq: true, quiet: true, onAnswer: function (ok, x, shown, given) {
        if (CL.Game) CL.Game.quiet(true);
        ui.recordTrain(x, ok);
        if (CL.Game) CL.Game.quiet(false);
        run.ans.push({ ok: !!ok, a: given === undefined ? null : given });
        run.i++;
        CL.save();
        if (run.i < run.plan.length) ask(); else finish();
      } });
    }
    function finish() {
      var res = run.plan.map(function (it, i) { var a = run.ans[i] || {}; return { c: it.c, g: it.g, s: it.s, ok: !!a.ok, a: a.a === undefined ? null : a.a }; });
      var rec = { date: Date.now(), score: res.filter(function (r) { return r.ok; }).length, n: res.length, ms: Date.now() - run.t0, res: res };
      st.diag = [rec].concat(st.diag || []).slice(0, 10);
      delete st.diagNow;
      run = null;
      CL.save();
      p.innerHTML = '<div class="eyebrow">Diagnostic test</div><h1 class="title">Your results</h1>';
      results(rec, p, false);
      window.scrollTo(0, 0);
    }
    function results(rec, host, compact) {
      var byC = {};
      rec.res.forEach(function (r) { byC[r.c] = r.ok; });
      // a wrong concept whose own prerequisite was also wrong is fixed from the bottom up
      function wrongPre(cid, seen) {
        seen = seen || {};
        var c = LN.byId[cid];
        if (!c || seen[cid]) return null;
        seen[cid] = 1;
        for (var i = 0; i < c.pre.length; i++) { var d = wrongPre(c.pre[i], seen); if (d) return d; if (byC[c.pre[i]] === false) return c.pre[i]; }
        return null;
      }
      var solid = rec.res.filter(function (r) { return r.ok; }), wrong = rec.res.filter(function (r) { return !r.ok; });
      var fixNow = wrong.filter(function (r) { return !wrongPre(r.c); }), later = wrong.filter(function (r) { return wrongPre(r.c); });
      var box = h("div", "dg-res");
      function item(r, extra) { var c = LN.byId[r.c] || { title: r.c }, fl = firstLesson(r.c); return "<li><b>" + esc(c.title) + "</b>" + (extra || "") + '<span class="dg-links">' + (fl ? '<a href="#l-' + fl + '">Lesson ' + esc(lessonTitle(fl)) + "</a>" : "") + (LN.practiseable(r.c) ? '<button type="button" class="linkbtn" data-concept="' + r.c + '">Practise</button>' : "") + "</span></li>"; }
      box.innerHTML = (compact ? "<h2>Your last result (" + esc(fmtDay(rec.date)) + ")</h2>" : "") + '<div class="dg-score"><b>' + rec.score + "</b> of " + rec.n + " right" + (rec.ms ? " · " + Math.round(rec.ms / 60000) + " min" : "") + "</div>" +
        '<div class="dg-cols">' +
        '<section class="dg-col fix"><h3>Fix these first (' + fixNow.length + ")</h3>" + (fixNow.length ? '<p class="small muted">You missed these, and the ideas they build on look fine. Start here.</p><ul>' + fixNow.map(function (r) { return item(r); }).join("") + "</ul>" : '<p class="small muted">Nothing here.</p>') + "</section>" +
        '<section class="dg-col later"><h3>Then these (' + later.length + ")</h3>" + (later.length ? '<p class="small muted">You also missed an idea each one builds on. Fix that one first, then come back.</p><ul>' + later.map(function (r) { var w = wrongPre(r.c); return item(r, ' <span class="small muted">after ' + esc((LN.byId[w] || {}).title || w) + "</span>"); }).join("") + "</ul>" : '<p class="small muted">Nothing here.</p>') + "</section>" +
        '<section class="dg-col ok"><h3>Solid (' + solid.length + ")</h3>" + (solid.length ? "<ul>" + solid.map(function (r) { return item(r); }).join("") + "</ul>" : '<p class="small muted">Nothing yet.</p>') + "</section>" +
        "</div>" + (compact ? "" : '<div class="btns"><a class="btn primary" href="#path-final">Follow the revision plan</a><a class="btn" href="#progress">Your progress</a><button type="button" class="btn ghost" data-again>Take it again</button></div>') +
        '<details class="dg-review"><summary>Review every question with its worked solution</summary><div class="dg-rq"></div></details>';
      host.appendChild(box);
      wireActions(box);
      var ag = box.querySelector("[data-again]");
      if (ag) ag.addEventListener("click", function () { intro(); });
      var det = box.querySelector(".dg-review"), filled = false;
      det.addEventListener("toggle", function () {
        if (!det.open || filled) return;
        filled = true;
        var rq = det.querySelector(".dg-rq");
        rec.res.forEach(function (r) {
          var qq = q(r);
          if (!qq) return;
          var v = ui.renderQuestion(qq, rq, { mcq: true, focus: false });
          v.finish(r.ok, r.a, r.a === null);
        });
      });
    }
    if (run) ask(); else intro();
  } };
})(CL);
