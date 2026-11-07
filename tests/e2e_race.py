"""The sorting race: every algorithm sorts correctly, counts match known best and worst cases, and the controls work."""
import asyncio, os, sys
from playwright.async_api import async_playwright
URL = os.environ.get("CODELAB_URL", "file:///home/claude/codelab/dist/COMP2611-Code-Lab.html")
FAILS = []
def check(c, m):
    print(("ok   " if c else "FAIL ") + m)
    if not c: FAILS.append(m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1280, "height": 900})
        await pg.add_init_script(path="/home/claude/codelab/dev/fakeclaude.js")
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL + "#lab-sort"); await pg.wait_for_timeout(600)
        res = await pg.evaluate("""(() => {
          const S = CL.SORTS_RACE, out = { sorted: true };
          for (let trial = 0; trial < 60; trial++) {
            const n = 1 + Math.floor(Math.random() * 40), a = Array.from({ length: n }, () => Math.floor(Math.random() * 20));
            const want = a.slice().sort((x, y) => x - y).join();
            Object.keys(S).forEach(k => { const st = S[k].run(a.slice()); if (st[st.length - 1].A.join() !== want) out.sorted = false; });
          }
          const sorted = Array.from({ length: 20 }, (_, i) => i), rev = sorted.slice().reverse(), last = (k, a) => { const st = S[k].run(a.slice()); return st[st.length - 1]; };
          out.insSorted = last('insertion', sorted).cmp;       // n - 1 = 19
          out.insRev = last('insertion', rev).cmp;             // n(n-1)/2 = 190
          out.bubSorted = last('bubble', sorted).cmp;          // the lecture's version: still n(n-1)/2 = 190
          out.selSorted = last('selection', sorted).cmp;       // 190
          out.quickSorted = last('quick', sorted).cmp;         // n(n-1)/2 = 190 (worst case)
          return out;
        })()""")
        check(res["sorted"], "all six sorts give the sorted array on 60 random inputs (duplicates, sizes 1 to 40)")
        check(res["insSorted"] == 19 and res["insRev"] == 190, "insertion sort: 19 comparisons on sorted input, 190 on reversed (n = 20)")
        check(res["bubSorted"] == 190 and res["selSorted"] == 190, "bubble (lecture version) and selection: 190 comparisons even when sorted")
        check(res["quickSorted"] == 190, "quick sort's worst case on sorted input: 190 comparisons")
        check(await pg.locator(".race-cell").count() == 3, "three algorithms race by default")
        await pg.click('.race [data-r="end"]'); await pg.wait_for_timeout(200)
        check("Finishing order" in await pg.locator(".race-res").inner_text(), "finishing order is reported")
        await pg.select_option(".race-kind", "sorted"); await pg.wait_for_timeout(200)
        await pg.click('.race [data-r="play"]'); await pg.wait_for_timeout(600)
        t = await pg.locator(".race-t").inner_text()
        check(not t.startswith("tick 0 "), "Start plays the race: " + t)
        await pg.evaluate("location.hash = '#home'"); await pg.wait_for_timeout(300)
        for e in errs: print("  error:", e)
        check(not errs, "no page errors (and the race stops when you leave)")
        await b.close()
    print("\n%d failures" % len(FAILS)); sys.exit(1 if FAILS else 0)
asyncio.run(main())
