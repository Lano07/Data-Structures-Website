import sys, asyncio, json
from playwright.async_api import async_playwright
# usage: shot.py hash out.png [width] [dark] [actions-json]
import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
async def main():
    h = sys.argv[1]; out = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
    dark = len(sys.argv) > 4 and sys.argv[4] == "dark"
    actions = json.loads(sys.argv[5]) if len(sys.argv) > 5 else []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": w, "height": 900}, color_scheme="dark" if dark else "light")
        errs = []
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
        await pg.goto("file://" + REPO + "/dist/COMP2611-Code-Lab.html" + h)
        await pg.wait_for_timeout(700)
        for a in actions:
            if a[0] == "click": await pg.click(a[1])
            elif a[0] == "fill": await pg.fill(a[1], a[2])
            elif a[0] == "wait": await pg.wait_for_timeout(a[1])
            elif a[0] == "eval": print("EVAL:", await pg.evaluate(a[1]))
            elif a[0] == "scroll": await pg.evaluate("window.scrollTo(0, %d)" % a[1])
            elif a[0] == "press": await pg.keyboard.press(a[1])
        await pg.wait_for_timeout(400)
        full = not (len(sys.argv) > 6 and sys.argv[6] == "viewport")
        await pg.screenshot(path=out, full_page=full)
        sw = await pg.evaluate("document.documentElement.scrollWidth")
        print("scrollWidth", sw, "viewport", w)
        for e in errs[:20]: print(e)
        await b.close()
asyncio.run(main())
