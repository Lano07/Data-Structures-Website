/* COMP 2611 Code Lab — the Playground IDE: projects with folders and many kinds of files, tabs, uploads from your computer
   (files, whole folders, .zip archives, a link, or a folder opened straight from disk in Chrome and Edge), downloads,
   a multi-file build (main.cpp + list.h + list.cpp), and a terminal that runs the program interactively and also takes
   shell commands (g++, ./a.out, ls, cat, mkdir, ...). Projects are kept in this browser. */
(function (CL) {
  "use strict";
  var P = CL.Project, esc = CL.esc;
  var IDE = CL.IDE = { pending: null };
  var LS_H = "comp2611-ide-termh";

  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function iconFor(path) {
    var k = P.kindOf(path), K = P.KINDS[k];
    return '<span class="fx-ic k-' + k + '" aria-hidden="true">' + esc(K ? K.icon : "•") + "</span>";
  }
  function download(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  IDE.download = download;
  function slug(s) { return String(s || "file").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file"; }

  // ---------------------------------------------------------------- small dialogs and menus
  function modal(title, bodyHtml, buttons) {
    return new Promise(function (resolve) {
      var m = h("div", "modal ide-modal");
      m.setAttribute("role", "dialog");
      m.setAttribute("aria-modal", "true");
      m.setAttribute("aria-label", title);
      var box = h("div", "modal-in ide-dlg", '<div class="modal-h"><h3>' + esc(title) + '</h3><button type="button" class="btn ghost small" data-x aria-label="Close">✕</button></div><div class="ide-dlg-b">' + bodyHtml + '</div><div class="ide-dlg-f"></div>');
      m.appendChild(box);
      var foot = box.querySelector(".ide-dlg-f");
      (buttons || [{ label: "OK", value: true, primary: true }]).forEach(function (b) {
        var bt = h("button", "btn" + (b.primary ? " primary" : "") + (b.danger ? " danger" : ""), esc(b.label));
        bt.type = "button";
        bt.addEventListener("click", function () { close(typeof b.value === "function" ? b.value(box) : b.value); });
        foot.appendChild(bt);
      });
      function close(v) { document.removeEventListener("keydown", onKey); m.remove(); resolve(v); }
      function onKey(e) {
        if (e.key === "Escape") close(null);
        if (e.key === "Enter" && e.target.tagName === "INPUT") { var pb = foot.querySelector(".primary"); if (pb) { e.preventDefault(); pb.click(); } }
      }
      document.addEventListener("keydown", onKey);
      m.addEventListener("click", function (e) { if (e.target === m || e.target.closest("[data-x]")) close(null); });
      document.body.appendChild(m);
      var f = box.querySelector("input, textarea, select, .primary");
      if (f) setTimeout(function () { f.focus(); if (f.select && f.tagName === "INPUT") f.select(); }, 30);
      IDE.lastModal = box;
    });
  }
  function askText(title, label, value, hint) {
    return modal(title, '<label class="ide-lbl">' + esc(label) + '<input type="text" class="ide-inp" value="' + esc(value || "") + '"></label>' + (hint ? '<p class="small muted">' + hint + "</p>" : ""),
      [{ label: "Cancel", value: null }, { label: "OK", primary: true, value: function (box) { return box.querySelector("input").value; } }]);
  }
  function confirmBox(title, text, yes) {
    return modal(title, "<p>" + text + "</p>", [{ label: "Cancel", value: false }, { label: yes || "Delete", danger: true, primary: true, value: true }]);
  }
  var openMenu = null;
  function menu(anchor, items) {
    closeMenu();
    var m = h("div", "ide-menu");
    m.setAttribute("role", "menu");
    items.forEach(function (it) {
      if (it === "-") { m.appendChild(h("div", "ide-menu-sep")); return; }
      if (it.head) { m.appendChild(h("div", "ide-menu-head", esc(it.head))); return; }
      var b = h("button", "ide-menu-i" + (it.on ? " on" : "") + (it.danger ? " danger" : ""), (it.icon ? '<span class="mi">' + it.icon + "</span>" : "") + "<span>" + esc(it.label) + "</span>" + (it.note ? '<small>' + esc(it.note) + "</small>" : ""));
      b.type = "button";
      b.setAttribute("role", "menuitem");
      if (it.disabled) b.disabled = true;
      b.addEventListener("click", function (e) { e.stopPropagation(); closeMenu(); it.act(); });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    var top = r.bottom + 4, left = r.left;
    m.style.top = Math.min(top, window.innerHeight - m.offsetHeight - 8) + window.scrollY + "px";
    m.style.left = Math.max(8, Math.min(left, window.innerWidth - m.offsetWidth - 8)) + "px";
    openMenu = m;
    var first = m.querySelector("button:not([disabled])");
    if (first) first.focus();
    setTimeout(function () { document.addEventListener("click", closeMenu, { once: true }); }, 0);
  }
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  // ---------------------------------------------------------------- storage
  function getIndex() { return P.store.get("index").then(function (x) { return x && x.projects ? x : { projects: [], current: null }; }); }
  function setIndex(idx) { return P.store.set("index", idx); }
  function getProject(id) { return P.store.get("proj:" + id); }
  function putProject(p, idx) {
    p.updated = Date.now();
    var ent = idx.projects.filter(function (x) { return x.id === p.id; })[0];
    if (ent) { ent.name = p.name; ent.updated = p.updated; }
    else idx.projects.push({ id: p.id, name: p.name, updated: p.updated });
    return P.store.set("proj:" + p.id, p).then(function () { return setIndex(idx); });
  }
  IDE.getIndex = getIndex;
  IDE.getProject = getProject;

  // lessons and the visualizer send programs here ("Open in Playground"): they go into an "Examples" project
  IDE.openExample = function (code, stdin, files, title) {
    IDE.pending = { code: code, stdin: stdin || "", files: files || {}, title: title || "example" };
    if (location.hash === "#play") { if (IDE.applyPending) IDE.applyPending(); } else location.hash = "#play";
  };

  // ---------------------------------------------------------------- the page
  IDE.page = function (ui) {
    var p = ui.page("ide-page");
    var idx = null, proj = null, tabs = {}, openDirs = {}, problems = [], lastRun = null, saveTimer = null, dirty = false, bins = {}, fsDir = null, target = "auto";
    var root = h("div", "ide");
    root.innerHTML =
      '<div class="ide-top">' +
      '<button type="button" class="ide-files-btn btn small" data-a="files" aria-label="Show files">☰ Files</button>' +
      '<button type="button" class="ide-proj" data-a="projects" aria-haspopup="menu"><span class="ide-proj-k">Project</span><b class="ide-proj-n">…</b><span aria-hidden="true">▾</span></button>' +
      '<span class="ide-save" aria-live="polite"></span>' +
      '<div class="ide-tools"><button type="button" class="btn small" data-a="new" aria-haspopup="menu">＋ New</button><button type="button" class="btn small" data-a="upload" aria-haspopup="menu">⬆ Upload</button><button type="button" class="btn small" data-a="download" aria-haspopup="menu">⬇ Download</button></div>' +
      '<div class="ide-run"><button type="button" class="btn small ghost ide-target" data-a="target" aria-haspopup="menu" title="Which program runs">Auto</button><button type="button" class="btn primary ide-runbtn" data-a="run" title="Compile and run (Ctrl + Enter)">▶ Run</button><button type="button" class="btn small" data-a="viz" title="Step through the program and watch memory">Step through</button></div>' +
      "</div>" +
      '<div class="ide-main"><aside class="ide-side" aria-label="Files"><div class="ide-side-h"><span>Explorer</span><span class="ide-side-acts"><button type="button" class="ide-ib" data-a="newfile" title="New file" aria-label="New file">＋</button><button type="button" class="ide-ib" data-a="newdir" title="New folder" aria-label="New folder">▣</button><button type="button" class="ide-ib" data-a="collapse" title="Collapse folders" aria-label="Collapse folders">⊟</button></span></div>' +
      '<div class="ide-tree" role="tree"></div><div class="ide-drop">Drop files, folders or a .zip here</div></aside>' +
      '<section class="ide-center"><div class="ide-tabs" role="tablist"></div><div class="ide-edwrap"><div class="ide-empty">Loading your projects…</div></div>' +
      '<div class="ide-split" role="separator" aria-orientation="horizontal" aria-label="Resize the terminal" tabindex="0"></div>' +
      '<div class="ide-panel"><div class="ide-ptabs" role="tablist"><button type="button" class="on" data-p="term">Terminal</button><button type="button" data-p="problems">Problems <span class="ide-pcount"></span></button><button type="button" data-p="input">Prepared input <span class="ide-icount"></span></button><span class="ide-hint small">Ctrl+Enter runs · Ctrl+C stops · Ctrl+D ends input</span></div>' +
      '<div class="ide-pbody"><div class="ide-term" data-pp="term"></div><div class="ide-problems" data-pp="problems" hidden></div>' +
      '<div class="ide-input" data-pp="input" hidden><p class="small muted">Lines here are typed into the program automatically each time it runs (like <code>./main &lt; input.txt</code>). When they run out, the terminal waits for you to type more. Leave it empty to type everything yourself.</p><textarea class="plain ide-inp-ta" rows="6" spellcheck="false" aria-label="Prepared input"></textarea></div></div></div>' +
      "</section></div>" +
      '<input type="file" class="ide-f-files" multiple hidden><input type="file" class="ide-f-dir" webkitdirectory multiple hidden><input type="file" class="ide-f-zip" accept=".zip,application/zip" hidden>';
    p.appendChild(root);
    var Q = function (s) { return root.querySelector(s); };
    var treeEl = Q(".ide-tree"), tabsEl = Q(".ide-tabs"), edWrap = Q(".ide-edwrap"), saveEl = Q(".ide-save"), inpTa = Q(".ide-inp-ta"), probEl = Q(".ide-problems");

    // ---- the terminal
    var term = new CL.Terminal(Q(".ide-term"), {
      shell: true, title: "Terminal",
      prompt: function () { return "student@codelab:~/" + (proj ? slug(proj.name) : "project") + "$ "; },
      welcome: "COMP 2611 Code Lab terminal · type help for commands, or press ▶ Run.",
      onCommand: command,
      onLocate: function (file, line) { reveal(file, line); },
      autofocus: false
    });
    var termH = 260;
    try { termH = Math.max(140, Math.min(700, +localStorage.getItem(LS_H) || 260)); } catch (e) { /* ignore */ }
    Q(".ide-term .term-body").style.height = termH + "px";

    ui.setTutor("play", "Playground", function () {
      if (!proj) return "The Playground IDE is loading.";
      var act = proj.active, names = Object.keys(proj.files);
      var s = "The student's Playground project \"" + proj.name + "\" has these files: " + names.join(", ") + ".\n";
      if (act && P.isText(act)) s += "\nThe open file, " + act + ":\n" + CL.numbered(proj.files[act]) + "\n";
      names.filter(function (n) { return n !== act && P.isText(n) && proj.files[n].length < 4000; }).slice(0, 4).forEach(function (n) { s += "\n" + n + ":\n" + CL.numbered(proj.files[n]) + "\n"; });
      s += "\nTerminal (most recent part):\n" + CL.Tutor.clip(term.text().slice(-2500), 2500);
      return s;
    });

    // ---- saving
    function scheduleSave() {
      dirty = true;
      saveEl.textContent = "Saving…";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, 450);
    }
    function saveNow() {
      clearTimeout(saveTimer);
      if (!proj || !idx) return Promise.resolve();
      dirty = false;
      return putProject(proj, idx).then(function () { saveEl.textContent = "Saved"; setTimeout(function () { if (saveEl.textContent === "Saved") saveEl.textContent = ""; }, 1400); });
    }

    // ---- loading and switching projects
    function migrateOld() {
      var old = CL.store && CL.store.play;
      var files = { "main.cpp": old && old.code ? old.code : (window.CODELAB_DATA && CODELAB_DATA.playStart) || P.HELLO };
      if (old && old.files) Object.keys(old.files).forEach(function (n) { files[P.clean(n) || "data.txt"] = old.files[n]; });
      var pr = P.make("My first project", files);
      pr.input = old && old.stdin ? old.stdin : "";
      return pr;
    }
    function boot() {
      getIndex().then(function (x) {
        idx = x;
        if (!idx.projects.length) {
          var first = migrateOld();
          return putProject(first, idx).then(function () { idx.current = first.id; return setIndex(idx); }).then(function () { return first; });
        }
        var cur = idx.current && idx.projects.some(function (q) { return q.id === idx.current; }) ? idx.current : idx.projects.slice().sort(function (a, b) { return b.updated - a.updated; })[0].id;
        return getProject(cur).then(function (pr) { return pr || migrateOld(); });
      }).then(function (pr) {
        use(pr);
        if (IDE.pending) IDE.applyPending();
      });
    }
    function use(pr) {
      proj = pr;
      proj.folders = proj.folders || [];
      proj.open = (proj.open || []).filter(function (f) { return proj.files[f] !== undefined; });
      if (proj.active && proj.files[proj.active] === undefined) proj.active = null;
      if (!proj.active) proj.active = proj.open[0] || Object.keys(proj.files).filter(P.isSource)[0] || Object.keys(proj.files)[0] || null;
      if (proj.active && proj.open.indexOf(proj.active) < 0) proj.open.push(proj.active);
      idx.current = proj.id;
      setIndex(idx);
      Object.keys(tabs).forEach(function (k) { tabs[k].el.remove(); });
      tabs = {};
      bins = {};
      fsDir = proj.fsDir || null;
      target = "auto";
      Q(".ide-proj-n").textContent = proj.name;
      inpTa.value = proj.input || "";
      countInput();
      problems = [];
      drawProblems();
      drawTree();
      drawTabs();
      showActive();
      drawTarget();
    }
    function switchTo(id) {
      saveNow().then(function () { return getProject(id); }).then(function (pr) { if (pr) { use(pr); term.print("Switched to the project " + pr.name + ".", "t-dim"); } });
    }
    IDE.applyPending = function () {
      var x = IDE.pending;
      if (!x || !idx) return;
      IDE.pending = null;
      var ent = idx.projects.filter(function (q) { return q.name === "Examples"; })[0];
      var go = ent ? getProject(ent.id) : Promise.resolve(null);
      saveNow().then(function () { return go; }).then(function (pr) {
        if (!pr) pr = P.make("Examples", {});
        var name = slug(x.title) + ".cpp", n = 2;
        while (pr.files[name] !== undefined && pr.files[name] !== x.code) name = slug(x.title) + "-" + (n++) + ".cpp";
        pr.files[name] = x.code;
        Object.keys(x.files || {}).forEach(function (f) { pr.files[P.clean(f)] = x.files[f]; });
        pr.input = x.stdin || "";
        pr.active = name;
        if ((pr.open || []).indexOf(name) < 0) (pr.open = pr.open || []).push(name);
        return putProject(pr, idx).then(function () { use(pr); term.print("Opened " + name + " in the Examples project." + (x.stdin ? " Its keyboard input is in Prepared input." : ""), "t-dim"); });
      });
    };

    // ---- the file tree
    function allDirs() {
      var d = {};
      (proj.folders || []).forEach(function (f) { var parts = f.split("/"); for (var i = 1; i <= parts.length; i++) d[parts.slice(0, i).join("/")] = 1; });
      Object.keys(proj.files).forEach(function (f) { var parts = f.split("/"); for (var i = 1; i < parts.length; i++) d[parts.slice(0, i).join("/")] = 1; });
      return Object.keys(d).sort();
    }
    function drawTree() {
      var dirs = allDirs(), files = Object.keys(proj.files).sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; });
      function children(parent) {
        var depth = parent ? parent.split("/").length : 0;
        var ds = dirs.filter(function (d) { return P.dir(d) === parent; });
        var fs = files.filter(function (f) { return P.dir(f) === parent; });
        var html = "";
        ds.forEach(function (d) {
          var open = openDirs[d] !== false;
          html += '<div class="fx-row dir' + (open ? " open" : "") + '" role="treeitem" aria-expanded="' + open + '" data-dir="' + esc(d) + '" style="--d:' + depth + '" tabindex="0"><span class="fx-car" aria-hidden="true">' + (open ? "▾" : "▸") + '</span><span class="fx-ic k-dir" aria-hidden="true">▣</span><span class="fx-n">' + esc(P.base(d)) + '</span><button type="button" class="fx-more" data-more aria-label="Folder actions">⋯</button></div>';
          if (open) html += children(d);
        });
        fs.forEach(function (f) {
          html += '<div class="fx-row file' + (f === proj.active ? " on" : "") + '" role="treeitem" data-file="' + esc(f) + '" style="--d:' + depth + '" tabindex="0" title="' + esc(f) + '"><span class="fx-car" aria-hidden="true"></span>' + iconFor(f) + '<span class="fx-n">' + esc(P.base(f)) + '</span><button type="button" class="fx-more" data-more aria-label="File actions">⋯</button></div>';
        });
        return html;
      }
      var body = children("");
      treeEl.innerHTML = body || '<p class="small muted fx-none">No files yet. Press ＋ to make one, or drop files here.</p>';
      Q(".ide-proj-n").textContent = proj.name;
    }
    treeEl.addEventListener("click", function (e) {
      var row = e.target.closest(".fx-row");
      if (!row) return;
      var more = e.target.closest("[data-more]");
      if (row.hasAttribute("data-dir")) {
        var d = row.getAttribute("data-dir");
        if (more) return dirMenu(more, d);
        openDirs[d] = openDirs[d] === false;
        drawTree();
        return;
      }
      var f = row.getAttribute("data-file");
      if (more) return fileMenu(more, f);
      openFile(f);
      root.classList.remove("side-open");
    });
    treeEl.addEventListener("dblclick", function (e) { var row = e.target.closest(".fx-row.file"); if (row) renameFile(row.getAttribute("data-file")); });
    treeEl.addEventListener("keydown", function (e) {
      var row = e.target.closest(".fx-row");
      if (!row) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); row.click(); }
      if (e.key === "F2" && row.hasAttribute("data-file")) renameFile(row.getAttribute("data-file"));
      if (e.key === "Delete" && row.hasAttribute("data-file")) deleteFile(row.getAttribute("data-file"));
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); var rows = Array.prototype.slice.call(treeEl.querySelectorAll(".fx-row")), i = rows.indexOf(row) + (e.key === "ArrowDown" ? 1 : -1); if (rows[i]) rows[i].focus(); }
    });
    function fileMenu(anchor, f) {
      menu(anchor, [
        { icon: "↗", label: "Open", act: function () { openFile(f); } },
        { icon: "✎", label: "Rename or move", note: "F2", act: function () { renameFile(f); } },
        { icon: "⧉", label: "Duplicate", act: function () { var n = uniqueName(f.replace(/(\.[^.]+)?$/, "-copy$1")); proj.files[n] = proj.files[f]; scheduleSave(); drawTree(); openFile(n); } },
        { icon: "⬇", label: "Download", act: function () { download(P.base(f), new Blob([P.toBytes(proj.files[f])])); } },
        P.isSource(f) && P.hasMain(proj.files[f]) ? { icon: "▶", label: "Run this file's main()", act: function () { target = f; drawTarget(); run(); } } : null,
        "-",
        { icon: "🗑", label: "Delete", danger: true, note: "Del", act: function () { deleteFile(f); } }
      ].filter(Boolean));
    }
    function dirMenu(anchor, d) {
      menu(anchor, [
        { icon: "＋", label: "New file here", act: function () { newFile(d); } },
        { icon: "▣", label: "New folder here", act: function () { newDir(d); } },
        { icon: "✎", label: "Rename folder", act: function () { renameDir(d); } },
        { icon: "⬇", label: "Download as .zip", act: function () { zipOf(function (f) { return f.indexOf(d + "/") === 0; }, P.base(d)); } },
        "-",
        { icon: "🗑", label: "Delete folder", danger: true, act: function () { deleteDir(d); } }
      ]);
    }
    function uniqueName(path) {
      path = P.clean(path);
      if (proj.files[path] === undefined) return path;
      var m = /^(.*?)(\.[^./]+)?$/.exec(path), n = 2;
      while (proj.files[m[1] + "-" + n + (m[2] || "")] !== undefined) n++;
      return m[1] + "-" + n + (m[2] || "");
    }
    function newFile(dir) {
      var types = [["main.cpp", "C++ source (.cpp)"], ["header.h", "Header (.h)"], ["notes.txt", "Text (.txt)"], ["input.in", "Input data (.in)"], ["table.csv", "Table (.csv)"], ["README.md", "Notes (.md)"], ["data.json", "JSON (.json)"]];
      var body = '<label class="ide-lbl">File name<input type="text" class="ide-inp" value="' + esc(dir ? dir + "/" : "") + '"></label><div class="ide-types">' +
        types.map(function (t) { return '<button type="button" class="ide-type" data-n="' + esc(t[0]) + '">' + iconFor(t[0]) + "<span>" + esc(t[1]) + "</span></button>"; }).join("") + "</div>" +
        '<p class="small muted">Use a folder in the name to put it in a folder, like <code>data/input.txt</code>. The extension decides the type: .cpp and .h are compiled; .txt, .in, .csv and others can be read with ifstream.</p>';
      var pr = modal("New file", body, [{ label: "Cancel", value: null }, { label: "Create", primary: true, value: function (box) { return box.querySelector("input").value; } }]);
      setTimeout(function () {
        var box = IDE.lastModal;
        if (!box) return;
        box.querySelector(".ide-types").addEventListener("click", function (e) {
          var b = e.target.closest("[data-n]");
          if (!b) return;
          var inp = box.querySelector("input"), base = b.getAttribute("data-n");
          var n = base === "main.cpp" ? (proj.files[P.join(dir, "main.cpp")] === undefined ? "main.cpp" : "program.cpp") : base;
          inp.value = (dir ? dir + "/" : "") + n;
          inp.focus();
          var dot = inp.value.lastIndexOf(".");
          inp.setSelectionRange(inp.value.lastIndexOf("/") + 1, dot > 0 ? dot : inp.value.length);
        });
      }, 40);
      pr.then(function (name) {
        name = P.clean(name);
        if (!name) return;
        if (!/\.[^./]+$/.test(name)) name += ".cpp";
        if (proj.files[name] !== undefined) { openFile(name); return; }
        proj.files[name] = starterFor(name);
        if (dir) openDirs[dir] = true;
        scheduleSave();
        drawTree();
        openFile(name);
      });
    }
    function starterFor(name) {
      var k = P.kindOf(name), base = P.base(name).replace(/\.[^.]+$/, "");
      if (k === "cpp") return Object.keys(proj.files).some(function (f) { return P.isSource(f) && P.hasMain(proj.files[f]); }) ? "#include <iostream>\nusing namespace std;\n\n" : P.HELLO;
      if (k === "h") { var g = base.toUpperCase().replace(/[^A-Z0-9]+/g, "_") + "_H"; return "#ifndef " + g + "\n#define " + g + "\n\n// declarations go here: structs, constants and function prototypes\n\n#endif\n"; }
      if (k === "md") return "# " + base + "\n\n";
      if (k === "csv") return "name,score\n";
      if (k === "json") return "{\n}\n";
      return "";
    }
    function newDir(parent) {
      askText("New folder", "Folder name", parent ? parent + "/" : "").then(function (n) {
        n = P.clean(n);
        if (!n) return;
        if (proj.folders.indexOf(n) < 0) proj.folders.push(n);
        openDirs[n] = true;
        scheduleSave();
        drawTree();
      });
    }
    function renameFile(f) {
      askText("Rename or move", "New name (use a folder path to move it)", f).then(function (n) {
        n = P.clean(n);
        if (!n || n === f) return;
        if (proj.files[n] !== undefined) { term.print("There is already a file called " + n + ".", "t-err"); return; }
        moveFile(f, n);
        scheduleSave();
        drawTree();
        drawTabs();
      });
    }
    function moveFile(f, n) {
      proj.files[n] = proj.files[f];
      delete proj.files[f];
      proj.open = proj.open.map(function (x) { return x === f ? n : x; });
      if (proj.active === f) proj.active = n;
      if (tabs[f]) { tabs[n] = tabs[f]; delete tabs[f]; tabs[n].path = n; }
    }
    function renameDir(d) {
      askText("Rename folder", "New folder name", d).then(function (n) {
        n = P.clean(n);
        if (!n || n === d) return;
        Object.keys(proj.files).forEach(function (f) { if (f.indexOf(d + "/") === 0) moveFile(f, n + f.slice(d.length)); });
        proj.folders = proj.folders.map(function (x) { return x === d || x.indexOf(d + "/") === 0 ? n + x.slice(d.length) : x; });
        scheduleSave();
        drawTree();
        drawTabs();
      });
    }
    function deleteFile(f) {
      confirmBox("Delete " + P.base(f) + "?", "This removes <b>" + esc(f) + "</b> from the project. It cannot be undone.").then(function (ok) {
        if (!ok) return;
        delete proj.files[f];
        closeTab(f);
        scheduleSave();
        drawTree();
      });
    }
    function deleteDir(d) {
      var inside = Object.keys(proj.files).filter(function (f) { return f.indexOf(d + "/") === 0; });
      confirmBox("Delete the folder " + P.base(d) + "?", "This removes the folder <b>" + esc(d) + "</b>" + (inside.length ? " and the " + inside.length + " file" + (inside.length > 1 ? "s" : "") + " in it" : "") + ". It cannot be undone.").then(function (ok) {
        if (!ok) return;
        inside.forEach(function (f) { delete proj.files[f]; closeTab(f); });
        proj.folders = proj.folders.filter(function (x) { return x !== d && x.indexOf(d + "/") !== 0; });
        scheduleSave();
        drawTree();
      });
    }

    // ---- tabs and editors
    function drawTabs() {
      tabsEl.innerHTML = proj.open.map(function (f) {
        return '<div class="ide-tab' + (f === proj.active ? " on" : "") + '" role="tab" aria-selected="' + (f === proj.active) + '" data-tab="' + esc(f) + '" title="' + esc(f) + '">' + iconFor(f) + "<span>" + esc(P.base(f)) + '</span><button type="button" class="ide-tab-x" aria-label="Close ' + esc(P.base(f)) + '">✕</button></div>';
      }).join("");
    }
    tabsEl.addEventListener("click", function (e) {
      var t = e.target.closest(".ide-tab");
      if (!t) return;
      var f = t.getAttribute("data-tab");
      if (e.target.closest(".ide-tab-x")) closeTab(f);
      else openFile(f);
    });
    tabsEl.addEventListener("auxclick", function (e) { var t = e.target.closest(".ide-tab"); if (t && e.button === 1) closeTab(t.getAttribute("data-tab")); });
    function openFile(f) {
      if (proj.files[f] === undefined) return;
      if (proj.open.indexOf(f) < 0) proj.open.push(f);
      proj.active = f;
      drawTabs();
      showActive();
      treeEl.querySelectorAll(".fx-row.file").forEach(function (r) { r.classList.toggle("on", r.getAttribute("data-file") === f); });
      scheduleSave();
    }
    function closeTab(f) {
      var i = proj.open.indexOf(f);
      if (i >= 0) proj.open.splice(i, 1);
      if (tabs[f]) { tabs[f].el.remove(); delete tabs[f]; }
      if (proj.active === f) proj.active = proj.open[Math.max(0, i - 1)] || null;
      drawTabs();
      showActive();
    }
    function makeTab(f) {
      var k = P.kindOf(f), wrap = h("div", "ide-ed k-" + k), t = { path: f, el: wrap, kind: k };
      if (k === "image") {
        wrap.innerHTML = '<div class="ide-img"><img alt="' + esc(P.base(f)) + '"><p class="small muted">' + esc(f) + " · images can be kept with your project, but a C++ program cannot read them here.</p></div>";
        wrap.querySelector("img").src = proj.files[f];
      } else {
        var bar = null;
        if (k === "md" || k === "csv") {
          bar = h("div", "ide-edbar", '<div class="seg" role="group"><button type="button" class="on" data-v="code">Edit</button><button type="button" data-v="view">' + (k === "md" ? "Preview" : "Table") + "</button></div>");
          wrap.appendChild(bar);
        }
        var host = h("div", "ide-edhost");
        wrap.appendChild(host);
        var ed = t.ed = new CL.Editor(host, { value: proj.files[f], label: "Code editor: " + f, tools: k === "cpp" || k === "h", lang: k === "cpp" || k === "h" ? "cpp" : "text", onRun: function () { run(); } });
        ed.scroll.style.maxHeight = "none";
        ed.onChange(function (v) { if (proj.files[t.path] !== v) { proj.files[t.path] = v; scheduleSave(); } });
        if (bar) {
          var view = h("div", "ide-view md");
          view.hidden = true;
          wrap.appendChild(view);
          bar.addEventListener("click", function (e) {
            var b = e.target.closest("[data-v]");
            if (!b) return;
            var v = b.getAttribute("data-v") === "view";
            bar.querySelectorAll("[data-v]").forEach(function (x) { x.classList.toggle("on", x === b); });
            host.hidden = v;
            view.hidden = !v;
            if (v) { view.innerHTML = ""; if (k === "md") view.appendChild(CL.renderMd(proj.files[t.path] || "")); else view.innerHTML = csvTable(proj.files[t.path] || ""); }
          });
        }
      }
      edWrap.appendChild(wrap);
      tabs[f] = t;
      return t;
    }
    function csvTable(text) {
      var sep = text.indexOf("\t") >= 0 && text.indexOf(",") < 0 ? "\t" : ",";
      var rows = text.replace(/\n+$/, "").split("\n").slice(0, 500).map(function (r) {
        var out = [], cur = "", q = false;
        for (var i = 0; i < r.length; i++) { var c = r.charAt(i); if (c === '"') q = !q; else if (c === sep && !q) { out.push(cur); cur = ""; } else cur += c; }
        out.push(cur);
        return out;
      });
      if (!rows.length || !rows[0].join("")) return '<p class="muted">The file is empty.</p>';
      return '<div class="tbl"><table><thead><tr>' + rows[0].map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.slice(1).map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    }
    function showActive() {
      var empty = edWrap.querySelector(".ide-empty");
      Object.keys(tabs).forEach(function (k) { tabs[k].el.hidden = k !== proj.active; });
      if (!proj.active) {
        if (!empty) { empty = h("div", "ide-empty"); edWrap.appendChild(empty); }
        empty.hidden = false;
        empty.innerHTML = "<p>No file is open.</p><p class='small muted'>Pick a file on the left, or make a new one with ＋ New.</p>";
        return;
      }
      if (empty) empty.hidden = true;
      var t = tabs[proj.active] || makeTab(proj.active);
      t.el.hidden = false;
      if (t.ed && t.ed.getValue() !== proj.files[proj.active]) t.ed.setValue(proj.files[proj.active]);
      if (t.ed) setTimeout(function () { t.ed.refresh(); }, 0);
    }
    function reveal(file, line) {
      if (proj.files[file] === undefined) return;
      openFile(file);
      var t = tabs[file];
      if (t && t.ed && line) { t.ed.revealLine(line); t.ed.mark(line, "cur", ""); setTimeout(function () { t.ed.clearMarks("cur"); }, 1600); t.ed.focus(); }
    }
    IDE.reveal = reveal;

    // ---- running
    function textFiles() {
      var o = {};
      Object.keys(proj.files).forEach(function (f) { if (P.isText(f)) o[f] = proj.files[f]; });
      return o;
    }
    function inputLines() {
      var t = inpTa.value;
      if (!t) return [];
      return t.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
    }
    function countInput() { var n = inputLines().length; Q(".ide-icount").textContent = n ? "(" + n + ")" : ""; }
    inpTa.addEventListener("input", function () { proj.input = inpTa.value; countInput(); scheduleSave(); });
    function pickUnits(forFile) {
      var files = textFiles();
      if (forFile) {
        var rest = Object.keys(files).filter(function (f) { return P.isSource(f) && f !== forFile && !P.hasMain(files[f]); });
        return { units: [forFile].concat(rest), main: forFile };
      }
      if (target !== "auto" && files[target] !== undefined && P.hasMain(files[target])) return pickUnits(target);
      return P.unitsFor(files, proj.active);
    }
    function exeName(main) { return main ? P.base(main).replace(/\.[^.]+$/, "") : "a.out"; }
    function run(forFile, opts) {
      opts = opts || {};
      if (!proj) return;
      if (term.busy()) term.stop(true);
      var pick = pickUnits(forFile);
      if (!pick.units.length) {
        if (pick.why === "many") term.print("Several files have a main() function: " + pick.mains.join(", ") + ". Open the one you want and press Run, or choose it from the Auto menu next to Run.", "t-warnc");
        else term.print("There is no .cpp file to compile. Make one with ＋ New (for example main.cpp).", "t-warnc");
        term.idle();
        return;
      }
      var files = textFiles(), exe = exeName(pick.main);
      var cmd = "g++ -std=c++17 -Wall " + pick.units.join(" ") + " -o " + exe + " && ./" + exe;
      if (!pick.main) {
        echoCmd(cmd);
        term.printHtml('<span class="t-errw">/usr/bin/ld: error:</span> undefined reference to <code>main</code><div class="t-hint"><b>hint:</b> every program needs exactly one <code>int main()</code>. None of ' + esc(pick.units.join(", ")) + " has one.</div>", "t-errblock");
        term.idle();
        return;
      }
      var linked = P.link(files, pick.units);
      clearMarks();
      if (linked.error) {
        echoCmd(cmd);
        term.compileError({ file: linked.error.file, line: linked.error.line, col: linked.error.col, msg: linked.error.msg, hint: linked.error.hint }, { files: files });
        setProblems([{ kind: "error", file: linked.error.file, line: linked.error.line, msg: linked.error.msg }]);
        term.idle();
        return;
      }
      bins[exe] = { linked: linked, units: pick.units };
      showPanel("term");
      lastRun = null;
      term.exec({ src: linked.src, files: files, cmd: opts.cmd === undefined ? cmd : opts.cmd, linked: linked, prepared: opts.prepared || inputLines(), focus: true,
        onDone: function (res, sess) { afterRun(res, sess, linked, files); } });
    }
    IDE.run = function () { run(); };
    function echoCmd(cmd) { term.removeInput(); term.append(term.opts.prompt(), "t-prompt"); term.append(cmd + "\n", "t-cmdline"); }
    function clearMarks() { Object.keys(tabs).forEach(function (k) { if (tabs[k].ed) { tabs[k].ed.clearMarks("err"); tabs[k].ed.clearMarks("warn"); } }); }
    function afterRun(res, sess, linked, before) {
      lastRun = { res: res, lines: sess ? sess.lines.slice() : [], linked: linked };
      var list = [];
      if (res.err && res.err.line) { var w = CL.Project.where(linked, res.err.line); list.push({ kind: res.compiled ? (res.err.kind === "limit" ? "stopped" : "runtime") : "error", file: w.file, line: w.line, msg: res.err.msg }); }
      (res.warnings || []).forEach(function (wn) { var w2 = CL.Project.where(linked, wn.line); list.push({ kind: "warning", file: w2.file, line: w2.line, msg: wn.msg }); });
      setProblems(list);
      list.forEach(function (it) { var t = tabs[it.file]; if (t && t.ed && it.line) { t.ed.mark(it.line, it.kind === "warning" ? "warn" : "err", it.msg); if (it.kind !== "warning" && it.file === proj.active) t.ed.revealLine(it.line); } });
      // files the program wrote with ofstream become project files, like on a real disk
      if (res.files) {
        var wrote = [];
        Object.keys(res.files).forEach(function (f) {
          var name = P.clean(f);
          if (!name || res.files[f] === before[f]) return;
          proj.files[name] = res.files[f];
          wrote.push(name);
          if (tabs[name] && tabs[name].ed && proj.active === name) tabs[name].ed.setValue(res.files[f]);
        });
        if (wrote.length) {
          scheduleSave();
          drawTree();
          var d = term.printHtml("The program wrote " + wrote.map(function (f) { return '<a href="#" class="t-loc" data-loc="' + esc(f) + ':1">' + esc(f) + "</a>"; }).join(", ") + " (open it in the file list).", "t-dim");
          d.className += " t-wrote";
        }
      }
    }
    function setProblems(list) { problems = list; drawProblems(); }
    function drawProblems() {
      var n = problems.filter(function (x) { return x.kind !== "warning"; }).length, w = problems.length - n;
      Q(".ide-pcount").textContent = problems.length ? "(" + problems.length + ")" : "";
      Q(".ide-pcount").className = "ide-pcount" + (n ? " bad" : w ? " warn" : "");
      probEl.innerHTML = problems.length ? problems.map(function (x) {
        return '<button type="button" class="ide-prob ' + x.kind + '" data-loc="' + esc(x.file + ":" + x.line) + '"><span class="pk">' + esc(x.kind) + '</span><span class="pl">' + esc(x.file) + ":" + x.line + '</span><span class="pm">' + esc(x.msg) + "</span></button>";
      }).join("") : '<p class="small muted">No problems in the last run.</p>';
    }
    probEl.addEventListener("click", function (e) { var b = e.target.closest("[data-loc]"); if (b) { var p2 = b.getAttribute("data-loc").split(":"); reveal(p2.slice(0, -1).join(":"), +p2[p2.length - 1]); } });
    function showPanel(which) {
      root.querySelectorAll(".ide-ptabs [data-p]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-p") === which); });
      root.querySelectorAll("[data-pp]").forEach(function (x) { x.hidden = x.getAttribute("data-pp") !== which; });
      if (which === "term") term.focus();
    }
    Q(".ide-ptabs").addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (b) showPanel(b.getAttribute("data-p")); });
    function drawTarget() {
      var b = Q(".ide-target");
      b.textContent = target === "auto" ? "Auto" : P.base(target);
      b.title = target === "auto" ? "Runs every .cpp file (the program with main) · click to choose" : "Runs " + target + " (plus the .cpp files without main) · click to change";
    }
    function targetMenu(anchor) {
      var mains = Object.keys(proj.files).filter(function (f) { return P.isSource(f) && P.hasMain(proj.files[f]); });
      menu(anchor, [{ head: "Which program runs" }, { label: "Auto: the project's main()", note: "or the open file when several have main()", on: target === "auto", act: function () { target = "auto"; drawTarget(); } }].concat(
        mains.map(function (f) { return { label: f, on: target === f, act: function () { target = f; drawTarget(); } }; })));
    }
    function stepThrough() {
      var pick = pickUnits();
      if (!pick.main) { run(); return; }
      var files = textFiles(), linked = P.link(files, pick.units);
      if (linked.error) { run(); return; }
      var lines = lastRun && lastRun.lines.length ? lastRun.lines : inputLines();
      CL.openViz(linked.src, { stdin: lines.join("\n") + (lines.length ? "\n" : ""), files: files, title: "Step through " + (pick.units.length > 1 ? pick.units.join(" + ") + " (joined into one file)" : pick.main) });
    }

    // ---- the shell
    function tokens(line) {
      var out = [], re = /"([^"]*)"|'([^']*)'|(\S+)/g, m;
      while ((m = re.exec(line))) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
      return out;
    }
    var HELP = [
      ["run [file.cpp]", "compile and run the project (or the program in file.cpp)"],
      ["g++ a.cpp b.cpp -o prog", "compile those files into ./prog"],
      ["./prog [< input.txt]", "run a compiled program (optionally reading cin from a file)"],
      ["ls [folder]  ·  tree", "list files"],
      ["cat file  ·  head file  ·  wc file", "show a file, its first lines, or count its lines, words and characters"],
      ["touch file  ·  mkdir folder", "make an empty file or a folder"],
      ["cp a b  ·  mv a b  ·  rm file  ·  rm -r folder", "copy, move or rename, delete"],
      ["echo text > file  ·  echo text >> file", "write or add a line to a file"],
      ["open file", "open a file in the editor"],
      ["clear  ·  history  ·  pwd  ·  date", "the usual"]
    ];
    function command(line, t) {
      if (!line) return;
      var redirIn = null, m = /^(.*?)\s*<\s*(\S+)\s*$/.exec(line);
      if (m && !/^echo\b/.test(line)) { line = m[1]; redirIn = P.clean(m[2]); }
      var a = tokens(line), cmd = a[0], args = a.slice(1);
      var files = proj.files;
      function need(path) { if (files[path] === undefined) { t.print(cmd + ": " + path + ": No such file or directory", "t-err"); return false; } return true; }
      switch (cmd) {
        case "help": case "?":
          t.printHtml('<div class="t-help">' + HELP.map(function (x) { return "<div><code>" + esc(x[0]) + "</code><span>" + esc(x[1]) + "</span></div>"; }).join("") + '</div><div class="t-dim">Keys: ↑ and ↓ bring back earlier commands · Ctrl+C stops a program · Ctrl+D ends its input · Ctrl+L clears.</div>');
          return;
        case "clear": case "cls": t.clear(); return;
        case "pwd": t.print("/home/student/" + slug(proj.name)); return;
        case "whoami": t.print("student"); return;
        case "date": t.print(new Date().toString()); return;
        case "history": t.print(t.history.map(function (x, i) { return "  " + (i + 1) + "  " + x; }).join("\n") || "(no commands yet)"); return;
        case "cd": t.print("This terminal always works in the project folder (" + slug(proj.name) + "); use paths like data/input.txt.", "t-dim"); return;
        case "ls": case "dir": case "tree": {
          var base = P.clean(args.filter(function (x) { return x[0] !== "-"; })[0] || "");
          var names = Object.keys(files).concat(proj.folders.map(function (d) { return d + "/"; })).filter(function (f) { return !base || f.indexOf(base + "/") === 0; }).sort();
          if (cmd === "tree") { t.print(names.length ? names.join("\n") : "(empty)"); return; }
          var shown = {};
          names.forEach(function (f) { var rest = base ? f.slice(base.length + 1) : f, top = rest.split("/")[0] + (rest.indexOf("/") >= 0 ? "/" : ""); if (top && top !== "/") shown[top] = 1; });
          var list = Object.keys(shown).sort();
          t.printHtml(list.length ? list.map(function (n) { return '<span class="t-ls' + (/\/$/.test(n) ? " d" : "") + '">' + esc(n) + "</span>"; }).join("") : '<span class="t-dim">(empty)</span>', "t-lsrow");
          return;
        }
        case "cat": case "type": args.forEach(function (f) { f = P.clean(f); if (!need(f)) return; if (!P.isText(f)) { t.print("cat: " + f + ": binary file", "t-err"); return; } t.print(files[f] === "" ? "" : files[f].replace(/\n$/, "")); }); return;
        case "head": case "tail": {
          var nn = 10, fl = [];
          for (var i = 0; i < args.length; i++) { if (args[i] === "-n") nn = +args[++i] || 10; else if (/^-\d+$/.test(args[i])) nn = +args[i].slice(1); else fl.push(P.clean(args[i])); }
          fl.forEach(function (f) { if (!need(f)) return; var L = String(files[f]).replace(/\n$/, "").split("\n"); t.print((cmd === "head" ? L.slice(0, nn) : L.slice(-nn)).join("\n")); });
          return;
        }
        case "wc": args.forEach(function (f) { f = P.clean(f); if (!need(f)) return; var s = String(files[f]); t.print("  " + (s.match(/\n/g) || []).length + "  " + (s.match(/\S+/g) || []).length + "  " + s.length + " " + f); }); return;
        case "touch": args.forEach(function (f) { f = P.clean(f); if (f && files[f] === undefined) files[f] = ""; }); scheduleSave(); drawTree(); return;
        case "mkdir": args.filter(function (x) { return x[0] !== "-"; }).forEach(function (d) { d = P.clean(d); if (d && proj.folders.indexOf(d) < 0) proj.folders.push(d); }); scheduleSave(); drawTree(); return;
        case "rm": case "del": {
          var rec = args.some(function (x) { return /^-[a-z]*r/i.test(x); });
          args.filter(function (x) { return x[0] !== "-"; }).forEach(function (f) {
            f = P.clean(f);
            if (files[f] !== undefined) { delete files[f]; closeTab(f); return; }
            var inside = Object.keys(files).filter(function (x) { return x.indexOf(f + "/") === 0; });
            if (proj.folders.indexOf(f) >= 0 || inside.length) {
              if (!rec) { t.print("rm: cannot remove '" + f + "': Is a directory (use rm -r)", "t-err"); return; }
              inside.forEach(function (x) { delete files[x]; closeTab(x); });
              proj.folders = proj.folders.filter(function (x) { return x !== f && x.indexOf(f + "/") !== 0; });
              return;
            }
            t.print("rm: cannot remove '" + f + "': No such file or directory", "t-err");
          });
          scheduleSave(); drawTree(); return;
        }
        case "cp": case "mv": {
          if (args.length < 2) { t.print(cmd + ": missing file operand", "t-err"); return; }
          var src = P.clean(args[0]), dst = P.clean(args[1]);
          if (!need(src)) return;
          if (proj.folders.indexOf(dst) >= 0 || /\/$/.test(args[1])) dst = P.join(dst, P.base(src));
          if (cmd === "cp") files[dst] = files[src]; else moveFile(src, dst);
          scheduleSave(); drawTree(); drawTabs(); return;
        }
        case "echo": {
          var em = /^echo\s?(.*?)(?:\s*(>>?)\s*(\S+))?$/.exec(line), text = em ? em[1].replace(/^["']|["']$/g, "") : "";
          if (em && em[2]) { var tf = P.clean(em[3]); files[tf] = (em[2] === ">>" && files[tf] !== undefined ? files[tf] : "") + text + "\n"; scheduleSave(); drawTree(); if (tabs[tf] && tabs[tf].ed) tabs[tf].ed.setValue(files[tf]); }
          else t.print(text);
          return;
        }
        case "open": case "code": case "nano": case "vim": case "edit": args.forEach(function (f) { f = P.clean(f); if (files[f] === undefined) { files[f] = starterFor(f); scheduleSave(); drawTree(); } openFile(f); }); return;
        case "run": case "make": {
          var f2 = args[0] ? P.clean(args[0]) : null;
          if (f2 && !need(f2)) return;
          run(f2, { cmd: null, prepared: redirIn && files[redirIn] !== undefined ? String(files[redirIn]).replace(/\n$/, "").split("\n") : undefined });
          return;
        }
        case "g++": case "c++": case "gcc": case "clang++": case "cc": {
          var out = "a.out", units = [];
          for (var j = 0; j < args.length; j++) {
            if (args[j] === "-o") out = args[++j] || "a.out";
            else if (/^-o./.test(args[j])) out = args[j].slice(2);
            else if (args[j][0] === "-") continue;
            else units.push(P.clean(args[j]));
          }
          if (!units.length) { t.print(cmd + ": fatal error: no input files", "t-err"); return; }
          for (var u = 0; u < units.length; u++) if (!need(units[u])) return;
          units = units.filter(function (x) { return P.isSource(x); });
          var tf2 = textFiles(), lk = P.link(tf2, units);
          if (lk.error) { t.compileError({ file: lk.error.file, line: lk.error.line, col: lk.error.col, msg: lk.error.msg, hint: lk.error.hint }, { files: tf2 }); return; }
          if (!P.hasMain(lk.src)) { t.printHtml('<span class="t-errw">/usr/bin/ld: error:</span> undefined reference to <code>main</code>', "t-errblock"); return; }
          try { CPP.compile(lk.src); }
          catch (ex) {
            var err = ex && ex.toJSON ? ex.toJSON() : { msg: String(ex && ex.message || ex), line: 0 };
            t.compileError(err, { files: tf2, linked: lk });
            setProblems([Object.assign({ kind: "error" }, CL.Project.where(lk, err.line), { msg: err.msg })]);
            return;
          }
          bins[out.replace(/^\.\//, "")] = { linked: lk, units: units };
          setProblems([]);
          t.print("compiled " + units.join(" ") + " → ./" + out.replace(/^\.\//, ""), "t-dim");
          return;
        }
        default: {
          var bm = /^\.\/(.+)$/.exec(cmd);
          if (bm) {
            var b = bins[bm[1]];
            if (!b) {
              if (files[bm[1]] !== undefined) t.print("bash: " + cmd + ": Permission denied (compile it first: g++ " + bm[1] + " -o prog)", "t-err");
              else t.print("bash: " + cmd + ": No such file or directory" + (Object.keys(bins).length ? " (compiled so far: " + Object.keys(bins).map(function (x) { return "./" + x; }).join(", ") + ")" : " (compile first, for example: g++ main.cpp -o main)"), "t-err");
              return;
            }
            var pre = redirIn ? (files[redirIn] !== undefined ? String(files[redirIn]).replace(/\n$/, "").split("\n") : null) : [];
            if (pre === null) { t.print("bash: " + redirIn + ": No such file or directory", "t-err"); return; }
            var tf3 = textFiles();
            t.exec({ src: b.linked.src, files: tf3, linked: b.linked, prepared: pre, onDone: function (res, sess) { afterRun(res, sess, b.linked, tf3); } });
            return;
          }
          t.print("bash: " + cmd + ": command not found · type help to see what this terminal can do", "t-err");
        }
      }
    }

    // ---- projects menu
    function projectsMenu(anchor) {
      var list = idx.projects.slice().sort(function (a, b) { return b.updated - a.updated; });
      menu(anchor, [{ head: "Your projects" }].concat(list.map(function (x) {
        return { label: x.name, on: x.id === proj.id, note: new Date(x.updated).toLocaleDateString(), act: function () { if (x.id !== proj.id) switchTo(x.id); } };
      }), ["-",
        { icon: "＋", label: "New project…", act: newProject },
        { icon: "✎", label: "Rename this project", act: function () { askText("Rename project", "Project name", proj.name).then(function (n) { n = (n || "").trim(); if (!n) return; proj.name = n; drawTree(); scheduleSave(); }); } },
        { icon: "⧉", label: "Duplicate this project", act: function () { var c = P.make(proj.name + " (copy)", proj.files); c.folders = proj.folders.slice(); c.input = proj.input; saveNow().then(function () { return putProject(c, idx); }).then(function () { use(c); }); } },
        { icon: "🗑", label: "Delete this project", danger: true, act: deleteProject }
      ]));
    }
    function newProject() {
      var body = '<label class="ide-lbl">Project name<input type="text" class="ide-inp" value="My project"></label><div class="ide-tpls">' +
        P.TEMPLATES.map(function (t, i) { return '<label class="ide-tpl"><input type="radio" name="tpl" value="' + t.id + '"' + (i === 0 ? " checked" : "") + '><b>' + esc(t.title) + "</b><span>" + esc(t.blurb) + "</span><small>" + Object.keys(t.files).map(esc).join(" · ") + "</small></label>"; }).join("") + "</div>";
      modal("New project", body, [{ label: "Cancel", value: null }, { label: "Create", primary: true, value: function (box) { return { name: box.querySelector("input[type=text]").value, tpl: (box.querySelector("input[name=tpl]:checked") || {}).value }; } }]).then(function (r) {
        if (!r) return;
        var t = P.TEMPLATES.filter(function (x) { return x.id === r.tpl; })[0] || P.TEMPLATES[0];
        var pr = P.make((r.name || "").trim() || t.title, t.files);
        saveNow().then(function () { return putProject(pr, idx); }).then(function () { use(pr); term.print("Created the project " + pr.name + ". Press ▶ Run to try it.", "t-dim"); });
      });
    }
    function deleteProject() {
      confirmBox("Delete the project " + proj.name + "?", "All of its " + Object.keys(proj.files).length + " files will be deleted from this browser. Download it as a .zip first if you want to keep a copy.").then(function (ok) {
        if (!ok) return;
        var id = proj.id;
        idx.projects = idx.projects.filter(function (x) { return x.id !== id; });
        P.store.del("proj:" + id);
        if (!idx.projects.length) { var fresh = P.make("My project", { "main.cpp": P.HELLO }); return putProject(fresh, idx).then(function () { use(fresh); }); }
        setIndex(idx).then(function () { switchTo(idx.projects.slice().sort(function (a, b) { return b.updated - a.updated; })[0].id); });
      });
    }

    // ---- uploads
    function addFiles(list, intoDir) {
      // list: [{path, bytes}] -> project files; reports what was skipped, and asks before replacing a file
      var incoming = [], skipped = [];
      list.forEach(function (x) {
        var path = P.clean((intoDir ? intoDir + "/" : "") + x.path);
        if (!path || /(^|\/)(\.git|node_modules|__MACOSX|\.vs|\.vscode|build|cmake-build-[^/]*)(\/|$)/.test(path) || /(^|\/)\.DS_Store$/.test(path)) return;
        var r = P.fromBytes(path, x.bytes);
        if (r.skip) { skipped.push(path + " " + r.skip); return; }
        incoming.push({ path: path, content: r.text !== undefined ? r.text : r.data });
      });
      var clash = incoming.filter(function (x) { return proj.files[x.path] !== undefined && proj.files[x.path] !== x.content; });
      if (!clash.length) return place(incoming, "replace", skipped);
      modal("Some files already exist", "<p>" + clash.length + " file" + (clash.length > 1 ? "s" : "") + " with the same name " + (clash.length > 1 ? "are" : "is") + " already in " + esc(proj.name) + ": <b>" + clash.slice(0, 8).map(function (x) { return esc(x.path); }).join(", ") + (clash.length > 8 ? ", …" : "") + "</b>.</p><p class='small muted'>Replace overwrites them. Keep both adds the new ones with -2 in the name.</p>",
        [{ label: "Cancel", value: null }, { label: "Keep both", value: "both" }, { label: "Replace", primary: true, danger: true, value: "replace" }]).then(function (how) {
        if (how) place(incoming, how, skipped);
      });
    }
    function place(incoming, how, skipped) {
      var added = [];
      incoming.forEach(function (x) {
        var path = x.path;
        if (how === "both" && proj.files[path] !== undefined && proj.files[path] !== x.content) path = uniqueName(path);
        proj.files[path] = x.content;
        if (tabs[path] && tabs[path].ed) tabs[path].ed.setValue(x.content);
        added.push(path);
      });
      if (added.length) {
        scheduleSave();
        drawTree();
        var firstSrc = added.filter(P.isSource)[0] || added.filter(P.isText)[0] || added[0];
        if (firstSrc) openFile(firstSrc);
      }
      term.print(added.length ? "Added " + added.length + " file" + (added.length > 1 ? "s" : "") + ": " + added.slice(0, 12).join(", ") + (added.length > 12 ? ", …" : "") : "No files were added.", added.length ? "t-ok" : "t-warnc");
      if (skipped.length) term.print("Skipped " + skipped.length + ": " + skipped.slice(0, 6).join("; ") + (skipped.length > 6 ? "; …" : ""), "t-warnc");
      term.idle();
    }
    function readFileList(fl) {
      return Promise.all(Array.prototype.map.call(fl, function (f) {
        var path = f.webkitRelativePath || f.relPath || f.name;
        if (/\.zip$/i.test(f.name)) return f.arrayBuffer().then(function (b) { return P.unzip(b); }).then(function (entries) {
          var prefix = commonDir(entries.map(function (e) { return e.path; }));
          return entries.map(function (e) { return { path: e.path.slice(prefix.length), bytes: e.bytes }; });
        }, function (e) { term.print(f.name + ": " + e.message, "t-err"); return []; });
        if (f.size > P.MAX_TEXT && !P.isImage(path)) return [{ path: path, bytes: null }];
        return f.arrayBuffer().then(function (b) { return [{ path: path, bytes: new Uint8Array(b) }]; });
      })).then(function (lists) { return [].concat.apply([], lists); });
    }
    function commonDir(paths) {
      if (!paths.length) return "";
      var first = paths[0].split("/");
      if (first.length < 2) return "";
      var top = first[0] + "/";
      return paths.every(function (p2) { return p2.indexOf(top) === 0; }) ? top : "";
    }
    var fFiles = Q(".ide-f-files"), fDir = Q(".ide-f-dir"), fZip = Q(".ide-f-zip");
    fFiles.addEventListener("change", function () { readFileList(fFiles.files).then(function (l) { addFiles(l); fFiles.value = ""; }); });
    fZip.addEventListener("change", function () { readFileList(fZip.files).then(function (l) { addFiles(l); fZip.value = ""; }); });
    fDir.addEventListener("change", function () {
      var fl = Array.prototype.slice.call(fDir.files);
      if (!fl.length) return;
      var top = (fl[0].webkitRelativePath || "").split("/")[0];
      readFileList(fl).then(function (l) {
        // a folder upload keeps the folder's own name as a folder in the project
        addFiles(l.map(function (x) { return { path: x.path, bytes: x.bytes }; }));
        if (top) openDirs[top] = true;
        fDir.value = "";
      });
    });
    function uploadMenu(anchor) {
      var fsOk = typeof window.showDirectoryPicker === "function";
      menu(anchor, [
        { head: "Add to " + proj.name },
        { icon: "📄", label: "Files from my computer…", note: ".cpp .h .txt .csv .in …", act: function () { fFiles.click(); } },
        { icon: "📁", label: "A whole folder…", act: function () { fDir.click(); } },
        { icon: "🗜", label: "A .zip archive…", act: function () { fZip.click(); } },
        { icon: "🔗", label: "From a link…", note: "GitHub, Gist or any open link", act: fromUrl },
        { icon: "📋", label: "Paste text as a new file…", act: pasteFile },
        "-",
        { head: "Work on a folder on this computer" },
        { icon: "💾", label: fsOk ? "Open a folder from disk…" : "Open a folder from disk (Chrome or Edge)", note: fsOk ? "save straight back to it" : "not supported in this browser", disabled: !fsOk, act: openFromDisk },
        { icon: "☁", label: "Google Drive or OneDrive", note: "use their folder on your computer", act: function () { term.print("To use files from Google Drive, OneDrive or iCloud: install the provider's desktop app so your drive appears as a folder on your computer, then use Upload › A whole folder (or Open a folder from disk in Chrome or Edge). On a phone, download the files first, then upload them.", "t-dim"); term.idle(); } }
      ]);
    }
    function fromUrl() {
      askText("Add a file from a link", "Web address of a text file", "", "Works with links that allow downloads from other sites, like GitHub (raw or file pages), Gist or Pastebin raw links. Google Drive and OneDrive share links usually do not allow it: download the file and upload it instead.").then(function (url) {
        url = (url || "").trim();
        if (!url) return;
        var gh = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/.exec(url);
        if (gh) url = "https://raw.githubusercontent.com/" + gh[1] + "/" + gh[2] + "/" + gh[3];
        term.print("Downloading " + url + " …", "t-dim");
        fetch(url).then(function (r) { if (!r.ok) throw new Error("the site answered " + r.status); return r.arrayBuffer(); }).then(function (b) {
          var name = decodeURIComponent((url.split("?")[0].split("/").pop() || "download.txt"));
          addFiles([{ path: uniqueName(name), bytes: new Uint8Array(b) }]);
        }).catch(function (e) { term.print("Could not download it: " + (e && e.message ? e.message : e) + ". The site may not allow downloads from other pages; download the file and use Upload instead.", "t-err"); term.idle(); });
      });
    }
    function pasteFile() {
      modal("Paste text as a new file", '<label class="ide-lbl">File name<input type="text" class="ide-inp" value="pasted.cpp"></label><label class="ide-lbl">Text<textarea class="plain ide-inp" rows="10" spellcheck="false"></textarea></label>',
        [{ label: "Cancel", value: null }, { label: "Create", primary: true, value: function (box) { return { n: box.querySelector("input").value, t: box.querySelector("textarea").value }; } }]).then(function (r) {
        if (!r || !P.clean(r.n)) return;
        var n = uniqueName(r.n);
        proj.files[n] = r.t.replace(/\r\n?/g, "\n");
        scheduleSave(); drawTree(); openFile(n);
      });
    }
    // File System Access API (Chrome, Edge): open a folder, edit, and save straight back to it
    function walkDir(dir, prefix, out) {
      var it = dir.values();
      function next() {
        return it.next().then(function (r) {
          if (r.done) return out;
          var e = r.value, path = prefix + e.name;
          if (e.kind === "directory") {
            if (/^(\.git|node_modules|\.vs|\.vscode|build|__MACOSX)$/.test(e.name) || out.length > 400) return next();
            out.dirs.push(path);
            return walkDir(e, path + "/", out).then(next);
          }
          if (out.length > 400) return next();
          return e.getFile().then(function (f) {
            if (f.size > P.MAX_TEXT) { out.push({ path: path, bytes: null }); return; }
            return f.arrayBuffer().then(function (b) { out.push({ path: path, bytes: new Uint8Array(b) }); });
          }).then(next);
        });
      }
      return next();
    }
    function openFromDisk() {
      window.showDirectoryPicker({ mode: "readwrite" }).then(function (dir) {
        var out = []; out.dirs = [];
        term.print("Reading the folder " + dir.name + " …", "t-dim");
        return walkDir(dir, "", out).then(function () {
          var pr = P.make(dir.name, {});
          pr.folders = out.dirs;
          return saveNow().then(function () { return putProject(pr, idx); }).then(function () {
            use(pr);
            fsDir = dir;   // the folder handle stays in memory for this visit only
            addFiles(out);
            term.print("Opened " + dir.name + " from your computer. Download › Save back to the folder writes your changes into it.", "t-ok");
            term.idle();
          });
        });
      }).catch(function (e) { if (e && e.name !== "AbortError") { term.print("Could not open the folder: " + (e.message || e), "t-err"); term.idle(); } });
    }
    function saveToDisk() {
      var go = fsDir ? Promise.resolve(fsDir) : window.showDirectoryPicker({ mode: "readwrite" });
      go.then(function (dir) {
        fsDir = dir;
        var paths = Object.keys(proj.files), n = 0;
        return paths.reduce(function (chain, path) {
          return chain.then(function () {
            var parts = path.split("/"), name = parts.pop();
            return parts.reduce(function (c, d) { return c.then(function (h2) { return h2.getDirectoryHandle(d, { create: true }); }); }, Promise.resolve(dir))
              .then(function (d2) { return d2.getFileHandle(name, { create: true }); })
              .then(function (fh) { return fh.createWritable(); })
              .then(function (w) { return w.write(new Blob([P.toBytes(proj.files[path])])).then(function () { n++; return w.close(); }); });
          });
        }, Promise.resolve()).then(function () { term.print("Saved " + n + " file" + (n === 1 ? "" : "s") + " to the folder " + dir.name + " on your computer.", "t-ok"); term.idle(); });
      }).catch(function (e) { if (e && e.name !== "AbortError") { term.print("Could not save to the folder: " + (e.message || e), "t-err"); term.idle(); } });
    }
    // drag and drop: files, folders (Chrome, Edge, Firefox, Safari) and zips
    function entryFiles(entry, prefix, out) {
      return new Promise(function (resolve) {
        if (entry.isFile) { entry.file(function (f) { f.relPath = prefix + f.name; out.push(f); resolve(); }, function () { resolve(); }); return; }
        if (!entry.isDirectory || /^(\.git|node_modules)$/.test(entry.name)) { resolve(); return; }
        var rd = entry.createReader(), all = [];
        (function read() {
          rd.readEntries(function (es) {
            if (!es.length) { Promise.all(all.map(function (e) { return entryFiles(e, prefix + entry.name + "/", out); })).then(resolve); return; }
            all = all.concat(Array.prototype.slice.call(es));
            read();
          }, function () { resolve(); });
        })();
      });
    }
    var side = Q(".ide-side");
    ["dragenter", "dragover"].forEach(function (ev) { root.addEventListener(ev, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0) { e.preventDefault(); root.classList.add("dropping"); } }); });
    root.addEventListener("dragleave", function (e) { if (!root.contains(e.relatedTarget)) root.classList.remove("dropping"); });
    root.addEventListener("drop", function (e) {
      root.classList.remove("dropping");
      if (!e.dataTransfer) return;
      e.preventDefault();
      var items = e.dataTransfer.items, out = [], waits = [];
      if (items && items.length && items[0].webkitGetAsEntry) {
        Array.prototype.forEach.call(items, function (it) { var en = it.webkitGetAsEntry && it.webkitGetAsEntry(); if (en) waits.push(entryFiles(en, "", out)); });
        Promise.all(waits).then(function () { return readFileList(out); }).then(function (l) { addFiles(l); });
      } else readFileList(e.dataTransfer.files).then(function (l) { addFiles(l); });
    });

    // ---- downloads
    function zipOf(filter, name) {
      var o = {};
      Object.keys(proj.files).filter(filter || function () { return true; }).forEach(function (f) { o[f] = P.toBytes(proj.files[f]); });
      if (!Object.keys(o).length) { term.print("There is nothing to download.", "t-warnc"); return; }
      P.zip(o).then(function (blob) { download(slug(name || proj.name) + ".zip", blob); term.print("Downloaded " + slug(name || proj.name) + ".zip (" + Object.keys(o).length + " files).", "t-dim"); term.idle(); });
    }
    function downloadMenu(anchor) {
      var fsOk = typeof window.showDirectoryPicker === "function";
      menu(anchor, [
        { icon: "📄", label: "This file" + (proj.active ? " (" + P.base(proj.active) + ")" : ""), disabled: !proj.active, act: function () { download(P.base(proj.active), new Blob([P.toBytes(proj.files[proj.active])])); } },
        { icon: "🗜", label: "The whole project as .zip", act: function () { zipOf(null); } },
        { icon: "📦", label: "Every project as one .zip", act: allProjectsZip },
        "-",
        { icon: "💾", label: fsDir ? "Save back to the folder " + fsDir.name : "Save into a folder on this computer…", note: fsOk ? "Chrome or Edge" : "not supported in this browser", disabled: !fsOk, act: saveToDisk }
      ]);
    }
    function allProjectsZip() {
      saveNow().then(function () {
        return Promise.all(idx.projects.map(function (x) { return getProject(x.id); }));
      }).then(function (prs) {
        var o = {};
        prs.filter(Boolean).forEach(function (pr) { Object.keys(pr.files).forEach(function (f) { o[slug(pr.name) + "/" + f] = P.toBytes(pr.files[f]); }); });
        return P.zip(o);
      }).then(function (blob) { download("comp2611-projects.zip", blob); });
    }

    // ---- top bar
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]");
      if (!b || !proj) return;
      var a = b.getAttribute("data-a");
      if (a === "run") run();
      else if (a === "viz") stepThrough();
      else if (a === "projects") projectsMenu(b);
      else if (a === "target") targetMenu(b);
      else if (a === "upload") uploadMenu(b);
      else if (a === "download") downloadMenu(b);
      else if (a === "new") menu(b, [{ icon: "📄", label: "New file…", act: function () { newFile(""); } }, { icon: "▣", label: "New folder…", act: function () { newDir(""); } }, { icon: "＋", label: "New project…", act: newProject }]);
      else if (a === "newfile") newFile("");
      else if (a === "newdir") newDir("");
      else if (a === "collapse") { allDirs().forEach(function (d) { openDirs[d] = false; }); drawTree(); }
      else if (a === "files") root.classList.toggle("side-open");
    });
    function onKey(e) {
      if (!document.body.contains(root)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveNow(); saveEl.textContent = "Saved"; }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.target.closest(".ed")) { e.preventDefault(); run(); }
      if (e.ctrlKey && e.key === "`") { e.preventDefault(); showPanel("term"); }
    }
    document.addEventListener("keydown", onKey);
    // resizing the terminal
    var split = Q(".ide-split");
    split.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var tb = Q(".ide-term .term-body"), y0 = e.clientY, h0 = tb.offsetHeight;
      function mv(ev) { var nh = Math.max(120, Math.min(window.innerHeight - 200, h0 - (ev.clientY - y0))); tb.style.height = nh + "px"; }
      function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); try { localStorage.setItem(LS_H, String(tb.offsetHeight)); } catch (er) { /* ignore */ } }
      document.addEventListener("pointermove", mv);
      document.addEventListener("pointerup", up);
    });
    split.addEventListener("keydown", function (e) {
      var tb = Q(".ide-term .term-body");
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); tb.style.height = Math.max(120, tb.offsetHeight + (e.key === "ArrowUp" ? 30 : -30)) + "px"; }
    });
    function onUnload() { if (dirty) saveNow(); }
    window.addEventListener("beforeunload", onUnload);
    ui.setCurrent({ destroy: function () { document.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onUnload); closeMenu(); if (dirty) saveNow(); term.destroy(); IDE.applyPending = null; } });
    boot();
  };
})(CL);
