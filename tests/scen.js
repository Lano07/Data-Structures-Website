// Runs every Memory Lab scenario and generated lab program under the interpreter and g++.
const CPP = require("./load.js");
const fs = require("fs"), path = require("path"), cp = require("child_process"), vm = require("vm");
const ctx = { CL: { Labs: {}, Diagrams: {} }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/lab_mem.js"), "utf8"), ctx);
const CL = ctx.CL;
const progs = CL.MemScenarios.map((s) => ({ name: "scenario " + s.id, code: s.code, crash: s.id === "dangle" }));
CL.LIST_OPS.forEach((op) => {
  progs.push({ name: "list " + op.id, code: CL.listProgram(op, [40, 10, 30, 20], 25, [15, 35]) });
  progs.push({ name: "list " + op.id + " (empty)", code: CL.listProgram(op, [], 5, []) });
  progs.push({ name: "list " + op.id + " (x at head)", code: CL.listProgram(op, [5, 10], 5, [1]) });
});
progs.push({ name: "stack", code: CL.sqProgram("stack", CL.parseOps("push 1, push 2, pop, pop, pop")) });
progs.push({ name: "queue", code: CL.sqProgram("queue", CL.parseOps("enqueue 1, enqueue 2, dequeue, push 3, pop, pop, pop")) });
const tmp = "/tmp/claude-0/scen"; fs.mkdirSync(tmp, { recursive: true });
let ok = 0;
progs.forEach((p, k) => {
  const r = CPP.run(p.code, { trace: true, maxSnaps: 2500, maxSteps: 400000 });
  const src = path.join(tmp, "p" + k + ".cpp"), exe = path.join(tmp, "p" + k);
  fs.writeFileSync(src, p.code);
  let g = "";
  try { cp.execFileSync("g++", ["-std=c++17", "-O0", "-w", "-o", exe, src], { stdio: "pipe" }); g = cp.execFileSync(exe, { timeout: 5000, stdio: ["pipe", "pipe", "pipe"] }).toString(); }
  catch (e) { g = (e.stdout ? e.stdout.toString() : "") + "[g++ " + (e.status !== undefined ? "exit " + e.status : "fail") + "]"; }
  const interpErr = r.err ? r.err.msg : "";
  const same = r.out === g.replace(/\[g\+\+ .*\]$/, "") && (!r.err || p.crash);
  if (same && r.compiled) ok++;
  else console.log("FAIL " + p.name + "\n  g++: " + JSON.stringify(g) + "\n  int: " + JSON.stringify(r.out) + " " + interpErr);
});
console.log(ok + "/" + progs.length + " lab programs OK");
