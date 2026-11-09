import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
"""End-to-end check of the editor tools in the Playground: brackets, comments, moving lines, tidy, completion, matching."""
import asyncio, os, sys
from playwright.async_api import async_playwright
URL = os.environ.get("CODELAB_URL", "file://" + REPO + "/dist/COMP2611-Code-Lab.html")
FAILS = []
def check(c, m):
    print(("ok   " if c else "FAIL ") + m)
    if not c: FAILS.append(m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 900})
        await pg.add_init_script(path=REPO + "/dev/fakeclaude.js")
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL + "#play"); await pg.wait_for_timeout(1200)
        ta = pg.locator(".ide .ed-ta").first
        val = lambda: pg.evaluate("document.querySelector('.ide .ed-ta').value")
        async def setv(v, caret=None):
            await pg.evaluate("([v, c]) => { const t = document.querySelector('.ide .ed-ta'); t.value = v; t.dispatchEvent(new Event('input')); t.focus(); t.selectionStart = t.selectionEnd = (c === null ? v.length : c); }", [v, caret])
        await setv("")
        await pg.keyboard.type("int f(")
        check(await val() == "int f()", "( closes itself: " + repr(await val()))
        await pg.keyboard.type("x)")
        check(await val() == "int f(x)", "typing ) steps over the closing bracket: " + repr(await val()))
        await setv("cout << ")
        await pg.keyboard.type('"')
        check(await val() == 'cout << ""', "quote closes itself")
        await pg.keyboard.press("Backspace")
        check(await val() == "cout << ", "Backspace removes an empty pair")
        await setv("int a;\nint b;\n", 0)
        await pg.keyboard.press("Control+/")
        check((await val()).startswith("// int a;"), "Ctrl+/ comments the line: " + repr(await val()))
        await pg.keyboard.press("Control+/")
        check((await val()).startswith("int a;"), "Ctrl+/ again removes the comment")
        await pg.keyboard.press("Alt+ArrowDown")
        check(await val() == "int b;\nint a;\n", "Alt+Down moves the line down: " + repr(await val()))
        await setv("int main () {\nif (x)\ny = 1;\nfor (int i = 0; i < 3; i++) {\ncout << i;\n}\nreturn 0;\n}")
        await pg.keyboard.press("Shift+Alt+F")
        want = "int main () {\n\tif (x)\n\t\ty = 1;\n\tfor (int i = 0; i < 3; i++) {\n\t\tcout << i;\n\t}\n\treturn 0;\n}"
        check(await val() == want, "Shift+Alt+F tidies the indentation")
        await pg.keyboard.press("Control+z")
        check("\tif" not in await val(), "Ctrl+Z undoes the tidy")
        await setv("int counter = 0;\nint main () {\n\tcou")
        await pg.keyboard.type("n")
        vis = await pg.evaluate("(() => { const c = document.querySelector('.ed-complete'); return c && !c.hidden ? c.innerText : ''; })()")
        check("counter" in vis, "completion offers a name from the program: " + vis.split("\n")[0])
        await pg.keyboard.press("Tab")
        check((await val()).endswith("counter"), "Tab accepts the suggestion: " + repr((await val())[-12:]))
        await setv("int main () { return (1 + 2); }", 21)
        await pg.wait_for_timeout(100)
        await pg.keyboard.press("ArrowRight"); await pg.keyboard.press("ArrowLeft")
        n = await pg.locator(".ide .ed-hl .ed-bm").count()
        check(n == 2, "the bracket under the caret and its partner are highlighted (%d)" % n)
        check(await pg.locator(".ed-bar [data-tidy]").count() == 1, "Tidy button and shortcut list under the Playground editor")
        # phone: symbol bar
        mp = await b.new_page(viewport={"width": 390, "height": 800}, has_touch=True, is_mobile=True)
        await mp.add_init_script(path=REPO + "/dev/fakeclaude.js")
        await mp.goto(URL + "#play"); await mp.wait_for_timeout(1200)
        await mp.evaluate("(() => { const t = document.querySelector('.ide .ed-ta'); t.value = 'p'; t.dispatchEvent(new Event('input')); t.focus(); t.selectionStart = t.selectionEnd = 1; })()")
        await mp.wait_for_timeout(100)
        check(await mp.locator(".ide .ed-keys").is_visible(), "symbol bar shows on a touch screen")
        await mp.locator('.ide .ed-keys button[aria-label="->"]').tap()
        check(await mp.evaluate("document.querySelector('.ide .ed-ta').value") == "p->", "symbol bar inserts ->")
        for e in errs: print("  error:", e)
        check(not errs, "no page errors")
        await b.close()
    print("\n%d failures" % len(FAILS)); sys.exit(1 if FAILS else 0)
asyncio.run(main())
