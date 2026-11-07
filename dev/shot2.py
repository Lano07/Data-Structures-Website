import sys, asyncio, json
from playwright.async_api import async_playwright
# usage: shot2.py hash out.png width theme(light|dark) actions-json [viewport] [nofake]
async def main():
    h = sys.argv[1]; out = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
    dark = len(sys.argv) > 4 and sys.argv[4] == "dark"
    actions = json.loads(sys.argv[5]) if len(sys.argv) > 5 else []
    full = not (len(sys.argv) > 6 and sys.argv[6] == "viewport")
    fake = not (len(sys.argv) > 7 and sys.argv[7] == "nofake")
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": w, "height": 900}, color_scheme="dark" if dark else "light")
        if fake:
            await pg.add_init_script(path="/home/claude/codelab/dev/fakeclaude.js")
        errs = []
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type in ("error", "warning") and "Failed to load resource" not in m.text else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
        await pg.goto("file:///home/claude/codelab/dist/COMP2611-Code-Lab.html" + h)
        await pg.wait_for_timeout(800)
        for a in actions:
            if a[0] == "click": await pg.click(a[1])
            elif a[0] == "fill": await pg.fill(a[1], a[2])
            elif a[0] == "wait": await pg.wait_for_timeout(a[1])
            elif a[0] == "eval": print("EVAL:", await pg.evaluate(a[1]))
            elif a[0] == "scroll": await pg.evaluate("window.scrollTo(0, %d)" % a[1])
            elif a[0] == "press": await pg.keyboard.press(a[1])
            elif a[0] == "type": await pg.keyboard.type(a[1])
            elif a[0] == "hash": await pg.evaluate("location.hash = %s" % json.dumps(a[1])); await pg.wait_for_timeout(400)
            elif a[0] == "shot": await pg.screenshot(path=a[1], full_page=False)
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=out, full_page=full)
        sw = await pg.evaluate("document.documentElement.scrollWidth")
        print("scrollWidth", sw, "viewport", w)
        for e in errs[:20]: print(e)
        await b.close()
asyncio.run(main())
