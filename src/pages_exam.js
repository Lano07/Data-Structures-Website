/* COMP 2611 Code Lab — written-answer practice (marked against a marking scheme, by the tutor or by the student) and
   the exam review page (answer formats, presenting handwritten C++, time planning, where marks are lost). */
(function (CL) {
  "use strict";
  var esc = CL.esc, LN = CL.Learn;
  CL.pages = CL.pages || {};
  var TYPE = { code: "Write code", trace: "Trace", explain: "Explain", complexity: "Complexity", proof: "Proof", design: "Design" };
  function S() { return CL.store; }
  function bank() { return (window.CODELAB_DATA.written || []); }
  function byId(id) { return bank().filter(function (q) { return q.id === id; })[0] || null; }
  function topicName(t) { var x = CL.Train.topicById[t]; return x ? x.title : t; }
  function firstLine(md) { return String(md).split("\n")[0].replace(/`/g, "").replace(/\*\*/g, "").slice(0, 150); }
  function rec(id) { return (S().wr || {})[id] || null; }
  var filt = { topic: "", type: "" };

  CL.pages.written = { nav: "train", draw: function (ui) {
    var p = ui.page("wr-page"), h = ui.h;
    ui.setTutor("home", "Written answers", ui.progressText);
    var all = bank();
    var done = all.filter(function (q) { return rec(q.id) && rec(q.id).done; }).length;
    p.innerHTML = '<div class="eyebrow">Practice</div><h1 class="title">Written answers</h1>' +
      '<p class="lede">Exam-style questions you answer in your own words or code, then mark against a marking scheme. You see which points earned marks, which did not, and the ideal answer laid out as a marker wants it. ' +
      (CL.Tutor && CL.Tutor.ready ? "The tutor can mark your answer strictly, point by point, or you can mark it yourself." : "Mark your answer yourself against the scheme, honestly, point by point.") + "</p>" +
      '<p class="wr-note small"><b>Original practice questions</b>, written for this site in the style of COMP 2611. None of them is from a UWI past paper. Every code answer has been compiled with g++ and run to check that it works.</p>' +
      '<p class="small muted">' + done + " of " + all.length + ' answered. See also the <a href="#exam-review">exam review</a>: answer formats, handwritten C++ and time planning.</p>';
    var f = h("div", "filters");
    var topics = [];
    all.forEach(function (q) { if (topics.indexOf(q.topic) < 0) topics.push(q.topic); });
    var order = CL.Train.topics.map(function (t) { return t.id; });
    topics.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    f.innerHTML = '<span class="fl">Topic</span><button type="button" class="fbtn" data-t="">All</button>' + topics.map(function (t) { return '<button type="button" class="fbtn" data-t="' + t + '">' + esc(topicName(t)) + "</button>"; }).join("");
    var f2 = h("div", "filters");
    f2.innerHTML = '<span class="fl">Kind</span><button type="button" class="fbtn" data-k="">All</button>' + Object.keys(TYPE).filter(function (k) { return all.some(function (q) { return q.type === k; }); }).map(function (k) { return '<button type="button" class="fbtn" data-k="' + k + '">' + TYPE[k] + "</button>"; }).join("");
    p.appendChild(f); p.appendChild(f2);
    var list = h("div", "wr-list");
    p.appendChild(list);
    function draw() {
      f.querySelectorAll("[data-t]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-t") === filt.topic); });
      f2.querySelectorAll("[data-k]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-k") === filt.type); });
      list.innerHTML = all.filter(function (q) { return (!filt.topic || q.topic === filt.topic) && (!filt.type || q.type === filt.type); }).map(function (q) {
        var r = rec(q.id);
        return '<a class="wr-item" href="#written-' + q.id + '"><span class="wr-st ' + (r && r.done ? (r.best / q.marks >= 0.7 ? "ok" : "part") : "") + '" aria-hidden="true">' + (r && r.done ? r.best + "/" + q.marks : "") + '</span><span class="wr-main"><span class="wr-meta"><span class="chip">' + esc(topicName(q.topic)) + '</span><span class="chip">' + TYPE[q.type] + "</span><span class=\"muted small\">" + q.marks + " marks · about " + q.minutes + " min</span></span><span class=\"wr-q\">" + esc(firstLine(q.q)) + "</span></span></a>";
      }).join("") || '<p class="muted">No questions match.</p>';
    }
    f.addEventListener("click", function (e) { var b = e.target.closest("[data-t]"); if (b) { filt.topic = b.getAttribute("data-t"); draw(); } });
    f2.addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) { filt.type = b.getAttribute("data-k"); draw(); } });
    draw();
  } };

  CL.pages["written-"] = { nav: "train", draw: function (ui, id) {
    var q = byId(id);
    if (!q) return false;
    var p = ui.page("wr-page narrow"), h = ui.h, st = S();
    st.wr = st.wr || {};
    var all = bank(), idx = all.indexOf(q), prevQ = all[idx - 1], nextQ = all[idx + 1];
    var marked = null, t0 = Date.now(), timer = null;
    ui.setTutor("home", "Written answer: " + firstLine(q.q), function () {
      var s = ui.progressText() + "\n\nThe student is answering a written practice question (" + q.marks + " marks):\n" + q.q;
      s += marked ? "\n\nIt has been marked: " + marked.total + "/" + q.marks + ". The marking scheme: " + q.rubric.map(function (r) { return r.pts + " mark(s): " + r.text; }).join(" | ") + "\nThe model answer: " + q.answer : "\n\nThey have NOT been marked yet: do not give the answer or the marking scheme; give hints only.";
      return s;
    });
    p.innerHTML = '<div class="eyebrow"><a href="#written">Written answers</a> · ' + esc(topicName(q.topic)) + " · " + TYPE[q.type] + "</div>" +
      '<h1 class="title wr-t">' + esc(firstLine(q.q).replace(/\.$/, "").slice(0, 90)) + (firstLine(q.q).length > 90 ? "…" : "") + "</h1>" +
      '<div class="wr-head"><span class="chip">' + q.marks + " marks</span><span class=\"muted small\">Suggested time " + q.minutes + ' min</span><span class="wr-clock" aria-live="off"></span><span class="wr-orig small muted">Original practice question</span></div>';
    var qbox = h("div", "wr-qbox md");
    qbox.appendChild(CL.renderMd(q.q, ui.mdHooks({ noRun: true })));
    p.appendChild(qbox);
    var ansWrap = h("div", "wr-ans");
    ansWrap.innerHTML = '<label class="wr-lab" for="wr-in">Your answer</label><p class="small muted">' + (q.type === "code" ? "Write the code as you would on paper, without running it. You can test it after marking." : "Write it as you would in the exam: complete sentences, tables and steps where they help.") + "</p>";
    p.appendChild(ansWrap);
    var saved = (rec(q.id) || {}).draft || (rec(q.id) || {}).ans || "";
    var ed = null, ta = null;
    if (q.type === "code") {
      var host = h("div", "wr-ed");
      ansWrap.appendChild(host);
      ed = new CL.Editor(host, { value: saved || "", label: "Your answer", minLines: 12, tools: true });
    } else {
      ta = h("textarea", "wr-ta");
      ta.id = "wr-in";
      ta.rows = 12;
      ta.value = saved;
      ta.setAttribute("spellcheck", "true");
      ansWrap.appendChild(ta);
    }
    function answer() { return ed ? ed.getValue() : ta.value; }
    var draftT = null;
    function keepDraft() { clearTimeout(draftT); draftT = setTimeout(function () { var r = st.wr[q.id] = st.wr[q.id] || {}; r.draft = answer().slice(0, 6000); r.dt = Date.now(); CL.save(true); }, 800); }
    if (ed) ed.onChange(keepDraft); else ta.addEventListener("input", keepDraft);
    var acts = h("div", "btns wr-acts");
    acts.innerHTML = (CL.Tutor && CL.Tutor.ready ? '<button type="button" class="btn primary" data-ai>Mark it strictly (tutor)</button>' : "") +
      '<button type="button" class="btn' + (CL.Tutor && CL.Tutor.ready ? "" : " primary") + '" data-self>Mark it myself</button><button type="button" class="btn ghost" data-show>Show the ideal answer</button>';
    p.appendChild(acts);
    // the tutor connects a moment after the page opens: add its button when it is ready
    if (CL.Tutor && !CL.Tutor.ready) CL.Tutor.whenReady(function () {
      if (!document.body.contains(acts) || acts.querySelector("[data-ai]")) return;
      acts.insertAdjacentHTML("afterbegin", '<button type="button" class="btn primary" data-ai>Mark it strictly (tutor)</button>');
      var sb = acts.querySelector("[data-self]");
      if (sb) sb.classList.remove("primary");
    });
    var res = h("div", "wr-res");
    p.appendChild(res);
    var nav = h("div", "wr-nav");
    nav.innerHTML = (prevQ ? '<a class="btn ghost" href="#written-' + prevQ.id + '">← Previous</a>' : "<span></span>") + '<a class="btn ghost" href="#written">All questions</a>' + (nextQ ? '<a class="btn ghost" href="#written-' + nextQ.id + '">Next →</a>' : "<span></span>");
    p.appendChild(nav);
    // a running clock against the suggested time
    var clock = p.querySelector(".wr-clock");
    function tick() {
      var s = Math.floor((Date.now() - t0) / 1000), over = s > q.minutes * 60;
      clock.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      clock.classList.toggle("over", over);
      clock.title = over ? "Past the suggested time" : "Time spent";
    }
    timer = setInterval(tick, 1000); tick();
    ui.setCurrent({ destroy: function () { clearInterval(timer); clearTimeout(draftT); } });

    function ideal() {
      var box = h("div", "wr-ideal");
      box.innerHTML = "<h2>The ideal answer</h2>";
      var md = CL.renderMd(q.answer, ui.mdHooks({ noRun: true }));
      md.classList.add("md");
      box.appendChild(md);
      if (q.format) box.insertAdjacentHTML("beforeend", "<h3>How to present it</h3><p>" + CL.inline(q.format) + "</p>");
      if (q.mistakes && q.mistakes.length) box.insertAdjacentHTML("beforeend", "<h3>Where marks are usually lost</h3><ul>" + q.mistakes.map(function (m) { return "<li>" + CL.inline(m) + "</li>"; }).join("") + "</ul>");
      if (q.lessons && q.lessons.length) box.insertAdjacentHTML("beforeend", '<p class="small">Revise: ' + q.lessons.map(function (l) { return ui.lessonLink(l); }).join(" · ") + "</p>");
      ui.wireSectionLinks(box);
      if (q.type === "code" && q.check) {
        var tb = h("div", "wr-test");
        tb.innerHTML = '<button type="button" class="btn small">Test my code</button><span class="small muted">Runs your function with a small test program and compares the output with the model answer\'s.</span>';
        var out = h("div", "wr-tout");
        tb.appendChild(out);
        tb.querySelector("button").addEventListener("click", function () {
          var prog = (q.given || "") + "\n\n" + answer() + "\n" + q.check + "\n";
          var r = CPP.run(prog, { maxSteps: 2000000 });
          var ok = r.compiled && !r.err && r.out.replace(/\s+$/, "") === q.expect.replace(/\s+$/, "");
          out.innerHTML = !r.compiled ? '<div class="errbox"><b>Your code does not compile' + (r.err.line ? " (line " + Math.max(1, r.err.line - (q.given || "").split("\n").length - 1) + " of your answer)" : "") + ".</b> " + esc(r.err.msg) + "</div>" :
            ok ? '<div class="okbox"><b>✓ Your code gives the expected output:</b> <code>' + esc(r.out.trim()) + "</code></div>" :
            '<div class="errbox"><b>Not the expected output.</b> Expected <code>' + esc(q.expect.trim()) + "</code>, yours gave <code>" + esc(r.out.trim() || "(nothing)") + "</code>" + (r.err ? ". " + esc(r.err.msg) : "") + "</div>";
        });
        box.appendChild(tb);
      }
      return box;
    }
    function save(total, by) {
      var r = st.wr[q.id] = st.wr[q.id] || {};
      var first = !r.done;
      r.done = 1; r.last = total; r.best = Math.max(r.best || 0, total); r.t = Date.now(); r.by = by; r.ans = answer().slice(0, 6000); r.n = (r.n || 0) + 1;
      delete r.draft;
      CL.Progress.log("w");
      if (first) { var seen = {}; (q.lessons || []).forEach(function (l) { var c = LN.forLesson(l); if (c && !seen[c]) { seen[c] = 1; LN.record(c, total / q.marks >= 0.6, 1); } }); }
      CL.save();
    }
    function showScore(total, rows, by, extra) {
      marked = { total: total };
      res.innerHTML = '<div class="wr-score"><b>' + total + "</b> / " + q.marks + ' <span class="muted small">' + (by === "ai" ? "marked strictly by the tutor against the scheme" : "your own marking against the scheme") + "</span></div>" +
        '<ul class="wr-rub">' + rows.map(function (r) { return '<li class="' + (r.got >= r.pts ? "ok" : r.got > 0 ? "part" : "no") + '"><span class="wr-pts">' + r.got + "/" + r.pts + '</span><span>' + esc(r.text) + (r.reason ? '<span class="wr-why">' + esc(r.reason) + "</span>" : "") + "</span></li>"; }).join("") + "</ul>" + (extra || "");
      res.appendChild(ideal());
      res.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    acts.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-show")) { if (!answer().trim() && !b.classList.contains("confirm")) { b.classList.add("confirm"); b.textContent = "Show it without answering?"; return; } res.innerHTML = ""; res.appendChild(ideal()); return; }
      if (!answer().trim()) { ui.toast("Write your answer first."); return; }
      if (b.hasAttribute("data-self")) return selfMark();
      if (b.hasAttribute("data-ai")) return aiMark(b);
    });
    function selfMark() {
      res.innerHTML = '<div class="wr-self"><h2>Mark your answer</h2><p class="small">Tick a point only if your answer clearly contains it. Be strict: in the exam, vague or partly right statements earn nothing.</p>' +
        q.rubric.map(function (r, i) {
          return '<div class="wr-sp"><span class="wr-sp-t">' + esc(r.text) + '</span><span class="wr-sp-b" role="group" aria-label="Marks for this point">' + Array.apply(null, Array(r.pts + 1)).map(function (_, k) { return '<button type="button" data-i="' + i + '" data-v="' + k + '"' + (k === 0 ? ' class="on"' : "") + ">" + k + "</button>"; }).join("") + "</span></div>";
        }).join("") + '<div class="btns"><button type="button" class="btn primary" data-done>Done: show my score and the ideal answer</button></div></div>';
      var got = q.rubric.map(function () { return 0; });
      res.querySelector(".wr-self").addEventListener("click", function (e) {
        var b = e.target.closest("[data-v]");
        if (b) { var i = +b.getAttribute("data-i"); got[i] = +b.getAttribute("data-v"); b.parentNode.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); return; }
        if (e.target.closest("[data-done]")) {
          var total = got.reduce(function (a, x) { return a + x; }, 0);
          save(total, "self");
          showScore(total, q.rubric.map(function (r, i) { return { pts: r.pts, text: r.text, got: got[i] }; }), "self");
        }
      });
      res.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function aiMark(btn) {
      btn.disabled = true;
      btn.textContent = "Marking…";
      var prompt = "You are marking a student's answer to an exam-style question for COMP 2611 Data Structures (C++) at UWI.\n" +
        "Mark STRICTLY against the marking scheme. Award a scheme point only when the answer clearly and correctly contains it. Vague, partly correct, or missing statements earn 0 for that point (you may award part of a multi-mark point only when the scheme's text clearly splits). Do not award anything outside the scheme. A correct answer written in a different valid form still earns the point. Code is marked as written: do not assume missing lines.\n" +
        "Return JSON only, exactly in this shape: {\"points\": [{\"i\": 0, \"awarded\": 0, \"reason\": \"one short sentence that points at the student's own words or the missing piece\"}], \"summary\": \"two or three sentences: what earned marks and what lost them\", \"fix\": \"the single most important change\"}. Include one entry for every scheme point, in order.\n\n" +
        "QUESTION (" + q.marks + " marks):\n" + q.q + "\n\nMARKING SCHEME (index: marks: what earns it):\n" + q.rubric.map(function (r, i) { return i + ": " + r.pts + ": " + r.text; }).join("\n") +
        "\n\nMODEL ANSWER (reference only):\n" + q.answer + "\n\nSTUDENT'S ANSWER:\n" + answer().slice(0, 6000);
      CL.Tutor.json(prompt, { modelTier: "default" }).then(function (j) {
        btn.disabled = false; btn.textContent = "Mark it strictly (tutor)";
        if (!j || !Array.isArray(j.points)) throw { code: "invalid_json" };
        var rows = q.rubric.map(function (r, i) {
          var pnt = j.points.filter(function (x) { return +x.i === i; })[0] || {};
          var got = Math.max(0, Math.min(r.pts, Math.round(+pnt.awarded || 0)));
          return { pts: r.pts, text: r.text, got: got, reason: String(pnt.reason || "").slice(0, 300) };
        });
        var total = rows.reduce(function (a, r) { return a + r.got; }, 0);
        save(total, "ai");
        showScore(total, rows, "ai", '<div class="wr-sum">' + (j.summary ? "<p>" + esc(String(j.summary).slice(0, 800)) + "</p>" : "") + (j.fix ? "<p><b>Fix first:</b> " + esc(String(j.fix).slice(0, 400)) + "</p>" : "") +
          '<p class="small muted">The tutor marks against the scheme above. If a decision looks wrong to you, compare your answer with the ideal answer below; the scheme is what counts.</p></div>');
      }).catch(function (e) {
        btn.disabled = false; btn.textContent = "Mark it strictly (tutor)";
        res.innerHTML = '<div class="errbox">' + esc(CL.Tutor.errorText(e && e.code)) + ' You can <button type="button" class="linkbtn" data-self2>mark it yourself</button> instead.</div>';
        var s2 = res.querySelector("[data-self2]");
        if (s2) s2.addEventListener("click", selfMark);
      });
    }
  } };

  // ---------------------------------------------------------------- exam review
  CL.pages["exam-review"] = { nav: "train", draw: function (ui) {
    var p = ui.page("er-page narrow"), ex = LN.examDate(), goal = S().goal || {}, mins = goal.examMin || 120;
    ui.setTutor("home", "Exam review", ui.progressText);
    var formats = {};
    bank().forEach(function (q) { if (q.format && !formats[q.type]) formats[q.type] = q.format; });
    p.innerHTML = '<div class="eyebrow">Practice</div><h1 class="title">Exam review</h1>' +
      '<p class="lede">How to turn what you know into marks: the shape of a full-marks answer for each kind of question, how to present C++ written by hand, how to plan your time, and where marks are usually lost.</p>' +
      '<p class="wr-note small">This is general exam technique, written for this site. It is not official COMP 2611 exam information. Follow your lecturer\'s instructions for the paper itself.</p>' +
      "<h2>Your final exam</h2><p>" + esc(ex.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })) + " at " + esc(ex.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })) + ", " + mins + ' minutes (you can change this on the <a href="#progress">Progress page</a>). The paper\'s sections and marks were not in the lecture notes, so check the format your lecturer announces.</p>' +
      "<h2>Planning your time</h2><ol>" +
      "<li>Spend the first 5 minutes reading the whole paper and marking the questions you can do quickly.</li>" +
      "<li>Work out your rate: <b>minutes per mark = (" + mins + " − 15) ÷ the total marks</b>. This keeps 10 minutes to check and 5 to read. For example, a 100-mark paper in " + mins + " minutes gives about " + (Math.round((mins - 15) / 100 * 10) / 10) + " minutes per mark.</li>" +
      "<li>Give each question its share of time. When a question's time runs out, write down the method in steps (a partial answer earns method marks) and move on.</li>" +
      "<li>Do the questions you are surest of first, but number your answers clearly so the marker can find them.</li>" +
      "<li>Use the last 10 minutes to check the empty, one-element and end cases of every piece of code.</li></ol>" +
      "<h2>The shape of a full-marks answer</h2>" +
      '<div class="er-grid">' +
      fmt("Write code", "The exact header (return type, name, parameters), then the body. Handle the special cases first (empty list, NULL root, first node, not found), each with a short comment. Use the course's names: top, curr, prev, root, newNode.") +
      fmt("Trace an algorithm", "A table with one row per step: what is compared, what moves, and the state after the step (array, queue, table or tree). Mark the values that changed. End with the final answer on its own line.") +
      fmt("Explain or compare", "One sentence that answers the question directly, then the reasons as short points. For a comparison, use the same points for each item (cost, memory, special cases), or a table.") +
      fmt("Complexity", "State the big-O, then justify it by counting how many times the key statement runs (a sum like n + (n−1) + … + 1, or the number of halvings). Say which case (best, average, worst) you mean.") +
      fmt("Proof of correctness", "State the loop invariant in one sentence, then three short parts: initialisation, maintenance and termination. For recursion: base case, then why each call is correct if the smaller calls are.") +
      fmt("Draw a structure", "Draw boxes and arrows large and clearly: every pointer starts inside a box and ends at the box it points to, NULL is written or drawn as a slash, and deleted nodes are crossed out.") +
      "</div>" +
      "<h2>Writing C++ by hand</h2><ul>" +
      "<li>Write the header exactly as given. A changed name or parameter type can cost marks even when the logic is right.</li>" +
      "<li>Indent consistently, and put each closing brace under the line that opened it. If an indent is unclear, add the brace: <code>if (...) { ... }</code>.</li>" +
      "<li>Leave a blank line between functions and space between lines, so you can insert a forgotten line neatly. Put an arrow and the missing line in the margin rather than squeezing it in.</li>" +
      "<li>Test your code by hand on three cases before moving on: an empty structure, one element, and a typical case. Trace the pointers in a small drawing.</li>" +
      "<li>Free what you remove (<code>delete</code>), and update every pointer that pointed to it (<code>prev-&gt;next</code>, <code>tail</code>, <code>parent</code>).</li>" +
      "<li>If you cannot finish, write the remaining steps as numbered comments. A clear plan earns method marks; a half-written loop does not.</li></ul>" +
      "<h2>Where marks are usually lost</h2><ul>" +
      "<li>Following a NULL pointer: checking <code>curr-&gt;data</code> before <code>curr != NULL</code>.</li>" +
      "<li>Forgetting the special first or last case (the first node of a list, the last node of a queue, the root of a tree).</li>" +
      "<li>Off-by-one errors: heap indexes from 1, hash locations 1 to N, loop bounds such as <code>i &lt;= n</code>.</li>" +
      "<li>Answering a different question: giving inorder when preorder was asked for, or the average case when the worst case was asked for.</li>" +
      "<li>A big-O with no reason, or a trace with no working: a right answer with no working may get only part of the marks, and a wrong one gets none.</li>" +
      "<li>Leaving a part of a question unanswered. Write something for every part: a definition, a small example or the method.</li></ul>" +
      '<h2>Practise it</h2><div class="btns"><a class="btn primary" href="#written">Written answers</a><a class="btn" href="#exam">Timed mock exams</a><a class="btn" href="#l-l2-exam-technique">Exam technique lesson</a><a class="btn ghost" href="#diag">Diagnostic test</a></div>';
    function fmt(t, d) { return '<div class="er-card"><b>' + esc(t) + "</b><p>" + d + "</p></div>"; }
  } };
})(CL);
