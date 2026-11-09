/* COMP 2611 Code Lab — Coursework Exam #2: its page (what the course says to expect, the topics and their marks, the
   mock papers, the plan) and the mock papers themselves, sat like the real one: 4 short-answer questions, 40 marks,
   90 minutes. You write every part, then mark it against its marking scheme (yourself, or the tutor), and see your
   score for each area of the outline. The questions are original, written for this site; none is from a past paper. */
(function (CL) {
  "use strict";
  var esc = CL.esc, LN = CL.Learn;
  CL.pages = CL.pages || {};
  // from the course's "what to expect" sheet
  var CW2 = CL.CW2 = {
    name: "Coursework Exam #2", weight: "20%", when: new Date("2026-11-17T09:00:00-04:00"), minutes: 90,
    time: "9:00 to 10:30 am", where: "JFK Auditorium", format: "4 short-answer questions, 40 marks",
    note: "You will not have to write the code of a stack or a queue, but you may need to use one to solve another problem (for example, a queue in a level-order traversal).",
    // where each area of the outline is taught
    links: {
      lsq: [["l", "c2-traversal"], ["l", "c3-insertion"], ["l", "c4-deletion"], ["l", "e1-stacks"], ["l", "e2-queues"], ["l", "e3-applications"]],
      trees: [["l", "f1-terminology"], ["l", "f2-traversals"], ["l", "f3-tree-code"], ["l", "f4-level-order-types"], ["l", "g2-insert-search"], ["l", "g3-parent-successor"], ["l", "g4-deletion"]],
      heaps: [["l", "h1-heap-arrays"], ["l", "h2-heapify-build"], ["l", "h3-delete-heapsort"], ["l", "h4-insert-priority"]],
      hashgraph: [["l", "i1-hash-tables"], ["l", "i2-probing"], ["l", "i3-chaining-strings"], ["l", "j1-graph-basics"], ["l", "j3-bfs-dfs"], ["l", "j4-dijkstra"]],
      perf: [["l", "l1-performance"], ["l", "g5-performance"]]
    },
    labs: { lsq: ["lists", "stackqueue"], trees: ["traversal", "bst"], heaps: ["heap"], hashgraph: ["hash", "graph"], perf: [] }
  };
  var TYPE = { code: "Write code", trace: "Trace", explain: "Explain", complexity: "Complexity", proof: "Proof", design: "Design" };
  function S() { return CL.store; }
  function data() { return (window.CODELAB_DATA && window.CODELAB_DATA.cw2) || { areas: [], papers: [] }; }
  function paper(id) { return data().papers.filter(function (p) { return p.id === id; })[0] || null; }
  function areaOf(id) { return data().areas.filter(function (a) { return a.id === id; })[0] || { id: id, title: id, marks: 0 }; }
  function store() {
    var s = S();
    s.cw2 = s.cw2 || {};
    ["drafts", "att", "run", "marks"].forEach(function (k) { s.cw2[k] = s.cw2[k] || {}; });
    return s.cw2;
  }
  function allParts(pp) { var out = []; pp.questions.forEach(function (q) { out = out.concat(q.parts); }); return out; }
  function lessonTitle(id) { var D = window.CODELAB_DATA, l = D.lessons[id]; return l ? l.title : id; }
  function daysTo(t) { var now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); return Math.round((new Date(t.getFullYear(), t.getMonth(), t.getDate()) - d0) / 86400000); }
  CW2.daysText = function () {
    var d = daysTo(CW2.when);
    return d < 0 ? "was on " + CW2.when.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }) : d === 0 ? "is today" : d === 1 ? "is tomorrow" : "is in " + d + " days";
  };
  CW2.best = function (pid) { var a = store().att[pid]; return a ? a.best : null; };
  CW2.sat = function (pid) { return !!store().att[pid]; };
  function fmtClock(ms) { var neg = ms < 0, s = Math.floor(Math.abs(ms) / 1000); return (neg ? "+" : "") + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  // ---------------------------------------------------------------- the exam's page
  CL.pages.cw2 = { nav: "train", draw: function (ui) {
    var p = ui.page("cw-page"), h = ui.h, D = data(), st = store();
    ui.setTutor("home", "Coursework Exam #2", function () {
      return ui.progressText() + "\n\nThe student is on the Coursework Exam #2 page. The exam: " + CW2.when.toDateString() + ", " + CW2.time + ", " + CW2.where + ". " + CW2.format + ", 90 minutes. Areas and marks: " +
        D.areas.map(function (a) { return a.title + " (about " + a.marks + ")"; }).join(", ") + ". " + CW2.note;
    });
    p.innerHTML = '<div class="eyebrow">Coursework Exam #2 · ' + CW2.weight + " of your grade</div>" +
      '<h1 class="title">Coursework Exam #2 ' + esc(CW2.daysText()) + "</h1>" +
      '<p class="lede"><b>' + esc(CW2.when.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })) + ", " + esc(CW2.time) + "</b> (90 minutes), <b>" + esc(CW2.where) + "</b>. " + esc(CW2.format) + ". This page has everything for it: what is on it, three mock papers in its format, and a day-by-day plan.</p>";
    // what is on it
    var on = h("section", "cw-card");
    on.innerHTML = '<h2>What is on it</h2><p class="small muted">From the course\'s "what to expect" sheet. The marks are approximate.</p>' +
      '<div class="cw-areas">' + D.areas.map(function (a) {
        return '<div class="cw-area"><div class="cw-area-h"><b>' + esc(a.title) + '</b><span class="cw-area-m">about ' + a.marks + " marks</span></div>" +
          '<div class="cw-area-bar"><i style="width:' + Math.round(100 * a.marks / 40) + '%"></i></div>' +
          '<div class="cw-area-l">' + (CW2.links[a.id] || []).map(function (x) { return '<a href="#l-' + x[1] + '">' + esc(lessonTitle(x[1])) + "</a>"; }).join("") + (CW2.labs[a.id] || []).map(function (lid) { var lb = (window.CODELAB_DATA.labs || []).filter(function (l) { return l.id === lid; })[0]; return lb ? '<a class="cw-lab" href="#lab-' + lid + '">🔬 ' + esc(lb.title) + "</a>" : ""; }).join("") + "</div></div>";
      }).join("") + "</div>" +
      '<p class="cw-nb"><b>Note from the course:</b> ' + esc(CW2.note) + "</p>";
    p.appendChild(on);
    // the mock papers
    var mp = h("section", "cw-card");
    mp.innerHTML = '<h2>Mock papers in the same format</h2><p class="small muted">Each paper has 4 questions and 40 marks, split like the real exam: Q1 linked lists, stacks and queues (9), Q2 binary trees and BSTs (11), Q3 heaps and priority queues (10), Q4 hashing and graphs (7) plus performance analysis (3). Sit one in 90 minutes, then mark it against its marking scheme. Original questions written for this site, checked by compiling every code answer.</p>' +
      '<div class="cw-papers">' + D.papers.map(function (pp) {
        var a = st.att[pp.id], run = st.run[pp.id];
        return '<div class="cw-paper"><div class="cw-paper-t"><b>Mock paper ' + esc(pp.id) + '</b><span class="small muted">' + pp.questions.length + " questions · " + pp.marks + " marks · " + pp.minutes + " minutes</span></div>" +
          '<div class="cw-paper-s">' + (a ? "Best: <b>" + a.best + "/" + pp.marks + "</b>" + (a.n > 1 ? " · sat " + a.n + " times" : "") : run && run.t0 ? "In progress" : "Not sat yet") + "</div>" +
          '<div class="btns"><a class="btn primary" href="#cw2-' + pp.id + '">' + (run && run.t0 && !run.done ? "Carry on" : a ? "Sit it again" : "Sit it") + '</a><a class="btn ghost small" href="#cw2-' + pp.id + '" data-print="' + pp.id + '">Print it</a></div></div>';
      }).join("") + "</div>";
    p.appendChild(mp);
    mp.addEventListener("click", function (e) { var b = e.target.closest("[data-print]"); if (b) { st.printNext = b.getAttribute("data-print"); CL.save(true); } });
    // the plan and quick practice
    var pl = h("section", "cw-card");
    var path = LN.paths().filter(function (x) { return x.id === "cw2"; })[0], pd = 0, pt = 0;
    if (path) path.groups.forEach(function (g) { pt += g.steps.length; pd += g.steps.filter(LN.stepDone).length; });
    pl.innerHTML = "<h2>Your plan, day by day</h2><p>Eight days, one area a day weighted by its marks, then the mock papers under exam conditions. Every step ticks itself off as you work.</p>" +
      (path ? '<div class="pg-planbar"><div class="bar"><i style="width:' + (pt ? Math.round(100 * pd / pt) : 0) + '%"></i></div><span>' + pd + " of " + pt + " steps done</span></div>" : "") +
      '<div class="btns"><a class="btn blue" href="#path-cw2">Open the plan</a>' + (S().path === "cw2" ? "" : '<button type="button" class="btn" data-pick>Make it my plan</button>') + '<a class="btn ghost" href="#exam" data-drill>Quick drill: multiple choice on these topics</a><a class="btn ghost" href="#written">Written answers</a></div>';
    pl.addEventListener("click", function (e) {
      if (e.target.closest("[data-pick]")) { S().path = "cw2"; CL.save(); ui.toast("Plan chosen. Its next step shows on the home page."); ui.route(); }
    });
    p.appendChild(pl);
    var adv = h("section", "cw-card");
    adv.innerHTML = '<h2>How the course says to prepare</h2><ul class="cw-list">' +
      "<li><b>Past papers.</b> The UWI Library has the 2025/2026 and 2024/2025 Semester 1 examinations; the 2023/2024 Semester 1 examination is on myeLearning. The coursework exam's questions are similar in style.</li>" +
      "<li><b>Review session.</b> The Week 11 lab sessions (including the online lab on Tuesday 10 November) review past-paper questions and questions from Labs 1 to 10.</li>" +
      "<li><b>Revise</b> the solutions to the lab sheets and the lecture slides, and attempt as many past-paper questions as you can.</li></ul>" +
      '<p class="small muted">This site has no past papers. Its mock papers and written answers are practice in the same style, and the <a href="#exam-review">exam review</a> shows how to lay out answers for full marks.</p>';
    p.appendChild(adv);
  } };

  // ---------------------------------------------------------------- a mock paper
  CL.pages["cw2-"] = { nav: "train", draw: function (ui, id) {
    var pp = paper(id);
    if (!pp) return false;
    var p = ui.page("cw-page cw-sit"), h = ui.h, st = store(), parts = allParts(pp);
    var run = st.run[pp.id] = st.run[pp.id] || {};
    var mode = run.t0 && !run.done ? "writing" : "ready", review = false;
    var editors = {}, timer = null, draftT = null, marking = null;
    var printNow = st.printNext === pp.id;
    if (printNow) delete st.printNext;
    ui.setTutor("home", "Coursework Exam #2 mock paper " + pp.id, function () {
      var s = ui.progressText() + "\n\nThe student is on Coursework Exam #2 mock paper " + pp.id + " (4 short-answer questions, 40 marks, 90 minutes). ";
      if (mode !== "marking") return s + "They have NOT finished it: do not give answers, model answers or marking schemes; if asked, give hints about method only.";
      return s + "They have finished and are marking it against these schemes:\n" + parts.map(function (x) { return "Q" + x.qn + "(" + x.part + "), " + x.marks + " marks: " + x.q.slice(0, 300) + "\nScheme: " + x.rubric.map(function (r) { return r.pts + ": " + r.text; }).join(" | "); }).join("\n\n");
    });
    function head() {
      return '<div class="eyebrow"><a href="#cw2">Coursework Exam #2</a> · Mock paper ' + esc(pp.id) + "</div>" +
        '<h1 class="title">Mock paper ' + esc(pp.id) + "</h1>" +
        '<div class="wr-head"><span class="chip">4 questions</span><span class="chip">' + pp.marks + ' marks</span><span class="chip">90 minutes</span><span class="wr-orig small muted">Original questions in the format of the course\'s outline</span></div>';
    }
    function draw() {
      if (timer) { clearInterval(timer); timer = null; }
      editors = {};
      marking = null;
      if (mode === "ready") drawReady();
      else if (mode === "writing") drawWriting();
      else drawMarking();
    }
    ui.setCurrent({ destroy: function () { if (timer) clearInterval(timer); clearTimeout(draftT); } });
    function clearAnswers() { parts.forEach(function (x) { delete st.drafts[x.id]; }); }

    // one click handler for every state of the page
    p.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-start]")) { run.t0 = Date.now(); run.done = false; delete run.t1; clearAnswers(); CL.save(); mode = "writing"; draw(); window.scrollTo(0, 0); return; }
      if (t.closest("[data-print]")) { printQuestions(); return; }
      if (t.closest("[data-review]")) { review = true; mode = "marking"; draw(); window.scrollTo(0, 0); return; }
      var jq = t.closest("[data-q]");
      if (jq) { e.preventDefault(); var tq = p.querySelector("#cw-q" + jq.getAttribute("data-q")); if (tq) tq.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      var fin = t.closest("[data-finish]");
      if (fin && mode === "writing") {
        var empty = parts.filter(function (x) { return !(editors[x.id] && editors[x.id].get().trim()); }).length;
        if (empty && !fin.classList.contains("confirm")) { fin.classList.add("confirm"); fin.textContent = empty + " part" + (empty > 1 ? "s are" : " is") + " empty. Finish anyway?"; return; }
        saveDrafts();
        run.done = true; run.t1 = Date.now(); CL.save();
        review = false; mode = "marking"; draw(); window.scrollTo(0, 0);
        return;
      }
      var ab = t.closest("[data-abandon]");
      if (ab) {
        if (!ab.classList.contains("confirm")) { ab.classList.add("confirm"); ab.textContent = "This clears your answers. Sure?"; return; }
        clearAnswers(); delete st.run[pp.id]; CL.save(); location.hash = "#cw2";
        return;
      }
      if (t.closest("[data-again]")) { clearAnswers(); run = st.run[pp.id] = {}; CL.save(); review = false; mode = "ready"; draw(); window.scrollTo(0, 0); return; }
      if (marking) marking(e);
    });

    // ready: the rules, then start the clock
    function drawReady() {
      var a = st.att[pp.id];
      p.innerHTML = head() +
        '<section class="cw-card cw-rules"><h2>Exam conditions</h2><ul class="cw-list">' +
        "<li>90 minutes for 40 marks: about 2 minutes a mark. The clock starts when you press Start, and keeps running if you leave the page.</li>" +
        "<li>Answer every part in its own box, as you would on paper: no notes, and no running code. Show your working: it earns method marks.</li>" +
        "<li>When you finish (or the time is up), mark each part against its marking scheme, honestly, point by point." + (CL.Tutor && CL.Tutor.ready ? " The tutor can mark it strictly for you instead." : "") + "</li>" +
        "<li>Prefer paper? Print the questions, write your answers by hand, then come back to see the schemes and mark them.</li></ul>" +
        (a ? '<p class="small">Your best so far: <b>' + a.best + "/" + pp.marks + "</b>. Sitting it again starts with empty answers.</p>" : "") +
        '<div class="btns"><button type="button" class="btn primary" data-start>▶ Start the 90 minutes</button><button type="button" class="btn" data-print>Print the questions</button><button type="button" class="btn ghost" data-review>See the marking schemes</button></div></section>' +
        '<div class="cw-printable"></div>';
      if (printNow) { printNow = false; setTimeout(printQuestions, 300); }
    }
    function printQuestions() {
      var box = p.querySelector(".cw-printable") || p.appendChild(h("div", "cw-printable"));
      box.innerHTML = "";
      box.appendChild(h("div", "cw-print-h", "<b>COMP 2611 · Coursework Exam #2 · Mock paper " + esc(pp.id) + "</b><span>4 questions · 40 marks · 90 minutes · answer every question</span>"));
      pp.questions.forEach(function (q) { box.appendChild(questionBlock(q, false)); });
      document.body.classList.add("cw-printing");
      setTimeout(function () { try { window.print(); } catch (er) { /* printing is not available here */ } document.body.classList.remove("cw-printing"); }, 80);
    }
    function questionBlock(q, withAnswers) {
      var sec = h("section", "cw-q");
      sec.id = "cw-q" + q.q;
      var areas = [];
      q.parts.forEach(function (x) { if (areas.indexOf(x.area) < 0) areas.push(x.area); });
      sec.appendChild(h("div", "cw-qh", "<h2>Question " + q.q + '</h2><span class="chip">' + q.marks + ' marks</span><span class="cw-qa">' + areas.map(function (a) { return esc(areaOf(a).title); }).join(" · ") + "</span>"));
      if (q.stem) { var stem = CL.renderMd(q.stem, ui.mdHooks({ noRun: true })); stem.classList.add("cw-stem", "md"); sec.appendChild(stem); }
      q.parts.forEach(function (x) {
        var part = h("div", "cw-part");
        part.setAttribute("data-id", x.id);
        part.appendChild(h("div", "cw-ph", "<b>(" + esc(x.part) + ")</b><span class=\"chip\">" + x.marks + " mark" + (x.marks > 1 ? "s" : "") + '</span><span class="small muted">' + TYPE[x.type] + " · about " + x.minutes + " min</span>"));
        var qq = CL.renderMd(x.q, ui.mdHooks({ noRun: true }));
        qq.classList.add("cw-pq", "md");
        part.appendChild(qq);
        if (withAnswers) part.appendChild(answerBox(x));
        sec.appendChild(part);
      });
      return sec;
    }
    function answerBox(x) {
      var wrap = h("div", "cw-ans"), saved = st.drafts[x.id] || "", label = "Your answer to question " + x.qn + " (" + x.part + ")";
      wrap.appendChild(h("div", "cw-k", "Your answer" + (x.type === "code" ? " (code, as you would write it on paper)" : "")));
      if (x.type === "code") {
        var host = h("div", "wr-ed");
        wrap.appendChild(host);
        var ed = new CL.Editor(host, { value: saved, label: label, minLines: 9 });
        editors[x.id] = { get: function () { return ed.getValue(); } };
        ed.onChange(keepDrafts);
      } else {
        var ta = h("textarea", "wr-ta cw-ta");
        ta.rows = 7;
        ta.value = saved;
        ta.setAttribute("aria-label", label);
        ta.setAttribute("spellcheck", "true");
        ta.addEventListener("input", keepDrafts);
        wrap.appendChild(ta);
        editors[x.id] = { get: function () { return ta.value; } };
      }
      return wrap;
    }
    function saveDrafts() { Object.keys(editors).forEach(function (k) { var v = editors[k].get(); if (v) st.drafts[k] = v.slice(0, 6000); else delete st.drafts[k]; }); }
    function keepDrafts() { clearTimeout(draftT); draftT = setTimeout(function () { saveDrafts(); CL.save(true); }, 700); }

    // writing: the questions, a clock, and Finish
    function drawWriting() {
      p.innerHTML = head();
      var bar = h("div", "cw-bar");
      bar.innerHTML = '<span class="cw-clock" aria-live="off"></span><span class="cw-left small"></span><button type="button" class="btn primary small" data-finish>Finish and mark</button>';
      p.appendChild(bar);
      var nav = h("nav", "cw-jump");
      nav.setAttribute("aria-label", "Questions");
      nav.innerHTML = pp.questions.map(function (q) { return '<a href="#cw2-' + pp.id + '" data-q="' + q.q + '">Q' + q.q + " · " + q.marks + " marks</a>"; }).join("");
      p.appendChild(nav);
      pp.questions.forEach(function (q) { p.appendChild(questionBlock(q, true)); });
      p.appendChild(h("div", "btns cw-end", '<button type="button" class="btn primary" data-finish>Finish and mark</button><button type="button" class="btn ghost" data-abandon>Stop, and clear my answers</button>'));
      var clock = bar.querySelector(".cw-clock"), left = bar.querySelector(".cw-left");
      function tick() {
        var rem = pp.minutes * 60000 - (Date.now() - run.t0);
        clock.textContent = fmtClock(rem);
        clock.classList.toggle("low", rem < 10 * 60000 && rem >= 0);
        clock.classList.toggle("over", rem < 0);
        left.textContent = rem >= 0 ? "left" : "over time: in the real exam you would have stopped";
      }
      tick();
      timer = setInterval(tick, 1000);
    }

    // marking: each part against its scheme, with the ideal answer; then the score by area
    function drawMarking() {
      var got = {};
      parts.forEach(function (x) { var m = st.marks[x.id]; got[x.id] = m && m.length === x.rubric.length && !review ? m.slice() : x.rubric.map(function () { return 0; }); });
      p.innerHTML = head();
      var used = run.t1 && run.t0 ? run.t1 - run.t0 : 0;
      p.appendChild(h("section", "cw-card cw-howmark", review ? "<h2>The marking schemes</h2><p>Every part with its marking scheme and its ideal answer. If you sat the paper on paper, mark it here: press <b>Start</b> later to type your answers instead.</p>" :
        "<h2>Now mark it</h2><p>For each part, compare your answer with the marking scheme and award a point only if your answer clearly contains it: vague or partly right statements earn nothing in the exam. The ideal answer under each scheme shows what the marker looks for." +
        (used ? " You used <b>" + fmtClock(used).replace("+", "") + "</b> of the 90 minutes." : "") + "</p>" +
        (CL.Tutor && CL.Tutor.ready ? '<div class="btns"><button type="button" class="btn blue" data-aiall>Let the tutor mark every part strictly</button><span class="small muted cw-aiprog"></span></div>' : "")));
      var totalBar = h("div", "cw-bar cw-totalbar");
      totalBar.innerHTML = '<span class="cw-total"><b>0</b> / ' + pp.marks + '</span><button type="button" class="btn primary small" data-save>Save my marks</button>';
      if (!review) p.appendChild(totalBar);
      var result = h("div", "cw-result");
      p.appendChild(result);
      var boxes = [];
      pp.questions.forEach(function (q) {
        var sec = questionBlock(q, false);
        sec.querySelectorAll(".cw-part").forEach(function (pe) {
          var x = parts.filter(function (y) { return y.id === pe.getAttribute("data-id"); })[0];
          var mb = markBox(x);
          boxes.push(mb);
          pe.appendChild(mb);
        });
        p.appendChild(sec);
      });
      p.appendChild(h("div", "btns cw-end", (review ? '<button type="button" class="btn primary" data-start>▶ Start the 90 minutes</button>' : '<button type="button" class="btn primary" data-save>Save my marks</button>') + '<a class="btn" href="#cw2">Back to Coursework Exam #2</a>' + (review ? "" : '<button type="button" class="btn ghost" data-again>Sit this paper again</button>')));
      function total() { return parts.reduce(function (t, x) { return t + got[x.id].reduce(function (a, v) { return a + v; }, 0); }, 0); }
      function refresh() { var b = totalBar.querySelector(".cw-total b"); if (b) b.textContent = total(); }
      refresh();
      function markBox(x) {
        var box = h("div", "cw-mark"), ans = st.drafts[x.id] || "";
        if (!review) {
          var yours = h("div", "cw-yours");
          yours.appendChild(h("div", "cw-k", "Your answer"));
          var pre = h("pre", "cw-ans-ro" + (ans ? "" : " empty"));
          pre.textContent = ans || "(no answer)";
          yours.appendChild(pre);
          box.appendChild(yours);
        }
        var rub = h("div", "wr-self cw-rub");
        rub.innerHTML = '<div class="cw-k">Marking scheme · ' + x.marks + " mark" + (x.marks > 1 ? "s" : "") + "</div>" + x.rubric.map(function (r, i) {
          return '<div class="wr-sp"><span class="wr-sp-t">' + esc(r.text) + '<span class="wr-why" data-why="' + i + '"></span></span>' + (review ? '<span class="wr-pts">' + r.pts + (r.pts > 1 ? " marks" : " mark") + "</span>" :
            '<span class="wr-sp-b" role="group" aria-label="Marks for this point">' + Array.apply(null, Array(r.pts + 1)).map(function (_, k) { return '<button type="button" data-pid="' + x.id + '" data-i="' + i + '" data-v="' + k + '"' + (got[x.id][i] === k ? ' class="on"' : "") + ">" + k + "</button>"; }).join("") + "</span>") + "</div>";
        }).join("");
        box.appendChild(rub);
        box._part = x;
        box._setMarks = function (rows) {
          rows.forEach(function (r, i) {
            got[x.id][i] = r.got;
            var grp = rub.querySelectorAll(".wr-sp-b")[i];
            if (grp) grp.querySelectorAll("button").forEach(function (y) { y.classList.toggle("on", +y.getAttribute("data-v") === r.got); });
            var why = rub.querySelector('[data-why="' + i + '"]');
            if (why) why.textContent = r.reason || "";
          });
          refresh();
        };
        var ideal = h("details", "wr-ideal cw-ideal");
        ideal.open = true;
        ideal.innerHTML = "<summary><b>The ideal answer</b></summary>";
        var md = CL.renderMd(x.answer, ui.mdHooks({ noRun: true }));
        md.classList.add("md");
        ideal.appendChild(md);
        if (x.format) ideal.insertAdjacentHTML("beforeend", "<h3>How to present it</h3><p>" + CL.inline(x.format) + "</p>");
        if (x.mistakes && x.mistakes.length) ideal.insertAdjacentHTML("beforeend", "<h3>Where marks are usually lost</h3><ul>" + x.mistakes.map(function (m) { return "<li>" + CL.inline(m) + "</li>"; }).join("") + "</ul>");
        if (x.lessons && x.lessons.length) ideal.insertAdjacentHTML("beforeend", '<p class="small">Revise: ' + x.lessons.map(function (l) { return ui.lessonLink(l); }).join(" · ") + "</p>");
        ui.wireSectionLinks(ideal);
        if (x.type === "code" && x.check && ans.trim() && !review) {
          var tb = h("div", "wr-test");
          tb.innerHTML = '<button type="button" class="btn small" data-test="' + x.id + '">Test my code</button><span class="small muted">Runs your answer with a small test program and compares its output with the model answer\'s.</span><div class="wr-tout"></div>';
          ideal.appendChild(tb);
        }
        box.appendChild(ideal);
        return box;
      }
      function save() {
        var areas = {}, t = 0;
        parts.forEach(function (x) {
          var g = got[x.id].reduce(function (a, v) { return a + v; }, 0);
          areas[x.area] = (areas[x.area] || 0) + g;
          t += g;
          st.marks[x.id] = got[x.id].slice();
        });
        var a = st.att[pp.id] = st.att[pp.id] || { best: 0, n: 0 };
        a.last = t; a.best = Math.max(a.best || 0, t); a.n = (a.n || 0) + 1; a.t = Date.now(); a.areas = areas; a.ms = used || 0;
        CL.Progress.log("w");
        // each part's result counts toward the concepts of its lessons, once per sitting
        var seen = {};
        parts.forEach(function (x) { (x.lessons || []).forEach(function (l) { var c = LN.forLesson(l); if (c && !seen[c]) { seen[c] = 1; var g = got[x.id].reduce(function (s2, v) { return s2 + v; }, 0); LN.record(c, g / x.marks >= 0.6, 1); } }); });
        CL.save();
        showResult(t, areas);
      }
      function showResult(t, areas) {
        var weak = data().areas.map(function (ar) { return { a: ar, pct: (areas[ar.id] || 0) / ar.marks }; }).sort(function (x, y) { return x.pct - y.pct; })[0];
        result.innerHTML = '<section class="cw-card cw-score"><h2>Your mark: <b>' + t + "</b> / " + pp.marks + ' <span class="muted">(' + Math.round(100 * t / pp.marks) + "%)</span></h2>" +
          '<div class="cw-areas">' + data().areas.map(function (ar) {
            var g = areas[ar.id] || 0, pc = Math.round(100 * g / ar.marks);
            return '<div class="cw-area"><div class="cw-area-h"><b>' + esc(ar.title) + '</b><span class="cw-area-m">' + g + " / " + ar.marks + "</span></div>" + '<div class="cw-area-bar ' + (pc >= 70 ? "ok" : pc >= 40 ? "mid" : "low") + '"><i style="width:' + pc + '%"></i></div></div>';
          }).join("") + "</div>" +
          (weak && weak.pct < 0.7 ? "<p>Revise first: <b>" + esc(weak.a.title) + "</b>: " + (CW2.links[weak.a.id] || []).slice(0, 4).map(function (x) { return '<a href="#l-' + x[1] + '">' + esc(lessonTitle(x[1])) + "</a>"; }).join(" · ") + "</p>" : "<p>Every area is at 70% or more. Sit another paper to make sure it holds.</p>") +
          '<div class="btns"><a class="btn primary" href="#cw2">Back to Coursework Exam #2</a><a class="btn" href="#path-cw2">Your plan</a></div></section>';
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      marking = function (e) {
        var b = e.target.closest("[data-v]");
        if (b && b.hasAttribute("data-pid")) {
          got[b.getAttribute("data-pid")][+b.getAttribute("data-i")] = +b.getAttribute("data-v");
          b.parentNode.querySelectorAll("button").forEach(function (y) { y.classList.toggle("on", y === b); });
          refresh();
          return;
        }
        if (e.target.closest("[data-save]")) { save(); return; }
        var tb = e.target.closest("[data-test]");
        if (tb) {
          var x = parts.filter(function (y) { return y.id === tb.getAttribute("data-test"); })[0], ans = st.drafts[x.id] || "", out = tb.parentNode.querySelector(".wr-tout");
          var r = CPP.run((x.given || "") + "\n\n" + ans + "\n" + x.check + "\n", { maxSteps: 2000000 });
          var ok = r.compiled && !r.err && r.out.replace(/\s+$/, "") === x.expect.replace(/\s+$/, "");
          out.innerHTML = !r.compiled ? '<div class="errbox"><b>It does not compile.</b> ' + esc(r.err.msg) + "</div>" : ok ? '<div class="okbox"><b>✓ Your code gives the expected output.</b></div>' :
            '<div class="errbox"><b>Not the expected output.</b> Expected <code>' + esc(x.expect.trim()) + "</code>, yours gave <code>" + esc(r.out.trim() || "(nothing)") + "</code>" + (r.err ? ". " + esc(r.err.msg) : "") + "</div>";
          return;
        }
        var ai = e.target.closest("[data-aiall]");
        if (ai) tutorMarkAll(ai);
      };
      function tutorMarkAll(btn) {
        var prog = p.querySelector(".cw-aiprog"), k = 0;
        btn.disabled = true;
        function next() {
          if (k >= boxes.length) { btn.disabled = false; prog.textContent = "Done. Check the marks, then press Save my marks."; return; }
          var box = boxes[k], x = box._part, ans = st.drafts[x.id] || "";
          prog.textContent = "Marking part " + (k + 1) + " of " + boxes.length + "…";
          k++;
          if (!ans.trim()) { box._setMarks(x.rubric.map(function () { return { got: 0, reason: "No answer." }; })); next(); return; }
          var stem = pp.questions[x.qn - 1] && pp.questions[x.qn - 1].stem;
          var prompt = "You are marking a student's answer to one part of an exam-style question for COMP 2611 Data Structures (C++) at UWI.\n" +
            "Mark STRICTLY against the marking scheme. Award a scheme point only when the answer clearly and correctly contains it. Vague, partly correct, or missing statements earn 0 for that point (you may award part of a multi-mark point only when the scheme's text clearly splits). Do not award anything outside the scheme. A correct answer written in a different valid form still earns the point. Code is marked as written: do not assume missing lines.\n" +
            "Return JSON only, exactly in this shape: {\"points\": [{\"i\": 0, \"awarded\": 0, \"reason\": \"one short sentence that points at the student's own words or the missing piece\"}]}. Include one entry for every scheme point, in order.\n\n" +
            (stem ? "QUESTION STEM:\n" + stem + "\n\n" : "") + "PART (" + x.part + "), " + x.marks + " marks:\n" + x.q + "\n\nMARKING SCHEME (index: marks: what earns it):\n" + x.rubric.map(function (r, i) { return i + ": " + r.pts + ": " + r.text; }).join("\n") +
            "\n\nMODEL ANSWER (reference only):\n" + x.answer + "\n\nSTUDENT'S ANSWER:\n" + ans.slice(0, 6000);
          CL.Tutor.json(prompt, { modelTier: "default" }).then(function (j) {
            if (!j || !Array.isArray(j.points)) throw { code: "invalid_json" };
            box._setMarks(x.rubric.map(function (r, i) {
              var pnt = j.points.filter(function (y) { return +y.i === i; })[0] || {};
              return { got: Math.max(0, Math.min(r.pts, Math.round(+pnt.awarded || 0))), reason: String(pnt.reason || "").slice(0, 300) };
            }));
            next();
          }).catch(function (er) {
            btn.disabled = false;
            prog.textContent = CL.Tutor.errorText(er && er.code) + " Mark the remaining parts yourself.";
          });
        }
        next();
      }
    }
    draw();
  } };
})(CL);
