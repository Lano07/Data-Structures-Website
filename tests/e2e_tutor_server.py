"""The tutor outside Claude: the page talks to the tutor proxy (server/tutor-proxy), which talks to a stand-in API."""
import asyncio, os, sys, subprocess, time
from playwright.async_api import async_playwright
ROOT = "/home/claude/codelab"
URL = os.environ.get("CODELAB_URL", "file://" + ROOT + "/dist/COMP2611-Code-Lab.html")
FAILS = []
def check(c, m):
    print(("ok   " if c else "FAIL ") + m)
    if not c: FAILS.append(m)
async def main():
    mock = subprocess.Popen(["node", ROOT + "/tests/servers/mock_api.mjs"])
    env = dict(os.environ, ANTHROPIC_API_KEY="test-key", ALLOWED_ORIGIN="null", API_URL="http://127.0.0.1:9901/v1/messages", PORT="8787")
    proxy = subprocess.Popen(["node", ROOT + "/server/tutor-proxy/server.mjs"], env=env)
    time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page()
            await pg.add_init_script("localStorage.setItem('comp2611-prefs-v1', JSON.stringify({ tutorUrl: 'http://localhost:8787/tutor', tutorMode: 'socratic' }))")
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(URL + "#home"); await pg.wait_for_timeout(600)
            check(await pg.evaluate("CL.Tutor.ready && CL.Tutor.via === 'server'"), "outside Claude, the tutor connects to the configured server")
            r = await pg.evaluate("CL.Tutor.run('Say hello').then(r => r.text)")
            check(r.startswith("Hello from the mock") and "test-key" in r, "streamed answer arrives through the proxy, which added the key: " + r)
            j = await pg.evaluate("CL.Tutor.json('MARK THIS').then(o => o)")
            check(j.get("ok") is True, "JSON answers are parsed: %s" % j)
            check("TEACHING MODE: SOCRATIC" in await pg.evaluate("CL.Tutor.rulesNow()"), "the chosen teaching style goes into the tutor's instructions")
            html = await pg.content()
            check("test-key" not in html and "x-api-key" not in html, "the API key never reaches the page")
            await pg.evaluate("location.hash = '#prefs'"); await pg.wait_for_timeout(300)
            check("Connected to your tutor server" in await pg.locator(".pf-sec").first.inner_text() or "Connected to your tutor server" in await pg.locator("#main").inner_text(), "Settings shows the server connection")
            await pg.click('[data-mode="exam"]'); await pg.wait_for_timeout(100)
            check(await pg.evaluate("CL.prefs.tutorMode") == "exam", "teaching style can be changed in Settings")
            for e in errs: print("  error:", e)
            check(not errs, "no page errors")
            await b.close()
    finally:
        proxy.kill(); mock.kill()
    print("\n%d failures" % len(FAILS)); sys.exit(1 if FAILS else 0)
asyncio.run(main())
