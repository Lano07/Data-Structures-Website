/* COMP 2611 Code Lab — the app: pages, routing, progress, runnable examples, quizzes and the Code Gym. */
(function () {
  "use strict";
  var D = window.CODELAB_DATA, esc = CL.esc;
  var app = document.getElementById("app");
  var KEY = "comp2611-codelab-v1";
  var store = { done: {}, ex: {}, play: null, quiz: {}, tb: {} };
  try { var saved = localStorage.getItem(KEY); if (saved) store = Object.assign(store, JSON.parse(saved)); } catch (e) { /* storage unavailable */ }
  store.quiz = store.quiz || {};
  store.tb = store.tb || {};
  store.lab = store.lab || {};
  store.train = store.train || {};
  store.miss = store.miss || [];
  store.trainPref = store.trainPref || { mode: "adaptive", style: "mcq" };
  store.exams = store.exams || [];
  store.pz = store.pz || {};
  store.cm = store.cm || {};
  store.srs = store.srs || {};
  // save in this browser, then (after a pause) to the synced copy on the viewer's account
  function save(localOnly) {
    try { localStorage.setItem(KEY, JSON.stringify(store)); CL.storageFailed = false; }
    catch (e) { if (!CL.storageFailed) { CL.storageFailed = true; setTimeout(storageWarning, 0); } }
    if (!localOnly && CL.Progress) CL.Progress.changed();
  }
  CL.store = store;
  CL.save = save;
  CL.Progress.attach(store, function (localOnly) { save(localOnly); }, KEY);
  var LN = CL.Learn;
  LN.migrate();
  function storageWarning() {
    if (document.querySelector(".store-warn")) return;
    var w = document.createElement("div");
    w.className = "store-warn";
    w.setAttribute("role", "alert");
    w.innerHTML = "<b>Your browser is not saving progress here</b> (private browsing, or storage is full). " + '<a href="#prefs">Download a backup or turn on sync</a> so nothing is lost. <button type="button" class="btn small ghost">Dismiss</button>';
    w.querySelector("button").addEventListener("click", function () { w.remove(); });
    document.body.appendChild(w);
  }
  // "Your turn" answers in the labs: right / answered per lab
  CL.onPractice = function (ok, lab, skipped) {
    var s = store.lab[lab || "lab"] = store.lab[lab || "lab"] || { r: 0, n: 0, k: 0 };
    s.n++;
    if (ok) s.r++;
    if (skipped) s.k = (s.k || 0) + 1;
    s.t = Date.now();
    CL.Progress.log("q");
    if (ok) CL.Progress.log("r");
    if (!skipped && LN.forLab[lab]) LN.record(LN.forLab[lab], ok, 0.5);
    save();
  };
  var Tu = CL.Tutor;
  function plain(html) { var d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/\s+/g, " ").trim(); }
  // the tutor's view of each page: kind, title, a context function and quick prompts
  var QUICK = {
    exam: [
      { label: "Review my last paper", prompt: "Review my last mock exam (in the context): which ideas did I get wrong, and what should I practise first?" },
      { label: "How should I pace myself?", prompt: "How should I pace myself in a 50-minute, 28-question multiple-choice exam like COMP 2611's Coursework Exam #1? Give me a simple plan." },
      { label: "Exam technique for tracing questions", prompt: "Give me a short checklist for answering tree, heap and hashing tracing questions in a multiple-choice exam without making careless mistakes." }
    ],
    train: [
      { label: "Give me a hint", prompt: "Give me one hint for the Trace Trainer question I'm on. If I haven't answered yet, do not tell me the answer." },
      { label: "Explain the answer", prompt: "Explain the answer to the Trace Trainer question I'm on, step by step, using its values. If I haven't answered yet, guide me instead of giving the answer." },
      { label: "Give me a similar question", prompt: "Give me one new question like the Trace Trainer question I'm on, with different values. Wait for my answer, then check it." },
      { label: "What should I practise?", prompt: "Look at my Trace Trainer results by topic (in the context) and tell me which topic to practise next and why." }
    ],
    home: [
      { label: "Make me a study plan", prompt: "Make me a study plan for COMP 2611 based on my progress (in the context). If you need to know when my next test is or what it covers, ask me first." },
      { label: "Quiz me on any topic", prompt: "Quiz me. First ask which topic I want. Then ask exam-style questions one at a time, wait for my answer, and give feedback on each before the next." },
      { label: "Explain pointers from zero", prompt: "Explain pointers from the very beginning with one tiny example, as if I'm meeting them for the first time. Then check my understanding with one question." },
      { label: "Which topic should I do next?", prompt: "Based on my progress in the context, which topic should I study next and why? Give me a short plan for the next hour." }
    ],
    lesson: [
      { label: "Explain this more simply", prompt: "Explain the section I'm reading more simply, step by step, with a tiny example. Then ask me one short question to check I've got it." },
      { label: "Show me another example", prompt: "Give me a new worked example of what I'm reading, with different values from the lesson, traced step by step." },
      { label: "Quiz me on this lesson", prompt: "Quiz me on this lesson exam-style: ask one question at a time, wait for my answer, then tell me whether I'm right and why before the next question." },
      { label: "Common exam mistakes here", prompt: "What mistakes do students commonly make with this topic in tests and exams? For each one, show a tiny example and how to avoid it." }
    ],
    lab: [
      { label: "Explain the current step", prompt: "Explain the current step in the lab and why the algorithm does it at this point." },
      { label: "Walk me through the whole run", prompt: "Walk me through what this algorithm does on the data in the lab, from start to finish, briefly and step by step." },
      { label: "Quiz me on this algorithm", prompt: "Quiz me on this algorithm with small tracing questions like the exam asks, one at a time. Wait for my answer each time." },
      { label: "Why is it this fast?", prompt: "What is the big-O of this algorithm, and why? Explain it using the data in the lab." }
    ],
    exercise: [
      { label: "Give me a hint", prompt: "Give me one hint for my current code. Do not write the solution." },
      { label: "Review my code", prompt: "Review my current code for this exercise. Tell me what is right, what is wrong, and which cases it would fail. Hints only, no full solution." },
      { label: "Explain the task", prompt: "Explain what this exercise asks me to do, with a small example of the input and what my function should produce." },
      { label: "How do I start?", prompt: "I don't know how to start this exercise. Help me plan it: list the cases the way the lectures do (for example: the list is empty, the key is first, ...) without writing the code for me." }
    ],
    play: [
      { label: "Explain this program", prompt: "Explain what my program does, line by line where it matters, and what it will print." },
      { label: "Why doesn't it work?", prompt: "My program doesn't do what I want. Look at my code and the last run, find the problem, and explain it. Show the fix only for the lines that change." },
      { label: "Give me a practice program", prompt: "Write a short complete C++ program I can run here that practises a data structures topic. Tell me to predict its output before I run it." }
    ],
    gym: [
      { label: "Which exercise should I do?", prompt: "Which Code Gym exercises should I do next, based on my progress in the context? Explain why." },
      { label: "Teach me to write list functions", prompt: "Teach me a reliable method for writing linked list functions on paper in an exam, with one small example." },
      { label: "Quiz me on code tracing", prompt: "Give me a short C++ code-tracing question (what does it print?), wait for my answer, then explain." }
    ],
    ref: [
      { label: "Explain this section", prompt: "Explain the cheat-sheet section I'm looking at, one item at a time, with tiny examples." },
      { label: "Quiz me on big-O", prompt: "Quiz me on the big-O of data structure operations, one question at a time. Wait for my answer each time." },
      { label: "Compare two structures", prompt: "Help me compare data structures: ask which two I want to compare, then compare them clearly with a table." }
    ]
  };
  function progressText() {
    var done = lessonList.filter(function (l) { return store.done[l.id]; }).map(function (l) { return l.num; });
    var passed = D.exercises.filter(function (e) { var x = store.ex[e.id]; return x && x.passed; }).map(function (e) { return e.title; });
    var tried = D.exercises.filter(function (e) { var x = store.ex[e.id]; return x && x.tried && !x.passed; }).map(function (e) { return e.title; });
    var qs = Object.keys(store.quiz), right = qs.filter(function (k) { return store.quiz[k].right; }).length;
    return "Student progress on this site: lessons completed " + (done.length ? done.join(", ") : "none yet") + " (of " + lessonList.length + "). " +
      "Exercises passed: " + passed.length + " of " + D.exercises.length + (passed.length ? " (" + passed.slice(0, 30).join("; ") + ")" : "") + ". " +
      (tried.length ? "Exercises tried but not passed yet: " + tried.slice(0, 20).join("; ") + ". " : "") +
      "Quick-check questions answered: " + qs.length + ", first try right: " + right + ". " +
      (Object.keys(store.train).length ? "Trace Trainer results by topic (all time; last 20 in brackets): " + Object.keys(store.train).map(function (k) { var x = store.train[k], t = CL.Train.topicById[k]; return (t ? t.title : k) + " " + x.r + "/" + x.n + " (" + (x.h || "").split("").filter(function (c) { return c === "1"; }).length + "/" + (x.h || "").length + ")"; }).join("; ") + ". " : "") +
      (Object.keys(store.lab).length ? "Lab predictions (Your turn mode): " + Object.keys(store.lab).map(function (k) { var x = store.lab[k]; return k + " " + x.r + " right of " + x.n; }).join("; ") + "." : "") + "\n" +
      "Course parts: " + D.parts.map(function (p) { return p.id.toUpperCase() + " " + p.title + " (" + p.lectures + ")"; }).join("; ") + "\n" + learnText();
  }
  // concept mastery and the review queue, for the tutor
  function learnText() {
    var seen = LN.concepts.filter(function (c) { return LN.mastery(c.id).n > 0; });
    var cnt = LN.counts();
    return (seen.length ? "Concept mastery estimates (from every answer on the site; 0–100%): " + seen.map(function (c) { var m = LN.mastery(c.id); return c.title + " " + m.pct + "% (" + m.label + ", " + m.n + " answers)"; }).join("; ") + ". " : "No concept mastery data yet. ") +
      "Concepts not practised yet: " + LN.concepts.filter(function (c) { return !LN.mastery(c.id).n; }).map(function (c) { return c.title; }).join("; ") + ". " +
      "Review queue: " + cnt.dueQ + " missed questions and " + cnt.dueC + " flashcards due now. Final exam: " + LN.examDate().toString().slice(0, 21) + ".";
  }
  function setTutor(kind, title, context, quick) {
    if (Tu) Tu.setPage({ kind: kind, title: title, context: context, quick: quick || QUICK[kind] || QUICK.home });
  }
  var EXAM = { name: "Coursework Exam #1", when: new Date("2026-10-27T08:30:00-04:00"), where: "TLC E, 8:30–9:20 am", topics: [
    { t: "Linked lists", part: "c", n: 2 }, { t: "Binary trees", part: "f", n: 5 }, { t: "Binary search trees", part: "g", n: 10 }, { t: "Heaps", part: "h", n: 7 }, { t: "Performance", lesson: "l1-performance", n: 4 }] };

  var lessonList = [];
  D.parts.forEach(function (p) { p.lessons.forEach(function (id, i) { if (D.lessons[id]) lessonList.push({ id: id, part: p, num: p.id.toUpperCase() + (i + 1) }); }); });
  var lessonInfo = {};
  lessonList.forEach(function (l, i) { l.index = i; lessonInfo[l.id] = l; });
  var exById = {};
  D.exercises.forEach(function (e) { exById[e.id] = e; });
  var topicTitle = {};
  D.topics.forEach(function (t) { topicTitle[t.id] = t.title; });
  var labById = {};
  D.labs.forEach(function (l) { labById[l.id] = l; });

  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function toast(msg) {
    var t = h("div", "toast", esc(msg));
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  CL.toast = toast;
  function norm(s) { return String(s || "").replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n").replace(/\n+$/, ""); }

  // ---------------------------------------------------------------- shell
  app.innerHTML = '<header class="top"><div class="top-in"><a class="brand" href="#home"><b>COMP 2611 <i>Code Lab</i></b><span>C++ data structures</span></a>' +
    '<nav class="nav" aria-label="Main"><a href="#quest" data-r="quest" class="nav-quest">⚔ Quest</a><a href="#learn" data-r="learn">Learn</a><a href="#lab" data-r="lab">Labs</a><a href="#train" data-r="train">Practice</a><a href="#arcade" data-r="arcade" class="nav-arcade">Arcade</a><a href="#gym" data-r="gym">Code Gym</a><a href="#play" data-r="play">Playground</a><a href="#ref" data-r="ref">Reference</a><a href="#progress" data-r="progress">Progress</a></nav><button type="button" class="srch-btn" aria-label="Search the site (press /)" title="Search (/)"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
    '<a class="srch-btn set-btn" href="#prefs" aria-label="Settings and your data" title="Settings and your data"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M10.3 3h3.4l.5 2.4c.6.2 1.2.5 1.7.9l2.3-.8 1.7 2.9-1.8 1.6c.1.6.1 1.4 0 2l1.8 1.6-1.7 2.9-2.3-.8c-.5.4-1.1.7-1.7.9l-.5 2.4h-3.4l-.5-2.4c-.6-.2-1.2-.5-1.7-.9l-2.3.8-1.7-2.9 1.8-1.6c-.1-.6-.1-1.4 0-2L3.4 8.4l1.7-2.9 2.3.8c.5-.4 1.1-.7 1.7-.9z"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><i class="sync-dot" aria-hidden="true"></i></a></div></header>' +
    '<main id="main"></main><footer class="foot">Built for COMP 2611 at UWI. Your progress is saved in this browser, and on your account when sync is on (<a href="#prefs">settings and backups</a>). The C++ runner works in the page, so programs never leave your device.</footer>';
  var main = document.getElementById("main");
  var current = null;
  app.querySelector(".srch-btn").addEventListener("click", function () { openSearch(); });

  function route() {
    var hash = (location.hash || "#home").slice(1);
    if (current && current.destroy) { try { current.destroy(); } catch (e) { /* ignore */ } }
    current = null;
    (CL.liveTerminals || []).forEach(function (t) { try { t.destroy(); } catch (e) { /* ignore */ } });
    CL.liveTerminals = [];
    main.innerHTML = "";
    var r = "home";
    if (hash === "learn") { r = "learn"; pageLearn(); }
    else if (hash.indexOf("l-") === 0 && D.lessons[hash.slice(2)]) { r = "learn"; pageLesson(hash.slice(2)); }
    else if (hash === "lab") { r = "lab"; pageLabs(); }
    else if (hash.indexOf("lab-") === 0 && labById[hash.slice(4)]) { r = "lab"; pageLab(hash.slice(4)); }
    else if (hash === "lectures") { r = "learn"; pageLectures(); }
    else if (hash === "prefs") { r = ""; pagePrefs(); }
    else if (hash === "glossary") { r = "ref"; pageGlossary(); }
    else if (hash === "train") { r = "train"; pageTrain(); }
    else if (hash === "exam") { r = "train"; pageExam(); }
    else if (hash === "gym") { r = "gym"; pageGym(); }
    else if (hash.indexOf("ex-") === 0 && exById[hash.slice(3)]) { r = "gym"; pageExercise(hash.slice(3)); }
    else if (hash === "play") { r = "play"; pagePlay(); }
    else if (hash === "ref") { r = "ref"; pageRef(); }
    else if (CL.pages[hash]) { r = CL.pages[hash].nav; CL.pages[hash].draw(CL.ui); }
    else if (/^[a-z0-9]+-./.test(hash) && CL.pages[hash.split("-")[0] + "-"]) { var pg = CL.pages[hash.split("-")[0] + "-"]; r = pg.nav; if (pg.draw(CL.ui, hash.slice(hash.indexOf("-") + 1)) === false) { main.innerHTML = ""; pageHome(); r = "home"; } }
    else pageHome();
    document.querySelectorAll(".nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-r") === r); });
    bookmarkButton(hash);
    window.scrollTo(0, 0);
    scrollPending();
  }
  window.addEventListener("hashchange", route);

  // ---------------------------------------------------------------- bookmarks: lessons, labs, exercises, questions and references
  store.bm = store.bm || {};
  var BM_KIND = [[/^l-/, "Lesson"], [/^lab-/, "Lab"], [/^ex-/, "Exercise"], [/^written-/, "Written answer"], [/^(ref|cpp|glossary|exam-review|lectures)$/, "Reference"]];
  function bmKind(hash) { for (var i = 0; i < BM_KIND.length; i++) if (BM_KIND[i][0].test(hash)) return BM_KIND[i][1]; return null; }
  function bookmarks() { return Object.keys(store.bm).filter(function (k) { return store.bm[k] && !store.bm[k].off; }).map(function (k) { return Object.assign({ hash: k }, store.bm[k]); }).sort(function (a, b) { return b.t - a.t; }); }
  CL.bookmarks = bookmarks;
  function bookmarkButton(hash) {
    var kind = bmKind(hash), title = main.querySelector("h1.title");
    if (!kind || !title) return;
    var on = store.bm[hash] && !store.bm[hash].off;
    var b = h("button", "bm-btn" + (on ? " on" : ""), on ? "★" : "☆");
    b.type = "button";
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.setAttribute("aria-label", on ? "Remove bookmark" : "Bookmark this page");
    b.title = on ? "Remove bookmark" : "Bookmark this page";
    b.addEventListener("click", function () {
      var was = store.bm[hash] && !store.bm[hash].off;
      // a removed bookmark is kept as "off" with a time, so that syncing another device does not bring it back
      store.bm[hash] = was ? { off: 1, t: Date.now() } : { t: Date.now(), title: title.textContent.slice(0, 120), kind: kind };
      save();
      b.classList.toggle("on", !was);
      b.textContent = was ? "☆" : "★";
      b.setAttribute("aria-pressed", was ? "false" : "true");
      b.setAttribute("aria-label", was ? "Bookmark this page" : "Remove bookmark");
      toast(was ? "Bookmark removed" : "Bookmarked. Find it on the Progress page.");
    });
    title.appendChild(b);
  }
  function bookmarkList(limit) {
    var bm = bookmarks().slice(0, limit || 50);
    if (!bm.length) return "";
    return '<ul class="bm-list">' + bm.map(function (x) { return '<li><a href="#' + esc(x.hash) + '"><span class="chip">' + esc(x.kind || "") + "</span> " + esc(x.title || x.hash) + "</a></li>"; }).join("") + "</ul>";
  }
  CL.bookmarkList = bookmarkList;

  function page(cls) { var p = h("div", "page" + (cls ? " " + cls : "")); main.appendChild(p); return p; }
  function partProgress(p) {
    var ids = p.lessons.filter(function (id) { return D.lessons[id]; });
    var done = ids.filter(function (id) { return store.done[id]; }).length;
    return { done: done, total: ids.length };
  }
  function nextLesson() {
    for (var i = 0; i < lessonList.length; i++) if (!store.done[lessonList[i].id]) return lessonList[i];
    return lessonList[0];
  }

  // ---------------------------------------------------------------- today: streak, daily goal, reviews due, next step
  function todayCard() {
    var c = h("section", "today");
    var act = (store.act || {})[CL.Progress.day()] || {}, goalN = (store.goal && store.goal.daily) || 20, doneN = (act.q || 0) + (act.c || 0);
    var cnt = LN.counts(), streak = CL.Progress.streak(), pathNext = CL.pathNext ? CL.pathNext() : null;
    var pct = Math.min(100, Math.round(100 * doneN / goalN));
    c.innerHTML = '<div class="td-ring" style="--p:' + pct + '" role="img" aria-label="' + doneN + " of " + goalN + ' questions and cards today"><b>' + doneN + "</b><span>of " + goalN + "</span></div>" +
      '<div class="td-body"><div class="pl">Today</div><div class="td-line">' + (doneN >= goalN ? "<b>Daily goal reached.</b> " : doneN ? "<b>" + (goalN - doneN) + " more</b> questions or flashcards to reach today's goal. " : "Answer " + goalN + " questions or flashcards to reach today's goal. ") +
      (streak ? "Study streak: <b>" + streak + " day" + (streak > 1 ? "s" : "") + "</b>." : "Start a study streak today.") + "</div>" +
      (pathNext ? '<div class="td-line">Next on your plan: ' + CL.stepLinkHtml(pathNext.step) + "</div>" : "") + "</div>" +
      '<div class="btns">' + (cnt.dueQ ? '<button type="button" class="btn primary" data-go="review">Review ' + cnt.dueQ + " missed question" + (cnt.dueQ > 1 ? "s" : "") + "</button>" : "") +
      (cnt.dueC ? '<a class="btn' + (cnt.dueQ ? "" : " primary") + '" href="#cards">' + cnt.dueC + " flashcard" + (cnt.dueC > 1 ? "s" : "") + " due</a>" : "") +
      (!cnt.due ? '<button type="button" class="btn primary" data-go="adaptive">Adaptive practice</button>' : "") + '<a class="btn ghost" href="#progress">Your progress</a></div>';
    CL.wireStepLinks(c);
    c.addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]");
      if (!b) return;
      store.trainPref.mode = b.getAttribute("data-go"); save(); location.hash = "#train";
    });
    return c;
  }

  // ---------------------------------------------------------------- home
  // the scene that goes with each part of the course (the Quest chapter on the same topic)
  var PART_SCENE = { a: "office", b: "harbor", c: "andes", d: "chichen", e: "panama", f: "ceiba", g: "seville", h: "giza", i: "bletchley", j: "bridges", k: "census", l: "pitch", n: "vault", m: "night" };
  function pageHome() {
    var p = page("home-page");
    setTutor("home", "Home page", progressText);
    var nl = nextLesson();
    var started = Object.keys(store.done).length > 0;
    var nGames = CL.Arcade ? CL.Arcade.count : 0;
    var A = CL.QArt, Q = CL.Quest && A && CL.Quest.worlds().length ? CL.Quest : null;
    var qs = Q ? Q.stats() : null, qn = Q ? Q.nextLevel() : null, me = Q ? Q.you() : { name: "Explorer" };
    var lessonHref = "#l-" + nl.id, questHref = qn && qs.levels ? "#quest-" + qn.id : "#quest";

    // the banner: a pixel night over the water, the course's name, and the ways in
    var hero = h("section", "hm-hero");
    hero.innerHTML = (A ? '<img class="hm-sky" src="' + A.panorama("night") + '" alt="" aria-hidden="true">' : "") +
      '<div class="hm-hero-in"><div class="eyebrow">COMP 2611 · Data Structures · C++</div><h1 class="hm-h1">Code Lab</h1>' +
      '<p class="hm-lede">Every data structure in the course, learned by doing: a story campaign through history, labs that take your own values, real C++ in a terminal, and exam practice that follows the COMP 2611 lecture notes and course outline.</p>' +
      '<div class="btns">' + (Q ? '<a class="btn primary hm-cta" href="' + questHref + '">▶ ' + (qs.levels ? "Continue the quest" : "Start the adventure") + "</a>" : "") +
      '<a class="btn blue hm-cta" href="' + lessonHref + '">' + (started ? "Continue lessons" : "Start lesson A1") + '</a><a class="btn hm-cta" href="#arcade">🕹️ Arcade</a></div></div>';
    p.appendChild(hero);

    var grid = h("div", "hm-grid"), main = h("div", "hm-main"), side = h("aside", "hm-side");
    grid.appendChild(main);
    grid.appendChild(side);
    p.appendChild(grid);
    var demo = null;
    current = { destroy: function () { if (demo) demo.destroy(); } };

    // count calendar days in the viewer's own time zone; hide each card once its exam is over
    var now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    function daysTo(t) { return Math.round((new Date(t.getFullYear(), t.getMonth(), t.getDate()) - d0) / 86400000); }
    var days = daysTo(EXAM.when);
    if (days >= 0 && now - EXAM.when <= 50 * 60000) {
      var ex = h("section", "exam-card");
      ex.innerHTML = "<h2>" + esc(EXAM.name) + (days === 0 ? " is today" : days === 1 ? " is tomorrow" : " is in " + days + " days") + '</h2><div class="when">Tuesday 27 October, ' + esc(EXAM.where) + ". 28 multiple-choice questions. Marks per topic are shown beside each link.</div>" +
        '<div class="exam-topics">' + EXAM.topics.map(function (t) {
          var href = t.lesson ? "#l-" + t.lesson : "#l-" + D.parts.filter(function (pp) { return pp.id === t.part; })[0].lessons[0];
          return '<a href="' + href + '">' + esc(t.t) + " <span>" + t.n + " Q" + "</span></a>";
        }).join("") + "</div>";
      main.appendChild(ex);
    }
    var C2 = CL.CW2;
    if (C2 && daysTo(C2.when) >= 0 && now - C2.when <= C2.minutes * 60000) {
      var c2 = h("section", "exam-card cw2-card"), areas = (D.cw2 && D.cw2.areas) || [];
      c2.innerHTML = "<h2>" + esc(C2.name) + " " + esc(C2.daysText()) + '</h2><div class="when">' + esc(C2.when.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })) + ", " + esc(C2.time) + ", " + esc(C2.where) + ". " + esc(C2.format) + ", 90 minutes, " + esc(C2.weight) + " of your grade. The marks for each area are beside its link.</div>" +
        '<div class="exam-topics">' + areas.map(function (a) { var l = (C2.links[a.id] || [])[0]; return '<a href="' + (l ? "#l-" + l[1] : "#cw2") + '">' + esc(a.title) + " <span>" + a.marks + " marks</span></a>"; }).join("") + "</div>" +
        '<div class="btns cw2-acts"><a class="btn primary" href="#cw2">Get ready: the Coursework Exam #2 page</a><a class="btn blue" href="#cw2-A">Sit mock paper A</a><a class="btn" href="#path-cw2">The eight-day plan</a></div>';
      main.appendChild(c2);
    }
    var fx = LN.examDate(), fdays = daysTo(fx), goal = store.goal || {};
    if (fdays >= 0 && now - fx <= (goal.examMin || 120) * 60000) {
      var fc = h("section", "exam-card final");
      fc.innerHTML = "<h2>Your final exam " + (fdays === 0 ? "is today" : fdays === 1 ? "is tomorrow" : "is in " + fdays + " days") + '</h2><div class="when">' + esc(fx.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })) + " at " + esc(fx.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })) + ", " + Math.round((goal.examMin || 120) / 60 * 10) / 10 + " hours. It covers the whole course. " +
        '<a href="#progress">Change the date</a> if it moves.</div>' +
        '<div class="exam-topics"><a href="#path-final">Week-by-week revision plan</a><a href="#diag">Find your weak spots (diagnostic)</a><a href="#exam">Whole-course mock exam</a><a href="#written">Written answers</a><a href="#exam-review">Exam technique</a></div>';
      main.appendChild(fc);
    }

    // jump back in: the Quest chapter and the lesson you are on
    main.appendChild(h("h2", "hm-h", "Jump back in"));
    function jump(href, art, kicker, title, sub, done, total, btn, btnCls) {
      var a = h("a", "hm-card hm-jump");
      a.href = href;
      a.innerHTML = (art ? '<img class="hm-jump-art" src="' + art + '" alt="" aria-hidden="true">' : "") + '<div class="hm-jump-t"><span class="hm-k">' + kicker + '</span><b class="hm-jump-h">' + esc(title) + '</b><span class="hm-jump-s">' + esc(sub) + "</span>" +
        '<div class="hm-prog"><div class="xpbar"><i style="width:' + Math.round(100 * done / Math.max(1, total)) + '%"></i></div><span>' + done + " / " + total + '</span></div></div><span class="btn ' + btnCls + '">' + btn + "</span>";
      return a;
    }
    if (Q) {
      var ws = Q.worlds(), w = qn ? qn.world : ws[ws.length - 1], wp = Q.worldProgress(w);
      main.appendChild(jump(questHref, A.scene(w.scene), "Quest · " + (w.index ? "Chapter " + w.index : "Prologue") + " · " + esc(w.place), qn ? qn.title : "The Lost Index is complete", w.title + (qn ? " · level " + (qn.index + 1) + " of " + w.levels.length : ""), wp.done, wp.total, qs.levels ? "Continue" : "Start", "primary"));
    }
    var part = nl.part, pr = partProgress(part);
    main.appendChild(jump(lessonHref, A ? A.scene(PART_SCENE[part.id] || "office") : "", "Lessons · Part " + part.id.toUpperCase() + " · " + esc(part.lectures), nl.num + " " + D.lessons[nl.id].title, part.title, pr.done, pr.total, started ? "Continue" : "Start", "blue"));
    main.appendChild(todayCard());
    var tm = TR.topics.map(function (t) { return { t: t, m: trainMastery(t.id) }; }).filter(function (x) { return x.m && x.m.recent >= 3; });
    if (tm.length || store.exams.length) {
      tm.sort(function (a, b2) { return a.m.pct - b2.m.pct; });
      var lastEx = store.exams[0], pc = h("section", "home-prac");
      pc.innerHTML = '<div><div class="pl">Your practice</div>' + (lastEx ? "<div>Last mock exam: <b>" + lastEx.score + "/" + lastEx.max + "</b> (" + Math.round(100 * lastEx.score / lastEx.max) + "%) on " + esc(lastEx.title) + "</div>" : "") +
        (tm.length ? "<div>Weakest topic right now: <b>" + esc(tm[0].t.title) + "</b> (" + tm[0].m.pct + "% of your last " + tm[0].m.recent + ")" + (tm.length > 1 ? ". Strongest: " + esc(tm[tm.length - 1].t.title) + " (" + tm[tm.length - 1].m.pct + "%)" : "") + "</div>" : "") +
        '</div><div class="btns">' + (tm.length ? '<a class="btn primary" href="#train" data-weak="' + tm[0].t.id + '">Practise ' + esc(lcTitle(tm[0].t.title)) + "</a>" : "") + '<a class="btn" href="#exam">Mock exams</a></div>';
      var wl = pc.querySelector("[data-weak]");
      if (wl) wl.addEventListener("click", function () { store.trainPref.mode = wl.getAttribute("data-weak"); save(); });
      main.appendChild(pc);
    }

    // ways to learn
    main.appendChild(h("h2", "hm-h", "Ways to learn and practise"));
    var modes = [["#quest", "⚔️", "Quest", "A story campaign through history: every level teaches by doing, from pointers to graphs."],
      ["#learn", "📘", "Lessons", lessonList.length + " lessons with code you can run, edit and step through, plus quick checks and puzzles."],
      ["#lab", "🔬", "Visual Labs", "Type your own values and watch trees, heaps, hash tables, graphs and sorts change step by step."],
      ["#gym", "💻", "Code Gym", D.exercises.length + " exercises: write the functions the exams ask for, run them in a terminal, then submit."],
      ["#arcade", "🕹️", "Arcade", nGames + " timed games: big-O, traversals, BST insertion, heapify, hashing, Dijkstra and spanning trees."],
      ["#boss", "🐉", "Boss Battles", "One boss per topic, fought with fresh exam-style questions, then the Final Exam."],
      ["#train", "⚡", "Practice", "Unlimited exam-style questions with worked solutions, flashcards and timed mock exams."],
      ["#play", "🖥️", "Playground", "A real C++ editor with projects, files from your computer, and a terminal."]];
    main.appendChild(h("div", "hm-modes", modes.map(function (m) { return '<a class="hm-card hm-mode" href="' + m[0] + '"><i aria-hidden="true">' + m[1] + "</i><b>" + m[2] + "</b><span>" + m[3] + "</span></a>"; }).join("") +
      '<a class="hm-card hm-mode tutor-only" href="#home" data-tutor><i aria-hidden="true">🤖</i><b>Your tutor</b><span>Ask Claude about any page, step or error, and get hints on exercises.</span></a>'));
    var tl = main.querySelector("[data-tutor]");
    if (tl) tl.addEventListener("click", function (e) { e.preventDefault(); if (Tu) Tu.open(); });

    // the memory visualizer, stepping through a real program
    var feat = h("section", "hm-card hm-feature");
    feat.innerHTML = '<div class="hm-fcopy"><div class="eyebrow">Memory visualizer</div><h2>See what your code does to memory.</h2><p>Step through real C++ one line at a time. Local variables live on the stack, objects made with <code>new</code> live on the heap, and every pointer is an arrow you can follow.</p><div class="btns"><a class="btn blue" href="#lab-memory">Open the Memory Visualizer</a><a class="btn ghost" href="#play">Write your own in the Playground</a></div></div><div class="hero-demo"></div>';
    main.appendChild(feat);
    demo = new CL.Visualizer(feat.querySelector(".hero-demo"), { compact: true });
    demo.load(D.heroCode);
    var firstCall = 0;
    demo.snaps.forEach(function (s, i) { if (!firstCall && s.kind === "step" && s.heap.length >= 3) firstCall = i; });
    if (firstCall) demo.go(firstCall);

    // the course, part by part
    main.appendChild(h("div", "sec-h", "<h2 class='hm-h'>The course, part by part</h2><span class='muted small'>" + lessonList.length + " lessons · " + D.exercises.length + " exercises · " + D.labs.length + " labs</span>"));
    var map = h("div", "hm-map"), nextPart = nl.part ? nl.part.id : "";
    D.parts.forEach(function (pt) {
      var r = partProgress(pt);
      if (!r.total) return;
      var pct = Math.round(100 * r.done / r.total), a = h("a", "hm-card hm-part" + (pct === 100 ? " cleared" : "") + (pt.id === nextPart ? " now" : ""));
      a.href = "#l-" + pt.lessons[0];
      a.innerHTML = '<span class="hm-part-id" aria-hidden="true">' + pt.id.toUpperCase() + '</span><div class="hm-part-b"><div class="hm-part-k">Part ' + pt.id.toUpperCase() + " · " + esc(pt.lectures) + (pct === 100 ? ' · <span class="ok">cleared</span>' : pt.id === nextPart ? ' · <span class="now">you are here</span>' : "") + "</div><b>" + esc(pt.title) + "</b><p>" + esc(pt.blurb) + '</p><div class="hm-prog"><div class="xpbar"><i style="width:' + pct + '%"></i></div><span>' + r.done + " / " + r.total + "</span></div></div>";
      map.appendChild(a);
    });
    main.appendChild(map);

    // the side panel: you, your numbers, today's quests, more to play
    if (CL.Game) CL.Game.dashCard({ name: me.name, avatar: A ? A.img("you", { scale: 3, pal: me.pal }) : "" }).forEach(function (el) { side.appendChild(el); });
    side.appendChild(h("section", "hm-card hm-links", '<h2 class="hm-h2">More to play</h2><a href="#boss"><span aria-hidden="true">🐉</span>Boss Battles</a><a href="#collection"><span aria-hidden="true">🃏</span>Algorithm Cards</a><a href="#exam"><span aria-hidden="true">📝</span>Mock exams</a><a href="#journal"><span aria-hidden="true">📔</span>Quest journal</a><a href="#lectures"><span aria-hidden="true">🗂️</span>Lecture by lecture</a>'));
  }

  // ---------------------------------------------------------------- learn index
  function pageLearn() {
    var p = page();
    setTutor("home", "All lessons", progressText);
    p.innerHTML = '<div class="eyebrow">Learn</div><h1 class="title">All lessons</h1><p class="lede">Work through the parts in order, or jump to what your next test covers. Every lesson has code you can run and step through.</p>' +
      '<div class="learn-alt"><a class="btn primary" href="#quest">⚔ Learn it as a story: The Lost Index (Quest)</a><a class="btn" href="#lectures">Follow the lectures instead: Lecture 1 to 21, mapped to the lessons</a><a class="btn ghost" href="#glossary">Glossary of terms</a></div>' +
      (bookmarks().length ? '<div class="learn-bm"><b>Your bookmarks</b>' + bookmarkList(8) + "</div>" : "");
    var list = h("div", "parts");
    D.parts.forEach(function (pt) {
      var pr = partProgress(pt);
      if (!pr.total) return;
      var row = h("section", "part-row");
      row.innerHTML = '<div><div class="pl">Part ' + pt.id.toUpperCase() + " · " + esc(pt.lectures) + "</div><h2>" + esc(pt.title) + "</h2><p>" + esc(pt.blurb) + '</p><div class="bar"><i style="width:' + Math.round(100 * pr.done / pr.total) + '%"></i></div></div>' +
        "<ol>" + pt.lessons.filter(function (id) { return D.lessons[id]; }).map(function (id) {
          var li = lessonInfo[id];
          return '<li><a href="#l-' + id + '"' + (store.done[id] ? ' class="done"' : "") + '><span class="n">' + li.num + "</span><span>" + esc(D.lessons[id].title) + (D.lessons[id].soon ? ' <span class="chip">coming soon</span>' : "") + "</span></a></li>";
        }).join("") + "</ol>";
      list.appendChild(row);
    });
    p.appendChild(list);
  }

  // ---------------------------------------------------------------- runnable code
  function filesOf(attr) {
    var files = {};
    if (!attr || attr === true) return files;
    attr.split(/\|\|/).forEach(function (spec) {
      var i = spec.indexOf("|");
      if (i > 0) files[spec.slice(0, i)] = spec.slice(i + 1).replace(/\\n/g, "\n");
    });
    return files;
  }
  CL.filesOf = filesOf;

  function explainErrorRow(code, err, kind) {
    if (!Tu || !code || !err) return null;
    var row = h("div", "tutor-row");
    row.appendChild(Tu.button("Explain this error", function () {
      Tu.ask("Explain this " + (kind || "error") + (err.line ? " on line " + err.line : "") + " and how to fix it.", {
        content: "My program gives this " + (kind || "error") + ".\n\nPROGRAM:\n" + CL.numbered(code) + "\n\nERROR" + (err.line ? " (line " + err.line + ")" : "") + ": " + err.msg + (err.hint ? "\nThe site's hint: " + err.hint : "") +
          "\n\nExplain in simple terms what this means, why my code causes it, and how to fix it. Show only the lines that change."
      });
    }));
    return row;
  }
  CL.explainErrorRow = explainErrorRow;
  function showResult(box, r, ed, opts) {
    opts = opts || {};
    box.innerHTML = "";
    var srcCode = opts.code || (ed ? ed.getValue() : "");
    if (ed) { ed.clearMarks("err"); ed.clearMarks("warn"); }
    if (!r.compiled) {
      box.appendChild(h("div", "errbox", "<b>The program does not compile" + (r.err.line ? " (line " + r.err.line + ")" : "") + ".</b> " + esc(r.err.msg) + (r.err.hint ? '<div class="hint">' + esc(r.err.hint) + "</div>" : "") +
        (/not supported|does not support|not available here/.test(r.err.msg) ? '<div class="hint">This runner covers the C++ used in COMP 2611, not all of C++. <a href="#cpp">See exactly what it supports</a>.</div>' : "")));
      var er0 = explainErrorRow(srcCode, r.err, "compile error");
      if (er0) box.appendChild(er0);
      if (ed && r.err.line) { ed.mark(r.err.line, "err", r.err.msg); ed.revealLine(r.err.line); }
      return;
    }
    var hd = h("div", "out-h", "Output");
    if (r.ok && r.leaks && opts.showLeaks !== false) hd.appendChild(h("span", "chip warn", r.leaks + " object" + (r.leaks > 1 ? "s" : "") + " never deleted"));
    box.appendChild(hd);
    var pre = h("pre", "out" + (r.out ? "" : " empty"));
    pre.textContent = r.out || "(nothing was printed)";
    box.appendChild(pre);
    if (r.err) {
      var what = r.err.kind === "limit" ? "The program was stopped" : "Runtime error";
      box.appendChild(h("div", "errbox", "<b>" + what + (r.err.line ? " on line " + r.err.line : "") + ".</b> " + esc(r.err.msg) + (r.err.hint ? '<div class="hint">' + esc(r.err.hint) + "</div>" : "")));
      var er1 = explainErrorRow(srcCode, r.err, r.err.kind === "limit" ? "problem" : "runtime error");
      if (er1) box.appendChild(er1);
      if (ed && r.err.line) { ed.mark(r.err.line, "err", r.err.msg); ed.revealLine(r.err.line); }
    }
    if (r.warnings && r.warnings.length && opts.warnings !== false) {
      r.warnings.slice(0, 3).forEach(function (w) {
        box.appendChild(h("div", "warnbox", "<b>Warning" + (w.line ? " (line " + w.line + ")" : "") + ":</b> " + esc(w.msg)));
        if (ed && w.line) ed.mark(w.line, "warn", w.msg);
      });
    }
    if (opts.files && r.files) {
      Object.keys(r.files).forEach(function (n) {
        if (opts.files[n] === r.files[n]) return;
        var d = h("details", "file-peek", "<summary>File " + esc(n) + " after the run</summary>");
        var fp = h("pre"); fp.textContent = r.files[n]; d.appendChild(fp);
        box.appendChild(d);
      });
    }
  }
  CL.showResult = showResult;
  CL.toPlayground = function (code, stdin, files, title) { CL.IDE.openExample(code, stdin || "", files || {}, title || "example"); };

  // modal visualizer
  function openViz(code, opts) {
    opts = opts || {};
    var m = h("div", "modal");
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    var inner = h("div", "modal-in", '<div class="modal-h"><h3>' + esc(opts.title || "Step through the program") + '</h3><button type="button" class="btn" data-close>Close</button></div>');
    m.appendChild(inner);
    document.body.appendChild(m);
    document.body.style.overflow = "hidden";
    var v = new CL.Visualizer(inner);
    v.load(code, opts);
    function close() { v.destroy(); m.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    m.addEventListener("click", function (e) { if (e.target === m || e.target.hasAttribute("data-close")) close(); });
    v.el.focus();
    return v;
  }
  CL.openViz = openViz;

  function runnable(b, ctx) {
    var a = b.attrs, code = b.code;
    var wrap = h("div", "ex");
    var stdin = typeof a.stdin === "string" ? a.stdin : "";
    var files = filesOf(a.file);
    var lines = code.split("\n").length;
    var ed = new CL.Editor(wrap, { value: code, label: a.example ? String(a.example) : "Example program", onRun: function () { run(); } });
    if (lines > 26) ed.scroll.style.maxHeight = "460px";
    var bar = h("div", "ex-bar");
    var lbl = a.example && a.example !== true ? esc(a.example) : "You can edit this code";
    bar.innerHTML = '<span class="lbl">' + lbl + "</span>" +
      '<button type="button" class="btn small primary" data-a="run">Run</button><button type="button" class="btn small" data-a="viz">Step through</button>' +
      '<button type="button" class="btn small ghost" data-a="reset" hidden>Reset</button><button type="button" class="btn small ghost" data-a="play">Open in Playground</button>';
    wrap.appendChild(bar);
    if (stdin) wrap.appendChild(h("div", "info-line", "Keyboard input for this program: <code>" + esc(stdin.replace(/\n/g, "↵ ")) + "</code>"));
    Object.keys(files).forEach(function (n) {
      var d = h("details", "file-peek", "<summary>This program reads the file " + esc(n) + "</summary>");
      var pre = h("pre"); pre.textContent = files[n]; d.appendChild(pre);
      wrap.appendChild(d);
    });
    var res = h("div", "run");
    wrap.appendChild(res);
    var resetBtn = bar.querySelector('[data-a="reset"]');
    ed.onChange(function (v) { resetBtn.hidden = v === code; });
    var term = null;
    function run() { runInTerminal(res, ed, { stdin: stdin, files: files, getTerm: function () { return term; }, setTerm: function (t) { term = t; } }); }
    bar.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      var act = t.getAttribute("data-a");
      if (act === "run") run();
      if (act === "viz") openViz(ed.getValue(), { stdin: stdin, files: files, title: a.example && a.example !== true ? a.example : "Step through the program" });
      if (act === "reset") { ed.setValue(code); ed.clearMarks(); if (term) { term.destroy(); term = null; } res.innerHTML = ""; resetBtn.hidden = true; }
      if (act === "play") CL.toPlayground(ed.getValue(), stdin, files, a.example && a.example !== true ? a.example : "example");
    });
    return wrap;
  }
  // run a program in a small terminal under its editor (lessons, puzzles, the quest): output streams in, cin waits for typing
  function runInTerminal(box, ed, o) {
    var term = o.getTerm();
    if (!term || !box.contains(term.el)) {
      box.innerHTML = "";
      term = new CL.Terminal(box, { title: o.title || "Output", cls: "term-inline",
        onLocate: function (file, line) { ed.revealLine(line); ed.mark(line, "cur", ""); setTimeout(function () { ed.clearMarks("cur"); }, 1400); ed.focus(); },
        onError: function (w, err, kind) { if (w.line) { ed.mark(w.line, kind === "warning" ? "warn" : "err", err.msg); if (kind !== "warning") ed.revealLine(w.line); } } });
      o.setTerm(term);
    }
    ed.clearMarks("err"); ed.clearMarks("warn");
    term.clear();
    var peeks = box.querySelectorAll(".file-peek.after");
    peeks.forEach(function (x) { x.remove(); });
    var files = o.files || {};
    term.exec({ src: ed.getValue(), files: files, file: "program.cpp", prepared: o.stdin ? o.stdin.replace(/\n$/, "").split("\n") : [],
      onDone: function (r) {
        if (o.onDone) o.onDone(r);
        if (!r || !r.files) return;
        Object.keys(r.files).forEach(function (n) {
          if (files[n] === r.files[n]) return;
          var d = h("details", "file-peek after", "<summary>File " + esc(n) + " after the run</summary>");
          var fp = h("pre"); fp.textContent = r.files[n]; d.appendChild(fp);
          box.appendChild(d);
        });
      } });
    return term;
  }
  CL.runInTerminal = runInTerminal;

  function errorExample(b) {
    var wrap = h("div", "ex error-ex");
    var code = b.code;
    var ed = new CL.Editor(wrap, { value: code, label: "Program with a bug" });
    var bar = h("div", "ex-bar", '<span class="lbl">This program has a mistake in it on purpose</span><button type="button" class="btn small primary" data-a="run">Run it</button><button type="button" class="btn small ghost" data-a="reset" hidden>Reset</button>');
    wrap.appendChild(bar);
    var res = h("div", "run");
    wrap.appendChild(res);
    var resetBtn = bar.querySelector('[data-a="reset"]');
    ed.onChange(function (v) { resetBtn.hidden = v === code; });
    var term = null;
    bar.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      if (t.getAttribute("data-a") === "run") runInTerminal(res, ed, { getTerm: function () { return term; }, setTerm: function (x) { term = x; } });
      if (t.getAttribute("data-a") === "reset") { ed.setValue(code); ed.clearMarks(); if (term) { term.destroy(); term = null; } res.innerHTML = ""; resetBtn.hidden = true; }
    });
    return wrap;
  }

  function memoryFigure(b) {
    var a = b.attrs;
    var fig = h("figure", "fig");
    fig.style.margin = "0 0 18px";
    var code = b.code;
    var stdin = typeof a.stdin === "string" ? a.stdin : "", files = filesOf(a.file);
    var r = CL.runTrace(code, { stdin: stdin, files: files });
    if (!r.compiled || !r.snaps || !r.snaps.length) { fig.appendChild(CL.codeBlock(code)); return fig; }
    var idx = -1, at = a.at && a.at !== true ? +a.at : 0;
    r.snaps.forEach(function (s, i) { if (s.kind === "step" && (!at || s.line === at)) idx = i; });
    if (idx < 0) idx = r.snaps.length - 1;
    var snap = r.snaps[idx];
    var marks = {};
    if (snap.line) marks[snap.line] = "l-cur";
    var cb = CL.codeBlock(code, { marks: marks, cls: "fig-code" });
    cb.style.borderRadius = "0";
    cb.style.border = "0";
    cb.style.borderBottom = "1px solid var(--line-2)";
    if (!a.hidecode) fig.appendChild(cb);
    var host = h("div");
    fig.appendChild(host);
    var mv = new CL.MemViz(host, {});
    mv.render(snap, null, r.structs);
    var cap = h("figcaption", "fig-cap");
    cap.innerHTML = (a.caption && a.caption !== true ? CL.inline(a.caption) + " " : "Memory just before the highlighted line runs. ") + '<button type="button" class="btn small" style="margin-left:6px">Step through it</button>';
    cap.querySelector("button").addEventListener("click", function () { openViz(code, { stdin: stdin, files: files, at: idx }); });
    fig.appendChild(cap);
    return fig;
  }

  function quizText(q, chosen) {
    var L = function (j) { return String.fromCharCode(65 + j); };
    var right = 0;
    q.opts.forEach(function (o, j) { if (o.right) right = j; });
    return "Quick-check question: " + plain(CL.inline(q.q)) + (q.code ? "\nCode:\n" + q.code : "") + "\nOptions:\n" +
      q.opts.map(function (o, j) { return L(j) + ") " + o.text.replace(/⏎/g, "\\n"); }).join("\n") +
      "\nI chose " + L(chosen) + ". The correct answer is " + L(right) + ".\nThe site's explanation: " + plain(CL.inline(q.expl || ""));
  }
  function quizBlock(q, qid) {
    var el = h("div", "quiz");
    var qh = h("div", "quiz-q");
    qh.innerHTML = '<span class="eyebrow">Quick check' + (q.title ? " · " + esc(q.title) : "") + "</span>" + CL.inline(q.q);
    el.appendChild(qh);
    if (q.code) el.appendChild(CL.codeBlock(q.code));
    var hasNl = q.opts.some(function (o) { return o.text.indexOf("⏎") >= 0; });
    if (hasNl) el.appendChild(h("p", "quiz-note", "↵ marks where the output moves to a new line."));
    var opts = h("div", "quiz-opts");
    var expl = h("div", "quiz-ex");
    expl.hidden = true;
    q.opts.forEach(function (o, i) {
      var btn = h("button", "quiz-opt");
      btn.type = "button";
      btn.innerHTML = '<span class="mk">' + String.fromCharCode(65 + i) + "</span><span>" + CL.inline(o.text.replace(/⏎/g, "↵")) + "</span>";
      btn.addEventListener("click", function () {
        if (el.classList.contains("done")) return;
        el.classList.add("done");
        var kids = opts.children;
        q.opts.forEach(function (oo, j) { if (oo.right) kids[j].classList.add("right"); });
        if (!o.right) btn.classList.add("wrong");
        expl.hidden = false;
        expl.innerHTML = "<b>" + (o.right ? "Correct." : "Not quite.") + "</b> " + CL.inline(q.expl || "");
        if (qid && !store.quiz[qid]) { store.quiz[qid] = { right: !!o.right, t: Date.now() }; CL.Progress.log("q"); if (o.right) CL.Progress.log("r"); LN.record(LN.forLesson(qid.split("#")[0]), !!o.right, 0.6); save(); }
        if (Tu) {
          var row = h("div", "tutor-row");
          row.appendChild(Tu.button(o.right ? "Go deeper with the tutor" : "Why was I wrong? Ask the tutor", function () {
            Tu.ask(o.right ? "I got this question right. Can we go a bit deeper?" : "Why is my answer to this question wrong?", {
              content: quizText(q, i) + "\n\n" + (o.right ? "I got it right. Make sure I really understand it: ask me one deeper follow-up question about the same idea, and wait for my answer." :
                "Explain step by step why my choice is wrong and why the correct answer is right. Then give me one similar question to try, and wait for my answer.")
            });
          }));
          expl.appendChild(row);
        }
      });
      opts.appendChild(btn);
    });
    el.appendChild(opts);
    el.appendChild(expl);
    return el;
  }

  function diagramBlock(d) {
    var box = h("div", "diagram");
    try {
      var parts = d.spec.split(/\s+/);
      var kind = parts.shift();
      var fn = CL.Diagrams && CL.Diagrams[kind];
      if (!fn) throw new Error("unknown diagram " + kind);
      var r = fn(parts.join(" "), d.body);
      box.appendChild(r.svg || r);
      if (r.cap) box.appendChild(h("div", "cap", CL.inline(r.cap)));
    } catch (e) {
      box.textContent = "(diagram could not be drawn: " + e.message + ")";
    }
    return box;
  }

  // "Explain it back": the student explains in their own words; the tutor gives feedback, or they compare with a model answer
  function teachbackBlock(b, tid, where) {
    var q = [], key = [];
    b.body.split("\n").forEach(function (l) {
      if (/^>>\s?/.test(l)) key.push(l.replace(/^>>\s?/, "").trim());
      else if (l.trim()) q.push(l.trim());
    });
    var qText = q.join(" ");
    var st = (tid && store.tb[tid]) || {};
    var el = h("div", "tb");
    el.innerHTML = '<div class="tb-h"><span class="box-k">Explain it back</span><span class="small muted">Putting it in your own words is the quickest way to find the gaps.</span></div>' +
      '<div class="tb-q">' + CL.inline(qText) + '</div>' +
      '<textarea class="plain tb-in" rows="4" aria-label="Your explanation" placeholder="Write your explanation here, in your own words…"></textarea>' +
      '<div class="btns"><button type="button" class="btn primary small tutor-only" data-a="check">Check my explanation</button><button type="button" class="btn small" data-a="key">Compare with a model answer</button><button type="button" class="btn small ghost tutor-only" data-a="talk">Work through it with the tutor</button></div>' +
      '<div class="tb-fb"></div><div class="tb-key" hidden><b>A complete answer covers:</b><ul>' + key.map(function (k) { return "<li>" + CL.inline(k) + "</li>"; }).join("") + "</ul></div>";
    var ta = el.querySelector("textarea"), fb = el.querySelector(".tb-fb"), keyEl = el.querySelector(".tb-key"), check = el.querySelector('[data-a="check"]');
    ta.value = st.text || "";
    if (st.fb) { fb.innerHTML = ""; fb.appendChild(Tu ? Tu.render(st.fb, true) : h("div", "", esc(st.fb))); }
    ta.addEventListener("input", function () { if (!tid) return; store.tb[tid] = Object.assign(store.tb[tid] || {}, { text: ta.value }); save(); });
    var ctl = null;
    el.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-a]");
      if (!btn) return;
      var a = btn.getAttribute("data-a");
      if (a === "key") { keyEl.hidden = !keyEl.hidden; btn.textContent = keyEl.hidden ? "Compare with a model answer" : "Hide the model answer"; if (tid) { store.tb[tid] = Object.assign(store.tb[tid] || {}, { peeked: true }); save(); } }
      if (a === "talk" && Tu) {
        Tu.ask("Help me answer this explain-it-back question: " + plain(CL.inline(qText)), {
          content: "In " + where + " there is an 'explain it back' question:\n" + plain(CL.inline(qText)) + "\n\nKey points a complete answer covers (do not just recite these to me):\n- " + key.join("\n- ") +
            "\n\nMy attempt so far: " + (ta.value.trim() ? "\"\"\"" + ta.value.trim() + "\"\"\"" : "(nothing yet)") +
            "\n\nHelp me build a complete explanation myself: ask me one guiding question at a time and respond to my answers."
        });
      }
      if (a === "check" && Tu) {
        var ans = ta.value.trim();
        if (ans.length < 15) { fb.textContent = "Write a sentence or two first, then check it."; return; }
        if (ctl) ctl.abort();
        ctl = new AbortController();
        check.disabled = true;
        fb.innerHTML = '<span class="thinking">Reading your explanation<i>.</i><i>.</i><i>.</i></span>';
        var prompt = Tu.RULES + "\n\nTASK: In " + where + ", the student was asked to explain something in their own words. Give feedback like a supportive, honest tutor.\n\nQuestion: " + plain(CL.inline(qText)) +
          "\nKey points a complete answer covers:\n- " + key.join("\n- ") + "\n\nThe student's explanation:\n\"\"\"\n" + ans + "\n\"\"\"\n\n" +
          "Reply in exactly this format:\n**Verdict:** Spot on, Nearly there, or Not yet, then one sentence.\n**What you got right:** the correct points in the student's own answer.\n**What to add or fix:** the missing or wrong points, explained simply (leave this line out if nothing is missing).\n**Try this:** one short follow-up question that takes the idea one step further.\n" +
          "Respond to what the student actually wrote; do not just list the key points. Stay under 170 words.";
        var latest = "", timer = null;
        Tu.run(prompt, { signal: ctl.signal, onText: function (u) { latest = u.text; if (!timer) timer = setTimeout(function () { timer = null; fb.innerHTML = ""; fb.appendChild(Tu.render(latest, false)); }, 90); } }).then(function (r) {
          clearTimeout(timer);
          fb.innerHTML = "";
          fb.appendChild(Tu.render(r.text, true));
          if (tid) {
            var verdict = /spot on/i.test(r.text) ? "spot" : /nearly there/i.test(r.text) ? "nearly" : /not yet/i.test(r.text) ? "notyet" : "";
            store.tb[tid] = Object.assign(store.tb[tid] || {}, { text: ans, fb: r.text, verdict: verdict, t: Date.now() });
            save();
          }
        }, function (er) {
          clearTimeout(timer);
          fb.textContent = er && er.code === "cancelled" ? "" : Tu.errorText(er && er.code);
        }).then(function () { check.disabled = false; });
      }
    });
    return el;
  }

  function mdHooks(opts) {
    opts = opts || {};
    var qn = 0, tn = 0, pn = 0, rn = 0;
    return {
      teachback: function (b) { return teachbackBlock(b, opts.lessonId ? opts.lessonId + "#t" + (tn++) : null, opts.where || "this lesson"); },
      parsons: function (b) { return parsonsBlock(b, opts.lessonId ? opts.lessonId + "#p" + (pn++) : null); },
      predict: function (b) { return predictBlock(b, opts.lessonId ? opts.lessonId + "#r" + (rn++) : null); },
      code: function (b) {
        if (b.lang !== "cpp" && b.lang !== "" && b.lang !== "c") {
          var pre = CL.codeBlock(b.code, { cls: "nonum" });
          return pre;
        }
        var hasMain = /\bint\s+main\s*\(/.test(b.code);
        if (b.attrs.memory && hasMain) return memoryFigure(b);
        if (b.attrs.error && hasMain && !opts.noRun) return errorExample(b);
        if (hasMain && !b.attrs.norun && !opts.noRun) return runnable(b);
        return CL.codeBlock(b.code, b.attrs.nonum ? { cls: "nonum" } : {});
      },
      quiz: function (q) { return quizBlock(q, opts.lessonId ? opts.lessonId + "#q" + (qn++) : null); },
      diagram: diagramBlock
    };
  }
  CL.mdHooks = mdHooks;


  // ---------------------------------------------------------------- code puzzles: put the lines in order
  // :::parsons question
  // the code lines in the right order; a line starting with ~ does not belong (a distractor)
  function parsonsBlock(b, pid) {
    var raw = b.body.replace(/\s+$/, "").split("\n").filter(function (l) { return l.trim(); });
    var lines = raw.map(function (l, i) { var d = /^~/.test(l); return { id: i, text: (d ? l.slice(1) : l).replace(/\t/g, "  ").replace(/\s+$/, ""), bad: d }; });
    var sol = lines.filter(function (l) { return !l.bad; });
    var key = function (t) { return t.trim().replace(/\s+/g, " "); };
    var wrap = h("div", "pz");
    var st = (pid && store.pz[pid]) || {};
    wrap.innerHTML = '<div class="pz-h"><span class="pz-k">Code puzzle</span>' + CL.inline(b.title || "Put the lines in the right order.") + "</div>" +
      '<p class="small muted pz-how">Tap the lines in the order they should run. Tap a line in your code to send it back. Indentation is a clue.' + (lines.some(function (l) { return l.bad; }) ? " One or more lines do not belong at all." : "") + "</p>" +
      '<div class="pz-cols"><div><div class="pz-lbl">Lines</div><div class="pz-pool" role="list"></div></div><div><div class="pz-lbl">Your code</div><div class="pz-ans" role="list"></div></div></div>' +
      '<div class="pz-fb" hidden></div><div class="pz-acts"><button type="button" class="btn primary" data-p="check">Check</button><button type="button" class="btn ghost" data-p="hint">Hint</button><button type="button" class="btn ghost" data-p="reset">Start again</button><button type="button" class="btn ghost" data-p="show">Show the answer</button></div>';
    var pool = wrap.querySelector(".pz-pool"), ans = wrap.querySelector(".pz-ans"), fb = wrap.querySelector(".pz-fb"), acts = wrap.querySelector(".pz-acts");
    var order = CL.shuffle(lines.slice()), placed = [];
    function lineEl(l, where, cls) {
      var bt = h("button", "pz-line" + (cls ? " " + cls : ""), CL.highlight ? CL.highlight(l.text) : esc(l.text));
      bt.type = "button";
      bt.setAttribute("data-id", l.id);
      bt.setAttribute("data-w", where);
      return bt;
    }
    function draw(marks) {
      pool.innerHTML = ""; ans.innerHTML = "";
      order.forEach(function (l) { if (placed.indexOf(l) < 0) pool.appendChild(lineEl(l, "pool")); });
      placed.forEach(function (l, i) { ans.appendChild(lineEl(l, "ans", marks ? marks[i] : "")); });
      if (!placed.length) ans.appendChild(h("div", "pz-empty", "Tap a line on the left to start."));
      if (!pool.childNodes.length) pool.appendChild(h("div", "pz-empty", "All lines used."));
    }
    function check(quiet) {
      var marks = [], right = 0, stop = false;
      placed.forEach(function (l, i) {
        if (!stop && !l.bad && sol[i] && key(sol[i].text) === key(l.text)) { marks.push("ok"); right++; }
        else { marks.push("no"); stop = true; }
      });
      var done = right === sol.length && placed.length === sol.length;
      draw(marks);
      if (quiet) return done;
      fb.hidden = false;
      var badUsed = placed.filter(function (l) { return l.bad; }).length;
      fb.className = "pz-fb " + (done ? "ok" : "bad");
      fb.innerHTML = done ? "<b>✓ Right.</b> That is the code, in order." : "<b>Not yet.</b> " + (right ? "The first " + right + " line" + (right > 1 ? "s are" : " is") + " in the right place. " : "The first line is not right yet. ") + (badUsed ? "Your code uses a line that does not belong. " : "") + (placed.length < sol.length ? "The finished code has " + sol.length + " lines; you have placed " + placed.length + "." : "");
      if (pid) { var rec = store.pz[pid] = store.pz[pid] || {}; rec.tries = (rec.tries || 0) + 1; if (done && !rec.ok && CL.Game) CL.Game.event("pz"); if (done) rec.ok = true; rec.t = Date.now(); if (rec.tries === 1) LN.record(LN.forLesson(pid.split("#")[0]), done, 0.5); save(); }
      if (done && Tu && !acts.querySelector(".tutor-btn")) acts.appendChild(Tu.button("Ask the tutor to explain each line", function () {
        Tu.ask("Explain this code line by line.", { content: "I just solved a code puzzle (putting lines in order) in a lesson. The code:\n" + sol.map(function (l) { return l.text; }).join("\n") + "\n\nExplain what each line does and why it has to come where it does. Keep it short." });
      }));
      return done;
    }
    wrap.addEventListener("click", function (e) {
      var ln = e.target.closest(".pz-line"), a = e.target.closest("[data-p]");
      if (ln) {
        var id = +ln.getAttribute("data-id"), l = lines[id];
        if (ln.getAttribute("data-w") === "pool") placed.push(l); else placed.splice(placed.indexOf(l), 1);
        fb.hidden = true;
        draw();
        return;
      }
      if (!a) return;
      var act = a.getAttribute("data-p");
      if (act === "check") check();
      if (act === "reset") { placed = []; fb.hidden = true; draw(); }
      if (act === "show") { placed = sol.slice(); check(); }
      if (act === "hint") {
        // keep the right beginning, then add the next correct line
        var k = 0;
        while (k < placed.length && !placed[k].bad && sol[k] && key(sol[k].text) === key(placed[k].text)) k++;
        placed = placed.slice(0, k);
        if (k < sol.length) {
          var want = key(sol[k].text), cand = lines.filter(function (l) { return !l.bad && placed.indexOf(l) < 0 && key(l.text) === want; })[0];
          if (cand) placed.push(cand);
        }
        fb.hidden = false;
        fb.className = "pz-fb hint";
        fb.innerHTML = "<b>Hint:</b> the first " + placed.length + " line" + (placed.length > 1 ? "s are" : " is") + " now in place.";
        draw();
        if (placed.length === sol.length) check();
      }
    });
    draw();
    if (st.ok) { var tag = h("span", "chip ok pz-done", "Solved before"); wrap.querySelector(".pz-h").appendChild(tag); }
    return wrap;
  }

  // ---------------------------------------------------------------- predict the output, then run it
  // :::predict question, with a ```cpp program inside
  function predictBlock(b, rid) {
    var m = /```(?:cpp|c\+\+)?[^\n]*\n([\s\S]*?)\n```/.exec(b.body);
    var codeText = m ? m[1] : b.body;
    var wrap = h("div", "pr");
    wrap.innerHTML = '<div class="pz-h"><span class="pz-k">Predict first</span>' + CL.inline(b.title || "What does this program print?") + "</div>";
    var cb = CL.codeBlock(codeText);
    wrap.appendChild(cb);
    var form = h("div", "pr-form", '<label class="small muted" for="pr-' + (rid || Math.random()).toString().replace(/\W/g, "") + '">Your prediction: exactly what appears on the screen</label><textarea class="pr-in" rows="3" spellcheck="false" autocapitalize="off" id="pr-' + (rid || Math.random()).toString().replace(/\W/g, "") + '"></textarea><div class="pr-acts"><button type="button" class="btn primary" data-r="check">Check my prediction</button><button type="button" class="btn ghost" data-r="skip">I am not sure: just run it</button></div>');
    wrap.appendChild(form);
    var out = h("div", "pr-out");
    out.hidden = true;
    wrap.appendChild(out);
    var ta = form.querySelector("textarea");
    var normOut = function (t) { return String(t).replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+/g, " ").trim(); }).join("\n").replace(/\n+$/, "").trim(); };
    function run(guess) {
      var r = CPP.run(codeText, {});
      var actual = r.ok ? r.out : "(the program stopped with an error: " + (r.err && r.err.msg) + ")";
      var ok = guess !== null && normOut(guess) === normOut(actual);
      out.hidden = false;
      out.innerHTML = '<div class="pz-fb ' + (guess === null ? "hint" : ok ? "ok" : "bad") + '">' + (guess === null ? "<b>Here is what it prints.</b> Read the code again with the answer in front of you: can you see why?" : ok ? "<b>✓ Exactly right.</b>" : "<b>Not quite.</b> Compare the two, line by line.") + "</div>" +
        '<div class="pr-cmp">' + (guess !== null ? '<div><div class="pz-lbl">You predicted</div><pre class="pr-pre">' + esc(guess) + "</pre></div>" : "") + '<div><div class="pz-lbl">It printed</div><pre class="pr-pre">' + esc(actual.replace(/\n$/, "")) + "</pre></div></div>";
      var a2 = h("div", "pr-acts");
      var sb = h("button", "btn small", "Step through it line by line");
      sb.type = "button";
      sb.addEventListener("click", function () { if (CL.openViz) CL.openViz(codeText, {}); });
      a2.appendChild(sb);
      if (Tu) a2.appendChild(Tu.button(ok ? "Ask the tutor a question about it" : "Why does it print that? Ask the tutor", function () {
        Tu.ask(ok ? "I predicted this program's output correctly. Quiz me on a variation of it." : "Why does this program print what it prints?", { content: "A predict-the-output exercise from a lesson.\n\nThe program:\n" + CL.numbered(codeText) + "\n\nMy prediction:\n" + (guess === null ? "(I didn't predict; I just ran it)" : guess) + "\n\nWhat it actually printed:\n" + actual + "\n\n" + (ok ? "Give me one small change to the program and ask me to predict the new output. Wait for my answer." : "Walk through the program step by step, showing the values that matter, and point out where my prediction went wrong.") });
      }));
      out.appendChild(a2);
      if (rid) { var rec = store.pz[rid] = store.pz[rid] || {}; rec.tries = (rec.tries || 0) + 1; if (ok && !rec.ok && CL.Game) CL.Game.event("pz"); if (ok) rec.ok = true; rec.t = Date.now(); if (rec.tries === 1) LN.record(LN.forLesson(rid.split("#")[0]), ok, 0.5); save(); }
    }
    form.addEventListener("click", function (e) {
      var bt = e.target.closest("[data-r]");
      if (!bt) return;
      if (bt.getAttribute("data-r") === "check") { if (!ta.value.trim()) { ta.focus(); ta.placeholder = "Type what you think it prints first."; return; } run(ta.value); }
      else run(null);
    });
    return wrap;
  }

  // ---------------------------------------------------------------- lesson page
  function lessonContext(id) {
    var L = D.lessons[id], info = lessonInfo[id];
    var heads = Array.prototype.slice.call(document.querySelectorAll(".lesson-main > .md > h2"));
    var cur = null, lim = window.innerHeight * 0.45;
    heads.forEach(function (hd) { if (hd.getBoundingClientRect().top < lim) cur = hd; });
    var sections = L.md.split(/^(?=## )/m), section = sections[0];
    if (cur) {
      var t = cur.textContent.replace(/\s+/g, " ").trim();
      sections.forEach(function (sec) { if (sec.split("\n")[0].replace(/^##\s+/, "").replace(/[`*]/g, "").replace(/\s+/g, " ").trim() === t) section = sec; });
    }
    return "Lesson " + info.num + ": " + L.title + (L.lectures ? " (" + L.lectures + ")" : "") + "\nSummary: " + plain(CL.inline(L.summary || "")) +
      "\nGoals: " + (L.goals || []).join("; ") + "\nSections: " + (L.md.match(/^## .*$/gm) || []).map(function (x) { return x.slice(3); }).join(" | ") +
      "\n\nTHE SECTION THE STUDENT IS READING NOW:\n" + Tu.clip(section, 6500) + "\n\nTHE WHOLE LESSON (may be cut short):\n" + Tu.clip(L.md, 6500);
  }
  // highlight text anywhere in a container, then ask the tutor about it
  function selectionAsk(container, where) {
    if (!Tu) return { destroy: function () {} };
    var btn = null, curText = "", timer = null;
    function hide() { if (btn) { btn.remove(); btn = null; } }
    function check() {
      if (!Tu.ready) return hide();
      var sel = window.getSelection();
      var text = sel && !sel.isCollapsed ? sel.toString().trim() : "";
      if (text.length < 4 || !sel.rangeCount || !container.contains(sel.anchorNode)) return hide();
      var rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect || (!rect.width && !rect.height)) return hide();
      curText = text;
      if (!btn) {
        btn = Tu.button("Ask the tutor about this", function () {
          var t = curText.length > 1500 ? curText.slice(0, 1500) + "…" : curText;
          hide();
          Tu.ask("Can you explain this part? “" + (t.length > 140 ? t.slice(0, 140) + "…" : t) + "”", {
            content: "In " + where + " I highlighted this part and want it explained:\n\"\"\"\n" + t + "\n\"\"\"\nExplain it simply, step by step, with a tiny example if it helps. Then ask me one short question to check I've understood."
          });
          try { window.getSelection().removeAllRanges(); } catch (e) { /* ignore */ }
        }, "sel-ask");
        btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
        document.body.appendChild(btn);
      }
      btn.style.left = Math.max(110, Math.min(window.innerWidth - 110, rect.left + rect.width / 2)) + "px";
      btn.style.top = Math.max(90, rect.top) + "px";
    }
    function later() { clearTimeout(timer); timer = setTimeout(check, 250); }
    function down(e) { if (btn && !btn.contains(e.target)) hide(); }
    container.addEventListener("mouseup", later);
    container.addEventListener("keyup", later);
    document.addEventListener("selectionchange", later);
    document.addEventListener("mousedown", down);
    window.addEventListener("scroll", hide, { passive: true });
    return { destroy: function () {
      hide(); clearTimeout(timer);
      document.removeEventListener("selectionchange", later);
      document.removeEventListener("mousedown", down);
      window.removeEventListener("scroll", hide);
    } };
  }
  function pageLesson(id) {
    var L = D.lessons[id], info = lessonInfo[id], pt = info.part;
    var p = page();
    setTutor("lesson", "Lesson " + info.num + " · " + L.title, function () { return lessonContext(id); });
    var wrap = h("div", "lesson");
    var side = h("nav", "lesson-side");
    side.setAttribute("aria-label", "Lessons");
    var sh = "";
    D.parts.forEach(function (pp) {
      var ids = pp.lessons.filter(function (x) { return D.lessons[x]; });
      if (!ids.length) return;
      if (pp === pt) {
        sh += "<h4>Part " + pp.id.toUpperCase() + " · " + esc(pp.title) + "</h4><ol>" + ids.map(function (x) {
          return '<li class="' + (store.done[x] ? "done" : "") + '"><a href="#l-' + x + '"' + (x === id ? ' class="on" aria-current="page"' : "") + '><span class="n">' + lessonInfo[x].num + "</span><span>" + esc(D.lessons[x].title) + "</span></a></li>";
        }).join("") + "</ol>";
      }
    });
    sh += "<h4>Other parts</h4><ol>" + D.parts.filter(function (pp) { return pp !== pt && pp.lessons.some(function (x) { return D.lessons[x]; }); }).map(function (pp) {
      var pr = partProgress(pp);
      return '<li><a href="#l-' + pp.lessons[0] + '"><span class="n">' + pp.id.toUpperCase() + "</span><span>" + esc(pp.title) + (pr.done ? " <span class='muted small'>(" + pr.done + "/" + pr.total + ")</span>" : "") + "</span></a></li>";
    }).join("") + "</ol>";
    side.innerHTML = sh;
    var art = h("article", "lesson-main");
    art.innerHTML = '<div class="crumbs"><a href="#learn">Learn</a><span>/</span><span>Part ' + pt.id.toUpperCase() + " · " + esc(pt.title) + '</span></div><div class="eyebrow">Lesson ' + info.num + (L.lectures ? " · " + esc(L.lectures) : "") + '</div><h1 class="title">' + esc(L.title) + "</h1>" + (L.summary ? '<p class="lede">' + CL.inline(L.summary) + "</p>" : "") +
      (L.outline ? '<div class="supp-note outline-note" role="note"><b>Course outline topic.</b> The COMP 2611 course outline lists this topic, but the lecture notes have not covered it yet. This lesson follows the outline and the course textbooks (Kalicharan; Cormen et al.); when the lectures reach it, follow the notes if they differ.</div>' : "") +
      (L.supp ? '<div class="supp-note" role="note"><b>Supplementary topic.</b> This is not in the COMP 2611 lecture notes. It is here to deepen your understanding of the course material; check with your lecturer before relying on it for coursework or exams.</div>' : "");
    if (L.goals && L.goals.length) art.appendChild(h("div", "goals", "<h4>After this lesson you can</h4><ul>" + L.goals.map(function (g) { return "<li>" + CL.inline(g) + "</li>"; }).join("") + "</ul>"));
    art.appendChild(CL.renderMd(L.md, mdHooks({ lessonId: id, where: "lesson " + info.num + " (" + L.title + ")" })));
    var exs = D.exercises.filter(function (e) { return e.lessons.indexOf(id) >= 0; });
    if (exs.length || (L.labs && L.labs.length)) {
      var tr = h("section", "md");
      var html = "<h2>Practise this</h2>";
      if (L.labs && L.labs.length) html += "<p>" + L.labs.map(function (l) { return labById[l] ? '<a class="btn small" href="#lab-' + l + '">' + esc(labById[l].title) + "</a>" : ""; }).join(" ") + "</p>";
      if (exs.length) html += '<div class="exlist">' + exs.map(exRow).join("") + "</div>";
      tr.innerHTML = html;
      art.appendChild(tr);
    }
    var prev = lessonList[info.index - 1], next = lessonList[info.index + 1];
    var foot = h("div", "lesson-foot");
    foot.innerHTML = (prev ? '<a class="btn ghost" href="#l-' + prev.id + '">← ' + esc(D.lessons[prev.id].title) + "</a>" : "<span></span>") +
      '<button type="button" class="btn ' + (store.done[id] ? "ok" : "") + '" data-done>' + (store.done[id] ? "Completed ✓" : "Mark as complete") + "</button>" +
      (next ? '<a class="btn primary" href="#l-' + next.id + '">Next: ' + esc(D.lessons[next.id].title) + " →</a>" : "<span></span>");
    foot.querySelector("[data-done]").addEventListener("click", function (e) {
      var b = e.currentTarget;
      store.done[id] = !store.done[id];
      if (!store.done[id]) delete store.done[id];
      save();
      b.textContent = store.done[id] ? "Completed ✓" : "Mark as complete";
      b.classList.toggle("ok", !!store.done[id]);
      var li = side.querySelector('a[href="#l-' + id + '"]');
      if (li) li.parentNode.classList.toggle("done", !!store.done[id]);
      if (store.done[id]) { CL.Progress.log("l"); toast("Lesson " + info.num + " marked as complete"); }
    });
    art.appendChild(foot);
    wrap.appendChild(art);
    wrap.appendChild(side);
    p.appendChild(wrap);
    current = selectionAsk(art, "lesson " + info.num + " (" + L.title + ")");
  }



  // ---------------------------------------------------------------- settings and your data
  function pagePrefs() {
    var p = page("prefs-page"), P = CL.prefs, G = CL.Progress;
    setTutor("home", "Settings", function () { return "The student is on the settings and data page."; });
    p.innerHTML = '<div class="eyebrow">Settings</div><h1 class="title">Settings and your data</h1><p class="lede">Change how the site looks, and keep your progress safe: back it up to a file, restore it, or keep a synced copy on your account.</p>';
    function seg(name, opts, cur) { return '<div class="seg" role="group" aria-label="' + esc(name) + '">' + opts.map(function (o) { return '<button type="button" data-pref="' + name + '" data-v="' + o[0] + '"' + (String(cur) === String(o[0]) ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + esc(o[1]) + "</button>"; }).join("") + "</div>"; }
    var look = h("section", "pf-sec");
    look.innerHTML = "<h2>Appearance</h2>" +
      '<div class="pf-row"><div><b>Theme</b><div class="small muted">System follows your device. Dark is a pixel night; light is daylight.</div></div>' + seg("theme", [["system", "System"], ["light", "Light"], ["dark", "Dark"]], P.theme) + "</div>" +
      '<div class="pf-row"><div><b>Text size</b><div class="small muted">Code, lessons and labs all scale together.</div></div>' + seg("size", CL.TEXT_SIZES.map(function (v, i) { return [v, ["Small", "Normal", "Large", "Larger", "Largest"][i]]; }), P.size) + "</div>" +
      '<div class="pf-row"><div><b>Motion</b><div class="small muted">Reduce turns off animations and smooth scrolling.</div></div>' + seg("motion", [["system", "System"], ["reduce", "Reduce"]], P.motion) + "</div>";
    p.appendChild(look);
    look.addEventListener("click", function (e) { var b = e.target.closest("[data-pref]"); if (b) CL.setPref(b.getAttribute("data-pref"), b.getAttribute("data-pref") === "size" ? +b.getAttribute("data-v") : b.getAttribute("data-v")); });

    // the tutor: teaching style, and a tutor server for copies of the page opened outside Claude
    var tut = h("section", "pf-sec");
    var M = CL.Tutor ? CL.Tutor.MODES : {};
    function drawTut() {
      var cur = CL.Tutor ? CL.Tutor.mode() : "guide", via = CL.Tutor && CL.Tutor.ready ? CL.Tutor.via : null;
      tut.innerHTML = "<h2>Tutor</h2>" +
        '<div class="pf-row"><div><b>Teaching style</b><div class="small muted">' + esc(M[cur] ? M[cur].desc : "") + "</div></div>" +
        '<div class="seg pf-modes" role="group" aria-label="Teaching style">' + Object.keys(M).map(function (k) { return '<button type="button" data-mode="' + k + '"' + (k === cur ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + ">" + esc(M[k].name) + "</button>"; }).join("") + "</div></div>" +
        '<p class="small">' + (via === "claude" ? "Connected through your Claude account." : via === "server" ? "Connected to your tutor server." : "The tutor is not connected on this copy of the page.") +
        " Without the tutor everything else still works: every practice question has a worked solution, exercises have hints in stages, and written answers can be marked against their scheme by you.</p>" +
        '<details class="pf-adv"' + (via === "claude" ? "" : " open") + "><summary>Use the tutor outside Claude</summary>" +
        "<p class=\"small\">Inside Claude the tutor needs no setup. In a downloaded copy of this page you can connect it to a tutor server that you or your course runs. The page never stores an API key: the server keeps the key secret and adds it to each request. A small server you can deploy (Node.js, no dependencies) is included in this site's source files as <code>server/tutor-proxy</code>.</p>" +
        '<div class="pf-row"><label class="pf-url">Server address <input type="url" class="in" placeholder="https://your-server.example/tutor" value="' + esc(CL.prefs.tutorUrl || "") + '"></label><div class="btns"><button type="button" class="btn small" data-a="tsave">Save and connect</button>' + (CL.prefs.tutorUrl ? '<button type="button" class="btn small ghost" data-a="tclear">Remove</button>' : "") + "</div></div>" +
        '<div class="pf-msg small" aria-live="polite"></div></details>';
    }
    drawTut();
    p.appendChild(tut);
    if (CL.Tutor && !CL.Tutor.ready) CL.Tutor.whenReady(function () { if (tut.isConnected) drawTut(); });
    tut.addEventListener("click", function (e) {
      var m = e.target.closest("[data-mode]"), a = e.target.closest("[data-a]");
      if (m) { CL.setPref("tutorMode", m.getAttribute("data-mode")); drawTut(); return; }
      if (!a) return;
      var msg = tut.querySelector(".pf-msg"), inp = tut.querySelector(".pf-url input");
      if (a.getAttribute("data-a") === "tsave") {
        var u = inp.value.trim();
        if (!CL.Tutor.validUrl(u)) { msg.textContent = "Use an https:// address (or http://localhost while testing)."; return; }
        CL.setPref("tutorUrl", u);
        if (CL.Tutor.ready && CL.Tutor.via === "claude") { msg.textContent = "Saved. This page is inside Claude, so it keeps using your Claude account; the server is used in downloaded copies."; return; }
        CL.Tutor.connectServer(u);
        msg.textContent = "Testing the server…";
        CL.Tutor.run("Reply with the single word: ready").then(function (r) { msg.textContent = "Connected. The server replied: " + String(r.text).slice(0, 60); drawTut(); }, function (err) { msg.textContent = CL.Tutor.errorText(err && err.code); });
      }
      if (a.getAttribute("data-a") === "tclear") { CL.setPref("tutorUrl", ""); drawTut(); }
    });

    var sync = h("section", "pf-sec");
    p.appendChild(sync);
    function drawSync() {
      var st = G.state, txt = {
        on: "On. A copy of your progress is saved to your account" + (G.last ? " (last saved " + new Date(G.last).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ")" : "") + ", so it follows you to other devices.",
        saving: "Saving to your account…", connecting: "Connecting to your account…",
        unavailable: G.err || "Not available here. In a downloaded copy of the site, or when you are signed out, progress stays in this browser only: use backup files instead.",
        off: "Off: this page was not allowed to use storage on your account. Progress stays in this browser.",
        error: G.err || "Something went wrong. Your progress is still saved in this browser.", local: "Starting…"
      }[st] || st;
      sync.innerHTML = "<h2>Sync to your account</h2>" + '<div class="pf-sync s-' + st + '"><i class="sync-dot s-' + st + '"></i><div>' + esc(txt) + (G.trimmed ? '<div class="small muted">Your exercise code drafts are too big to sync, so they stay in this browser; everything else is synced.</div>' : "") + "</div></div>" +
        '<p class="small muted">The copy is stored in this site\'s private storage for your account only: nobody else who opens the site can read it. It holds the same things as a backup file: lessons done, answers, scores, review cards, settings for practice, and code drafts.</p>' +
        (st === "on" || st === "error" ? '<button type="button" class="btn small" data-a="syncnow">Save to my account now</button>' : "");
    }
    drawSync();
    G.on(function () { if (sync.isConnected) drawSync(); });
    sync.addEventListener("click", function (e) { if (e.target.closest('[data-a="syncnow"]')) { G.flush(); toast("Saving…"); } });

    var bk = h("section", "pf-sec");
    var stats = (function () {
      var lessons = Object.keys(store.done || {}).length, ex = Object.keys(store.ex || {}).filter(function (k) { return store.ex[k] && store.ex[k].passed; }).length;
      var answered = Object.keys(store.train || {}).reduce(function (a, k) { return a + (store.train[k].n || 0); }, 0);
      return lessons + " lesson" + (lessons === 1 ? "" : "s") + " done, " + ex + " exercise" + (ex === 1 ? "" : "s") + " passed, " + answered + " practice question" + (answered === 1 ? "" : "s") + " answered, " + (store.exams || []).length + " mock exam" + ((store.exams || []).length === 1 ? "" : "s") + ".";
    })();
    bk.innerHTML = "<h2>Backups</h2><p>Your progress: " + esc(stats) + "</p>" +
      '<div class="pf-btns"><button type="button" class="btn primary" data-a="export">Download a backup file</button><button type="button" class="btn" data-a="copy">Copy backup text</button></div>' +
      '<h3>Restore</h3><p class="small muted">Merging keeps everything from both your current progress and the backup. Replacing uses only the backup.</p>' +
      '<div class="pf-btns"><label class="btn"><input type="file" accept=".json,application/json" hidden data-a="file">Choose a backup file</label><button type="button" class="btn ghost" data-a="paste">Paste backup text instead</button></div>' +
      '<div class="pf-paste" hidden><textarea rows="4" placeholder="Paste the backup text here" aria-label="Backup text"></textarea><div class="pf-btns"><button type="button" class="btn" data-a="merge">Merge it in</button><button type="button" class="btn ghost" data-a="replace">Replace my progress</button></div></div>' +
      '<div class="pf-msg" role="status"></div>' +
      '<h3>Automatic backups in this browser</h3><div class="pf-auto"></div>';
    p.appendChild(bk);
    var msg = bk.querySelector(".pf-msg");
    function say(t, ok) { msg.className = "pf-msg " + (ok ? "ok" : "bad"); msg.textContent = t; }
    function drawAuto() {
      var list = G.backups();
      bk.querySelector(".pf-auto").innerHTML = list.length ? '<ul class="pf-list">' + list.map(function (b2, i) { return "<li><span>" + esc(new Date(b2.t).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })) + ' <span class="muted small">(' + Math.max(1, Math.round(b2.data.length / 1024)) + ' KB)</span></span><button type="button" class="btn small ghost" data-restore="' + i + '">Restore this</button></li>'; }).join("") + "</ul>" : '<p class="small muted">None yet. One is made each day you visit, and before any restore or merge.</p>';
    }
    drawAuto();
    bk.addEventListener("click", function (e) {
      var a = e.target.closest("[data-a]"), rs = e.target.closest("[data-restore]");
      if (rs) {
        if (!rs.classList.contains("confirm")) { rs.classList.add("confirm"); rs.textContent = "Click again to restore"; return; }
        if (G.restoreBackup(+rs.getAttribute("data-restore"))) { say("Restored. (A copy of what you had a moment ago was saved first.)", true); drawAuto(); }
        return;
      }
      if (!a) return;
      var act = a.getAttribute("data-a");
      if (act === "export") G.exportFile().then(function () { say("Backup saved.", true); }, function (er) { if (er && er.code === "declined") return say("Download cancelled.", false); say("Downloads are not available here: use Copy backup text and paste it into a note or file.", false); });
      if (act === "copy") { var t = G.exportText(); if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { say("Copied " + Math.round(t.length / 1024) + " KB of backup text. Paste it somewhere safe.", true); }, function () { say("Could not copy. Your browser blocked the clipboard.", false); }); }
      if (act === "paste") bk.querySelector(".pf-paste").hidden = false;
      if (act === "merge" || act === "replace") {
        var txt = bk.querySelector(".pf-paste textarea").value;
        if (act === "replace" && !a.classList.contains("confirm")) { a.classList.add("confirm"); a.textContent = "Click again: this replaces everything"; return; }
        var r = G.importText(txt, act);
        say(r.msg, r.ok);
        if (r.ok) drawAuto();
      }
    });
    bk.querySelector('input[type=file]').addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { var r = G.importText(rd.result, "merge"); say(r.msg, r.ok); if (r.ok) drawAuto(); };
      rd.onerror = function () { say("Could not read that file.", false); };
      rd.readAsText(f);
    });

    var dz = h("section", "pf-sec danger");
    dz.innerHTML = '<h2>Start again</h2><p class="small muted">Clears all progress in this browser (and the synced copy, if sync is on). A backup is made first, so you can undo it from the list above.</p><button type="button" class="btn ghost" data-a="reset">Reset all my progress</button>';
    p.appendChild(dz);
    dz.addEventListener("click", function (e) {
      var b2 = e.target.closest('[data-a="reset"]');
      if (!b2) return;
      if (!b2.classList.contains("confirm")) { b2.classList.add("confirm"); b2.textContent = "Click again to reset everything"; return; }
      G.reset();
      toast("Progress reset. You can restore it from the automatic backups.");
      route();
    });
  }
  // ---------------------------------------------------------------- jumping to a section of a lesson or the reference
  function lcTitle(t) { t = String(t || ""); return /^C\+\+/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); }
  function slugOf(t) { return "s-" + String(t).toLowerCase().replace(/<[^>]+>|`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  CL.slugOf = slugOf;
  function goSection(hash, heading) {
    CL.pendingSection = heading ? slugOf(heading) : null;
    if (location.hash === hash) { route(); } else location.hash = hash;
  }
  CL.goSection = goSection;
  function scrollPending() {
    var id = CL.pendingSection;
    CL.pendingSection = null;
    if (!id) return;
    setTimeout(function () {
      var el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash");
      setTimeout(function () { el.classList.remove("flash"); }, 1800);
    }, 60);
  }
  function lessonLink(lid, section) {
    var L = D.lessons[lid], info = lessonInfo[lid];
    if (!L) return "";
    return '<a href="#l-' + lid + '" data-sec="' + esc(section || "") + '" data-l="' + lid + '">' + (info ? '<span class="n">' + info.num + "</span>" : "") + esc(L.title) + (section ? ' <span class="muted">› ' + esc(section) + "</span>" : "") + "</a>";
  }
  function wireSectionLinks(root) {
    root.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-l]");
      if (!a) return;
      var sec = a.getAttribute("data-sec");
      if (!sec) return;
      e.preventDefault();
      goSection("#l-" + a.getAttribute("data-l"), sec);
    });
  }

  // ---------------------------------------------------------------- the lectures, one by one
  function pageLectures() {
    var p = page();
    setTutor("home", "Lecture by lecture", function () { return progressText() + "\n\nThe student is looking at the lecture-by-lecture map: " + D.lectures.map(function (L) { return "Lecture " + L.n + ": " + L.title; }).join("; "); });
    p.innerHTML = '<div class="crumbs"><a href="#learn">Learn</a><span>/</span><span>Lecture by lecture</span></div><div class="eyebrow">Learn</div><h1 class="title">Lecture by lecture</h1>' +
      '<p class="lede">Every lecture in the course notes, with what it covers and where to learn it here. Missed a lecture? Read its lessons, watch its lab, then practise it.</p>';
    var jump = h("nav", "lec-jump");
    jump.setAttribute("aria-label", "Lectures");
    jump.innerHTML = D.lectures.map(function (L) { return '<a href="#lectures" data-j="' + L.n + '">' + L.n + "</a>"; }).join("") + '<a href="#lectures" data-j="outline">Outline</a>';
    p.appendChild(jump);
    var list = h("div", "lec-list");
    D.lectures.forEach(function (L) {
      var done = L.lessons.filter(function (x) { return store.done[x[0]]; }).length;
      var card = h("section", "lec");
      card.id = "lec-" + L.n;
      var gymN = D.exercises.filter(function (e) { return L.gym.indexOf(e.topic) >= 0; }).length;
      card.innerHTML = '<div class="lec-n"><span>Lecture</span><b>' + esc(L.n) + "</b></div>" +
        '<div class="lec-b"><h2>' + esc(L.title) + "</h2><ul class=\"lec-topics\">" + L.topics.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
        '<div class="lec-row"><span class="lec-k">Learn it</span><div class="lec-links">' + L.lessons.map(function (x) { return lessonLink(x[0], x[1]); }).join("") + "</div></div>" +
        '<div class="lec-row"><span class="lec-k">See it</span><div class="lec-links">' + L.labs.filter(function (id) { return labById[id]; }).map(function (id) { return '<a href="#lab-' + id + '">' + esc(labById[id].title) + "</a>"; }).join("") + "</div></div>" +
        '<div class="lec-row"><span class="lec-k">Practise it</span><div class="lec-links">' + L.train.filter(function (t) { return TR.topicById[t]; }).map(function (t) { return '<a href="#train" data-train="' + t + '">Trace Trainer: ' + esc(lcTitle(TR.topicById[t].title)) + "</a>"; }).join("") + (gymN ? '<a href="#gym">Code Gym (' + gymN + " exercises)</a>" : "") + "</div></div>" +
        '<div class="lec-prog small muted">' + done + " of " + L.lessons.length + " lessons done</div></div>";
      list.appendChild(card);
      if (L.n === "17") list.appendChild(h("p", "lec-gap small muted", "Lecture 18 is not in the notes this site was built from, so it is not mapped here."));
    });
    // the course outline goes further than the notes: those topics have their own part
    var outPart = D.parts.filter(function (pp) { return pp.id === "n"; })[0];
    if (outPart) {
      var oc = h("section", "lec lec-outline");
      oc.id = "lec-outline";
      var odone = outPart.lessons.filter(function (x) { return store.done[x]; }).length;
      oc.innerHTML = '<div class="lec-n"><span>Course</span><b>⋯</b></div><div class="lec-b"><h2>In the course outline, not in the notes yet</h2><ul class="lec-topics"><li>Sequential and binary search (outline topic 2)</li><li>Matrices with special properties: symmetric, triangular, band and sparse (topic 8; Lecture 1 lists it)</li><li>Floyd\'s all-pairs shortest paths (topic 7.3) and graph isomorphism (topic 7.5)</li><li>Integer sorting in O(n): counting sort and radix sort (topic 1.3)</li><li>Trees in proofs and counting: structural induction (learning outcome 6)</li></ul>' +
        '<div class="lec-row"><span class="lec-k">Learn it</span><div class="lec-links">' + outPart.lessons.map(function (x) { return lessonLink(x); }).join("") + "</div></div>" +
        '<div class="lec-row"><span class="lec-k">See it</span><div class="lec-links">' + ["matrix", "floyd", "isort"].filter(function (id) { return labById[id]; }).map(function (id) { return '<a href="#lab-' + id + '">' + esc(labById[id].title) + "</a>"; }).join("") + "</div></div>" +
        '<div class="lec-row"><span class="lec-k">Practise it</span><div class="lec-links"><a href="#gym" data-gym-outline>Code Gym (' + D.exercises.filter(function (e) { return e.topic === "outline"; }).length + " exercises)</a><a href=\"#arcade-bigo\">Arcade: Big-O Blitz</a></div></div>" +
        '<div class="lec-prog small muted">' + odone + " of " + outPart.lessons.length + " lessons done</div></div>";
      list.appendChild(oc);
      var gl = oc.querySelector("[data-gym-outline]");
      if (gl) gl.addEventListener("click", function () { gymFilter.topic = "outline"; });
    }
    p.appendChild(list);
    wireSectionLinks(list);
    list.addEventListener("click", function (e) { var a = e.target.closest("[data-train]"); if (a) { store.trainPref.mode = a.getAttribute("data-train"); save(); } });
    jump.addEventListener("click", function (e) { var a = e.target.closest("[data-j]"); if (!a) return; e.preventDefault(); var el = document.getElementById("lec-" + a.getAttribute("data-j")); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  // ---------------------------------------------------------------- glossary
  function pageGlossary() {
    var p = page();
    setTutor("ref", "Glossary", function () { return "The student is on the glossary page, which defines " + D.glossary.length + " course terms."; });
    p.innerHTML = '<div class="crumbs"><a href="#ref">Reference</a><span>/</span><span>Glossary</span></div><div class="eyebrow">Reference</div><h1 class="title">Glossary</h1><p class="lede">Every term the course uses, in the course\'s own sense, with a link to the lesson that teaches it.</p>';
    var box = h("div", "glo-search");
    box.innerHTML = '<input type="search" class="glo-in" placeholder="Filter terms, for example: successor, probing, height" aria-label="Filter the glossary">';
    p.appendChild(box);
    var list = h("dl", "glo");
    p.appendChild(list);
    function draw(f) {
      f = (f || "").trim().toLowerCase();
      var words = f.split(/\s+/).filter(Boolean);
      var items = D.glossary.filter(function (t) { var hay = (t.term + " " + t.def).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
      var html = "", letter = "";
      items.forEach(function (t) {
        var L = (t.term.replace(/^[^A-Za-z0-9]+/, "")[0] || "#").toUpperCase();
        if (L !== letter && !f) { letter = L; html += '<div class="glo-l">' + esc(L) + "</div>"; }
        html += '<div class="glo-i"><dt>' + esc(t.term) + "</dt><dd>" + esc(t.def) + '<div class="glo-src">' + lessonLink(t.lesson, t.section) + "</div></dd></div>";
      });
      list.innerHTML = html || '<p class="muted">No term matches that. Try the site search (press /).</p>';
    }
    var inp = box.querySelector("input");
    inp.addEventListener("input", function () { draw(inp.value); });
    wireSectionLinks(list);
    draw("");
  }

  // ---------------------------------------------------------------- site search
  var searchIndex = null;
  function plainMd(src) {
    return String(src || "").replace(/```[\s\S]*?```/g, " ").replace(/^:::.*$/gm, " ").replace(/^>>.*$/gm, " ").replace(/^- \[[ x]\] /gm, "").replace(/[*_`#>|]/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
  }
  function buildIndex() {
    var out = [];
    lessonList.forEach(function (li) {
      var L = D.lessons[li.id];
      out.push({ kind: "Lesson", title: li.num + " · " + L.title, text: L.summary || "", go: function () { location.hash = "#l-" + li.id; }, boost: 3 });
      var parts = L.md.split(/^## /m);
      parts.slice(1).forEach(function (sec) {
        var nl = sec.indexOf("\n"), head = sec.slice(0, nl).trim(), body = plainMd(sec.slice(nl));
        out.push({ kind: "Section", title: head, sub: li.num + " · " + L.title, text: body, go: function () { goSection("#l-" + li.id, head.replace(/`/g, "")); }, boost: 2 });
      });
    });
    D.glossary.forEach(function (t) { out.push({ kind: "Glossary", title: t.term, text: t.def, go: function () { goSection("#l-" + t.lesson, t.section); }, boost: 4 }); });
    D.exercises.forEach(function (e) { out.push({ kind: "Exercise", title: e.title, text: (e.blurb || "") + " " + plainMd(e.prompt || ""), go: function () { location.hash = "#ex-" + e.id; }, boost: 2 }); });
    D.labs.forEach(function (l) { out.push({ kind: "Lab", title: l.title, text: l.blurb + " " + l.intro, go: function () { location.hash = "#lab-" + l.id; }, boost: 2 }); });
    D.lectures.forEach(function (L) { out.push({ kind: "Lecture", title: "Lecture " + L.n + ": " + L.title, text: L.topics.join(". "), go: function () { location.hash = "#lectures"; setTimeout(function () { var el = document.getElementById("lec-" + L.n); if (el) el.scrollIntoView({ block: "start" }); }, 80); }, boost: 2 }); });
    D.ref.split(/^## /m).slice(1).forEach(function (sec) {
      var nl = sec.indexOf("\n"), head = sec.slice(0, nl).trim();
      out.push({ kind: "Cheat sheet", title: head, text: plainMd(sec.slice(nl)), go: function () { goSection("#ref", head.replace(/`/g, "")); }, boost: 1 });
    });
    out.forEach(function (x) { x.lt = x.title.toLowerCase(); x.lx = x.text.toLowerCase(); });
    return out;
  }
  function searchFor(q) {
    if (!searchIndex) searchIndex = buildIndex();
    var words = q.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 0; });
    if (!words.length) return [];
    var res = [];
    searchIndex.forEach(function (x) {
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], inT = x.lt.indexOf(w), inX = x.lx.indexOf(w);
        if (inT < 0 && inX < 0) return;
        score += (inT >= 0 ? (inT === 0 || /\W/.test(x.lt[inT - 1]) ? 12 : 7) : 0) + (inX >= 0 ? 2 + Math.min(4, x.lx.split(w).length - 1) : 0);
      }
      if (x.lt === q.toLowerCase().trim()) score += 20;
      res.push({ x: x, s: score * x.boost });
    });
    res.sort(function (a, b2) { return b2.s - a.s; });
    return res.slice(0, 30).map(function (r) { return r.x; });
  }
  function snippet(x, words) {
    var t = x.text, lt = x.lx, at = -1;
    words.forEach(function (w) { var i = lt.indexOf(w); if (i >= 0 && (at < 0 || i < at)) at = i; });
    var from = Math.max(0, at - 50), s = (from > 0 ? "…" : "") + t.slice(from, from + 150) + (t.length > from + 150 ? "…" : "");
    s = esc(s);
    words.forEach(function (w) { if (w.length > 1) s = s.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
    return s;
  }
  var searchUI = null;
  function openSearch() {
    if (!searchUI) {
      searchUI = h("div", "srch");
      searchUI.hidden = true;
      searchUI.innerHTML = '<div class="srch-in" role="dialog" aria-label="Search the site"><div class="srch-top"><input type="search" placeholder="Search lessons, terms, exercises, labs…" aria-label="Search"><button type="button" class="btn ghost small" data-x>Close</button></div><div class="srch-res" role="listbox"></div><div class="srch-foot small muted">↑ ↓ to move · Enter to open · Esc to close</div></div>';
      document.body.appendChild(searchUI);
      var inp = searchUI.querySelector("input"), box = searchUI.querySelector(".srch-res"), sel = 0, items = [];
      var draw = function () {
        var q = inp.value.trim();
        items = q ? searchFor(q) : [];
        var words = q.toLowerCase().split(/\s+/).filter(Boolean);
        sel = 0;
        box.innerHTML = !q ? '<p class="muted small" style="padding:10px 4px">Try: <i>successor</i>, <i>quadratic probing</i>, <i>maxHeapify</i>, <i>dangling pointer</i>, <i>Lecture 13</i>.</p>' :
          items.length ? items.map(function (x, i) { return '<button type="button" class="srch-r' + (i === 0 ? " on" : "") + '" data-i="' + i + '"><span class="srch-k">' + esc(x.kind) + "</span><b>" + esc(x.title) + "</b>" + (x.sub ? '<span class="small muted"> · ' + esc(x.sub) + "</span>" : "") + '<span class="srch-s">' + snippet(x, words) + "</span></button>"; }).join("") : '<p class="muted small" style="padding:10px 4px">Nothing found. Try a shorter word.</p>';
      };
      var pick = function (i) { var x = items[i]; if (!x) return; closeSearch(); x.go(); };
      inp.addEventListener("input", draw);
      inp.addEventListener("keydown", function (e) {
        var rs = box.querySelectorAll(".srch-r");
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!rs.length) return;
          rs[sel].classList.remove("on");
          sel = (sel + (e.key === "ArrowDown" ? 1 : rs.length - 1)) % rs.length;
          rs[sel].classList.add("on");
          rs[sel].scrollIntoView({ block: "nearest" });
        }
        if (e.key === "Enter") { e.preventDefault(); pick(sel); }
      });
      box.addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) pick(+b.getAttribute("data-i")); });
      searchUI.addEventListener("click", function (e) { if (e.target === searchUI || e.target.closest("[data-x]")) closeSearch(); });
      searchUI.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSearch(); });
      searchUI.draw = draw;
    }
    searchUI.hidden = false;
    document.documentElement.classList.add("srch-open");
    var i2 = searchUI.querySelector("input");
    i2.select();
    searchUI.draw();
    setTimeout(function () { i2.focus(); }, 20);
  }
  function closeSearch() { if (searchUI) { searchUI.hidden = true; document.documentElement.classList.remove("srch-open"); } }
  CL.openSearch = openSearch;
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "/" || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) { e.preventDefault(); openSearch(); }
  });

  // ---------------------------------------------------------------- labs
  function pageLabs() {
    var p = page();
    setTutor("lab", "Visual Labs", progressText, QUICK.home);
    p.innerHTML = '<div class="eyebrow">Visual Labs</div><h1 class="title">See every structure move</h1><p class="lede">Pick a lab, type your own values, and step through the algorithm with the course code beside it. In the algorithm labs, switch to <b>Your turn</b>: before each important step you predict what happens (which way a key goes, which child heapify swaps with, which vertex BFS prints next), and the lab checks you. The Memory Visualizer runs any C++ program from the lessons.</p>';
    var g = h("div", "labs");
    D.labs.forEach(function (l) {
      var a = h("a", "lab-card");
      a.href = "#lab-" + l.id;
      a.innerHTML = '<div class="lab-thumb">' + (CL.labThumb ? CL.labThumb(l.id) : "") + "</div><h3>" + esc(l.title) + '</h3><div class="pl">' + esc(l.lectures) + "</div><p>" + esc(l.blurb) + "</p>";
      g.appendChild(a);
    });
    p.appendChild(g);
  }
  function labContext(l) {
    var s = "Visual Lab: " + l.title + " (" + l.lectures + ")\nWhat this lab does: " + l.intro + "\n";
    if (current && current.tutorContext) s += current.tutorContext();
    else if (CL.activeViz && CL.activeViz.code) s += "Program shown:\n" + CL.numbered(CL.activeViz.code) + "\n" + CL.activeViz.tutorContext();
    return s;
  }
  function pageLab(id) {
    var l = labById[id];
    var p = page();
    setTutor("lab", l.title, function () { return labContext(l); });
    p.innerHTML = '<div class="crumbs"><a href="#lab">Labs</a><span>/</span><span>' + esc(l.title) + '</span></div><div class="eyebrow">' + esc(l.lectures) + '</div><h1 class="title">' + esc(l.title) + "</h1>";
    var host = h("div", "lab");
    host.appendChild(h("p", "lab-intro", esc(l.intro)));
    p.appendChild(host);
    if (CL.Labs && CL.Labs[id]) {
      var preset = CL.labPreset && CL.labPreset.id === id ? CL.labPreset.preset : null;
      CL.labPreset = null;
      if (preset) host.appendChild(h("div", "lab-from", "Showing the values from your Trace Trainer question. " + '<a href="#train">Back to the trainer</a>'));
      var inst = CL.Labs[id](host, preset);
      current = inst || null;
    } else host.appendChild(h("p", "muted", "This lab is not available."));
  }


  // ---------------------------------------------------------------- Trace Trainer
  var TR = CL.Train;
  function trainMastery(topic) {
    var x = store.train[topic];
    if (!x || !x.h) return null;
    var right = x.h.split("").filter(function (c) { return c === "1"; }).length;
    return { pct: Math.round(100 * right / x.h.length), n: x.n, r: x.r, recent: x.h.length, right: right };
  }
  CL.trainMastery = trainMastery;
  // srsId: the review-queue item this answer is a review of (the question shown may be a fresh version of it)
  function recordTrain(q, ok, srsId) {
    CL.Progress.log("q");
    if (ok) CL.Progress.log("r");
    if (srsId && LN.srs()[srsId]) { LN.record(LN.forQuestion(q), ok, 1); LN.grade(srsId, ok ? 2 : 0); }
    else LN.recordQuestion(q, ok);
    var x = store.train[q.topic] = store.train[q.topic] || { n: 0, r: 0, h: "" };
    x.n++;
    if (ok) x.r++;
    x.h = (x.h + (ok ? "1" : "0")).slice(-20);
    x.t = Date.now();
    var key = q.gen + ":" + q.seed;
    store.miss = store.miss.filter(function (m) { return m.g + ":" + m.s !== key && !(ok && srsId === "q:" + m.g + ":" + m.s); });
    if (!ok) store.miss.unshift({ g: q.gen, s: q.seed, t: Date.now() });
    store.miss = store.miss.slice(0, 60);
    save();
  }
  CL.recordTrain = recordTrain;
  function pickGen(mode, rnd) {
    rnd = rnd || Math.random;
    var topics = TR.topics.map(function (t) { return t.id; }).filter(function (t) { return TR.gens.some(function (g) { return g.topic === t; }); });
    var topic = mode;
    if (mode === "mixed") topic = topics[Math.floor(rnd() * topics.length)];
    if (mode === "weak") {
      var scored = topics.map(function (t) { var m = trainMastery(t); return { t: t, s: m ? m.pct - Math.min(m.recent, 10) : 45 }; }).sort(function (a, b2) { return a.s - b2.s; });
      topic = scored[Math.floor(rnd() * Math.min(3, scored.length))].t;
    }
    var gens = TR.gens.filter(function (g) { return g.topic === topic; });
    // statement questions are rarer than tracing questions
    var pool = [];
    gens.forEach(function (g) { var w = /^facts-/.test(g.id) ? 1 : 3; for (var i = 0; i < w; i++) pool.push(g); });
    return pool[Math.floor(rnd() * pool.length)];
  }
  // render a question; opts.mcq forces multiple choice; opts.onAnswer(ok, q) is called once
  function renderQuestion(q, host, opts) {
    opts = opts || {};
    var useMcq = opts.mcq || q.type === "choice";
    var card = h("article", "tq");
    var topic = TR.topicById[q.topic];
    var lv = LN.levelOf(q);
    card.innerHTML = '<div class="tq-h"><span class="chip">' + esc(topic ? topic.title : q.topic) + '</span><span class="tq-title">' + esc(q.title) + '</span><span class="tq-lv lv' + lv + '" title="Difficulty">' + "●●●".slice(0, lv) + "○○○".slice(lv) + " " + LN.LEVEL_NAME[lv] + '</span><span class="tq-marks">' + q.marks + " mark" + (q.marks > 1 ? "s" : "") + "</span></div>" +
      '<div class="tq-text">' + q.text + "</div>";
    if (q.code) { var cb = CL.codeBlock(q.code); cb.classList.add("tq-code"); card.appendChild(cb); }
    if (q.fig) card.appendChild(h("div", "tq-figs", q.fig));
    var ans = h("div", "tq-ans");
    card.appendChild(ans);
    var fb = h("div", "tq-fb");
    fb.hidden = true;
    card.appendChild(fb);
    var acts = h("div", "tq-acts");
    card.appendChild(acts);
    var sol = h("details", "tq-sol");
    sol.hidden = true;
    sol.innerHTML = "<summary>Worked solution</summary><ol>" + q.steps.map(function (st) { return "<li>" + st + "</li>"; }).join("") + "</ol>";
    card.appendChild(sol);
    host.appendChild(card);
    var done = false, given = null;
    function finish(ok, yourText, shown) {
      if (done) return;
      done = true;
      given = yourText;
      if (opts.quiet) { if (opts.onAnswer) opts.onAnswer(ok, q, shown, yourText); return; }
      var right = useMcq ? q.mcq.options[q.mcq.answer] : String(q.answer);
      fb.hidden = false;
      fb.className = "tq-fb " + (ok ? "ok" : shown ? "skip" : "bad");
      fb.innerHTML = ok ? "<b>✓ Right.</b>" : shown ? "<b>The answer:</b> " + right : "<b>✗ Not quite.</b> The answer is " + right + (yourText !== null && yourText !== undefined && !useMcq ? '. You wrote <span class="tq-you">' + esc(yourText) + "</span>" : "") + ".";
      if (!ok && !useMcq && yourText) {
        var a = TR.norm(yourText).split(" "), c = TR.norm(right).split(" ");
        if (c.length > 1) {
          var k = 0;
          while (k < a.length && k < c.length && a[k] === c[k]) k++;
          fb.innerHTML += ' <span class="small">' + (k === 0 ? "It goes wrong at the very first value." : "The first " + k + " value" + (k > 1 ? "s are" : " is") + " right; it goes wrong at value " + (k + 1) + ".") + (a.length !== c.length ? " The answer has " + c.length + " values; you wrote " + a.length + "." : "") + "</span>";
        }
      }
      if (!ok && !shown && q.why && yourText !== null && yourText !== undefined) {
        // the mistake that produces this exact wrong answer, when the generator knows it
        var why = q.why[TR.norm(useMcq ? q.mcq.options[yourText] : yourText)];
        if (why) fb.innerHTML += '<div class="tq-why"><b>Likely mistake:</b> ' + esc(why) + "</div>";
      }
      sol.hidden = false;
      sol.open = !ok;
      ans.querySelectorAll("button, input").forEach(function (x) { x.disabled = true; });
      if (useMcq) {
        ans.querySelectorAll(".quiz-opt").forEach(function (x, i) {
          if (i === q.mcq.answer) x.classList.add("right");
          else if (i === yourText) x.classList.add("wrong");
        });
      }
      drawActs();
      if (opts.onAnswer) opts.onAnswer(ok, q, shown);
    }
    if (useMcq) {
      var list = h("div", "quiz-opts tq-opts" + (q.grid ? " grid" : "") + (q.wide ? " wide" : ""));
      q.mcq.options.forEach(function (o, i) {
        var bt = h("button", "quiz-opt", '<span class="mk">' + String.fromCharCode(65 + i) + "</span><span>" + o + "</span>");
        bt.type = "button";
        bt.addEventListener("click", function () { finish(i === q.mcq.answer, i, false); });
        list.appendChild(bt);
      });
      ans.appendChild(list);
      if (opts.mcq === false && q.type === "choice") ans.insertBefore(h("p", "small muted tq-note", "This one is multiple choice."), list);
    } else {
      var row = h("div", "tq-type");
      var inp = h("input");
      inp.type = "text";
      inp.className = "tq-in";
      inp.setAttribute("autocomplete", "off");
      inp.setAttribute("autocapitalize", "characters");
      inp.setAttribute("spellcheck", "false");
      inp.setAttribute("aria-label", "Your answer");
      inp.placeholder = q.type === "seq" ? "Values in order, separated by spaces" : q.type === "num" ? "A number" : "Your answer";
      if (q.type === "num") inp.setAttribute("inputmode", "numeric");
      var chk = h("button", "btn primary", "Check");
      chk.type = "button";
      row.appendChild(inp);
      row.appendChild(chk);
      ans.appendChild(row);
      var check = function () {
        var v = inp.value.trim();
        if (!v) { inp.focus(); return; }
        var a = TR.norm(v), c = TR.norm(q.answer);
        var ok = a === c || (q.nospace && a.replace(/\s/g, "") === c.replace(/\s/g, ""));
        finish(ok, v, false);
      };
      chk.addEventListener("click", check);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
      if (opts.focus !== false) setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 30);
    }
    function drawActs() {
      acts.innerHTML = "";
      if (opts.quiet) {
        if (!done) {
          var dk = h("button", "btn small ghost", "I don't know");
          dk.type = "button";
          dk.addEventListener("click", function () { finish(false, null, true); });
          acts.appendChild(dk);
        }
        return;
      }
      if (!done) {
        if (q.hint) {
          var hb = h("button", "btn small ghost", "Hint");
          hb.type = "button";
          hb.addEventListener("click", function () { hb.remove(); var hp = h("p", "tq-hint", "<b>Hint:</b> " + esc(q.hint)); card.insertBefore(hp, ans); });
          acts.appendChild(hb);
        }
        if (Tu) acts.appendChild(Tu.button("Ask the tutor for help", function () {
          Tu.ask("Help me with this question (no answer yet, please).", { content: "I'm on this Trace Trainer question and I haven't answered it yet.\n\n" + questionText(q, useMcq) + "\n\nDon't tell me the answer. Ask me what I've tried, or give me one hint that helps me take the next step." });
        }));
        var sb = h("button", "btn small ghost", "Show the answer");
        sb.type = "button";
        sb.addEventListener("click", function () { finish(false, null, true); });
        acts.appendChild(sb);
      } else {
        var qlab = TR.labFor ? TR.labFor(q) : q.lab;
        if (qlab && labById[qlab.id]) {
          var lb = h("button", "btn small", "Watch it in the " + esc(labById[qlab.id].title));
          lb.type = "button";
          lb.title = "Opens the lab with this question's values; change them there to see what happens";
          lb.addEventListener("click", function () { CL.labPreset = qlab; location.hash = "#lab-" + qlab.id; });
          acts.appendChild(lb);
        }
        var qprog = TR.program ? TR.program(q) : null;
        if (qprog) {
          var pb = h("button", "btn small", "▶ Run it with your own values");
          pb.type = "button";
          pb.addEventListener("click", function () { tryProgram(card, qprog, q); pb.remove(); });
          acts.appendChild(pb);
        }
        if (Tu) acts.appendChild(Tu.button("Ask the tutor to explain", function () {
          var right = useMcq ? plain(q.mcq.options[q.mcq.answer]) : String(q.answer);
          Tu.ask("Explain this question's answer.", { content: "I answered a Trace Trainer question.\n\n" + questionText(q, useMcq) + "\n\nMy answer: " + (given === null || given === undefined ? "(I asked to see the answer)" : useMcq ? plain(q.mcq.options[given]) : given) + "\nThe right answer: " + right + "\nThe worked solution shown to me: " + q.steps.map(plain).join(" | ") + "\n\nExplain step by step how to get the right answer" + (given !== null && given !== undefined && plain(useMcq ? q.mcq.options[given] : given) !== right ? ", and where my answer probably went wrong" : "") + ". Then give me one quick check question on the same idea." });
        }));
        if (opts.next) acts.appendChild(opts.next);
      }
    }
    drawActs();
    return { card: card, finish: finish, isDone: function () { return done; }, pick: function (i) { if (useMcq && !done && q.mcq.options[i] !== undefined) finish(i === q.mcq.answer, i, false); } };
  }
  CL.renderQuestion = renderQuestion;
  // the question's code as a whole program: change the values, run it, step through it
  function tryProgram(card, src, q) {
    var box = h("div", "tq-try");
    box.innerHTML = '<div class="tq-try-h"><b>Try it with your own values</b><span class="small muted">This is the question\'s code as a complete program. Change the values in main() (or the function), then run it or step through it.</span></div>';
    card.appendChild(box);
    var ed = new CL.Editor(box, { value: src, label: "The question's program", tools: true, onRun: function () { go(); } });
    ed.scroll.style.maxHeight = "380px";
    var bar = h("div", "btns", '<button type="button" class="btn small primary" data-t="run">▶ Run</button><button type="button" class="btn small" data-t="viz">Step through</button><button type="button" class="btn small ghost" data-t="reset">Reset</button><button type="button" class="btn small ghost" data-t="play">Open in Playground</button>');
    box.appendChild(bar);
    var out = h("div", "run");
    box.appendChild(out);
    var term = null;
    function go() { runInTerminal(out, ed, { title: "Output", getTerm: function () { return term; }, setTerm: function (t) { term = t; } }); }
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-t]");
      if (!b) return;
      var t = b.getAttribute("data-t");
      if (t === "run") go();
      if (t === "viz") openViz(ed.getValue(), { title: "Step through: " + (q.title || "question") });
      if (t === "reset") ed.setValue(src);
      if (t === "play") CL.toPlayground(ed.getValue(), "", {}, q.title || "question");
    });
    go();
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  CL.tryProgram = tryProgram;
  function questionText(q, mcq) {
    var s = "Topic: " + (TR.topicById[q.topic] || {}).title + " (" + q.title + ", " + q.marks + " marks)\nQuestion: " + plain(q.text);
    if (q.code) s += "\nCode shown:\n" + q.code;
    if (q.ctx) s += "\nWhat the figure shows: " + q.ctx;
    if (mcq || q.type === "choice") s += "\nOptions: " + q.mcq.options.map(function (o, i) { return String.fromCharCode(65 + i) + ") " + plain(o); }).join("   ");
    return s;
  }
  CL.questionText = questionText;

  // while Coursework Exam #2 is coming up, a banner on the practice pages points to its page
  function cw2Banner() {
    var C2 = CL.CW2;
    if (!C2 || Date.now() > C2.when.getTime() + C2.minutes * 60000) return null;
    var a = h("a", "cw2-banner");
    a.href = "#cw2";
    a.innerHTML = "<b>Coursework Exam #2 " + esc(C2.daysText()) + "</b><span>" + esc(C2.format) + ", 90 minutes. Three mock papers in its format, with marking schemes, and an eight-day plan.</span><span class=\"btn primary small\">Get ready</span>";
    return a;
  }
  function pageTrain() {
    var p = page("train-page");
    var pref = store.trainPref;
    var sess = { n: 0, r: 0, streak: 0, best: 0 };
    var q = null, view = null, reviewing = null;
    setTutor("train", "Trace Trainer", function () {
      var s = progressText();
      if (q) s += "\n\nThe Trace Trainer question on screen:\n" + questionText(q, pref.style === "mcq") + (view && view.isDone() ? "\nThe student has answered it. The right answer: " + (pref.style === "mcq" || q.type === "choice" ? plain(q.mcq.options[q.mcq.answer]) : q.answer) + ". Worked solution: " + q.steps.map(plain).join(" | ") : "\nThe student has NOT answered it yet: do not reveal the answer; guide with hints and questions.");
      return s;
    });
    p.innerHTML = '<div class="eyebrow">Practice</div><h1 class="title">Trace Trainer</h1><p class="lede">Exam-style questions, made fresh every time from random values, so you never run out. Answer, check, then read the worked solution or watch the same values in a lab. Your results build up a picture of which topics need work.</p>' +
      '<a class="tr-exam" href="#exam"><b>Ready to test yourself?</b><span>Sit a timed mock exam: a new CW1-format paper every time, the four hand-written papers, or the second half of the course.</span><span class="go">Mock exams →</span></a>' +
      '<nav class="tr-more-links" aria-label="More practice"><a href="#written"><b>Written answers</b><span>Explain, trace and write code, marked against a scheme</span></a><a href="#cards"><b>Flashcards</b><span>Terms, costs and code, with spaced repetition</span></a><a href="#diag"><b>Diagnostic test</b><span>Find what to fix first</span></a><a href="#exam-review"><b>Exam review</b><span>Answer formats, handwritten C++, timing</span></a></nav>';
    var cwb = cw2Banner();
    if (cwb) p.insertBefore(cwb, p.querySelector(".lede").nextSibling);
    var bar = h("div", "tr-bar");
    p.appendChild(bar);
    var grid = h("div", "tr-grid");
    var mainCol = h("div", "tr-main"), side = h("aside", "tr-side");
    grid.appendChild(mainCol);
    grid.appendChild(side);
    p.appendChild(grid);
    var sessEl = h("div", "tr-sess");
    var qHost = h("div", "tr-q");
    mainCol.appendChild(sessEl);
    mainCol.appendChild(qHost);

    function modeOk(m) { return m === "adaptive" || m === "mixed" || m === "weak" || m === "review" || !!TR.topicById[m] || (/^c:/.test(m) && LN.byId[m.slice(2)] && LN.practiseable(m.slice(2))); }
    function drawBar() {
      var nDue = LN.counts().dueQ;
      var modes = [{ id: "adaptive", t: "Adaptive" }, { id: "mixed", t: "Mixed" }, { id: "weak", t: "My weak spots" }, { id: "review", t: nDue ? "Reviews due (" + nDue + ")" : "No reviews due" }];
      if (/^c:/.test(pref.mode) && LN.byId[pref.mode.slice(2)]) modes.push({ id: pref.mode, t: "Concept: " + LN.byId[pref.mode.slice(2)].title });
      modes = modes.concat(TR.topics.filter(function (t) { return TR.gens.some(function (g) { return g.topic === t.id; }); }).map(function (t) { return { id: t.id, t: t.title }; }));
      bar.innerHTML = '<div class="tr-modes" role="group" aria-label="What to practise">' + modes.map(function (m) { return '<button type="button" class="chip-btn' + (pref.mode === m.id ? " on" : "") + '" data-m="' + esc(m.id) + '"' + (m.id === "review" && !nDue ? " disabled" : "") + ">" + esc(m.t) + "</button>"; }).join("") + "</div>" +
        '<div class="seg tr-style" role="group" aria-label="Answer style"><button type="button" data-s="mcq"' + (pref.style === "mcq" ? ' class="on"' : "") + '>Multiple choice</button><button type="button" data-s="type"' + (pref.style === "type" ? ' class="on"' : "") + ">Type the answer</button></div>";
    }
    function drawSide() {
      var rows = TR.topics.filter(function (t) { return TR.gens.some(function (g) { return g.topic === t.id; }); }).map(function (t) {
        var m = trainMastery(t.id);
        return '<button type="button" class="tr-row" data-m="' + t.id + '"' + (m ? ' title="' + m.right + " right of your last " + m.recent + '"' : "") + '><span class="tr-name">' + esc(t.title) + '</span><span class="tr-pct">' + (m ? m.pct + '% <span class="muted">(' + m.right + "/" + m.recent + ")</span>" : '<span class="muted">not tried</span>') + '</span><span class="bar"><i style="width:' + (m ? m.pct : 0) + "%" + (m && m.pct < 60 ? ";background:var(--bad)" : m && m.pct < 80 ? ";background:var(--hl)" : "") + '"></i></span></button>';
      }).join("");
      var cnt = LN.counts(), qItems = Object.keys(LN.srs()).filter(function (k) { return LN.srs()[k].k === "q"; }), nextDue = qItems.map(function (k) { return LN.srs()[k].due; }).filter(function (t) { return t > Date.now(); }).sort()[0];
      side.innerHTML = '<h2 class="tr-side-h">Your topics</h2><p class="small muted">Accuracy on your last 20 questions in each topic. Pick one to practise it.</p><div class="tr-rows">' + rows + "</div>" +
        '<div class="tr-rev"><b>Review queue</b><span>' + (cnt.dueQ ? cnt.dueQ + " missed question" + (cnt.dueQ > 1 ? "s are" : " is") + " due now." : qItems.length ? "Nothing due now." + (nextDue ? " Next one " + whenText(nextDue) + "." : "") : "Questions you get wrong come back here: soon after, then after 1 day, 3 days and longer gaps.") + "</span>" +
        (cnt.dueQ ? '<button type="button" class="btn" data-m="review">Review them now</button>' : "") + "</div>" +
        '<a class="tr-more" href="#progress">Every concept and your trends, on the Progress page →</a>';
    }
    function whenText(t) {
      var d = t - Date.now();
      if (d < 3600000) return "in " + Math.max(1, Math.round(d / 60000)) + " min";
      if (d < 86400000) return "in " + Math.round(d / 3600000) + " h";
      return "on " + new Date(t).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
    }
    var why = "";
    function drawSess() {
      sessEl.innerHTML = (sess.n ? "This session: <b>" + sess.r + "</b> right of " + sess.n + (sess.streak > 1 ? " · streak <b>" + sess.streak + "</b>" : "") + (sess.best > 2 ? " · best streak " + sess.best : "") :
        pref.mode === "review" ? "Reviewing questions you got wrong before. Each one comes back later, at longer and longer gaps, until it sticks." :
        pref.mode === "adaptive" ? "Adaptive practice picks the concept you most need and a level that suits your mastery of it." : "Answer as you would in the exam. Wrong answers go into your review queue.") +
        (why ? '<div class="tr-why">' + why + "</div>" : "");
    }
    // the question to show for a review item: the one missed the first time, then fresh values for the same method
    function reviewQuestion(it) {
      var r = it.ref || {};
      if (r.g === "classic") return TR.makeClassic(r.s);
      if (!TR.byId[r.g]) return null;
      return TR.make(r.g, it.reps ? (r.s + it.reps * 2654435761) % 4294967296 : r.s);
    }
    function answered(ok, qq) {
      recordTrain(qq, ok, reviewing ? reviewing.id : null);
      sess.n++;
      if (ok) { sess.r++; sess.streak++; sess.best = Math.max(sess.best, sess.streak); } else sess.streak = 0;
      drawSess(); drawSide(); drawBar();
    }
    function show() {
      var nb = h("button", "btn primary", "Next question →");
      nb.type = "button";
      nb.addEventListener("click", next);
      view = renderQuestion(q, qHost, {
        mcq: pref.style === "mcq", next: nb,
        onAnswer: function (ok, qq) { answered(ok, qq); setTimeout(function () { try { nb.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 30); }
      });
      drawSess();
    }
    function next() {
      qHost.innerHTML = "";
      reviewing = null;
      why = "";
      if (CL.trainOne) {
        // one question chosen elsewhere (the Progress page's recent mistakes)
        var one = CL.trainOne;
        CL.trainOne = null;
        q = one.g === "classic" ? TR.makeClassic(one.s) : TR.byId[one.g] ? TR.make(one.g, one.s) : null;
        if (q) {
          var sid = "q:" + one.g + ":" + one.s;
          reviewing = LN.srs()[sid] ? Object.assign({ id: sid }, LN.srs()[sid]) : null;
          why = "A question from your recent mistakes. Try it again.";
          show();
          return;
        }
      }
      if (!modeOk(pref.mode)) pref.mode = "adaptive";
      if (pref.mode === "review") {
        var due = LN.due("q");
        if (!due.length) { pref.mode = "adaptive"; save(); drawBar(); }
        else {
          reviewing = due[0];
          q = reviewQuestion(reviewing);
          if (!q) { LN.remove(reviewing.id); save(); return next(); }
          why = reviewing.reps ? "A fresh version of a question you missed: the same method with new values." : "A question you got wrong" + (reviewing.u ? " " + agoText(reviewing.u) : "") + ". Try it again.";
        }
      }
      if (!reviewing) {
        var gid = null, cid = null;
        if (pref.mode === "adaptive") cid = LN.pickConcept();
        else if (/^c:/.test(pref.mode)) cid = pref.mode.slice(2);
        if (cid) {
          gid = LN.genFor(cid);
          var m = LN.mastery(cid);
          if (gid) why = (pref.mode === "adaptive" ? "Adaptive pick: " : "Concept: ") + "<b>" + esc(LN.byId[cid].title) + "</b> · your mastery: " + (m.n ? m.label + " (" + m.pct + "%)" : "not started") + " · level: " + LN.LEVEL_NAME[LN.level(gid)];
        }
        if (!gid) gid = pickGen(cid || pref.mode === "adaptive" || /^c:/.test(pref.mode) ? "mixed" : pref.mode).id;
        q = TR.make(gid);
      }
      show();
    }
    function agoText(t) { var d = Date.now() - t; return d < 3600000 ? "a few minutes ago" : d < 86400000 ? "earlier today" : Math.round(d / 86400000) + " day" + (Math.round(d / 86400000) > 1 ? "s" : "") + " ago"; }
    bar.addEventListener("click", function (e) {
      var m = e.target.closest("[data-m]"), st = e.target.closest("[data-s]");
      if (m && !m.disabled) { pref.mode = m.getAttribute("data-m"); save(); drawBar(); next(); }
      if (st) { pref.style = st.getAttribute("data-s"); save(); drawBar(); if (view && !view.isDone()) { qHost.innerHTML = ""; view = null; show(); } }
    });
    side.addEventListener("click", function (e) {
      var m = e.target.closest("[data-m]");
      if (!m) return;
      pref.mode = m.getAttribute("data-m"); save(); drawBar(); next();
      p.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    function onKey(e) {
      if (!view || e.target.closest("input, textarea, select")) return;
      if (/^[1-4]$/.test(e.key) || /^[a-dA-D]$/.test(e.key)) { var i = /\d/.test(e.key) ? +e.key - 1 : e.key.toUpperCase().charCodeAt(0) - 65; view.pick(i); }
    }
    document.addEventListener("keydown", onKey);
    current = { destroy: function () { document.removeEventListener("keydown", onKey); } };
    if (pref.mode === "review" && !LN.counts().dueQ) pref.mode = "adaptive";
    drawBar(); drawSide(); next();
  }


  // ---------------------------------------------------------------- mock exams
  var PAPERS = [
    { id: "cw1", title: "Coursework Exam #1 format", sub: "A new paper every time", mix: { lists: 2, trees: 5, bst: 10, heaps: 7, bigo: 4 }, minutes: 50, ones: 14,
      desc: "28 multiple-choice questions, 42 marks, 50 minutes: 2 linked lists, 5 binary trees, 10 BSTs, 7 heaps and 4 performance, with 14 one-mark and 14 two-mark questions, like the real paper." },
    { id: "cw2drill", title: "Coursework Exam #2 topics", sub: "A new paper every time", mix: { lists: 4, stacks: 3, trees: 4, bst: 4, heaps: 7, hashing: 2, graphs: 3, bigo: 3 }, minutes: 45,
      desc: "30 quick multiple-choice questions on the Coursework Exam #2 topics, weighted like its marks: linked lists, stacks and queues (7), binary trees and BSTs (8), heaps (7), hashing and graphs (5) and performance (3). The real exam is short answer: sit the mock papers on the Coursework Exam #2 page for its format." },
    { id: "second", title: "Hashing, graphs and sorting", sub: "A new paper every time", mix: { hashing: 7, graphs: 9, sorting: 8 }, minutes: 45,
      desc: "24 questions on the second half of the course (Lectures 14–21): probing and chaining, BFS, DFS, Dijkstra, spanning trees, and every sort." },
    { id: "all", title: "The whole course", sub: "A new paper every time", mix: { cpp: 2, lists: 3, recursion: 2, stacks: 2, trees: 3, bst: 4, heaps: 4, hashing: 3, graphs: 3, sorting: 3, bigo: 1 }, minutes: 60,
      desc: "30 questions from every part of the course, for final exam practice." }
  ];
  "ABCD".split("").forEach(function (L) {
    PAPERS.push({ id: "paper" + L, title: "Mock paper " + L, sub: "Hand-written, fixed questions", classic: L, minutes: 50,
      desc: { A: "The first hand-written CW1-style paper: the core ideas of every topic.", B: "A second set at the same level, with different traps.", C: "Harder: more tracing and more 2-mark questions to work through.", D: "The hardest paper: long traces and subtle statements." }[L] + " 28 questions, 42 marks, 50 minutes." });
  });
  var paperById = {};
  PAPERS.forEach(function (pp) { paperById[pp.id] = pp; });
  // pick the questions for a paper: (generator, seed) pairs, or fixed hand-written ids
  function buildPaper(pp) {
    if (pp.classic) return TR.bank().filter(function (x) { return x.exam === pp.classic; }).sort(function (a, b2) { return a.n - b2.n; }).map(function (x) { return { c: x.id }; });
    var total = 0, items = [], used = {}, usedClassic = {}, ones = 0;
    Object.keys(pp.mix).forEach(function (t) { total += pp.mix[t]; });
    Object.keys(pp.mix).forEach(function (topic) {
      var gens = TR.gens.filter(function (g) { return g.topic === topic; });
      for (var k = 0; k < pp.mix[topic]; k++) {
        for (var tries = 0; tries < 40; tries++) {
          var avail = gens.filter(function (g) { return (used[g.id] || 0) < 2; });
          var g = avail.length ? avail[Math.floor(Math.random() * avail.length)] : gens[Math.floor(Math.random() * gens.length)];
          var seed = TR.newSeed(), q = TR.make(g.id, seed);
          if (q.classicId && usedClassic[q.classicId]) continue;
          if (pp.ones && tries < 30) {
            if (q.marks === 1 && ones >= pp.ones) continue;
            if (q.marks === 2 && items.length - ones >= total - pp.ones) continue;
          }
          items.push({ g: g.id, s: seed });
          used[g.id] = (used[g.id] || 0) + 1;
          if (q.classicId) usedClassic[q.classicId] = 1;
          if (q.marks === 1) ones++;
          break;
        }
      }
    });
    return items;
  }
  function itemQ(it) { return it.c ? TR.makeClassic(it.c) : TR.make(it.g, it.s); }
  function fmtClock(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function fmtDur(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + " min " + (s % 60) + " s"; }

  function pageExam() {
    var p = page("exam-page");
    var S = store.examNow || null, qs = [], timer = null, view = "setup", confirming = false;
    function qsFor(st) { return st.items.map(itemQ); }
    setTutor("exam", "Mock exam", function () {
      var t = progressText();
      if (view === "exam" && S) t += "\n\nThe student is sitting a timed mock exam right now (" + paperById[S.paper].title + "). Do not answer the exam's questions or give hints about them; you may help with general study questions, and remind them gently that they can ask about any question after submitting.";
      if (view === "results" && store.examLast) t += "\n\n" + examSummary(store.examLast);
      if (store.exams.length) t += "\n\nMock exam history (newest first): " + store.exams.slice(0, 8).map(function (e) { return e.title + " " + e.score + "/" + e.max + " (" + new Date(e.date).toLocaleDateString() + ")"; }).join("; ");
      return t;
    });
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function elapsed() { return S ? S.elapsed + (S.running ? Date.now() - S.t0 : 0) : 0; }
    function persist() { if (S) { var c = Object.assign({}, S, { elapsed: elapsed(), t0: Date.now() }); store.examNow = c; } else delete store.examNow; save(); }
    current = { destroy: function () { stopTimer(); if (S && view === "exam") { S.elapsed = elapsed(); S.running = false; store.examNow = S; save(); } document.removeEventListener("keydown", keyH); } };

    // ---- setup
    function drawSetup() {
      view = "setup"; stopTimer();
      var hist = store.exams;
      p.innerHTML = '<div class="eyebrow">Practice</div><h1 class="title">Mock exams</h1><p class="lede">Sit a full paper under exam conditions: a timer, no feedback until you submit, and questions you can flag and come back to. Then see your marks by topic, every worked solution, and what to practise next.</p>';
      var cwb2 = cw2Banner();
      if (cwb2) p.appendChild(cwb2);
      if (S && S.items) {
        var pp0 = paperById[S.paper];
        var res = h("div", "ex-resume", "<div><b>Paper in progress:</b> " + esc(pp0 ? pp0.title : "") + " · " + Object.keys(S.answers).length + " of " + S.items.length + " answered · " + fmtClock(S.minutes * 60000 - S.elapsed) + ' left</div><div class="btns"><button type="button" class="btn primary" data-a="resume">Resume</button><button type="button" class="btn ghost" data-a="drop">Abandon it</button></div>');
        p.appendChild(res);
      }
      var gen = h("div", "ex-cards");
      PAPERS.forEach(function (pp) {
        var mine = hist.filter(function (e) { return e.paper === pp.id; });
        var best = mine.length ? Math.max.apply(null, mine.map(function (e) { return Math.round(100 * e.score / e.max); })) : null;
        var c = h("article", "ex-card" + (pp.classic ? " fixed" : ""));
        c.innerHTML = '<div class="pl">' + esc(pp.sub) + "</div><h3>" + esc(pp.title) + "</h3><p>" + esc(pp.desc) + '</p><div class="ex-meta">' + (pp.classic ? "28 Qs · 42 marks" : Object.keys(pp.mix).reduce(function (a, k) { return a + pp.mix[k]; }, 0) + " Qs") + " · " + pp.minutes + " min" + (mine.length ? " · best " + best + "% · " + mine.length + " attempt" + (mine.length > 1 ? "s" : "") : "") + '</div><button type="button" class="btn ' + (pp.id === "cw1" ? "primary" : "") + '" data-start="' + pp.id + '">Start</button>';
        gen.appendChild(c);
      });
      p.appendChild(h("div", "sec-h", "<h2>Choose a paper</h2>"));
      p.appendChild(gen);
      p.appendChild(h("p", "small muted", "Tip: in the real exam you get about 1 minute per 1-mark question and 2 minutes per 2-mark question. Draw every tree and array before you pick an answer."));
      if (hist.length) {
        var tb = '<table class="ex-hist"><tr><th>Date</th><th>Paper</th><th>Score</th><th>Time</th></tr>' + hist.slice(0, 12).map(function (e) { return "<tr><td>" + esc(new Date(e.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })) + "</td><td>" + esc(e.title) + "</td><td><b>" + e.score + "</b> / " + e.max + " (" + Math.round(100 * e.score / e.max) + "%)</td><td>" + esc(fmtDur(e.ms)) + "</td></tr>"; }).join("") + "</table>";
        p.appendChild(h("div", "sec-h", "<h2>Your attempts</h2>" + (store.examLast ? '<button type="button" class="btn small" data-a="last">Review your last paper</button>' : "")));
        p.appendChild(h("div", "ex-hist-wrap", tb));
      }
    }
    // ---- sitting the exam
    function start(id) {
      var pp = paperById[id];
      S = { paper: id, items: buildPaper(pp), answers: {}, flags: {}, cur: 0, elapsed: 0, t0: Date.now(), running: true, minutes: pp.minutes };
      persist();
      sit();
    }
    function sit() {
      view = "exam"; confirming = false;
      qs = qsFor(S);
      S.running = true; S.t0 = Date.now();
      p.innerHTML = "";
      var bar = h("div", "ex-bar");
      bar.innerHTML = '<div class="ex-title"><b>' + esc(paperById[S.paper].title) + '</b><span class="ex-count"></span></div><div class="ex-clock" role="timer" aria-live="off"></div><div class="btns"><button type="button" class="btn small ghost" data-a="pause">Pause</button><button type="button" class="btn small primary" data-a="submit">Submit</button></div>';
      p.appendChild(bar);
      var top = document.querySelector(".top");
      bar.style.top = "calc(env(safe-area-inset-top, 0px) + " + (top ? top.offsetHeight : 0) + "px)";
      var pal = h("nav", "ex-pal");
      pal.setAttribute("aria-label", "Questions");
      p.appendChild(pal);
      var host = h("div", "ex-host");
      p.appendChild(host);
      var conf = h("div", "ex-confirm");
      conf.hidden = true;
      p.appendChild(conf);
      function tick() {
        var left = S.minutes * 60000 - elapsed();
        var ck = bar.querySelector(".ex-clock");
        ck.textContent = fmtClock(left) + " left";
        ck.classList.toggle("low", left < 5 * 60000);
        if (left <= 0) { stopTimer(); finish(true); }
      }
      function drawPal() {
        pal.innerHTML = qs.map(function (q, i) { return '<button type="button" data-q="' + i + '" class="' + (S.answers[i] !== undefined ? "ans " : "") + (S.flags[i] ? "flag " : "") + (i === S.cur ? "cur" : "") + '" aria-label="Question ' + (i + 1) + (S.answers[i] !== undefined ? ", answered" : "") + (S.flags[i] ? ", flagged" : "") + '">' + (i + 1) + "</button>"; }).join("");
        bar.querySelector(".ex-count").textContent = Object.keys(S.answers).length + " of " + qs.length + " answered";
      }
      function drawQ() {
        var q = qs[S.cur], i = S.cur, picked = S.answers[i];
        var topic = TR.topicById[q.topic];
        host.innerHTML = "";
        var card = h("article", "tq ex-q");
        card.innerHTML = '<div class="tq-h"><b>Question ' + (i + 1) + " of " + qs.length + '</b><span class="chip">' + esc(topic ? topic.title : "") + '</span><span class="tq-marks">' + q.marks + " mark" + (q.marks > 1 ? "s" : "") + "</span></div>" + '<div class="tq-text">' + q.text + "</div>";
        if (q.code) { var cb = CL.codeBlock(q.code); cb.classList.add("tq-code"); card.appendChild(cb); }
        if (q.fig) card.appendChild(h("div", "tq-figs", q.fig));
        var list = h("div", "quiz-opts tq-opts" + (q.grid ? " grid" : "") + (q.wide ? " wide" : ""));
        q.mcq.options.forEach(function (o, k) {
          var bt = h("button", "quiz-opt" + (picked === k ? " sel" : ""), '<span class="mk">' + String.fromCharCode(65 + k) + "</span><span>" + o + "</span>");
          bt.type = "button";
          bt.setAttribute("aria-pressed", picked === k ? "true" : "false");
          bt.addEventListener("click", function () { choose(k); });
          list.appendChild(bt);
        });
        card.appendChild(list);
        var nav = h("div", "ex-nav");
        nav.innerHTML = '<button type="button" class="btn" data-a="prev"' + (i === 0 ? " disabled" : "") + '>← Previous</button><button type="button" class="btn ghost ex-flag' + (S.flags[i] ? " on" : "") + '" data-a="flag">' + (S.flags[i] ? "⚑ Flagged" : "⚐ Flag for review") + "</button>" + (picked !== undefined ? '<button type="button" class="btn ghost" data-a="clear">Clear answer</button>' : "") + (i < qs.length - 1 ? '<button type="button" class="btn primary" data-a="next">Next →</button>' : '<button type="button" class="btn primary" data-a="submit">Finish and submit</button>');
        card.appendChild(nav);
        host.appendChild(card);
        drawPal();
      }
      function choose(k) {
        S.answers[S.cur] = k;
        persist();
        drawQ();
      }
      function go(i) { S.cur = Math.max(0, Math.min(qs.length - 1, i)); persist(); drawQ(); window.scrollTo({ top: 0, behavior: "smooth" }); }
      function askSubmit() {
        var un = qs.length - Object.keys(S.answers).length, fl = Object.keys(S.flags).filter(function (k) { return S.flags[k]; }).length;
        conf.hidden = false;
        confirming = true;
        conf.innerHTML = '<div class="ex-confirm-in" role="dialog" aria-label="Submit the paper"><h3>Submit your paper?</h3><p>' + (un ? "<b>" + un + "</b> question" + (un > 1 ? "s are" : " is") + " not answered. " : "Every question is answered. ") + (fl ? "<b>" + fl + "</b> " + (fl > 1 ? "are" : "is") + " flagged for review. " : "") + fmtClock(S.minutes * 60000 - elapsed()) + ' left.</p><div class="btns"><button type="button" class="btn" data-a="keep">Keep working</button><button type="button" class="btn primary" data-a="really">Submit</button></div></div>';
        conf.querySelector('[data-a="really"]').focus();
      }
      p.onclick = function (e) {
        var b = e.target.closest("[data-a], [data-q]");
        if (!b) return;
        if (b.hasAttribute("data-q")) return go(+b.getAttribute("data-q"));
        var a = b.getAttribute("data-a");
        if (a === "prev") go(S.cur - 1);
        if (a === "next") go(S.cur + 1);
        if (a === "flag") { S.flags[S.cur] = !S.flags[S.cur]; if (!S.flags[S.cur]) delete S.flags[S.cur]; persist(); drawQ(); }
        if (a === "clear") { delete S.answers[S.cur]; persist(); drawQ(); }
        if (a === "submit") askSubmit();
        if (a === "keep") { conf.hidden = true; confirming = false; }
        if (a === "really") { conf.hidden = true; finish(false); }
        if (a === "pause") {
          S.elapsed = elapsed(); S.running = false; persist(); stopTimer();
          host.innerHTML = '<div class="ex-paused"><h2>Paused</h2><p>The clock is stopped and the questions are hidden. In the real exam the clock does not stop, so use this only if you are interrupted.</p><button type="button" class="btn primary" data-a="unpause">Carry on</button></div>';
          pal.hidden = true;
        }
        if (a === "unpause") { S.running = true; S.t0 = Date.now(); pal.hidden = false; drawQ(); timer = setInterval(tick, 1000); tick(); }
      };
      onKey = function (e) {
        if (view !== "exam" || confirming || e.target.closest("input, textarea, select") || !S.running) return;
        if (/^[1-4]$/.test(e.key)) choose(+e.key - 1);
        else if (/^[a-dA-D]$/.test(e.key) && !e.ctrlKey && !e.metaKey) choose(e.key.toUpperCase().charCodeAt(0) - 65);
        else if (e.key === "ArrowRight") go(S.cur + 1);
        else if (e.key === "ArrowLeft") go(S.cur - 1);
        else if (e.key === "f" || e.key === "F") { S.flags[S.cur] = !S.flags[S.cur]; if (!S.flags[S.cur]) delete S.flags[S.cur]; persist(); drawQ(); }
        else return;
        e.preventDefault();
      };
      drawQ();
      timer = setInterval(tick, 1000);
      tick();
    }
    function finish(timeUp) {
      stopTimer();
      var ms = Math.min(elapsed(), S.minutes * 60000);
      var res = { paper: S.paper, title: paperById[S.paper].title, items: S.items, answers: S.answers, flags: S.flags, ms: ms, timeUp: !!timeUp, date: Date.now() };
      var score = 0, max = 0, right = 0, by = {};
      if (CL.Game) CL.Game.quiet(true);
      qs.forEach(function (q, i) {
        var ok = S.answers[i] === q.mcq.answer;
        max += q.marks;
        if (ok) { score += q.marks; right++; }
        var t = by[q.topic] = by[q.topic] || [0, 0, 0, 0];
        t[0] += ok ? q.marks : 0; t[1] += q.marks; t[2] += ok ? 1 : 0; t[3]++;
        recordTrain(q, ok);
      });
      if (CL.Game) { CL.Game.quiet(false); CL.Game.event("exam", { score: score, max: max }); }
      Object.assign(res, { score: score, max: max, right: right, n: qs.length, by: by });
      store.exams.unshift({ paper: res.paper, title: res.title, date: res.date, score: score, max: max, ms: ms });
      store.exams = store.exams.slice(0, 40);
      store.examLast = res;
      S = null;
      delete store.examNow;
      save();
      results(res);
    }
    // ---- results
    function examSummary(res) {
      var lines = ["The student's last mock exam: " + res.title + ", " + res.score + "/" + res.max + " marks (" + Math.round(100 * res.score / res.max) + "%), " + res.right + " of " + res.n + " questions right, in " + fmtDur(res.ms) + (res.timeUp ? " (time ran out)" : "") + "."];
      lines.push("Marks by topic: " + Object.keys(res.by).map(function (t) { var x = res.by[t]; return (TR.topicById[t] || {}).title + " " + x[0] + "/" + x[1]; }).join("; "));
      var qq = res.items.map(itemQ), wrong = [];
      qq.forEach(function (q, i) { if (res.answers[i] !== q.mcq.answer) wrong.push("Q" + (i + 1) + " (" + q.title + "): " + plain(q.text).slice(0, 220) + " | Student: " + (res.answers[i] === undefined ? "no answer" : plain(q.mcq.options[res.answers[i]])) + " | Right: " + plain(q.mcq.options[q.mcq.answer])); });
      if (wrong.length) lines.push("Questions missed:\n" + wrong.slice(0, 14).join("\n"));
      return lines.join("\n");
    }
    function results(res) {
      view = "results";
      var qq = res.items.map(itemQ), pct = Math.round(100 * res.score / res.max);
      var prev = store.exams.filter(function (e) { return e.paper === res.paper; }).slice(1, 6);
      p.innerHTML = '<div class="eyebrow">Mock exam results</div><h1 class="title">' + esc(res.title) + "</h1>";
      var sum = h("section", "ex-sum");
      var topics = Object.keys(res.by).sort(function (a, b2) { return res.by[a][0] / res.by[a][1] - res.by[b2][0] / res.by[b2][1]; });
      sum.innerHTML = '<div class="ex-score"><b>' + res.score + "</b><span>/ " + res.max + " marks</span><em>" + pct + "%</em></div>" +
        '<div class="ex-facts"><div>' + res.right + " of " + res.n + " questions right</div><div>Time: " + esc(fmtDur(res.ms)) + (res.timeUp ? " (time ran out)" : "") + "</div>" + (prev.length ? "<div>Earlier attempts at this paper: " + prev.map(function (e) { return Math.round(100 * e.score / e.max) + "%"; }).join(", ") + "</div>" : "") + "</div>" +
        '<div class="ex-topics">' + topics.map(function (t) { var x = res.by[t], tp = Math.round(100 * x[0] / x[1]); return '<div class="ex-topic"><span>' + esc((TR.topicById[t] || {}).title) + "</span><b>" + x[0] + "/" + x[1] + '</b><span class="bar"><i style="width:' + tp + "%" + (tp < 60 ? ";background:var(--bad)" : tp < 80 ? ";background:var(--hl)" : "") + '"></i></span></div>'; }).join("") + "</div>";
      p.appendChild(sum);
      var weakest = topics[0], acts = h("div", "ex-acts");
      if (weakest && res.by[weakest][0] < res.by[weakest][1]) {
        var pb = h("button", "btn primary", "Practise " + esc(lcTitle((TR.topicById[weakest] || {}).title)) + " in the Trace Trainer");
        pb.type = "button";
        pb.addEventListener("click", function () { store.trainPref.mode = weakest; save(); location.hash = "#train"; });
        acts.appendChild(pb);
      }
      if (Tu) acts.appendChild(Tu.button("Ask the tutor to review my paper", function () {
        Tu.ask("Review my mock exam and make me a plan.", { content: examSummary(res) + "\n\nLook at the questions I missed and find the patterns: which ideas am I getting wrong? Explain the two or three most important ones briefly, then give me a short practice plan." });
      }));
      var again = h("button", "btn", "Take another paper");
      again.type = "button";
      again.addEventListener("click", function () { drawSetup(); window.scrollTo(0, 0); });
      acts.appendChild(again);
      p.appendChild(acts);
      var wrongN = qq.filter(function (q, i) { return res.answers[i] !== q.mcq.answer; }).length, flagN = Object.keys(res.flags || {}).length;
      var filt = h("div", "tr-modes ex-filter", '<button type="button" class="chip-btn on" data-f="all">All ' + qq.length + '</button><button type="button" class="chip-btn" data-f="wrong">Wrong or blank ' + wrongN + "</button>" + (flagN ? '<button type="button" class="chip-btn" data-f="flag">Flagged ' + flagN + "</button>" : ""));
      p.appendChild(h("div", "sec-h", "<h2>Every question, with its solution</h2>"));
      p.appendChild(filt);
      var list = h("div", "ex-review");
      p.appendChild(list);
      function drawList(f) {
        list.innerHTML = "";
        qq.forEach(function (q, i) {
          var mine = res.answers[i], ok = mine === q.mcq.answer;
          if (f === "wrong" && ok) return;
          if (f === "flag" && !(res.flags || {})[i]) return;
          var card = h("article", "tq ex-r " + (ok ? "ok" : "bad"));
          card.innerHTML = '<div class="tq-h"><b>Question ' + (i + 1) + "</b>" + '<span class="chip ' + (ok ? "ok" : "bad") + '">' + (ok ? "✓ " + q.marks + "/" + q.marks : mine === undefined ? "Not answered" : "✗ 0/" + q.marks) + '</span><span class="chip">' + esc((TR.topicById[q.topic] || {}).title) + '</span><span class="tq-title">' + esc(q.title) + "</span>" + ((res.flags || {})[i] ? '<span class="chip warn">flagged</span>' : "") + '</div><div class="tq-text">' + q.text + "</div>";
          if (q.code) { var cb = CL.codeBlock(q.code); cb.classList.add("tq-code"); card.appendChild(cb); }
          if (q.fig) card.appendChild(h("div", "tq-figs", q.fig));
          card.appendChild(h("div", "quiz-opts tq-opts" + (q.grid ? " grid" : "") + (q.wide ? " wide" : ""), q.mcq.options.map(function (o, k) { return '<div class="quiz-opt' + (k === q.mcq.answer ? " right" : k === mine ? " wrong" : "") + '"><span class="mk">' + String.fromCharCode(65 + k) + "</span><span>" + o + (k === q.mcq.answer ? ' <span class="small">(correct)</span>' : k === mine ? ' <span class="small">(your answer)</span>' : "") + "</span></div>"; }).join("")));
          var sol = h("details", "tq-sol");
          sol.open = !ok;
          sol.innerHTML = "<summary>Worked solution</summary><ol>" + q.steps.map(function (st) { return "<li>" + st + "</li>"; }).join("") + "</ol>";
          card.appendChild(sol);
          var ra = h("div", "tq-acts");
          var ql = TR.labFor ? TR.labFor(q) : q.lab;
          if (ql && labById[ql.id]) { var lb = h("button", "btn small", "Watch it in the " + esc(labById[ql.id].title)); lb.type = "button"; lb.addEventListener("click", function () { CL.labPreset = ql; location.hash = "#lab-" + ql.id; }); ra.appendChild(lb); }
          if (Tu) ra.appendChild(Tu.button("Ask the tutor about this question", function () {
            Tu.ask("Explain question " + (i + 1) + " of my mock exam.", { content: "From my mock exam:\n\n" + questionText(q, true) + "\n\nMy answer: " + (mine === undefined ? "(not answered)" : plain(q.mcq.options[mine])) + "\nThe right answer: " + plain(q.mcq.options[q.mcq.answer]) + "\nThe worked solution shown to me: " + q.steps.map(plain).join(" | ") + "\n\nExplain step by step how to get the right answer" + (ok ? "" : " and where my thinking probably went wrong") + "." });
          }));
          if (ra.childNodes.length) card.appendChild(ra);
          list.appendChild(card);
        });
        if (!list.childNodes.length) list.appendChild(h("p", "muted", "Nothing to show here."));
      }
      filt.addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (!b) return; filt.querySelectorAll("[data-f]").forEach(function (x) { x.classList.toggle("on", x === b); }); drawList(b.getAttribute("data-f")); });
      drawList("all");
      window.scrollTo(0, 0);
    }
    var onKey = function () {};
    function keyH(e) { onKey(e); }
    document.addEventListener("keydown", keyH);
    p.addEventListener("click", function (e) {
      if (view !== "setup") return;
      var st = e.target.closest("[data-start]"), a = e.target.closest("[data-a]");
      if (st) {
        if (S && S.items) { toast("You have a paper in progress: resume it or abandon it first."); var rb = p.querySelector(".ex-resume"); if (rb) rb.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
        start(st.getAttribute("data-start"));
      }
      if (a) {
        var act = a.getAttribute("data-a");
        if (act === "resume") sit();
        if (act === "drop") { S = null; delete store.examNow; save(); drawSetup(); }
        if (act === "last" && store.examLast) results(store.examLast);
      }
    });
    drawSetup();
  }

  // ---------------------------------------------------------------- gym
  function exStatus(e) { var s = store.ex[e.id]; return s && s.passed ? "ok" : s && s.tried ? "tried" : ""; }
  function exRow(e) {
    var st = exStatus(e);
    return '<a class="exrow" href="#ex-' + e.id + '"><span class="st ' + st + '">' + (st === "ok" ? "✓" : "") + "</span><span><b>" + esc(e.title) + '</b><span class="b">' + esc(e.blurb || "") + '</span></span><span class="meta"><span class="chip">' + esc(topicTitle[e.topic] || e.topic) + '</span><span class="lvl" title="difficulty ' + e.level + ' of 3">' + "●".repeat(e.level) + "○".repeat(3 - e.level) + "</span></span></a>";
  }
  var gymFilter = { topic: "", level: 0, status: "" };
  function pageGym() {
    var p = page();
    setTutor("gym", "Code Gym", progressText);
    var passed = D.exercises.filter(function (e) { return exStatus(e) === "ok"; }).length;
    p.innerHTML = '<div class="eyebrow">Code Gym</div><h1 class="title">Write it until it is automatic</h1><p class="lede">Each exercise asks for one function, like the exam does. Write it, run the tests, and read exactly which case fails and why. You have passed ' + passed + " of " + D.exercises.length + ".</p>";
    var f = h("div", "filters");
    var topics = D.topics.filter(function (t) { return D.exercises.some(function (e) { return e.topic === t.id; }); });
    f.innerHTML = '<span class="fl">Topic</span><button type="button" class="fbtn" data-t="">All</button>' + topics.map(function (t) { return '<button type="button" class="fbtn" data-t="' + t.id + '">' + esc(t.title) + "</button>"; }).join("");
    var f2 = h("div", "filters");
    f2.innerHTML = '<span class="fl">Level</span><button type="button" class="fbtn" data-l="0">Any</button><button type="button" class="fbtn" data-l="1">●○○ Warm-up</button><button type="button" class="fbtn" data-l="2">●●○ Core</button><button type="button" class="fbtn" data-l="3">●●● Exam-hard</button>' +
      '<span class="fl" style="margin-left:10px">Show</span><button type="button" class="fbtn" data-s="">All</button><button type="button" class="fbtn" data-s="todo">Not passed</button>';
    p.appendChild(f);
    p.appendChild(f2);
    var list = h("div", "exlist");
    p.appendChild(list);
    function draw() {
      f.querySelectorAll(".fbtn").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-t") === gymFilter.topic); });
      f2.querySelectorAll("[data-l]").forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-l") === gymFilter.level); });
      f2.querySelectorAll("[data-s]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-s") === gymFilter.status); });
      var items = D.exercises.filter(function (e) {
        return (!gymFilter.topic || e.topic === gymFilter.topic) && (!gymFilter.level || e.level === gymFilter.level) && (gymFilter.status !== "todo" || exStatus(e) !== "ok");
      });
      list.innerHTML = items.length ? items.map(exRow).join("") : '<p class="muted">No exercises match these filters.</p>';
    }
    f.addEventListener("click", function (e) { var b = e.target.closest(".fbtn"); if (b) { gymFilter.topic = b.getAttribute("data-t"); draw(); } });
    f2.addEventListener("click", function (e) {
      var b = e.target.closest(".fbtn");
      if (!b) return;
      if (b.hasAttribute("data-l")) gymFilter.level = +b.getAttribute("data-l");
      else gymFilter.status = b.getAttribute("data-s");
      draw();
    });
    draw();
  }

  // random test templates (same rules as build.py's expand_random): $VALS(n,lo,hi) $KEYS(n,lo,hi) $SORTED(n,lo,hi) $INT(lo,hi) $N() $PICK()
  CL.expandRandom = function (tpl, rnd) {
    rnd = rnd || Math.random;
    var st = { n: 0, vals: [] };
    function ri(lo, hi) { return lo + Math.floor(rnd() * (hi - lo + 1)); }
    function count(spec) { var m = /^(\d+)-(\d+)$/.exec(spec.trim()); return m ? ri(+m[1], +m[2]) : +spec; }
    return String(tpl).replace(/\$(VALS|KEYS|SORTED|INT|N|PICK)\(([^)]*)\)/g, function (_, kind, a) {
      var args = a.split(",").map(function (x) { return x.trim(); }).filter(Boolean);
      if (kind === "VALS" || kind === "KEYS" || kind === "SORTED") {
        var n = count(args[0]), lo = +args[1], hi = +args[2], vals = [];
        if (kind === "VALS") for (var i = 0; i < n; i++) vals.push(ri(lo, hi));
        else {
          var pool = [];
          for (var v = lo; v <= hi; v++) pool.push(v);
          for (var j = pool.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)), t = pool[j]; pool[j] = pool[k]; pool[k] = t; }
          vals = pool.slice(0, n);
          if (kind === "SORTED") vals.sort(function (x, y) { return x - y; });
        }
        st.n = n; st.vals = vals;
        return vals.join(", ");
      }
      if (kind === "INT") return String(ri(+args[0], +args[1]));
      if (kind === "N") return String(st.n);
      return String(st.vals.length ? st.vals[Math.floor(rnd() * st.vals.length)] : 0);
    });
  };
  CL.assemble = function (ex, code, test) {
    var body = test.main.replace(/\s+$/, "").split("\n").map(function (l) { return "    " + l; }).join("\n");
    return code.replace(/\s+$/, "") + "\n\n" + (ex.harness ? ex.harness.replace(/\s+$/, "") + "\n\n" : "") + "int main() {\n" + body + "\n    return 0;\n}\n";
  };

  function pageExercise(id) {
    var e = exById[id];
    var st = store.ex[id] || {};
    var p = page();
    var lastResults = "";
    setTutor("exercise", "Exercise: " + e.title, function () {
      return "Code Gym exercise: " + e.title + " (" + (topicTitle[e.topic] || e.topic) + ", difficulty " + e.level + " of 3, " + (e.lecture || "") + ")\n\nTASK:\n" + e.prompt +
        "\n\nTHE STUDENT'S CURRENT CODE:\n" + CL.numbered(ed.getValue()) + "\n\n" + (lastResults || "The student has not run the tests on this code yet.") +
        "\n\nHow the tests call the student's code (examples):\n" + e.tests.filter(function (t) { return !t.hidden; }).slice(0, 3).map(function (t) { return "// test: " + t.name + "\n" + t.main; }).join("\n\n") +
        "\n\nRemember: give hints, not the full solution, unless the student explicitly asks for it.";
    });
    p.innerHTML = '<div class="crumbs"><a href="#gym">Code Gym</a><span>/</span><span>' + esc(topicTitle[e.topic] || e.topic) + '</span></div><div class="eyebrow">' + esc(e.lecture || "") + ' · <span class="lvl">' + "●".repeat(e.level) + "○".repeat(3 - e.level) + '</span></div><h1 class="title">' + esc(e.title) + "</h1>";
    var grid = h("div", "expage");
    var left = h("div", "ex-prompt");
    left.appendChild(CL.renderMd(e.prompt, mdHooks({ noRun: true })));
    var lessonLinks = e.lessons.filter(function (l) { return D.lessons[l]; });
    if (lessonLinks.length) left.appendChild(h("p", "small muted", "Covered in: " + lessonLinks.map(function (l) { return '<a href="#l-' + l + '">' + lessonInfo[l].num + " " + esc(D.lessons[l].title) + "</a>"; }).join(", ")));
    var shownTests = e.tests.filter(function (t) { return !t.hidden; }), nHidden = e.tests.length - shownTests.length;
    var testsInfo = h("details", "file-peek", "<summary>What the tests run (" + shownTests.length + " tests" + (nHidden ? ", plus " + nHidden + " hidden" : "") + (e.random ? ", plus random tests with new values every run" : "") + ")</summary>");
    var tpre = h("pre");
    tpre.textContent = shownTests.map(function (t) { return "// " + t.name + "\n" + t.main + (t.stdin ? "\n// keyboard input: " + t.stdin.replace(/\n/g, "↵ ") : ""); }).join("\n\n");
    testsInfo.appendChild(tpre);
    left.appendChild(testsInfo);
    var hintsBox = h("div", "hints");
    hintsBox.style.marginTop = "14px";
    left.appendChild(hintsBox);
    var shown = 0;
    var hintBtn = h("button", "btn small");
    hintBtn.type = "button";
    var solBtn = h("button", "btn small ghost");
    solBtn.type = "button";
    solBtn.textContent = "Show the model solution";
    var hb = h("div", "btns");
    hb.appendChild(hintBtn);
    hb.appendChild(solBtn);
    left.appendChild(hb);
    var solBox = h("div");
    left.appendChild(solBox);
    function drawHints() {
      hintsBox.innerHTML = "";
      e.hints.slice(0, shown).forEach(function (t, i) {
        var d = h("div", "hint-box");
        d.appendChild(h("div", "eyebrow", "Hint " + (i + 1)));
        d.appendChild(CL.renderMd(t, mdHooks({ noRun: true })));
        hintsBox.appendChild(d);
      });
      hintBtn.textContent = shown < e.hints.length ? (shown ? "Another hint" : "Show a hint") + " (" + (e.hints.length - shown) + " left)" : "No more hints";
      hintBtn.disabled = shown >= e.hints.length;
    }
    hintBtn.addEventListener("click", function () { shown++; drawHints(); });
    drawHints();
    var solArmed = false;
    function showSolution() {
      solBox.innerHTML = "";
      var d = h("div", "md");
      d.style.marginTop = "14px";
      d.appendChild(h("h3", "", "Model solution"));
      d.appendChild(CL.codeBlock(e.solutionPart || e.solution));
      if (e.explain) d.appendChild(CL.renderMd(e.explain, mdHooks({ noRun: true })));
      solBox.appendChild(d);
      solBtn.hidden = true;
    }
    solBtn.addEventListener("click", function () {
      if (st.passed) return showSolution();
      if (!solArmed) { solArmed = true; solBtn.textContent = "Sure? Trying first teaches more. Click again to show it."; return; }
      showSolution();
    });
    if (st.passed && e.explain) {
      var ex2 = h("div", "md");
      ex2.style.marginTop = "14px";
      ex2.appendChild(h("h3", "", "Why it works"));
      ex2.appendChild(CL.renderMd(e.explain, mdHooks({ noRun: true })));
      left.appendChild(ex2);
    }
    // the workspace: your code, ▶ Run (in the terminal, with main.cpp), ✓ Submit (every test), and the console
    var right = h("div", "ex-work");
    var ws = CL.Workspace(right, e, {
      code: st.code || e.code,
      onCode: function (v) { var s = store.ex[id] = store.ex[id] || {}; s.code = v; save(); },
      main: st.tryMain,
      onMain: function (v) { var s2 = store.ex[id] = store.ex[id] || {}; s2.tryMain = v; save(); },
      onReset: function () { var s = store.ex[id] || {}; delete s.code; save(); },
      onResults: function (info) {
        lastResults = ws.lastResults;
        var s = store.ex[id] = store.ex[id] || {};
        s.tried = true;
        if (!info.compileErr && Tu) {
          var trow = h("div", "tutor-row");
          if (!info.all) trow.appendChild(Tu.button("Ask the tutor for a hint", function () {
            Tu.ask("Give me a hint about the tests I'm failing.", { content: "I ran the tests on my current code.\n" + lastResults + "\n\nGive me one helpful hint toward fixing my code. Do NOT write the full solution. Point me at the specific case or line that fails and explain why it fails that test." });
          }));
          else trow.appendChild(Tu.button("Ask the tutor to review my solution", function () {
            Tu.ask("All my tests pass. Can you review my solution?", { content: "All the tests pass on my current code. Review it: is it correct in every case (including cases the tests may not cover), is it efficient, and how would I write it on paper in an exam? Suggest style improvements only if they matter." });
          }));
          info.el.insertBefore(trow, info.summaryEl.nextSibling);
        }
        if (info.all && !s.passed) {
          s.passed = true; CL.Progress.log("x"); toast("Exercise passed");
          var seenC = {};
          (e.lessons || []).forEach(function (lid) { var c = LN.forLesson(lid); if (c && !seenC[c]) { seenC[c] = 1; LN.record(c, true, 1); } });
        }
        save();
      }
    });
    var ed = ws.ed;
    current = { destroy: function () { ws.destroy(); } };
    grid.appendChild(left);
    grid.appendChild(right);
    p.appendChild(grid);
  }

  // ---------------------------------------------------------------- playground: the IDE (ide.js)
  function pagePlay() { CL.IDE.page(CL.ui); }

  // ---------------------------------------------------------------- reference
  function pageRef() {
    var p = page();
    setTutor("ref", "Reference cheat sheets", function () {
      var heads = Array.prototype.slice.call(document.querySelectorAll(".ref .md > h2"));
      var cur = heads[0], lim = window.innerHeight * 0.45;
      heads.forEach(function (hd) { if (hd.getBoundingClientRect().top < lim) cur = hd; });
      var t = "";
      for (var n = cur; n; n = n.nextElementSibling) { if (n !== cur && n.tagName === "H2") break; t += n.textContent + "\n"; }
      return "Reference page (cheat sheets for the whole course). The section the student is looking at:\n" + Tu.clip(t, 7000);
    });
    p.innerHTML = '<div class="eyebrow">Reference</div><h1 class="title">Cheat sheets</h1><p class="lede">The syntax and the standard code patterns for every structure in the course, with the big-O of each operation. Looking for a word? See the <a href="#glossary">glossary</a>. Wondering whether the runner handles a C++ feature? See <a href="#cpp">C++ support</a>.</p>';
    var wrap = h("div", "ref");
    var toc = h("nav", "ref-toc");
    toc.setAttribute("aria-label", "Contents");
    var body = CL.renderMd(D.ref, mdHooks());
    body.querySelectorAll("h2, h3").forEach(function (x) {
      var a = h("a", x.tagName === "H3" ? "l3" : "", esc(x.textContent));
      a.href = "#ref";
      a.addEventListener("click", function (ev) { ev.preventDefault(); x.scrollIntoView({ behavior: "smooth", block: "start" }); });
      toc.appendChild(a);
    });
    wrap.appendChild(toc);
    wrap.appendChild(body);
    p.appendChild(wrap);
  }

  // helpers for the pages kept in their own files (progress, flashcards, diagnostic, learning paths)
  CL.ui = { h: h, page: page, toast: toast, setTutor: setTutor, progressText: progressText, renderQuestion: renderQuestion, questionText: questionText, recordTrain: recordTrain,
    plain: plain, lcTitle: lcTitle, lessonInfo: lessonInfo, lessonList: lessonList, labById: labById, exById: exById, topicTitle: topicTitle, paperById: paperById, PAPERS: PAPERS,
    route: route, setCurrent: function (c) { current = c; }, gymTopic: function (t) { gymFilter.topic = t || ""; }, lessonLink: lessonLink, wireSectionLinks: wireSectionLinks, mdHooks: mdHooks,
    trainConcept: function (cid) { store.trainPref.mode = "c:" + cid; save(); location.hash = "#train"; },
    trainReview: function () { store.trainPref.mode = "review"; save(); location.hash = "#train"; } };
  if (CL.Game) { CL.Game.init(store); CL.Game.mountHud(app.querySelector(".top-in")); }
  route();
  // merge the copy kept on the viewer's account, then keep it up to date
  CL.Progress.on(function (P) {
    var dot = document.querySelector(".sync-dot");
    if (dot) dot.className = "sync-dot s-" + P.state;
  });
  setTimeout(function () { CL.Progress.startSync(function (changed) { if (changed) { toast("Your progress from your account was merged in."); route(); } }); }, 400);
  // tutor settings do not change how pages look, so they do not redraw the page
  CL.onPrefs = function (k) { if (k === "tutorMode" || k === "tutorUrl") return; route(); };
})();
