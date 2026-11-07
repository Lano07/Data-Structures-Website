/* COMP 2611 Code Lab — the built-in tutor. Claude answers through the artifact's `sample` capability, with the page the
   student is on as context. Everything here is optional: when the page is not shown inside Claude (for example the
   downloaded file), `claude.use("sample")` is unavailable and every tutor control stays hidden. */
(function (CL) {
  "use strict";
  var esc = CL.esc;

  var T = CL.Tutor = {
    ready: false,
    sample: null,
    page: { kind: "home", title: "Home", context: null, quick: [] },
    turns: [],
    busy: false,
    readyFns: []
  };
  var KEY = "comp2611-tutor-v1";
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && Array.isArray(saved.turns)) T.turns = saved.turns.slice(-30);
  } catch (e) { /* storage unavailable */ }
  // the text of an element with a space between separate pieces (textContent runs grid cells together)
  CL.textOf = function (el) {
    if (!el) return "";
    var out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    for (var n = w.nextNode(); n; n = w.nextNode()) { var t = n.nodeValue.replace(/\s+/g, " ").trim(); if (t) out.push(t); }
    return out.join(" ").replace(/\s+([.,;:!?)])/g, "$1");
  };
  CL.numbered = function (code) {
    return String(code || "").replace(/\s+$/, "").split("\n").map(function (l, i) { return (i + 1) + "  " + l; }).join("\n");
  };
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ turns: T.turns.slice(-30) })); } catch (e) { /* ignore */ } }

  // ---------------------------------------------------------------- how the tutor teaches
  var RULES = [
    "You are the tutor built into \"COMP 2611 Code Lab\", a study website for COMP 2611 Data Structures (C++) at The University of the West Indies.",
    "The student uses this site instead of lectures and a textbook, so you are their teacher. Work through ideas WITH them, the way a patient expert tutor sitting beside them would.",
    "",
    "HOW TO TEACH",
    "- Use calm, simple logic. Explain in plain words, one step at a time, so that each explanation can be fully understood within at most three readings. Elaborate enough that no step is skipped, but never over-complicate.",
    "- Be collaborative: build on what the student says, ask a short question back when it helps them think, and check understanding instead of lecturing.",
    "- Teach with tiny concrete examples (lists of 3-5 nodes, trees of 3-7 nodes, arrays of 5-8 values) and trace them step by step. Small text diagrams and tables are welcome.",
    "- When the student is wrong, say so kindly and clearly, explain exactly where the reasoning went off, and let them try again.",
    "- For Code Gym exercises and graded-style questions: give hints, not the full solution. Point to the case, line or idea that is wrong and why. Only write the complete solution if the student explicitly asks for it after trying.",
    "- When you write code, write C++ in the course's style (struct Node { int data; Node * next; }, createNode, NULL, a space before call parentheses like insertBST (root, key)). A complete program with main() can be run and stepped through on the page, so prefer complete programs for examples.",
    "- If you are unsure of something, say so. Follow the course notes when they are given in the context; never contradict the course's conventions.",
    "- Format: short paragraphs, numbered steps for procedures, Markdown code blocks for code, simple Markdown tables for traces. Use ### at most for headings. Usually stay under 250 words unless the student asks for more or a trace needs it.",
    "",
    "COURSE CONVENTIONS (follow exactly)",
    "- Linked lists: struct Node { int data; Node * next; }; the list is reached through top; createNode (n). Functions that may change the first node return the new top (or take Node * & top). insertAtHead, insertAtTail (getLast), insertSorted, deleteKey (prev/curr), reverse with three pointers. Recursive list functions: base case top == NULL, recursive call on top->next.",
    "- Stacks (LIFO): struct Stack { Node * top; }; push = insert at head, pop = delete at head, pop returns -999 when empty. Queues (FIFO): struct Queue { Node * head; Node * tail; }; enqueue at tail, dequeue at head, -999 when empty.",
    "- Binary trees: struct BTNode { int data; BTNode * left; BTNode * right; BTNode * parent; }. Moment = number of nodes. Weight = number of leaves (terminal nodes). Level/depth counts edges from the root (root is level 0). Height counts edges on the longest root-to-leaf path; an empty tree has height -1. Complete: every non-leaf has two subtrees AND all leaves are on the same level. Almost complete: every level is full except possibly the lowest, which is filled from the left. Full: every non-leaf has exactly two subtrees. Traversals: preorder (root, left, right), inorder (left, root, right), postorder (left, right, root), level order with a queue.",
    "- BSTs: smaller keys go left, larger go right, duplicates are ignored; inorder gives sorted order. Deletion: Case 1 the node is a leaf (set the parent's pointer to NULL); Case 2(a) only a right subtree, Case 2(b) only a left subtree (connect that subtree to the node's parent); Case 3 two subtrees (copy the inorder successor's key into the node, then remove the successor by connecting the successor's RIGHT subtree to the successor's parent). Inorder successor: if the node has a right subtree, the minimum of it; otherwise climb parent pointers while coming up from a right child, and the parent you stop at is the successor (NULL if none). BST operations cost O(h): about log2 n when well shaped, n in the worst (degenerate) case.",
    "- Heaps: stored in an array from index 1 (index 0 unused). Parent(i) = i/2, Left(i) = 2i, Right(i) = 2i+1. Max-heap property A[Parent(i)] >= A[i]. maxHeapify (heap, i) moves A[i] down by swapping with the larger child. buildMaxHeap runs maxHeapify from size/2 down to 1. heapExtractMax: save A[1], move A[size] to A[1], size--, maxHeapify (heap, 1). Insert: size++, put the key at A[size], move it up while its parent is smaller. Increase key: change A[i], then move up. Heap sort is O(n log n). struct MaxPriorityQueue { MaxHeap * heap; } with insert, maximum, extractMax, increaseKey. Lecture example: buildMaxHeap on 4 1 3 2 16 9 10 14 8 7 gives 16 14 10 8 7 9 3 2 4 1.",
    "- Hashing: table locations 1..N, h = key % N + 1 (the lectures use N = 12). 0 means empty, -1 means deleted. Linear probing: next location = location + 1, wrapping from N to 1. Search stops at the key, at an EMPTY location, or after N tries; a deleted (-1) location does not stop a search, but an insert may reuse it. Quadratic probing: after the x-th collision move forward x + x*x locations from the current location (2, 6, 12, 20, ...). Double hashing: step k = key % (N - 2) + 1 (the lecture's worked example used 16 % 10 = 6). Chaining: insert at the head of the list at location h. Strings: add the character codes (anagrams collide), or weight them as str[i] * i. Average O(1), worst O(n).",
    "- Graphs: struct Edge { string destID; Edge * nextEdge; }; struct Vertex { string ID; Edge * firstEdge; }; struct Graph { int numVertices; Vertex vertices[MAX_VERTICES]; }. Adjacency lists and adjacency matrices. BFS uses a queue and WHITE/GREY/BLACK colours (a vertex turns GREY when it is enqueued). DFS uses recursion (dfTraverse) with the same colours. Neighbours are processed in adjacency-list order (alphabetical in the lecture examples). Dijkstra keeps cost and parent for every vertex and a min-priority queue; it repeatedly takes the cheapest vertex and relaxes its edges (weights must not be negative). Kruskal: sort edges by weight and add an edge only if its ends are in different trees. Prim: from a start vertex, repeatedly add the cheapest edge from a used vertex to an unused one. A spanning tree of n vertices has n - 1 edges.",
    "- Sorting: selection, bubble and insertion sort are O(n^2) (insertion is O(n) on sorted input). mergeSort (A, start, end) with mergeArray (A, p, q, r) is O(n log n) always and needs extra arrays. Quick sort uses partition (A, p, r) with pivot x = A[r], i = p - 1, for j = p..r-1: if A[j] <= x then i++ and swap A[i], A[j]; finally swap A[i+1] with A[r] and return i + 1. Quick sort is O(n log n) on average and O(n^2) in the worst case (for example sorted input). Heap sort is O(n log n).",
    "- Performance: searching an array, a linked list, a binary tree or a heap is O(n) (a list search checks about n/2 nodes on average); a BST search is O(log2 n) when well shaped; hashing aims for O(1). Insert at the head of a list is O(1); at the tail (top pointer only) it depends on n."
  ].join("\n");
  T.RULES = RULES;
  // teaching styles the student can choose (Settings, or the menu in the tutor panel)
  var MODES = {
    guide: { name: "Guided", desc: "Hints and questions first; full solutions only when you ask.", rules: "" },
    beginner: { name: "Beginner", desc: "Plain words, tiny examples, one idea at a time.",
      rules: "TEACHING MODE: BEGINNER. Assume the student is meeting this idea for the first time. Use everyday words, define every technical term the first time you use it, use one tiny example (2 to 4 nodes or values), and end with one easy question to check understanding. Keep replies under about 180 words." },
    technical: { name: "Technical", desc: "University-level precision: definitions, invariants, proofs, complexity.",
      rules: "TEACHING MODE: TECHNICAL. The student wants university-level precision. Use exact definitions; state preconditions, invariants and edge cases; justify complexity (best, average and worst case, and extra space) with a short derivation; give correctness arguments where they matter. Be concise and rigorous, and still follow the course conventions." },
    socratic: { name: "Socratic", desc: "Leads you with questions so that you find the answer yourself.",
      rules: "TEACHING MODE: SOCRATIC. Do not state answers or write solution code. Ask one short, focused question at a time that moves the student one step closer, based on their last reply. If they are stuck after two tries, give one small hint, then ask again. Give the full answer only if they explicitly ask for it." },
    debug: { name: "Debugging", desc: "Finds the bug with you: reproduce it, locate it, explain it, fix it.",
      rules: "TEACHING MODE: DEBUGGING. Help the student find and fix a bug systematically: (1) restate or ask for the code, the input, the expected output and the actual output; (2) trace the smallest failing case (an empty structure, one element) line by line; (3) point to the exact line and explain the cause (following NULL, off-by-one, a pointer not updated, a leak); (4) suggest the smallest fix and a test that proves it. When pointers are involved, suggest stepping through the program in the site's visualizer. Never invent program output: if you need it, ask the student to run the program." },
    exam: { name: "Exam coach", desc: "Marking-scheme thinking, answer formats, timing, and where marks are lost.",
      rules: "TEACHING MODE: EXAM COACH. Coach for marks. When the student answers, mark strictly, as a marking scheme would, and show the ideal answer format. Point out where marks would be lost (a missing case, no justification, the wrong traversal order). Give timing advice in proportion to the marks. Prefer exam-style questions with marks shown. Never invent official exam rules or past-paper questions; label any question you write as practice." }
  };
  T.MODES = MODES;
  T.mode = function () { var m = CL.prefs && CL.prefs.tutorMode; return MODES[m] ? m : "guide"; };
  function rulesNow() { var m = MODES[T.mode()]; return RULES + (m.rules ? "\n\n" + m.rules : ""); }
  T.rulesNow = rulesNow;

  // ---------------------------------------------------------------- availability
  // Inside Claude the tutor uses the page's `sample` capability. Elsewhere (a downloaded copy) it can use a tutor
  // server the student or the course runs: the page sends only the conversation, and the server keeps the API key.
  function detect() {
    var c = window.claude;
    if (!c || typeof c.use !== "function") { tryRemote(); return; }
    Promise.resolve().then(function () { return c.use("sample"); }).then(function (s) {
      if (!s) { tryRemote(); return; }
      connect(s, "claude");
    }, function () { tryRemote(); });
  }
  function connect(s, via) {
    T.sample = s;
    T.via = via;
    T.ready = true;
    document.documentElement.classList.add("has-tutor");
    ensureUI();
    var fns = T.readyFns;
    T.readyFns = [];
    fns.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
  }
  T.validUrl = function (u) { return /^https:\/\/[^\s/]+\/?\S*$/.test(u || "") || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/\S*)?$/.test(u || ""); };
  function tryRemote() {
    var url = CL.prefs && CL.prefs.tutorUrl;
    if (!T.validUrl(url) || T.ready) return;
    connect(remoteSample(url), "server");
  }
  T.connectServer = function (url) { if (T.ready && T.via === "claude") return false; T.ready = false; if (T.validUrl(url)) { connect(remoteSample(url), "server"); return true; } disable(); return false; };
  function remoteSample(url) {
    function call(input, opts, wantJson) {
      opts = opts || {};
      var msgs = typeof input === "string" ? [{ role: "user", content: input }] : input;
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: msgs, json: !!wantJson, tier: opts.modelTier || "default" }), signal: opts.signal })
        .then(function (res) {
          if (res.status === 429) throw { code: "rate_limited", message: "rate limited" };
          if (res.status === 413) throw { code: "prompt_too_large", message: "too large" };
          if (!res.ok) throw { code: "server_error", message: "HTTP " + res.status };
          if (!res.body || !res.body.getReader) return res.text().then(function (t) { if (opts.onText) opts.onText({ text: t, delta: t }); return t; });
          var reader = res.body.getReader(), dec = new TextDecoder(), text = "";
          return (function pump() {
            return reader.read().then(function (r) {
              if (r.done) return text;
              var d = dec.decode(r.value, { stream: true });
              text += d;
              if (opts.onText) opts.onText({ text: text, delta: d });
              return pump();
            });
          })();
        })
        .then(function (text) {
          if (!text) throw { code: "empty_completion", message: "empty" };
          return { text: text, truncated: false };
        }, function (e) {
          if (e && e.name === "AbortError") throw { code: "cancelled", message: "stopped" };
          if (e && e.code) throw e;
          throw { code: "network", message: String((e && e.message) || e) };
        });
    }
    var f = function (input, opts) { return call(input, opts, false); };
    f.json = function (input, opts) {
      return call(input, opts, true).then(function (r) {
        var t = r.text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
        try { return JSON.parse(t); } catch (e) {
          var m = /\{[\s\S]*\}/.exec(t);
          if (m) { try { return JSON.parse(m[0]); } catch (e2) { /* fall through */ } }
          throw { code: "invalid_json", message: "not JSON" };
        }
      });
    };
    f.limits = function () { return Promise.resolve({ maxPromptBytes: 200000 }); };
    f.remote = url;
    return f;
  }
  T.whenReady = function (fn) { if (T.ready) fn(); else T.readyFns.push(fn); };
  var PERMANENT = { not_granted: 1, sampling_disabled: 1, not_declared: 1, capability_disabled: 1, capability_removed: 1 };
  function disable() {
    T.ready = false;
    document.documentElement.classList.remove("has-tutor");
  }
  function errorText(code) {
    if (PERMANENT[code]) return "The tutor isn't available here, so it has been switched off for this visit. Everything else on the site still works.";
    if (code === "rate_limited") return "You've reached a usage limit for now. Please try again in a little while.";
    if (code === "session_expired") return "Please sign in to Claude again, then try once more.";
    if (code === "refused") return "The tutor couldn't answer that. Try asking it a different way.";
    if (code === "empty_completion") return "No answer came back. Try rephrasing your question.";
    if (code === "prompt_too_large") return "That was too much to send at once. Try a shorter question or a smaller piece of code.";
    if (code === "invalid_json") return "The answer came back in the wrong shape. Try again.";
    if (code === "network") return "The tutor server could not be reached. Check its address in Settings, and that it is running.";
    if (code === "server_error") return "The tutor server returned an error. Try again, or check the server's log.";
    return "Something went wrong while answering. Please try again.";
  }
  T.errorText = errorText;

  // ---------------------------------------------------------------- page context
  // app.js calls this on every page: kind, title, a function returning context text, and quick prompts
  T.setPage = function (p) {
    T.page = Object.assign({ kind: "home", title: "", context: null, quick: [] }, p || {});
    if (ui) drawContext();
  };
  function clip(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "\n…(cut short)" : s; }
  T.clip = clip;
  function contextText() {
    var p = T.page, extra = "";
    try { extra = p.context ? p.context() : ""; } catch (e) { extra = ""; }
    return "WHAT THE STUDENT IS LOOKING AT RIGHT NOW\nPage: " + (p.title || p.kind) + "\n" + clip(extra, 14000);
  }
  T.contextText = contextText;

  // ---------------------------------------------------------------- one-shot calls (teach-back, explanations)
  // returns the sample promise; streams through onText; switches the tutor off on permanent errors
  T.run = function (prompt, opts) {
    if (!T.ready) return Promise.reject({ code: "not_granted", message: "unavailable" });
    opts = Object.assign({ cache: false }, opts || {});
    return T.sample(prompt, opts).catch(function (e) {
      if (e && PERMANENT[e.code]) disable();
      throw e;
    });
  };
  T.json = function (prompt, opts) {
    if (!T.ready) return Promise.reject({ code: "not_granted", message: "unavailable" });
    opts = Object.assign({ cache: false }, opts || {});
    return T.sample.json(prompt, opts).catch(function (e) {
      if (e && PERMANENT[e.code]) disable();
      throw e;
    });
  };

  // ---------------------------------------------------------------- markdown with runnable code
  function codeHook(final) {
    return function (b) {
      var lang = (b.lang || "").toLowerCase();
      var isCpp = !lang || lang === "cpp" || lang === "c" || lang === "cc";
      var pre = CL.codeBlock(b.code, isCpp ? {} : { cls: "nonum" });
      if (!final) return pre;
      var wrap = document.createElement("div");
      wrap.className = "tcode";
      wrap.appendChild(pre);
      var hasMain = isCpp && /\bint\s+main\s*\(/.test(b.code);
      var bar = document.createElement("div");
      bar.className = "tcode-bar";
      bar.innerHTML = (hasMain ? '<button type="button" class="btn small primary" data-c="run">Run</button><button type="button" class="btn small" data-c="viz">Step through</button>' : "") +
        '<button type="button" class="btn small ghost" data-c="copy">Copy</button>' + (hasMain && CL.toPlayground ? '<button type="button" class="btn small ghost" data-c="play">Open in Playground</button>' : "");
      wrap.appendChild(bar);
      var res = document.createElement("div");
      res.className = "run";
      wrap.appendChild(res);
      bar.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        var a = btn.getAttribute("data-c");
        if (a === "run") CL.showResult(res, CPP.run(b.code, {}), null);
        if (a === "viz") CL.openViz(b.code, { title: "The tutor's example" });
        if (a === "play") CL.toPlayground(b.code);
        if (a === "copy") {
          var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1400); };
          try { navigator.clipboard.writeText(b.code).then(done, function () { selectPre(pre); }); } catch (err) { selectPre(pre); }
        }
      });
      return wrap;
    };
  }
  function selectPre(pre) {
    var r = document.createRange();
    r.selectNodeContents(pre);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
  T.render = function (text, final) {
    var el = CL.renderMd(String(text || "").replace(/^#\s+/gm, "### ").replace(/^##\s+/gm, "### "), { code: codeHook(final), quiz: null, diagram: null });
    el.classList.add("tmd");
    return el;
  };

  // ---------------------------------------------------------------- the drawer
  var ui = null;
  var ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.6 3.6c-.5.4-1.4.1-1.4-.6V16h-.5A2.5 2.5 0 0 1 2 13.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8.5h8M8 11.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function ensureUI() {
    if (ui) return ui;
    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "tutor-fab tutor-only";
    fab.innerHTML = ICON + "<span>Ask the tutor</span>";
    fab.setAttribute("aria-label", "Ask the tutor");
    var box = document.createElement("aside");
    box.className = "tutor";
    box.hidden = true;
    box.setAttribute("aria-label", "Tutor");
    box.innerHTML = '<div class="tutor-h"><div class="tutor-tt"><b>' + ICON + 'Tutor</b><span class="tutor-ctx"></span></div>' +
      '<div class="btns"><label class="tutor-mode-l"><span class="sr-only">Teaching style</span><select class="tutor-mode" title="Teaching style">' + Object.keys(MODES).map(function (k) { return '<option value="' + k + '">' + MODES[k].name + "</option>"; }).join("") + "</select></label>" +
      '<button type="button" class="btn small ghost" data-t="new">New chat</button><button type="button" class="btn small ghost" data-t="close" aria-label="Close the tutor">✕</button></div></div>' +
      '<div class="tutor-body" aria-live="polite"></div>' +
      '<div class="tutor-foot"><div class="tutor-chips"></div><div class="tutor-in"><textarea rows="2" aria-label="Your message to the tutor" placeholder="Ask about this page, your code, or anything in the course…"></textarea>' +
      '<button type="button" class="btn primary" data-t="send">Send</button><button type="button" class="btn" data-t="stop" hidden>Stop</button></div>' +
      '<div class="tutor-note">The tutor sees this page and your code, and uses your Claude account. Enter sends; Shift + Enter makes a new line.</div></div>';
    document.body.appendChild(fab);
    document.body.appendChild(box);
    ui = { fab: fab, box: box, body: box.querySelector(".tutor-body"), ta: box.querySelector("textarea"), chips: box.querySelector(".tutor-chips"), ctx: box.querySelector(".tutor-ctx"),
      send: box.querySelector('[data-t="send"]'), stop: box.querySelector('[data-t="stop"]') };
    fab.addEventListener("click", function () { T.toggle(); });
    var modeSel = box.querySelector(".tutor-mode");
    modeSel.value = T.mode();
    modeSel.addEventListener("change", function () { if (CL.setPref) CL.setPref("tutorMode", modeSel.value); note(ui.body, "Teaching style: " + MODES[modeSel.value].name + ". " + MODES[modeSel.value].desc); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var a = b.getAttribute("data-t");
      if (a === "close") T.close();
      if (a === "new") { T.stop(); T.turns = []; persist(); drawAll(); ui.ta.focus(); }
      if (a === "send") submit();
      if (a === "stop") T.stop();
      var q = b.getAttribute("data-q");
      if (q !== null && b.closest(".tutor-chips, .tutor-welcome")) {
        var item = (T.page.quick || [])[+q];
        if (item) T.ask(item.label, { content: item.prompt });
      }
    });
    ui.ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
      if (e.key === "Escape") T.close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden && !document.querySelector(".modal")) T.close();
    });
    drawAll();
    return ui;
  }
  function submit() {
    var v = ui.ta.value.trim();
    if (!v || T.busy) return;
    ui.ta.value = "";
    T.ask(v);
  }
  function drawContext() {
    ui.ctx.textContent = T.page.title ? "Helping with: " + T.page.title : "";
    var q = T.page.quick || [];
    ui.chips.innerHTML = T.turns.length ? q.map(function (x, i) { return '<button type="button" class="chip-btn" data-q="' + i + '">' + esc(x.label) + "</button>"; }).join("") : "";
    var w = ui.body.querySelector(".tutor-welcome");
    if (w) w.replaceWith(welcome());
  }
  function welcome() {
    var d = document.createElement("div");
    d.className = "tutor-welcome";
    var q = T.page.quick || [];
    d.innerHTML = "<p><b>Hi! I'm your COMP 2611 tutor.</b> I can see the page you are on" + (T.page.kind === "exercise" ? " and the code you have written" : "") + ", so ask me anything about it: a step you don't follow, an error, an idea you want explained another way.</p>" +
      "<p>We'll work through it together. Try one of these:</p>" +
      '<div class="tw-q">' + q.map(function (x, i) { return '<button type="button" class="chip-btn big" data-q="' + i + '">' + esc(x.label) + "</button>"; }).join("") + "</div>";
    return d;
  }
  function msgEl(t) {
    var d = document.createElement("div");
    d.className = "tm " + (t.role === "user" ? "me" : "bot");
    if (t.role === "user") { d.innerHTML = '<div class="tm-b"></div>'; d.firstChild.textContent = t.show || t.content; }
    else { var b = document.createElement("div"); b.className = "tm-b"; b.appendChild(T.render(t.content, true)); d.appendChild(b); }
    return d;
  }
  function drawAll() {
    if (!ui) return;
    ui.body.innerHTML = "";
    if (!T.turns.length) ui.body.appendChild(welcome());
    T.turns.forEach(function (t) { ui.body.appendChild(msgEl(t)); });
    drawContext();
    scrollDown(true);
  }
  function scrollDown(force) {
    var b = ui.body;
    if (force || b.scrollHeight - b.scrollTop - b.clientHeight < 140) b.scrollTop = b.scrollHeight;
  }
  T.open = function () {
    if (!T.ready) return false;
    ensureUI();
    ui.box.hidden = false;
    document.documentElement.classList.add("tutor-open");
    drawContext();
    scrollDown(true);
    setTimeout(function () { if (!T.busy) ui.ta.focus(); }, 30);
    return true;
  };
  T.close = function () {
    if (!ui) return;
    ui.box.hidden = true;
    document.documentElement.classList.remove("tutor-open");
  };
  T.toggle = function () { if (ui && !ui.box.hidden) T.close(); else T.open(); };
  T.stop = function () { if (T.ctl) T.ctl.abort(); };

  // show: what the student sees; opts.content: what Claude reads (defaults to show)
  T.ask = function (show, opts) {
    opts = opts || {};
    if (!T.ready) return false;
    T.open();
    if (T.busy) T.stop();
    T.turns.push({ role: "user", content: opts.content || show, show: show });
    persist();
    var w = ui.body.querySelector(".tutor-welcome");
    if (w) w.remove();
    ui.body.appendChild(msgEl(T.turns[T.turns.length - 1]));
    drawContext();
    scrollDown(true);
    send();
    return true;
  };
  function buildInput() {
    var turns = T.turns.slice(-16).map(function (t) { return { role: t.role, content: t.content }; });
    while (turns.length && turns[0].role !== "user") turns.shift();
    return [{ role: "user", content: rulesNow() + "\n\n" + contextText() + "\n\nThe student's messages follow. Reply to the last one." }].concat(turns);
  }
  function setBusy(b) {
    T.busy = b;
    ui.send.hidden = b;
    ui.stop.hidden = !b;
    ui.box.classList.toggle("busy", b);
  }
  function send() {
    var ctl = new AbortController();
    T.ctl = ctl;
    setBusy(true);
    var bub = document.createElement("div");
    bub.className = "tm bot";
    bub.innerHTML = '<div class="tm-b"><span class="thinking">Thinking<i>.</i><i>.</i><i>.</i></span></div>';
    ui.body.appendChild(bub);
    scrollDown(true);
    var pending = null, latest = "";
    function paint(final) {
      pending = null;
      var b = bub.firstChild;
      b.innerHTML = "";
      b.appendChild(T.render(latest, final));
      scrollDown(false);
    }
    T.sample(buildInput(), {
      cache: false,
      signal: ctl.signal,
      onText: function (u) { latest = u.text; if (!pending) pending = setTimeout(function () { paint(false); }, 90); }
    }).then(function (r) {
      clearTimeout(pending);
      latest = r.text;
      paint(true);
      T.turns.push({ role: "assistant", content: r.text });
      persist();
      if (r.truncated) note(bub, "The answer was cut short. Ask me to continue.");
    }, function (e) {
      clearTimeout(pending);
      var code = e && e.code;
      if (e && e.text && code !== "refused") {
        latest = e.text;
        paint(true);
        T.turns.push({ role: "assistant", content: e.text });
        persist();
      } else bub.remove();
      if (code !== "cancelled") {
        var er = document.createElement("div");
        er.className = "tm sys";
        er.innerHTML = '<div class="tm-b">' + esc(errorText(code)) + (PERMANENT[code] ? "" : ' <button type="button" class="btn small" data-retry>Try again</button>') + "</div>";
        ui.body.appendChild(er);
        var rb = er.querySelector("[data-retry]");
        if (rb) rb.addEventListener("click", function () { er.remove(); if (!T.busy) send(); });
        scrollDown(true);
      }
      if (PERMANENT[code]) disable();
    }).then(function () {
      if (T.ctl === ctl) { T.ctl = null; setBusy(false); }
    });
  }
  function note(bub, text) {
    var n = document.createElement("div");
    n.className = "tm-note";
    n.textContent = text;
    bub.appendChild(n);
  }

  // a small "ask the tutor" button for anywhere on the site
  T.button = function (label, onClick, cls) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn small tutor-btn tutor-only" + (cls ? " " + cls : "");
    b.innerHTML = ICON + "<span>" + esc(label) + "</span>";
    b.addEventListener("click", function (e) { e.preventDefault(); onClick(e); });
    return b;
  };
  T.ICON = ICON;

  detect();
})(CL);
