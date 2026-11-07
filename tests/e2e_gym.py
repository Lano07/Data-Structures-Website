"""Code Gym: random tests (new values each run, expected output from the model solution) and hidden edge-case tests."""
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
        await pg.goto(URL + "#ex-list-delete-key"); await pg.wait_for_timeout(700)
        summary = await pg.locator(".file-peek summary").first.inner_text()
        check("hidden" in summary and "random" in summary, "the tests panel mentions hidden and random tests: " + summary)
        check("missing key" not in await pg.locator(".file-peek pre").first.inner_text(), "the hidden test's code is not shown in advance")
        # a wrong solution that never handles a missing key
        bad = await pg.evaluate("(() => { const e = CODELAB_DATA.exercises.find(x => x.id === 'list-delete-key'); return e.solution.replace(/while \\(curr != NULL && curr->data != key\\)/, 'while (curr->data != key)'); })()")
        if "while (curr->data != key)" not in bad:
            bad = await pg.evaluate("CODELAB_DATA.exercises.find(x => x.id === 'list-delete-key').code")
        await pg.evaluate("(c) => { const t = document.querySelector('.ed-ta'); t.value = c; t.dispatchEvent(new Event('input')); }", bad)
        await pg.click('[data-a="run"]'); await pg.wait_for_timeout(1200)
        names = await pg.locator(".test .nm").all_inner_texts()
        check(any(n.startswith("Random:") for n in names), "random tests run after the fixed ones (%d tests)" % len(names))
        hid = pg.locator(".test.fail:has(.chip:text('hidden test'))")
        if await hid.count():
            check(await hid.first.locator(".test-b").is_hidden(), "a failing hidden test keeps its details hidden at first")
            await hid.first.locator("text=Show this test").click()
            check(await hid.first.locator(".test-b").is_visible(), "Show this test reveals it")
        else:
            check(await pg.locator(".test:has(.chip:text('hidden test'))").count() == 1, "the hidden test ran")
        # the model solution passes everything, including random tests, every time
        sol = await pg.evaluate("CODELAB_DATA.exercises.find(x => x.id === 'list-delete-key').solution")
        for k in range(3):
            await pg.evaluate("(c) => { const t = document.querySelector('.ed-ta'); t.value = c; t.dispatchEvent(new Event('input')); }", sol)
            await pg.click('[data-a="run"]'); await pg.wait_for_timeout(900)
            s = await pg.locator(".summary").inner_text()
            check(s.startswith("All"), "run %d of the model solution: %s" % (k + 1, s))
        # every exercise with random tests: the model solution passes its random tests 3 times
        res = await pg.evaluate("""(() => {
          const out = []; const norm = s => String(s || '').replace(/\\r/g, '').split('\\n').map(l => l.replace(/\\s+$/, '')).join('\\n').replace(/\\n+$/, '');
          CODELAB_DATA.exercises.filter(e => e.random).forEach(e => e.random.forEach(rt => { for (let k = 0; k < 3; k++) {
            const tt = { main: CL.expandRandom(rt.tpl) }; const r = CPP.run(CL.assemble(e, e.solution, tt), { maxSteps: 2000000 });
            if (!r.compiled || r.err) out.push(e.id + ': ' + (r.err && r.err.msg)); } }));
          return out;
        })()""")
        check(not res, "all random templates run cleanly with the model solutions: %s" % res[:3])
        for e in errs: print("  error:", e)
        check(not errs, "no page errors")
        await b.close()
    print("\n%d failures" % len(FAILS)); sys.exit(1 if FAILS else 0)
asyncio.run(main())
