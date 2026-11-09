import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
"""Visit every page of the site (lessons, labs, exercises, written questions and every other route) at phone and
desktop widths, and report page errors, console errors and sideways overflow."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
URL = os.environ.get("CODELAB_URL", "file://" + REPO + "/dist/COMP2611-Code-Lab.html")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        problems = []
        for w in (390, 1280):
            pg = await b.new_page(viewport={"width": w, "height": 900})
            await pg.add_init_script(path=REPO + "/dev/fakeclaude.js")
            # an explorer already set up, so the Quest's first-visit dialog does not cover the pages
            await pg.add_init_script("try { localStorage.setItem('comp2611-codelab-v1', JSON.stringify({ quest: { name: 'Crawler', look: {} } })); } catch (e) {}")
            errs = []
            pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
            pg.on("console", lambda m: errs.append("CONSOLE " + m.text) if m.type == "error" and "Failed to load resource" not in m.text and "ERR_TUNNEL" not in m.text else None)
            await pg.goto(URL + "#home"); await pg.wait_for_timeout(600)
            D = await pg.evaluate("({ lessons: Object.keys(CODELAB_DATA.lessons), labs: CODELAB_DATA.labs.map(l => l.id), ex: CODELAB_DATA.exercises.map(e => e.id), wr: (CODELAB_DATA.written || []).map(q => q.id), q: CL.Quest.worlds().flatMap(w => w.levels.map(l => l.id)) })")
            routes = ["home", "learn", "lectures", "glossary", "lab", "train", "exam", "gym", "play", "ref", "cpp", "prefs", "progress", "cards", "diag", "paths", "written", "exam-review", "quest", "journal",
                      "path-final", "path-cw2", "path-beginner", "path-advanced"] + ["l-" + x for x in D["lessons"]] + ["lab-" + x for x in D["labs"]] + ["ex-" + x for x in D["ex"]] + ["written-" + x for x in D["wr"]] + ["quest-" + x for x in D["q"]]
            for r in routes:
                errs.clear()
                await pg.evaluate("location.hash = %s" % json.dumps("#" + r))
                await pg.wait_for_timeout(120 if r.startswith(("ex-", "written-")) else 700 if r == "play" else 250)
                sw = await pg.evaluate("document.documentElement.scrollWidth")
                if sw > w + 1: problems.append("%dpx %s: page is %dpx wide" % (w, r, sw))
                for e in errs: problems.append("%dpx %s: %s" % (w, r, e[:200]))
            print("%dpx: %d routes visited" % (w, len(routes)))
            await pg.close()
        await b.close()
        for x in problems[:60]: print("  " + x)
        print("%d problems" % len(problems))
        sys.exit(1 if problems else 0)
asyncio.run(main())
