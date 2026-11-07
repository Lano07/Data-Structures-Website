# Generates many questions from every Trace Trainer generator and checks their structure.
import asyncio, json, sys
from playwright.async_api import async_playwright
import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
N = int(sys.argv[1]) if len(sys.argv) > 1 else 150
CHECK = r"""
(N) => {
  const T = CL.Train, out = {};
  const strip = s => String(s).replace(/<[^>]*>/g, " ");
  T.gens.forEach(g => {
    const r = { n: 0, bad: [], opts4: 0, types: {} };
    for (let i = 0; i < N; i++) {
      const seed = (i * 2654435761 + 12345) >>> 0;
      let q;
      try { q = T.make(g.id, seed); } catch (e) { r.bad.push([seed, "THROW " + e.message + " " + (e.stack || "").split("\n")[1]]); continue; }
      r.n++;
      r.types[q.type] = (r.types[q.type] || 0) + 1;
      const o = q.mcq.options;
      if (!q.text || !q.steps || !q.steps.length) r.bad.push([seed, "missing text/steps"]);
      if (o.length < 2) r.bad.push([seed, "few options", o]);
      if (o.length === 4) r.opts4++;
      if (new Set(o.map(x => q.type === "choice" ? x : T.norm(x))).size !== o.length) r.bad.push([seed, "dup options", o]);
      if (!(q.mcq.answer >= 0 && q.mcq.answer < o.length)) r.bad.push([seed, "bad answer index", o, q.mcq.answer]);
      if (q.type !== "choice" && T.norm(o[q.mcq.answer]) !== T.norm(q.answer)) r.bad.push([seed, "mcq answer != answer"]);
      if (q.type !== "choice" && !T.norm(q.answer)) r.bad.push([seed, "empty answer"]);
      const all = strip(q.text) + " " + o.map(strip).join(" | ") + " " + q.steps.map(strip).join(" ");
      if (/undefined|NaN|\[object|Infinity/.test(all)) r.bad.push([seed, "odd text", all.match(/.{0,50}(undefined|NaN|\[object|Infinity).{0,30}/)[0]]);
      if (/\bnull\b/.test(strip(q.text) + o.map(strip).join(" ")) && !/null$|NULL/.test(o.map(strip).join(" ")) && g.id !== "bst-succ" && !/^classic/.test(g.id)) r.bad.push([seed, "null in text"]);
      // the same seed must give the same question
      const q2 = T.make(g.id, seed);
      if (q2.text !== q.text || JSON.stringify(q2.mcq) !== JSON.stringify(q.mcq)) r.bad.push([seed, "not deterministic"]);
    }
    out[g.id] = r;
  });
  return out;
}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
        await pg.goto("file://" + REPO + "/dist/COMP2611-Code-Lab.html#home")
        await pg.wait_for_timeout(500)
        res = await pg.evaluate(CHECK, N)
        tot = 0; bad = 0
        for gid, r in res.items():
            tot += r["n"]; bad += len(r["bad"])
            flag = "" if not r["bad"] else "  <-- %d problems" % len(r["bad"])
            print(f"{gid:16s} made {r['n']:4d}  4-option {r['opts4']:4d}  types {r['types']}{flag}")
            for x in r["bad"][:4]: print("     ", json.dumps(x)[:300])
        print("TOTAL", tot, "problems", bad)
        for e in errs[:10]: print(e)
        await b.close()
asyncio.run(main())
