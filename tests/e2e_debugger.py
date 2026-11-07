import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
"""End-to-end check of the debugger: step over/into/out, breakpoints, continue, inspector, history, leaks, dangling pointers."""
import asyncio, os, sys, json
from playwright.async_api import async_playwright
URL = os.environ.get("CODELAB_URL", "file://" + REPO + "/dist/COMP2611-Code-Lab.html")
FAILS = []
def check(c, m):
    print(("ok   " if c else "FAIL ") + m)
    if not c: FAILS.append(m)
PROG = r'''#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * make (int v) {
	Node * n = new Node;
	n->data = v;
	n->next = NULL;
	return n;
}

int sum (Node * top) {
	int s = 0;
	for (Node * c = top; c != NULL; c = c->next)
		s = s + c->data;
	return s;
}

int main () {
	Node * a = make (1);
	a->next = make (2);
	int total = sum (a);
	cout << total << endl;
	Node * lost = make (3);
	lost = NULL;
	delete a->next;
	Node * d = a->next;
	cout << "end" << endl;
	return 0;
}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 1000})
        await pg.add_init_script(path=REPO + "/dev/fakeclaude.js")
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(URL + "#play"); await pg.wait_for_timeout(500)
        await pg.evaluate("(code) => { const host = document.createElement('div'); host.id = 'vt'; document.querySelector('#main').prepend(host); window.__v = new CL.Visualizer(host); window.__v.load(code); }", PROG)
        await pg.wait_for_timeout(200)
        line = lambda: pg.evaluate("__v.snaps[__v.i].line")
        dep = lambda: pg.evaluate("__v.snaps[__v.i].frames.length")
        check(await pg.locator("#vt .viz-dbg button").count() == 6, "debug buttons shown")
        # go to line 24 (first statement of main)
        await pg.evaluate("(() => { for (let j = 0; j < __v.n; j++) if (__v.snaps[j].line === 24 && __v.snaps[j].kind === 'step') { __v.go(j); break; } })()")
        check(await line() == 24, "at line 24")
        await pg.click('#vt [data-d="over"]')
        check(await line() == 25 and await dep() == 1, "Step over runs make(1) and stops at line 25 (line %s)" % await line())
        await pg.click('#vt [data-d="into"]'); await pg.click('#vt [data-d="into"]')
        d2 = await dep()
        check(d2 == 2, "Step into enters make (depth %d, line %s)" % (d2, await line()))
        await pg.click('#vt [data-d="out"]')
        k = await pg.evaluate("__v.snaps[__v.i].kind")
        check(k == "return" and await dep() == 2, "Step out stops at make's return (%s)" % k)
        await pg.click('#vt [data-d="out"]')
        check(await dep() == 1, "Step out again is back in main (line %s)" % await line())
        # breakpoint on line 19 (inside the loop in sum) by clicking its line number
        await pg.evaluate("(() => { const ln = __v.lineEls[18]; const r = ln.getBoundingClientRect(); ln.dispatchEvent(new MouseEvent('click', {bubbles: true, clientX: r.left + 10, clientY: r.top + 5})); })()")
        check(await pg.evaluate("!!__v.bps[19]"), "clicking line number 19 sets a breakpoint")
        check(await pg.locator("#vt .ln.bp").count() == 1, "breakpoint drawn")
        await pg.click('#vt [data-d="cont"]')
        check(await line() == 19, "Continue stops at the breakpoint (line %s)" % await line())
        await pg.click('#vt [data-d="cont"]')
        check(await line() == 19, "Continue again stops at the next loop pass")
        txt = await pg.locator("#vt .viz-dinfo").inner_text()
        check("sum" in txt and "main" in txt, "call stack shows sum ← main")
        check("since step" in txt.lower(), "changes since the last stop are listed")
        # inspector on variable s and its history
        await pg.locator('#vt .mv-frame.active .mv-var:has(.mv-name:text-is("s"))').click()
        it = await pg.locator("#vt .viz-insp").inner_text()
        check("History" in it and "step" in it, "inspector shows s with its history")
        await pg.evaluate("__v.toggleBp(19)")
        # run to the end: the leak and the dangling pointer
        await pg.click('#vt [data-d="cont"]')
        await pg.evaluate("(() => { for (let j = 0; j < __v.n; j++) if (__v.snaps[j].line === 32 && __v.snaps[j].kind === 'step') { __v.go(j); break; } })()")
        leaks = await pg.locator("#vt .mv-obj.leak").count()
        check(leaks == 1, "the node lost on line 29 is marked as leaked (%d)" % leaks)
        await pg.locator("#vt .mv-obj.leak").first.click()
        it = await pg.locator("#vt .viz-insp").inner_text()
        check("Leaked" in it and "line 10" in it, "object inspector explains the leak and where it was made")
        await pg.evaluate("(() => { for (let j = 0; j < __v.n; j++) if (__v.snaps[j].line === 33 && __v.snaps[j].kind === 'step') { __v.go(j); break; } })()")
        await pg.locator('#vt .mv-var:has(.mv-name:text-is("d"))').first.click()
        it = await pg.locator("#vt .viz-insp").inner_text()
        check("Dangling" in it, "inspector explains the dangling pointer d")
        check(await pg.locator(".hero-demo .viz-dbg").count() == 0, "no debugger clutter in the home page demo")
        for e in errs: print("  error:", e)
        check(not errs, "no page errors")
        await b.close()
    print("\n%d failures" % len(FAILS)); sys.exit(1 if FAILS else 0)
asyncio.run(main())
