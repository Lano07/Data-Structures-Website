// every memory lab demo must run in the interpreter exactly as g++ runs it (except the deliberate crash)
const fs = require("fs"), vm = require("vm"), cp = require("child_process");
const CPP = require(require("path").join(__dirname, "load.js"));
const ctx = { CL: { esc: (s) => s, Labs: {}, Diagrams: {} }, console, document: { createElement: () => ({}) }, window: {} };
vm.createContext(ctx);
let src = fs.readFileSync(require("path").join(__dirname, "..", "src", "lab_mem.js"), "utf8").replace(/CL\.Labs\.(\w+) = function/g, "CL.Labs.$1 = function");
src = src.replace("var S = [];", "var S = CL.__S = [];");
try { vm.runInContext(src, ctx); } catch (e) { /* the DOM parts are not needed */ }
let bad = 0;
for (const d of ctx.CL.__S) {
  const r = CPP.run(d.code, {});
  fs.writeFileSync("/tmp/claude-0/md.cpp", d.code);
  let g = "";
  try { cp.execFileSync("g++", ["-std=c++17", "-w", "-o", "/tmp/claude-0/md.out", "/tmp/claude-0/md.cpp"]); g = cp.execFileSync("/tmp/claude-0/md.out", { timeout: 3000 }).toString(); } catch (e) { g = "[crash]"; }
  const ok = d.id === "dangle" ? !!r.err : (!r.err && r.out === g);
  if (!ok) { bad++; console.log("FAIL", d.id, JSON.stringify(r.out).slice(0, 80), r.err && r.err.msg, "| g++:", JSON.stringify(g).slice(0, 80)); }
}
console.log(ctx.CL.__S.length, "demos,", bad, "problems");
