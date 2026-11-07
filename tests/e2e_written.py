import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
"""End-to-end check of written-answer practice and the exam review page."""
import asyncio, os, sys
from playwright.async_api import async_playwright
URL = os.environ.get("CODELAB_URL", "file://" + REPO + "/dist/COMP2611-Code-Lab.html")
FAILS = []
def check(c, m):
    print(("ok   " if c else "FAIL ") + m)
    if not c: FAILS.append(m)
ANSWER = "int countKey (Node * top, int key) {\n\tint count = 0;\n\tfor (Node * curr = top; curr != NULL; curr = curr->next)\n\t\tif (curr->data == key)\n\t\t\tcount++;\n\treturn count;\n}"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 900})
        await pg.add_init_script(path=REPO + "/dev/fakeclaude.js")
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL + "#written"); await pg.wait_for_timeout(700)
        n = await pg.locator(".wr-item").count()
        check(n >= 20, "%d written questions listed" % n)
        check("Original practice questions" in await pg.locator(".wr-note").inner_text(), "clearly labelled as original, not past papers")
        await pg.click('.filters [data-k="proof"]'); await pg.wait_for_timeout(100)
        np = await pg.locator(".wr-item").count()
        check(0 < np < n, "kind filter narrows the list (%d proofs)" % np)
        await pg.evaluate("location.hash = '#written-w-ll-count'"); await pg.wait_for_timeout(500)
        check(await pg.locator(".wr-page .ed").count() == 1, "code question uses the code editor")
        await pg.evaluate("(a) => { const t = document.querySelector('.wr-page .ed-ta'); t.value = a; t.dispatchEvent(new Event('input')); }", ANSWER)
        # tutor marking (the fake tutor awards 2 of the first 3 points)
        await pg.click("[data-ai]"); await pg.wait_for_timeout(800)
        score = await pg.locator(".wr-score").inner_text()
        check(score.startswith("2"), "strict marking by the tutor shows a score: " + score.split("\n")[0])
        check(await pg.locator(".wr-rub li").count() == 4, "every scheme point is listed with its marks")
        check(await pg.locator(".wr-ideal").count() == 1, "the ideal answer is shown after marking")
        await pg.click(".wr-test button"); await pg.wait_for_timeout(300)
        check("expected output" in await pg.locator(".wr-tout").inner_text(), "Test my code runs the answer and passes")
        st = await pg.evaluate("CL.store.wr['w-ll-count']")
        check(st and st["done"] == 1 and st["best"] == 2 and st["by"] == "ai", "result saved: %s" % {k: st.get(k) for k in ("best", "by")})
        # self marking on a text question
        await pg.evaluate("location.hash = '#written-w-bst-perf'"); await pg.wait_for_timeout(400)
        await pg.fill(".wr-ta", "A search follows one path from the root, so it costs the height. Balanced: log n. Chain: n. Sorted input makes a chain.")
        await pg.click("[data-self]"); await pg.wait_for_timeout(200)
        await pg.click('.wr-sp-b [data-i="0"][data-v="1"]'); await pg.click('.wr-sp-b [data-i="3"][data-v="1"]')
        await pg.click("[data-done]"); await pg.wait_for_timeout(300)
        check((await pg.locator(".wr-score").inner_text()).startswith("2"), "self-marking adds up the ticked points")
        check(await pg.evaluate("CL.store.act[CL.Progress.day()].w") >= 2, "written answers count as activity")
        # a draft survives leaving the page
        await pg.evaluate("location.hash = '#written-w-hash-compare'"); await pg.wait_for_timeout(300)
        await pg.fill(".wr-ta", "Linear probing clusters.")
        await pg.wait_for_timeout(1000)
        await pg.evaluate("location.hash = '#written'"); await pg.wait_for_timeout(200)
        await pg.evaluate("location.hash = '#written-w-hash-compare'"); await pg.wait_for_timeout(300)
        check(await pg.input_value(".wr-ta") == "Linear probing clusters.", "an unfinished answer is kept as a draft")
        await pg.evaluate("location.hash = '#exam-review'"); await pg.wait_for_timeout(300)
        txt = await pg.locator(".er-page").inner_text()
        check("not official" in txt and "minutes per mark" in txt, "exam review page: labelled as general technique, with a time plan")
        await pg.evaluate("location.hash = '#path-final'"); await pg.wait_for_timeout(300)
        check("written" in (await pg.locator(".path-page").inner_text()).lower(), "the final plan now includes written answers")
        await pg.evaluate("location.hash = '#written-nope'"); await pg.wait_for_timeout(300)
        check(await pg.locator(".hero").count() == 1, "an unknown question falls back to home")
        for e in errs: print("  error:", e)
        check(not errs, "no page errors")
        await b.close()
    print("\n%d failures" % len(FAILS)); sys.exit(1 if FAILS else 0)
asyncio.run(main())
