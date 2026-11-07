// COMP 2611 Code Lab — tutor proxy (optional). It keeps the Anthropic API key on the server: the page sends only
// the conversation, and this server adds the key, calls the Claude API, and streams the answer back as plain text.
// Node.js 18 or newer, no dependencies.
//   ANTHROPIC_API_KEY=sk-...  ALLOWED_ORIGIN=https://your-site.example  node server.mjs
// The page's Settings → Tutor → "Server address" should then be https://your-server.example/tutor
import http from "node:http";

const PORT = +(process.env.PORT || 8787);
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || "claude-sonnet-5-5";       // check current model names in the Claude API docs
const ORIGINS = (process.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const MAX_BODY = 200000;                                       // bytes of conversation accepted per request
const MAX_TOKENS = +(process.env.MAX_TOKENS || 1500);          // longest answer
const PER_MINUTE = +(process.env.RATE_PER_MINUTE || 12);       // requests per minute per address
const API_URL = process.env.API_URL || "https://api.anthropic.com/v1/messages";   // override only for testing
if (!KEY) { console.error("Set ANTHROPIC_API_KEY in the environment (never in the page)."); process.exit(1); }
if (!ORIGINS.length) console.warn("ALLOWED_ORIGIN is not set: browsers on any site will be refused (CORS).");

const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > PER_MINUTE;
}
function allowed(origin) { return ORIGINS.includes("*") || (origin && ORIGINS.includes(origin)); }

http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (allowed(origin)) { res.setHeader("Access-Control-Allow-Origin", origin || "*"); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method !== "POST" || !req.url.startsWith("/tutor")) { res.writeHead(404); return res.end("not found"); }
  if (!allowed(origin)) { res.writeHead(403); return res.end("origin not allowed"); }
  if (limited(req.socket.remoteAddress)) { res.writeHead(429); return res.end("too many requests"); }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) { res.writeHead(413); return res.end("too large"); }
    chunks.push(c);
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { res.writeHead(400); return res.end("bad json"); }
  const messages = (Array.isArray(body.input) ? body.input : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 60000) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") { res.writeHead(400); return res.end("bad input"); }
  const payload = { model: MODEL, max_tokens: MAX_TOKENS, messages, stream: true };
  if (body.json) payload.system = "Reply with JSON only, with no text before or after it.";
  let upstream;
  try {
    upstream = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(payload)
    });
  } catch (e) { res.writeHead(502); return res.end("could not reach the API"); }
  if (!upstream.ok || !upstream.body) { res.writeHead(upstream.status === 429 ? 429 : 502); return res.end("API error " + upstream.status); }
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  // the API streams server-sent events; pass on only the text
  const dec = new TextDecoder();
  let buf = "";
  for await (const chunk of upstream.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      try {
        const ev = JSON.parse(line.slice(5));
        if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") res.write(ev.delta.text);
      } catch { /* ignore keep-alive and partial lines */ }
    }
  }
  res.end();
}).listen(PORT, () => console.log("COMP 2611 tutor proxy listening on port " + PORT));
