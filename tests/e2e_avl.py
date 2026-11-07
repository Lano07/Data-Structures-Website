"""End-to-end check of the AVL lab and the supplementary lessons."""
import asyncio, os, sys
from playwright.async_api import async_playwright
URL = os.environ.get("CODELAB_URL", "file:///home/claude/codelab/dist/COMP2611-Code-Lab.html")
FAILS = []
def check(c, m):
    print(("ok   " if c else "FAIL ") + m)
    if not c: FAILS.append(m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 900})
        await pg.add_init_script(path="/home/claude/codelab/dev/fakeclaude.js")
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL + "#lab-avl"); await pg.wait_for_timeout(700)
        n = await pg.evaluate("CL.lastPlayer.frames.length")
        check(n > 20, "lesson example builds %d frames" % n)
        last = await pg.evaluate("(() => { const P = CL.lastPlayer; const f = P.frames[P.frames.length - 1]; const pre = []; (function w(t) { if (!t) return; pre.push(t.key); w(t.left); w(t.right); })(f.tree); return pre.join(' '); })()")
        check(last == "30 20 10 25 40 50", "10 20 30 40 50 25 ends as 30 20 10 25 40 50 (got %s)" % last)
        texts = await pg.evaluate("CL.lastPlayer.frames.map(f => f.text).join(' ')")
        check("Right-Right" in texts and "Right-Left" in texts, "the right rotation cases are explained")
        # every frame's tree is a BST, and the final one is balanced
        ok = await pg.evaluate("""(() => {
          const P = CL.lastPlayer; let good = true;
          const h = (t) => t ? 1 + Math.max(h(t.left), h(t.right)) : -1;
          P.frames.forEach(f => { const ino = []; (function w(t) { if (!t) return; w(t.left); ino.push(t.key); w(t.right); })(f.tree); for (let i = 1; i < ino.length; i++) if (ino[i] <= ino[i - 1]) good = false; });
          const t = P.frames[P.frames.length - 1].tree; let bal = true;
          (function w(x) { if (!x) return; if (Math.abs(h(x.left) - h(x.right)) > 1) bal = false; if (x.h !== h(x)) bal = false; w(x.left); w(x.right); })(t);
          return good && bal;
        })()""")
        check(ok, "every frame is a valid BST, and the final tree is balanced with correct stored heights")
        # sorted keys 1..7 give a perfect tree
        await pg.select_option("#avl-preset", "1"); await pg.wait_for_timeout(300)
        pre = await pg.evaluate("(() => { const P = CL.lastPlayer; const f = P.frames[P.frames.length - 1]; const pre = []; (function w(t) { if (!t) return; pre.push(t.key); w(t.left); w(t.right); })(f.tree); return pre.join(' '); })()")
        check(pre == "4 2 1 3 6 5 7", "sorted keys 1..7 give the perfect tree 4 2 1 3 6 5 7 (got %s)" % pre)
        # random fuzz: 30 random inserts stay balanced
        bal = await pg.evaluate("""(() => {
          const h = (t) => t ? 1 + Math.max(h(t.left), h(t.right)) : -1;
          let ok = true;
          for (let trial = 0; trial < 20; trial++) {
            const keys = []; while (keys.length < 25) { const k = 1 + Math.floor(Math.random() * 200); if (!keys.includes(k)) keys.push(k); }
            document.querySelector('#avl-keys').value = keys.join(' ');
            document.querySelector('#avl-steps').click();
            const P = CL.lastPlayer, t = P.frames[P.frames.length - 1].tree, ino = [];
            (function w(x) { if (!x) return; if (Math.abs(h(x.left) - h(x.right)) > 1) ok = false; w(x.left); ino.push(x.key); w(x.right); })(t);
            const s = keys.slice().sort((a, b) => a - b);
            if (ino.join() !== s.join()) ok = false;
            if (h(t) > 1.45 * Math.log2(26)) ok = false;
          }
          return ok;
        })()""")
        check(bal, "20 random builds of 25 keys: all balanced, sorted inorder, height within the AVL bound")
        # Your turn: the case question
        await pg.evaluate("CL.lastPlayer.setMode('you')")
        await pg.select_option("#avl-preset", "2"); await pg.wait_for_timeout(300)
        asks = await pg.evaluate("CL.lastPlayer.frames.filter(f => f.ask).map(f => f.ask.options[f.ask.answer])")
        check(any("Left-Right" in a for a in asks), "Your turn asks for the rotation case (Left-Right for 30 10 20)")
        await pg.evaluate("CL.lastPlayer.setMode('watch')")
        # lessons
        await pg.evaluate("location.hash = '#l-m4-avl-trees'"); await pg.wait_for_timeout(500)
        check(await pg.locator(".supp-note").count() == 1, "AVL lesson is labelled supplementary")
        check(await pg.locator(".md .quiz").count() >= 2, "AVL lesson has quick checks")
        await pg.evaluate("location.hash = '#learn'"); await pg.wait_for_timeout(300)
        check("Beyond the notes" in await pg.locator("#main").inner_text(), "the supplementary part is listed in Learn")
        for e in errs: print("  error:", e)
        check(not errs, "no page errors")
        await b.close()
    print("\n%d failures" % len(FAILS)); sys.exit(1 if FAILS else 0)
asyncio.run(main())
