# Drives every lab operation in "Your turn" mode and checks every question.
import asyncio, json, sys
from playwright.async_api import async_playwright

import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
CHECK = r"""
() => {
  const P = CL.lastPlayer, out = { frames: P.frames.length, asks: 0, bad: [] };
  P.frames.forEach((f, i) => {
    if (!f.ask) return;
    out.asks++;
    const a = f.ask, o = a.options || [];
    const strip = s => String(s).replace(/<[^>]*>/g, "");
    if (!a.q || o.length < 2) out.bad.push([i, "few options", strip(a.q), o]);
    if (new Set(o.map(strip)).size !== o.length) out.bad.push([i, "duplicate options", strip(a.q), o]);
    if (!(a.answer >= 0 && a.answer < o.length)) out.bad.push([i, "bad answer index", strip(a.q), o, a.answer]);
    o.forEach(x => { if (/undefined|NaN|null|\[object/.test(strip(x))) out.bad.push([i, "odd option", strip(a.q), o]); });
    if (/undefined|NaN|\[object/.test(strip(a.q))) out.bad.push([i, "odd question", strip(a.q)]);
  });
  // play the whole run in Your turn mode, answering wrong first on every other question
  P.setMode("you");
  P.go(0);
  let guard = 0, wrongFirst = true;
  while (guard++ < 5000) {
    if (P.pending()) {
      const a = P.frames[P.i].ask;
      const pick = wrongFirst ? (a.answer + 1) % a.options.length : a.answer;
      wrongFirst = !wrongFirst;
      P.answer(pick);
      if (P.pending()) { out.bad.push([P.i, "still pending after answer"]); break; }
      continue;
    }
    if (P.i >= P.frames.length - 1) break;
    const before = P.i;
    P.go(P.i + 1);
    if (P.i === before) { out.bad.push([P.i, "stuck"]); break; }
  }
  out.answered = Object.keys(P.ans).length;
  out.say = document.querySelector(".player-say").textContent.slice(0, 80);
  return out;
}
"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 900})
        await pg.add_init_script(path=REPO + "/dev/fakeclaude.js")
        errs = []
        pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type == "error" else None)
        await pg.goto("file://" + REPO + "/dist/COMP2611-Code-Lab.html#home")
        await pg.wait_for_timeout(500)
        total = {"runs": 0, "asks": 0, "bad": 0}
        async def run(name, setup):
            await pg.evaluate(setup)
            await pg.wait_for_timeout(30)
            r = await pg.evaluate(CHECK)
            total["runs"] += 1; total["asks"] += r["asks"]; total["bad"] += len(r["bad"])
            flag = "" if r["asks"] else "  (no questions)"
            if r["bad"] or "-v" in sys.argv or not r["asks"]:
                print(f"{name}: frames {r['frames']}, asks {r['asks']}, answered {r['answered']}{flag}")
                for x in r["bad"][:6]: print("   BAD", x)
        async def lab(id):
            await pg.evaluate(f"location.hash = '#lab-{id}'")
            await pg.wait_for_timeout(500)
        # traversal
        await lab("traversal")
        for t in ["0", "1", "2", "3", "bst"]:
            for k in ["pre", "in", "post", "level"]:
                await run(f"traversal {t} {k}", f"""() => {{ const h = document.querySelector('.lab'); h.querySelector('#tv-tree').value = '{t}'; h.querySelector('#tv-kind').value = '{k}'; h.querySelector('#tv-go').click(); }}""")
        # BST
        await lab("bst")
        for preset in range(4):
            for op, key in [("insert", 33), ("insert", 1), ("insert", 25), ("search", 45), ("search", 99), ("del", 41), ("del", 30), ("del", 20), ("del", 5), ("del", 17), ("succ", 18), ("succ", 80), ("pred", 25), ("pred", 5), ("min", 0), ("max", 0)]:
                await run(f"bst preset {preset} {op} {key}", f"""() => {{ const h = document.querySelector('.lab'); const s = h.querySelector('#bst-preset'); s.value = '{preset}'; s.dispatchEvent(new Event('change')); h.querySelector('#bst-key').value = '{key}'; h.querySelector('[data-op="{op}"]').click(); }}""")
        # heap
        await lab("heap")
        for kind in ["max", "min"]:
            for vals in ["4 1 3 2 16 9 10 14 8 7", "5 5 5 3 3 9", "1 2 3 4 5 6 7", "42", "8 3"]:
                for op in ["build", "sort", "extract", "insert", "increase", "del", "heapify"]:
                    await run(f"heap {kind} [{vals}] {op}", f"""() => {{ const h = document.querySelector('.lab'); h.querySelector('#hp-vals').value = '{vals}'; const k = h.querySelector('#hp-kind'); k.value = '{kind}'; h.querySelector('[data-op="build"]').click(); h.querySelector('#hp-i').value = '2'; h.querySelector('#hp-x').value = '{ '20' if kind == 'max' else '0' }'; h.querySelector('[data-op="{op}"]').click(); }}""")
        # hashing
        await lab("hash")
        for preset in range(4):
            for method in ["linear", "quad", "double", "chain"]:
                for n in ["12", "13", "7"]:
                    await run(f"hash preset {preset} {method} N={n} all", f"""() => {{ const h = document.querySelector('.lab'); const s = h.querySelector('#hs-preset'); s.value = '{preset}'; s.dispatchEvent(new Event('change')); h.querySelector('#hs-method').value = '{method}'; h.querySelector('#hs-n').value = '{n}'; h.querySelector('#hs-all').click(); }}""")
                    for op, key in [("ins", 71), ("find", 23), ("find", 99), ("del", 31), ("find", 61)]:
                        await run(f"hash preset {preset} {method} N={n} {op} {key}", f"""() => {{ const h = document.querySelector('.lab'); h.querySelector('#hs-key').value = '{key}'; h.querySelector('[data-op="{op}"]').click(); }}""")
        # graphs
        await lab("graph")
        for alg, gs in [("bfs", ["g1", "g3", "rep", "file", "und", "dj"]), ("dfs", ["g1", "g3", "rep", "file", "und", "dj"]), ("dijkstra", ["dj"]), ("kruskal", ["p1", "k1"]), ("prim", ["p1", "k1"])]:
            for gid in gs:
                for start in ["A", "C", "F"]:
                    await run(f"graph {alg} {gid} from {start}", f"""() => {{ const h = document.querySelector('.lab'); const a = h.querySelector('#gr-alg'); a.value = '{alg}'; a.dispatchEvent(new Event('change')); const g = h.querySelector('#gr-g'); g.value = '{gid}'; g.dispatchEvent(new Event('change')); const s = h.querySelector('#gr-s'); if ([...s.options].some(o => o.value === '{start}')) s.value = '{start}'; h.querySelector('#gr-go').click(); }}""")
        # sorting
        await lab("sort")
        for alg in ["selection", "bubble", "insertion", "merge", "quick", "heap"]:
            for pre in range(7):
                for one in ["false", "true"] if alg == "quick" else ["false"]:
                    await run(f"sort {alg} preset {pre} one={one}", f"""() => {{ const h = document.querySelector('.lab'); const a = h.querySelector('#so-alg'); a.value = '{alg}'; const s = h.querySelector('#so-pre'); s.value = '{pre}'; h.querySelector('#so-one').checked = {one}; s.dispatchEvent(new Event('change')); }}""")
            for v in ["5 5 5 5", "2 1", "7", "3 1 2 3 1 2"]:
                await run(f"sort {alg} [{v}]", f"""() => {{ const h = document.querySelector('.lab'); h.querySelector('#so-alg').value = '{alg}'; h.querySelector('#so-v').value = '{v}'; h.querySelector('#so-go').click(); }}""")
        print("TOTAL", total)
        for e in errs[:20]: print(e)
        await b.close()
asyncio.run(main())
