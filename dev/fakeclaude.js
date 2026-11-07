// A stand-in for the Claude runtime, so the tutor can be tested in a plain browser.
window.__calls = [];
// a small in-memory db (persisted in localStorage under __fakedb so a reload sees the "account" copy), user and downloads
window.__fakedb = (function () { try { return JSON.parse(localStorage.getItem("__fakedb") || "{}"); } catch (e) { return {}; } })();
window.__saves = [];
var FAKE = {
  user: { id: function () { return Promise.resolve("viewer123"); }, isOwner: function () { return true; }, canEdit: function () { return true; } },
  downloads: { save: function (req) { window.__saves.push(req); return Promise.resolve({ status: "saved" }); } },
  db: { collection: function (cpath) { return { doc: function (k) { var path = cpath + "/" + k; return {
    id: k, path: path,
    get: function () { var d = window.__fakedb[path]; return Promise.resolve({ id: k, exists: !!d, data: function () { return d ? JSON.parse(JSON.stringify(d)) : undefined; } }); },
    set: function (data) { window.__fakedb[path] = JSON.parse(JSON.stringify(data)); try { localStorage.setItem("__fakedb", JSON.stringify(window.__fakedb)); } catch (e) {} return Promise.resolve(); }
  }; } }; } }
};
window.claude = { use: function (name) { return new Promise(function (res) { setTimeout(function () {
  if (name !== "sample") return res(window.__nofakecaps ? null : (FAKE[name] || null));
  var f = function (input, opts) {
    window.__calls.push(input);
    var last = Array.isArray(input) ? input[input.length - 1].content : input;
    var text = /Verdict/.test(last) ? "**Verdict:** Nearly there. You have the main idea.\n\n**What you got right:** you said the new node points to the old top.\n\n**What to add or fix:** say why it also works when the list is empty.\n\n**Try this:** what is top after inserting into an empty list?" :
      "Sure! Let's work through it together.\n\n1. First, look at `top`.\n2. Then follow `next`.\n\n```cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n\tint x = 41;\n\tcout << x + 1 << endl;\n\treturn 0;\n}\n```\n\n| step | value |\n|---|---|\n| 1 | 41 |\n| 2 | 42 |\n\n**Your turn:** what does it print?";
    return new Promise(function (resolve, reject) {
      var i = 0;
      var step = function () {
        if (opts && opts.signal && opts.signal.aborted) return reject({ code: "cancelled", message: "stopped", text: text.slice(0, i) || undefined });
        i = Math.min(text.length, i + 30);
        if (opts && opts.onText) opts.onText({ text: text.slice(0, i), delta: text.slice(Math.max(0, i - 30), i) });
        if (i < text.length) setTimeout(step, 15); else resolve({ text: text, truncated: false, modelTierApplied: "default" });
      };
      setTimeout(step, 250);
    });
  };
  f.json = function (input) {
    window.__calls.push(input);
    var last = Array.isArray(input) ? input[input.length - 1].content : String(input);
    if (/MARKING SCHEME/.test(last)) return new Promise(function (r) { setTimeout(function () { r({ points: [{ i: 0, awarded: 1, reason: "The header is right." }, { i: 1, awarded: 1, reason: "curr walks the list." }, { i: 2, awarded: 0, reason: "The counter is never increased." }], summary: "Good traversal, but nothing is counted.", fix: "Add 1 to count when curr->data == key." }); }, 200); });
    return Promise.resolve({});
  };
  f.limits = function () { return Promise.resolve({ maxPromptBytes: 262144 }); };
  res(f);
}, 40); }); } };
