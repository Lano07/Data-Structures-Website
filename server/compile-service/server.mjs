// COMP 2611 Code Lab — optional compiler service: a starting implementation of the design in README.md.
// NOT deployed and NOT security-audited. Requires Docker and the gcc:13 image on the host.
//   ALLOWED_ORIGIN=https://your-site.example node server.mjs
import http from "node:http";
import { spawn } from "node:child_process";

const PORT = +(process.env.PORT || 8788);
const ORIGINS = (process.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const MAX_CODE = 64 * 1024, MAX_OUT = 64 * 1024, WALL_MS = 15000;
const IMAGE = process.env.IMAGE || "gcc:13";
const hits = new Map();
function limited(ip) { const now = Date.now(), l = (hits.get(ip) || []).filter((t) => now - t < 60000); l.push(now); hits.set(ip, l); return l.length > 10; }

function runInContainer(code, stdin) {
  return new Promise((resolve) => {
    // compile, then run with a CPU-time limit; source arrives on stdin, so nothing is written on the host
    const script = "cd /work && head -c " + Buffer.byteLength(code, "utf8") + " > main.cpp && " +
      "(timeout 10 g++ -std=c++17 -O0 -o main main.cpp 2> compile.txt || { echo '__COMPILE_FAILED__'; head -c 8000 compile.txt; exit 0; }) && " +
      "(ulimit -t 2; timeout 3 ./main; echo \"__EXIT__$?\")";
    const args = ["run", "--rm", "-i", "--network", "none", "--read-only", "--tmpfs", "/work:rw,exec,size=16m",
      "--memory", "256m", "--memory-swap", "256m", "--pids-limit", "64", "--cpus", "1", "--user", "65534:65534",
      "--cap-drop", "ALL", "--security-opt", "no-new-privileges", IMAGE, "sh", "-c", script];
    const p = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", timedOut = false;
    const killer = setTimeout(() => { timedOut = true; p.kill("SIGKILL"); }, WALL_MS);
    p.stdout.on("data", (d) => { if (out.length < MAX_OUT) out += d.toString("utf8"); });
    p.on("close", () => {
      clearTimeout(killer);
      if (out.startsWith("__COMPILE_FAILED__")) return resolve({ compiled: false, compileErrors: out.slice(19), stdout: "", exitCode: null, timedOut });
      const m = /__EXIT__(\d+)\s*$/.exec(out);
      resolve({ compiled: true, compileErrors: "", stdout: (m ? out.slice(0, m.index) : out).slice(0, MAX_OUT), exitCode: m ? +m[1] : null, timedOut: timedOut || (m && +m[1] === 124) });
    });
    p.stdin.end(code + (stdin || ""));
  });
}

http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  const ok = ORIGINS.includes("*") || ORIGINS.includes(origin);
  if (ok) { res.setHeader("Access-Control-Allow-Origin", origin || "*"); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method !== "POST" || req.url !== "/run") { res.writeHead(404); return res.end(); }
  if (!ok) { res.writeHead(403); return res.end(); }
  if (limited(req.socket.remoteAddress)) { res.writeHead(429); return res.end(); }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > MAX_CODE * 2) { res.writeHead(413); return res.end(); } chunks.push(c); }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { res.writeHead(400); return res.end(); }
  if (typeof body.code !== "string" || body.code.length > MAX_CODE) { res.writeHead(400); return res.end(); }
  const result = await runInContainer(body.code, typeof body.stdin === "string" ? body.stdin.slice(0, 16384) : "");
  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(result));
}).listen(PORT, () => console.log("compiler service (unaudited starting point) on port " + PORT));
