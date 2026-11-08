/* COMP 2611 Code Lab — the lesson markup: a small Markdown dialect with boxes, quizzes and diagrams. */
(function (CL) {
  "use strict";
  var esc = CL.esc;

  // inline: `code`, **bold**, *italic*, [text](href)
  CL.inline = function (s) {
    var codes = [];
    var t = String(s).replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
    t = esc(t);
    t = t.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, txt, href) {
      // only links to web pages, e-mail or places on this site: never javascript: or data: (tutor replies use this too)
      var ext = /^https?:\/\//i.test(href);
      if (!ext && !/^#[\w-]*$/.test(href) && !/^mailto:[^\s"'<>]+$/i.test(href)) return txt;
      return '<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + txt + "</a>";
    });
    return t.replace(/\u0000(\d+)\u0000/g, function (_, i) { return "<code>" + esc(codes[+i]) + "</code>"; });
  };

  function attrs(s) {
    var out = {}, re = /([\w-]+)(?:="((?:[^"\\]|\\.)*)")?/g, m;
    while ((m = re.exec(s || ""))) out[m[1]] = m[2] === undefined ? true : m[2].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    return out;
  }
  CL.attrs = attrs;

  // Parse into blocks: {t:"h",level,text} {t:"p",text} {t:"ul"/"ol",items} {t:"code",lang,attrs,code} {t:"box",kind,title,body}
  // {t:"quiz",...} {t:"diagram",kind,args,body} {t:"table",head,rows} {t:"hr"} {t:"quote",text}
  CL.parseMd = function (src) {
    var lines = src.replace(/\r/g, "").split("\n");
    var blocks = [], i = 0;
    function collectUntilClose(start) {
      var depth = 1, j = start, body = [];
      while (j < lines.length) {
        var L = lines[j];
        if (/^```/.test(L)) {
          body.push(L); j++;
          while (j < lines.length && !/^```\s*$/.test(lines[j])) { body.push(lines[j]); j++; }
          if (j < lines.length) { body.push(lines[j]); j++; }
          continue;
        }
        if (/^:::\w/.test(L)) depth++;
        else if (/^:::\s*$/.test(L)) { depth--; if (depth === 0) return { body: body, next: j + 1 }; }
        body.push(L);
        j++;
      }
      return { body: body, next: j };
    }
    while (i < lines.length) {
      var L = lines[i];
      if (/^\s*$/.test(L)) { i++; continue; }
      var m;
      if ((m = /^```(\w*)(.*)$/.exec(L))) {
        var code = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        blocks.push({ t: "code", lang: m[1] || "cpp", attrs: attrs(m[2]), code: code.join("\n") });
        continue;
      }
      if ((m = /^:::(\w+)\s*(.*)$/.exec(L))) {
        var c = collectUntilClose(i + 1);
        var kind = m[1], rest = m[2];
        if (kind === "quiz") blocks.push(CL.parseQuiz(c.body.join("\n"), rest));
        else if (kind === "diagram") blocks.push({ t: "diagram", spec: rest.trim(), body: c.body.join("\n").trim() });
        else blocks.push({ t: "box", kind: kind, title: rest.trim(), body: c.body.join("\n") });
        i = c.next;
        continue;
      }
      if ((m = /^(#{2,4})\s+(.*)$/.exec(L))) { blocks.push({ t: "h", level: m[1].length, text: m[2] }); i++; continue; }
      if (/^---+\s*$/.test(L)) { blocks.push({ t: "hr" }); i++; continue; }
      if (/^\|/.test(L)) {
        var rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        var cells = function (r) { return r.replace(/^\||\|\s*$/g, "").split(/(?<!\\)\|/).map(function (x) { return x.trim().replace(/\\\|/g, "|"); }); };
        var head = cells(rows[0]);
        var body = rows.slice(1).filter(function (r) { return !/^\|[\s:|-]+\|?\s*$/.test(r); }).map(cells);
        blocks.push({ t: "table", head: head, rows: body });
        continue;
      }
      if (/^>\s?/.test(L)) {
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
        blocks.push({ t: "quote", text: q.join(" ") });
        continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(L)) {
        var ordered = /^\s*\d+\./.test(L), items = [];
        while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
          var it = lines[i];
          var mm = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(it);
          if (mm && mm[1].length >= 2 && items.length) {
            var last = items[items.length - 1];
            (last.sub = last.sub || []).push(mm[3]);
          } else if (mm) items.push({ text: mm[3] });
          else items[items.length - 1].text += " " + it.trim();
          i++;
        }
        blocks.push({ t: ordered ? "ol" : "ul", items: items });
        continue;
      }
      var para = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(```|:::|#{2,4}\s|\||>\s?|---+\s*$)/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) { para.push(lines[i].trim()); i++; }
      if (para.length) blocks.push({ t: "p", text: para.join(" ") });
      else i++;
    }
    return blocks;
  };

  // :::quiz  question text, optional ```cpp block```, options "- [ ]" / "- [x]", explanation lines ">> ..."
  CL.parseQuiz = function (text, rest) {
    var lines = text.split("\n"), q = [], opts = [], expl = [], code = null, codeAttrs = null, i = 0;
    while (i < lines.length) {
      var L = lines[i];
      var m;
      if ((m = /^```(\w*)(.*)$/.exec(L))) {
        var c = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) { c.push(lines[i]); i++; }
        i++;
        code = c.join("\n");
        codeAttrs = attrs(m[2]);
        continue;
      }
      if ((m = /^- \[( |x)\]\s+(.*)$/.exec(L))) { opts.push({ text: m[2], right: m[1] === "x" }); i++; continue; }
      if (/^>>\s?/.test(L)) { expl.push(L.replace(/^>>\s?/, "")); i++; continue; }
      if (L.trim()) {
        if (opts.length) expl.push(L.trim());
        else q.push(L.trim());
      }
      i++;
    }
    return { t: "quiz", q: q.join(" "), code: code, codeAttrs: codeAttrs, opts: opts, expl: expl.join(" "), title: (rest || "").trim() };
  };

  var BOX_LABEL = { tip: "Tip", mistake: "Common mistake", exam: "Exam focus", remember: "Remember", why: "Why it works", warn: "Careful", def: "Definition", info: "Note", steps: "Step by step", trace: "Trace it",
    theorem: "Theorem", proof: "Proof", trap: "Exam trap", insight: "Insight", example: "Worked example", invariant: "Invariant", challenge: "Challenge" };

  CL.renderMd = function (src, hooks) {
    hooks = hooks || {};
    var root = document.createElement("div");
    root.className = "md";
    var blocks = CL.parseMd(src);
    blocks.forEach(function (b) { var el = renderBlock(b, hooks); if (el) root.appendChild(el); });
    return root;
  };
  function renderBlock(b, hooks) {
    var el;
    switch (b.t) {
      case "h": {
        el = document.createElement("h" + b.level);
        el.innerHTML = CL.inline(b.text);
        el.id = "s-" + b.text.toLowerCase().replace(/<[^>]+>|`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return el;
      }
      case "p": el = document.createElement("p"); el.innerHTML = CL.inline(b.text); return el;
      case "hr": return document.createElement("hr");
      case "quote": el = document.createElement("blockquote"); el.innerHTML = CL.inline(b.text); return el;
      case "ul": case "ol": {
        el = document.createElement(b.t);
        b.items.forEach(function (it) {
          var li = document.createElement("li");
          li.innerHTML = CL.inline(it.text);
          if (it.sub) {
            var sub = document.createElement("ul");
            it.sub.forEach(function (s) { var l2 = document.createElement("li"); l2.innerHTML = CL.inline(s); sub.appendChild(l2); });
            li.appendChild(sub);
          }
          el.appendChild(li);
        });
        return el;
      }
      case "table": {
        var wrap = document.createElement("div");
        wrap.className = "tbl";
        var html = "<table><thead><tr>" + b.head.map(function (h) { return "<th>" + CL.inline(h) + "</th>"; }).join("") + "</tr></thead><tbody>";
        b.rows.forEach(function (r) { html += "<tr>" + r.map(function (c) { return "<td>" + CL.inline(c) + "</td>"; }).join("") + "</tr>"; });
        wrap.innerHTML = html + "</tbody></table>";
        return wrap;
      }
      case "code":
        if (hooks.code) { el = hooks.code(b); if (el) return el; }
        return CL.codeBlock(b.code);
      case "box": {
        if (b.kind === "teachback" || b.kind === "parsons" || b.kind === "predict") return hooks[b.kind] ? hooks[b.kind](b) : null;
        el = document.createElement("aside");
        el.className = "box box-" + b.kind;
        var label = b.title || BOX_LABEL[b.kind] || b.kind;
        var head = document.createElement("div");
        head.className = "box-h";
        head.innerHTML = '<span class="box-k">' + esc(BOX_LABEL[b.kind] || b.kind) + "</span>" + (b.title ? '<span class="box-t">' + CL.inline(b.title) + "</span>" : "");
        if (!b.title && !BOX_LABEL[b.kind]) head.innerHTML = '<span class="box-k">' + esc(label) + "</span>";
        el.appendChild(head);
        var inner = CL.renderMd(b.body, hooks);
        inner.className = "box-b";
        el.appendChild(inner);
        return el;
      }
      case "quiz": return hooks.quiz ? hooks.quiz(b) : null;
      case "diagram": return hooks.diagram ? hooks.diagram(b) : null;
    }
    return null;
  }
})(CL);
