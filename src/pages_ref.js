/* COMP 2611 Code Lab — reference pages: what the C++ runner supports, checked against g++. */
(function (CL) {
  "use strict";
  var esc = CL.esc;
  CL.pages = CL.pages || {};
  var STATUS = { match: ["Same as g++", "ok"], "catch": ["Caught and explained", "warn"], reject: ["Refused with a message", "bad"] };
  CL.pages.cpp = { nav: "ref", draw: function (ui) {
    var D = window.CODELAB_DATA, sup = D.cppSupport, st = D.cppStats || {}, p = ui.page("cpp-page narrow");
    ui.setTutor("ref", "What the C++ runner supports", function () {
      return "The student is reading the page that lists which C++ features the site's in-browser C++ runner supports. Supported (output checked against g++): " +
        (sup ? sup.cases.filter(function (c) { return c.expect === "match"; }).map(function (c) { return c.title; }).join("; ") : "") + ". Refused: " +
        (sup ? sup.cases.filter(function (c) { return c.expect === "reject"; }).map(function (c) { return c.title; }).join("; ") : "") + ". Never claim the runner is a full C++ compiler.";
    });
    if (!sup) { p.innerHTML = "<h1 class='title'>C++ support</h1><p>The feature list was not included in this build.</p>"; return; }
    var n = { match: 0, "catch": 0, reject: 0 };
    sup.cases.forEach(function (c) { n[c.expect]++; });
    var groups = [];
    sup.cases.forEach(function (c) { if (groups.indexOf(c.group) < 0) groups.push(c.group); });
    p.innerHTML = '<div class="eyebrow">Reference</div><h1 class="title">What the C++ runner can do</h1>' +
      '<p class="lede">Every program on this site runs in a C++ interpreter written for this site in JavaScript, so it works in your browser with nothing to install and your code never leaves your device. <b>It is not a full C++ compiler</b>, and it should not be treated as one. It covers the C++ that COMP 2611 uses: structs, pointers, references, new and delete, arrays, strings, recursion, files and the usual library functions. This page lists exactly what that means.</p>' +
      '<div class="cpp-stats"><div><b>' + n.match + "</b> features give exactly the same output as g++</div><div><b>" + n["catch"] + "</b> kinds of mistake are stopped and explained</div><div><b>" + n.reject + "</b> features are refused with a clear message, never run wrongly</div>" +
      (st.programs ? "<div><b>" + st.programs + "</b> programs from the lessons, labs and exercises are also compared with g++ whenever the site is built</div>" : "") + "</div>" +
      '<p class="small muted">Checked against ' + esc(sup.compiler) + " on " + esc(sup.generated) + ". Each test program below is compiled with <code>g++ -std=c++17</code> and run; for “Same as g++” the two outputs matched character for character.</p>";
    groups.forEach(function (g) {
      var sec = ui.h("section", "cpp-grp");
      var cs = sup.cases.filter(function (c) { return c.group === g; });
      sec.innerHTML = "<h2>" + esc(g) + "</h2>" + (g.indexOf("caught") >= 0 ? '<p class="small muted">In real C++ these are <i>undefined behaviour</i>: the program might crash, print rubbish, or seem to work. There is no right output to compare with, so the runner stops at the faulty line and tells you what went wrong instead of inventing a result.</p>' : g.indexOf("Not supported") >= 0 ? '<p class="small muted">These are real C++, but outside what this runner handles (and outside the lecture code). The runner refuses to start and names the feature, so it never gives you a wrong answer for them. Use a real compiler for these.</p>' : "");
      cs.forEach(function (c) {
        var s = STATUS[c.expect];
        var d = ui.h("details", "cpp-row");
        d.innerHTML = '<summary><span class="cpp-t">' + esc(c.title) + '</span><span class="chip ' + s[1] + '">' + s[0] + "</span></summary>";
        var body = ui.h("div", "cpp-body");
        var cb = CL.codeBlock(c.src);
        body.appendChild(cb);
        body.appendChild(ui.h("div", "cpp-res", c.expect === "match" ? "<b>Output, here and from g++:</b><pre>" + esc(c.out || "(nothing)") + "</pre>" : "<b>" + (c.expect === "reject" ? "The runner says" : "The runner stops with") + ":</b> " + esc(c.msg)));
        d.appendChild(body);
        sec.appendChild(d);
      });
      p.appendChild(sec);
    });
    var lim = ui.h("section", "cpp-grp");
    lim.innerHTML = "<h2>Limits to know</h2><ul class='cpp-list'>" +
      "<li><b>Running time.</b> A program is stopped after 2,000,000 steps (400,000 in the step-by-step visualizer), which catches loops that never end.</li>" +
      "<li><b>Recursion depth.</b> Calls nested more than about 3,000 deep are stopped (fewer on some phones), which catches recursion with no base case.</li>" +
      "<li><b>Number sizes</b> follow g++ on a 64-bit computer: <code>int</code> is 32 bits, <code>long</code> and <code>long long</code> are 64 bits, and <code>rand()</code> gives the same numbers as g++ on Linux for the same <code>srand</code> seed. Signed overflow wraps around as it usually does with g++, but real C++ does not promise this.</li>" +
      "<li><b>Files</b> live inside the page: a program can read the files you add and write new ones, but it cannot reach the files on your computer.</li>" +
      "<li><b>Library functions:</b> the input and output streams, iomanip, string, cstring (strlen, strcpy, strcat, strcmp), cmath, cstdlib (rand, srand, abs, atoi, exit), ctime (time), cctype (isdigit, toupper and the rest), min, max and swap. Using anything else from the library, such as <code>sort</code> from &lt;algorithm&gt; or <code>printf</code>, stops with a message that names it.</li>" +
      "<li><b>Memory addresses</b> shown in the visualizer are made up for display. Real addresses differ on every run.</li>" +
      "<li><b>Memory leaks</b> are reported when the program ends: objects made with <code>new</code> and never deleted are counted.</li></ul>";
    p.appendChild(lim);
    var full = ui.h("section", "cpp-grp");
    full.innerHTML = "<h2>If you need a full compiler</h2>" +
      "<p>For code outside this list (classes with member functions, templates, the STL), use a real compiler: g++ or clang on your own computer, or the lab machines. The source files of this site include a design and a starting implementation for an optional compiler service that a course or a student could host. It is <b>not running</b> behind this page.</p>" +
      "<ul class='cpp-list'><li>Each run happens in a throw-away container with no network, a read-only system, and a small private folder for the program's files.</li>" +
      "<li>Hard limits: 10 seconds to compile, 2 seconds of CPU time to run, 256 MB of memory, 64 processes, and 64 KB of output.</li>" +
      "<li>The page would send only your code and input, over HTTPS, to an address you choose in settings. No accounts or keys are needed in the page, and nothing is stored after the run.</li></ul>";
    p.appendChild(full);
  } };
})(CL);
