/* COMP 2611 Code Lab — the coding workspace of the Code Gym and the Quest's code challenges. It works like a small
   compiler: type your code, press ▶ Run to compile it and run it in the terminal (when the program reads cin, you type
   the input right there), or Submit to run every test in the background.
   An exercise's code is usually just a function, so Run builds it together with main.cpp (its own tab), which calls
   your function: it starts as the first test, and you change the values. If your code has its own main(), Run uses
   that instead, and Submit leaves it out because every test brings its own. */
(function (CL) {
  "use strict";
  var esc = CL.esc;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function norm(s) { return String(s || "").replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n").replace(/\n+$/, ""); }
  function clip(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; }

  // comments and the insides of strings become spaces, so braces in them do not count
  function plainCode(code) {
    return CL.Project.blankComments(String(code || "")).replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, function (s) { return s.replace(/[^\n]/g, " "); });
  }
  // where the code's own main() is, if it has one
  function findMain(code) {
    var plain = plainCode(code), m = /\bint\s+main\s*\([^)]*\)\s*\{/.exec(plain);
    if (!m) return null;
    for (var i = m.index + m[0].length - 1, depth = 0; i < plain.length; i++) {
      var c = plain.charAt(i);
      if (c === "{") depth++;
      else if (c === "}" && --depth === 0) return { start: m.index, end: i + 1 };
    }
    return { start: m.index, end: plain.length };
  }
  // the code without its main(): main's text becomes spaces, so every other line keeps its number
  function withoutMain(code) {
    var r = findMain(code);
    return r ? code.slice(0, r.start) + code.slice(r.start, r.end).replace(/[^\n]/g, " ") + code.slice(r.end) : code;
  }
  // a test's main() body, written out as a whole main.cpp
  function mainFile(body) {
    return "int main() {\n" + String(body || "").replace(/\s+$/, "").split("\n").map(function (l) { return l ? "\t" + l : l; }).join("\n") + "\n\treturn 0;\n}\n";
  }
  // the program Run compiles: your code, the tests' helper functions, then main.cpp. The map says which file each line
  // came from, so the terminal reports errors as solution.cpp:4 or main.cpp:2.
  function build(code, harness, main) {
    var parts = [["solution.cpp", code.replace(/\s+$/, "")]];
    if (harness) parts.push(["tests.h", harness.replace(/\s+$/, "")]);
    parts.push(["main.cpp", main.replace(/\s+$/, "")]);
    var lines = [], map = [], files = {};
    parts.forEach(function (p, k) {
      files[p[0]] = p[1];
      if (k) { lines.push(""); map.push({ f: parts[k - 1][0], l: parts[k - 1][1].split("\n").length + 1 }); }
      p[1].split("\n").forEach(function (L, i) { lines.push(L); map.push({ f: p[0], l: i + 1 }); });
    });
    return { src: lines.join("\n") + "\n", files: files, linked: { units: ["solution.cpp", "main.cpp"], map: map } };
  }

  // host: where the workspace goes. e: the exercise. o: { code, onCode(v), main, onMain(v), onReset(), onResults(info), compact }
  CL.Workspace = function (host, e, o) {
    o = o || {};
    var ws = { findMain: findMain };
    var shownTests = e.tests.filter(function (t) { return !t.hidden; });
    var firstTest = shownTests[0] || e.tests[0];
    var root = h("div", "ws" + (o.compact ? " ws-compact" : ""));
    var head = h("div", "ws-head",
      '<span class="ws-file"><i class="ws-ic" aria-hidden="true">C++</i>solution.cpp</span>' +
      '<span class="ws-acts"><button type="button" class="btn ghost small" data-a="reset">Start again</button>' +
      '<button type="button" class="btn blue" data-a="run" title="Compile your code and run it in the terminal (Ctrl + Enter)">▶ Run</button>' +
      '<button type="button" class="btn primary" data-a="submit" title="Run every test (Ctrl + Shift + Enter)">✓ Submit</button></span>');
    root.appendChild(head);
    var edHost = h("div", "ws-ed");
    root.appendChild(edHost);
    host.appendChild(root);
    var ed = ws.ed = new CL.Editor(edHost, { value: o.code != null ? o.code : e.code, label: "Your code for " + e.title, tools: true, onRun: run, onSubmit: submit });
    if (o.onCode) ed.onChange(o.onCode);

    // the console: Terminal, Tests and main.cpp
    var con = h("div", "ws-con");
    con.innerHTML = '<div class="ws-tabs" role="tablist" aria-label="Console">' +
      '<button type="button" role="tab" data-p="term" aria-selected="true"><span class="ws-tdot" aria-hidden="true"></span>Terminal</button>' +
      '<button type="button" role="tab" data-p="tests" aria-selected="false">Tests <span class="ws-badge" hidden></span></button>' +
      '<button type="button" role="tab" data-p="main" aria-selected="false"><i class="ws-ic" aria-hidden="true">C++</i>main.cpp</button>' +
      '<span class="ws-keys">Ctrl+Enter runs · Ctrl+Shift+Enter submits</span></div>';
    var panes = {};
    ["term", "tests", "main"].forEach(function (k) {
      var p = panes[k] = h("div", "ws-pane ws-p-" + k);
      p.setAttribute("role", "tabpanel");
      p.hidden = k !== "term";
      con.appendChild(p);
    });
    root.appendChild(con);
    var tabs = con.querySelector(".ws-tabs"), badge = con.querySelector(".ws-badge");
    function show(k) {
      Object.keys(panes).forEach(function (n) {
        panes[n].hidden = n !== k;
        tabs.querySelector('[data-p="' + n + '"]').setAttribute("aria-selected", n === k ? "true" : "false");
      });
    }
    ws.show = show;
    tabs.addEventListener("click", function (ev) { var b = ev.target.closest("[data-p]"); if (b) show(b.getAttribute("data-p")); });
    function setBadge(text, cls) { badge.hidden = !text; badge.textContent = text || ""; badge.className = "ws-badge" + (cls ? " " + cls : ""); }

    // main.cpp: calls your function; it starts as the first test
    var helpers = e.harness ? (e.harness.match(/\b(__\w+)\s*\(/g) || []).map(function (x) { return x.replace(/\s*\($/, ""); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 6) : [];
    panes.main.appendChild(h("p", "ws-note", "<b>main.cpp</b> calls your function. ▶ Run compiles it after your code, so it needs no <code>#include</code> lines" +
      (helpers.length ? ", and it can use the tests' helper functions (" + helpers.map(function (x) { return "<code>" + esc(x) + "</code>"; }).join(", ") + ")" : "") +
      ". Change the values, add <code>cout</code> lines, or read values with <code>cin</code>: the terminal waits for you to type them."));
    if (shownTests.length > 1) {
      var pick = h("div", "ws-pick", '<label>Start from a test <select>' + shownTests.map(function (t, i) { return '<option value="' + i + '">' + esc(t.name) + "</option>"; }).join("") + '</select></label><button type="button" class="btn small ghost" data-load>Load it</button>');
      panes.main.appendChild(pick);
      pick.querySelector("[data-load]").addEventListener("click", function () { loadTest(shownTests[+pick.querySelector("select").value], false); });
    }
    var startMain = o.main && /\bmain\s*\(/.test(o.main) ? o.main : o.main ? mainFile(o.main) : firstTest ? mainFile(firstTest.main) : "int main() {\n\tcout << \"hello\" << endl;\n\treturn 0;\n}\n";
    var mainEd = ws.mainEd = new CL.Editor(panes.main, { value: startMain, label: "main.cpp, which calls your function", minLines: 5, onRun: run, onSubmit: submit });
    if (o.onMain) mainEd.onChange(o.onMain);
    var mainBar = h("div", "ws-mainbar", '<button type="button" class="btn blue small" data-a="run">▶ Run</button>' + (firstTest ? '<button type="button" class="btn ghost small" data-first>Back to the first test</button>' : ""));
    panes.main.appendChild(mainBar);
    mainBar.addEventListener("click", function (ev) {
      if (ev.target.closest('[data-a="run"]')) run();
      if (ev.target.closest("[data-first]")) loadTest(firstTest, false);
    });
    var pending = null;   // keyboard input for the next run only: a test's prepared input
    function loadTest(t, runNow) {
      mainEd.setValue(mainFile(t.main));
      mainEd.fire();
      pending = t.stdin || null;
      if (runNow) run(); else show("main");
    }
    ws.loadTest = loadTest;

    // the terminal
    function target(file, line) {
      if (file === "main.cpp") return { ed: mainEd, line: line, tab: "main" };
      if (file === "solution.cpp") return { ed: ed, line: line };
      return null;
    }
    var term = ws.term = new CL.Terminal(panes.term, { title: "Terminal", cls: "ws-term", autofocus: false, prompt: "student@codelab:~/gym$ ",
      welcome: "Press ▶ Run to compile your code with main.cpp (it calls your function) and run it here. When the program reads cin, type the input here.\nPress ✓ Submit to run every test.",
      onLocate: function (file, line) {
        var t = target(file, line);
        if (!t) return;
        if (t.tab) show(t.tab);
        t.ed.revealLine(line); t.ed.mark(line, "cur", ""); setTimeout(function () { t.ed.clearMarks("cur"); }, 1400); t.ed.focus();
      },
      onError: function (w, err, kind) {
        var t = target(w.file, w.line);
        if (!t) return;
        t.ed.mark(w.line, kind === "warning" ? "warn" : "err", err.msg);
        if (kind !== "warning") t.ed.revealLine(w.line);
      } });
    function run() {
      show("term");
      var code = ed.getValue(), own = findMain(code), x;
      [ed, mainEd].forEach(function (E) { E.clearMarks("err"); E.clearMarks("warn"); });
      term.clear();
      if (own) {
        x = { src: code, files: { "solution.cpp": code }, file: "solution.cpp", cmd: "g++ -std=c++17 -Wall solution.cpp -o solution && ./solution" };
        term.print("Your code has its own main(), so Run uses it and leaves main.cpp out.", "t-dim");
      } else {
        x = build(code, e.harness || "", mainEd.getValue());
        x.cmd = "g++ -std=c++17 -Wall solution.cpp main.cpp -o solution && ./solution";
      }
      term.exec({ src: x.src, files: x.files, linked: x.linked, file: x.file, cmd: x.cmd, prepared: pending ? pending.replace(/\n$/, "").split("\n") : [], onDone: o.onRunDone });
      pending = null;
    }
    ws.run = run;

    // the tests run in the background (a worker), one after another, so the page stays responsive; Stop ends them
    var results = h("div", "tests ws-results");
    panes.tests.appendChild(results);
    results.appendChild(h("p", "ws-note", "Press ✓ Submit to run every test on your code" + (e.tests.length - shownTests.length ? " (" + shownTests.length + " you can see, " + (e.tests.length - shownTests.length) + " hidden)" : "") + (e.random ? ", plus random tests with new values every time" : "") + "."));
    var runner = CL.Runner.create(), running = false;
    ws.lastResults = "";
    function submit() {
      show("tests");
      var raw = ed.getValue(), own = !!findMain(raw), code = own ? withoutMain(raw) : raw;
      if (running) runner.stop(true);
      ed.clearMarks();
      results.innerHTML = "";
      setBadge("…", "run");
      var userLines = code.replace(/\s+$/, "").split("\n").length;
      var jobs = [], plan = [];
      e.tests.forEach(function (t) {
        plan.push({ t: t, at: jobs.length });
        jobs.push({ src: CL.assemble(e, code, t), opts: { stdin: t.stdin || "", maxSteps: 2000000 } });
      });
      // random tests: new values every run; the expected output comes from the model solution on the same values
      if (e.random && e.solution) {
        e.random.forEach(function (rt) {
          for (var k = 0; k < 2; k++) {
            var tt = { name: "Random: " + rt.name, main: CL.expandRandom(rt.tpl), random: true };
            plan.push({ t: tt, at: jobs.length + 1, ref: jobs.length });
            jobs.push({ src: CL.assemble(e, e.solution, tt), opts: { maxSteps: 2000000 } });
            jobs.push({ src: CL.assemble(e, code, tt), opts: { maxSteps: 2000000 } });
          }
        });
      }
      var got = new Array(jobs.length), nTests = plan.length;
      var prog = h("div", "gym-prog", '<div class="gym-prog-t"><i class="t-spin" aria-hidden="true"></i> <span>Running test 1 of ' + nTests + '…</span></div><div class="xpbar"><i style="width:0%"></i></div><button type="button" class="btn small ghost" data-stop>Stop</button>');
      results.appendChild(prog);
      prog.querySelector("[data-stop]").addEventListener("click", function () { runner.stop(true); running = false; setBadge("", ""); prog.innerHTML = '<span class="muted">Stopped. Press ✓ Submit to try again.</span>'; });
      running = true;
      runner.batch(jobs, {
        onResult: function (i, r) {
          got[i] = r;
          // a compile error makes every test fail the same way: stop at the first one
          if (i === 0 && !r.compiled) { runner.stop(true); finish(); return; }
          var doneTests = plan.filter(function (x) { return got[x.at]; }).length;
          prog.querySelector(".gym-prog-t span").textContent = doneTests >= nTests ? "Checking…" : "Running test " + (doneTests + 1) + " of " + nTests + "…";
          prog.querySelector(".xpbar i").style.width = Math.round(100 * doneTests / nTests) + "%";
        },
        onDone: function () { finish(); }
      });
      function finish() {
        if (!running) return;
        running = false;
        prog.remove();
        var pass = 0, compileErr = got[0] && !got[0].compiled ? got[0].err : null, cards = [];
        if (!compileErr) plan.forEach(function (x) {
          var r = got[x.at];
          if (!r) return;
          var t = x.t;
          if (x.ref !== undefined) {
            var ref = got[x.ref];
            if (!ref || !ref.compiled || ref.err) return;
            t.expect = ref.out;
          }
          var ok = r.compiled && !r.err && norm(r.out) === norm(t.expect);
          if (ok) pass++;
          cards.push({ t: t, r: r, ok: ok, src: jobs[x.at].src });
        });
        render({ code: code, userLines: userLines, pass: pass, total: cards.length, all: !compileErr && pass === cards.length && cards.length > 0, compileErr: compileErr, cards: cards, ownMain: own });
      }
    }
    ws.submit = submit;
    function render(info) {
      info.el = results;
      if (info.ownMain) results.appendChild(h("div", "ws-note", "Your own <code>main()</code> was left out: each test brings its own."));
      if (info.compileErr) {
        var ce = info.compileErr, inUser = ce.line && ce.line <= info.userLines;
        ws.lastResults = "Last test run: the code did not compile" + (ce.line ? " (line " + ce.line + ")" : "") + ": " + ce.msg;
        results.appendChild(h("div", "errbox", "<b>Your code does not compile" + (inUser ? " (line " + ce.line + ")" : "") + ".</b> " + esc(ce.msg) + (ce.hint ? '<div class="hint">' + esc(ce.hint) + "</div>" : "") +
          (inUser ? "" : '<div class="hint">The problem shows up in the test code, so check that your function has the exact name and parameters the exercise asks for.</div>')));
        if (inUser) { ed.mark(ce.line, "err", ce.msg); ed.revealLine(ce.line); }
        if (inUser && CL.explainErrorRow) { var cr = CL.explainErrorRow(info.code, ce, "compile error"); if (cr) results.appendChild(cr); }
        setBadge("error", "bad");
        if (o.onResults) o.onResults(info);
        return;
      }
      ws.lastResults = "Last test run: " + info.pass + " of " + info.total + " tests pass.\n" + info.cards.map(function (c) {
        return (c.ok ? "PASS " : "FAIL ") + c.t.name + (c.ok ? "" : ": expected output " + JSON.stringify(clip(c.t.expect || "", 300)) + ", the student's output " + JSON.stringify(clip(c.r.out || "", 300)) +
          (c.r.err ? ", stopped with " + (c.r.err.kind === "limit" ? "a limit" : "a runtime error") + (c.r.err.line && c.r.err.line <= info.userLines ? " on line " + c.r.err.line : "") + ": " + c.r.err.msg : ""));
      }).join("\n");
      info.summaryEl = h("div", "summary" + (info.all ? " allok" : ""), info.all ? "All " + info.pass + " tests pass. Well done." : info.pass + " of " + info.total + " tests pass");
      results.appendChild(info.summaryEl);
      setBadge(info.pass + "/" + info.total, info.all ? "ok" : "bad");
      info.cards.forEach(function (c) {
        var el = h("div", "test " + (c.ok ? "pass" : "fail"));
        el.innerHTML = '<div class="test-h"><span class="r">' + (c.ok ? "✓ Pass" : "✗ Fail") + '</span><span class="nm">' + esc(c.t.name) + (c.t.hidden ? ' <span class="chip">hidden test</span>' : "") + '</span><span class="tm">' + (c.r.ms !== undefined ? CL.fmtMs(c.r.ms) : "") + "</span></div>";
        if (!c.ok) {
          var b = h("div", "test-b");
          if (c.t.hidden) {
            // say what the hidden test is about, and let the student choose to see it
            var hid = h("div", "test-hid small", "This hidden test checks a case the other tests do not show: <b>" + esc(c.t.name) + "</b>. Think about what your code does there before you look. ");
            var rv = h("button", "btn small ghost", "Show this test");
            rv.type = "button";
            hid.appendChild(rv);
            el.appendChild(hid);
            b.hidden = true;
            rv.addEventListener("click", function () { b.hidden = false; hid.remove(); });
          }
          if (c.t.random) { var tp = h("pre", "out test-src"); tp.textContent = c.t.main; b.appendChild(h("div", "out-h", "This random test ran")); b.appendChild(tp); }
          if (c.r.err) {
            var inU = c.r.err.line && c.r.err.line <= info.userLines;
            b.appendChild(h("div", "errbox", "<b>" + (c.r.err.kind === "limit" ? "Stopped" : "Runtime error") + (inU ? " on line " + c.r.err.line : "") + ".</b> " + esc(c.r.err.msg) + (c.r.err.hint ? '<div class="hint">' + esc(c.r.err.hint) + "</div>" : "")));
            if (inU) ed.mark(c.r.err.line, "err", c.r.err.msg);
          }
          var cmp = h("div", "cmp");
          var exp = h("div"); exp.appendChild(h("div", "out-h", "Expected output")); var p1 = h("pre", "out"); p1.textContent = c.t.expect || "(nothing)"; exp.appendChild(p1);
          var gotEl = h("div"); gotEl.appendChild(h("div", "out-h", "Your output")); var p2 = h("pre", "out" + (c.r.out ? "" : " empty")); p2.textContent = c.r.out || "(nothing was printed)"; gotEl.appendChild(p2);
          cmp.appendChild(exp); cmp.appendChild(gotEl);
          b.appendChild(cmp);
          var vrow = h("div", "btns");
          var tb = h("button", "btn small blue", "▶ Run this test in the terminal");
          tb.type = "button";
          tb.title = "Puts this test into main.cpp and runs it, so you can add cout lines and see what happens";
          tb.addEventListener("click", function () { loadTest(c.t, true); });
          vrow.appendChild(tb);
          if (CL.openViz) {
            var vb = h("button", "btn small ghost", "Step through it");
            vb.type = "button";
            vb.addEventListener("click", function () { CL.openViz(c.src, { stdin: c.t.stdin || "", title: "Test: " + c.t.name }); });
            vrow.appendChild(vb);
          }
          b.appendChild(vrow);
          el.appendChild(b);
        }
        results.appendChild(el);
      });
      if (o.onResults) o.onResults(info);
    }

    head.addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "run") run();
      if (a === "submit") submit();
      if (a === "reset") {
        if (b.dataset.armed) {
          delete b.dataset.armed; b.textContent = "Start again";
          ed.setValue(e.code); ed.clearMarks(); ed.fire();
          results.innerHTML = ""; setBadge("", "");
          if (o.onReset) o.onReset();
        } else { b.dataset.armed = "1"; b.textContent = "Click again to erase your code"; setTimeout(function () { if (b.dataset.armed) { delete b.dataset.armed; b.textContent = "Start again"; } }, 4000); }
      }
    });
    ws.el = root;
    ws.destroy = function () { runner.destroy(); term.destroy(); };
    return ws;
  };
})(CL);
