// Differential test: every tests/progs/*.cpp runs under g++ and the interpreter; outputs must match.
const CPP = require("./load.js");
const fs = require("fs"), path = require("path"), cp = require("child_process");
const dir = path.join(__dirname, "progs");
const only = process.argv[2];
const tmp = "/tmp/claude-0/difftest"; fs.mkdirSync(tmp, { recursive: true });
let pass = 0, fail = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".cpp")).sort()) {
  if (only && !f.includes(only)) continue;
  const src = fs.readFileSync(path.join(dir, f), "utf8");
  const inFile = path.join(dir, f.replace(".cpp", ".in"));
  const stdin = fs.existsSync(inFile) ? fs.readFileSync(inFile, "utf8") : "";
  const files = {};
  for (const m of src.matchAll(/\/\/ FILE (\S+)\n((?:\/\/ (?!FILE ).*\n)*)/g)) files[m[1]] = m[2].split("\n").filter(Boolean).map((l) => l.slice(3)).join("\n") + "\n";
  for (const [n, c] of Object.entries(files)) fs.writeFileSync(path.join(tmp, n), c);
  const exe = path.join(tmp, f + ".out");
  let gout = "";
  try {
    cp.execFileSync("g++", ["-std=c++17", "-O0", "-w", "-o", exe, path.join(dir, f)], { stdio: "pipe" });
    gout = cp.execFileSync(exe, { input: stdin, cwd: tmp, stdio: ["pipe", "pipe", "pipe"], timeout: 5000 }).toString();
  } catch (e) { gout = (e.stdout ? e.stdout.toString() : "") + "[g++ failed: " + String(e.stderr || e.message).slice(0, 300) + "]"; }
  const r = CPP.run(src, { stdin, files, trace: true, maxSnaps: 3000 });
  const iout = r.out + (r.err ? "[ERR line " + r.err.line + "] " + r.err.msg : "");
  if (iout === gout) { pass++; console.log("ok   " + f + "  (snaps " + (r.snaps ? r.snaps.length : 0) + ")"); }
  else {
    fail++;
    console.log("FAIL " + f);
    const a = gout.split("\n"), b = iout.split("\n");
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { console.log("  line " + (i + 1) + "\n   g++: " + JSON.stringify(a[i]) + "\n   int: " + JSON.stringify(b[i])); break; }
  }
}
console.log(pass + " passed, " + fail + " failed");
