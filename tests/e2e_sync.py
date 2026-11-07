import asyncio, json
from playwright.async_api import async_playwright
import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
URL = "file://" + REPO + "/dist/COMP2611-Code-Lab.html"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1200, "height": 900})
        await ctx.add_init_script(path=REPO + "/dev/fakeclaude.js")
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL + "#home"); await pg.wait_for_timeout(1500)
        print("state", await pg.evaluate("CL.Progress.state"))
        # make progress on "device 1"
        await pg.evaluate("CL.store.done['a1-first-program'] = true; CL.store.train.bst = {n: 5, r: 4, h: '11101'}; CL.save();")
        await pg.wait_for_timeout(3200)
        acct = await pg.evaluate("Object.keys(window.__fakedb)")
        print("account docs", acct)
        # "device 2": clear local storage except the fake account db, reload
        await pg.evaluate("const db = localStorage.getItem('__fakedb'); localStorage.clear(); localStorage.setItem('__fakedb', db);")
        await pg.evaluate("localStorage.setItem('comp2611-codelab-v1', JSON.stringify({done: {'b1-addresses': true}, train: {bst: {n: 2, r: 1, h: '10'}}}))")
        await pg.reload(); await pg.wait_for_timeout(1500)
        st = await pg.evaluate("({done: Object.keys(CL.store.done), bst: CL.store.train.bst, state: CL.Progress.state, backups: CL.Progress.backups().length})")
        print("after merge", st)
        # export / import
        await pg.evaluate("location.hash = '#prefs'"); await pg.wait_for_timeout(300)
        await pg.click('[data-a="export"]'); await pg.wait_for_timeout(200)
        n = await pg.evaluate("window.__saves.length + ' ' + (window.__saves[0] && window.__saves[0].filename)")
        print("download", n)
        txt = await pg.evaluate("CL.Progress.exportText()")
        await pg.evaluate("CL.Progress.reset()")
        print("after reset done:", await pg.evaluate("Object.keys(CL.store.done || {}).length"))
        r = await pg.evaluate("(t) => CL.Progress.importText(t, 'merge')", txt)
        print("import", r, await pg.evaluate("Object.keys(CL.store.done).length"))
        r2 = await pg.evaluate("CL.Progress.importText('{\"app\":\"other\"}', 'merge')")
        print("bad import", r2)
        await pg.click('[data-pref="theme"][data-v="dark"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-pref="size"][data-v="125"]'); await pg.wait_for_timeout(200)
        print("theme", await pg.evaluate("document.documentElement.getAttribute('data-theme') + ' ' + document.documentElement.style.fontSize + ' lh ' + CL.edLineH"))
        await pg.screenshot(path="/tmp/claude-0/-home-claude/20c2e75a-fdf0-582e-b20a-7222af21b9c7/scratchpad/prefs.png", full_page=True)
        # editor alignment at the larger size
        await pg.evaluate("location.hash = '#play'"); await pg.wait_for_timeout(400)
        al = await pg.evaluate("(() => { const ta = document.querySelector('.ed-ta'), hl = document.querySelector('.ed-hl'); return [getComputedStyle(ta).lineHeight, getComputedStyle(hl).lineHeight, ta.offsetHeight, hl.offsetHeight]; })()")
        print("editor", al)
        await pg.evaluate("CL.setPref('size', 100); CL.setPref('theme', 'system')")
        print("errors", errs[:5])
        await b.close()
asyncio.run(main())
