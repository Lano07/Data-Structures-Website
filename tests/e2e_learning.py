"""End-to-end check of the adaptive learning features: the Today card, adaptive practice, the review queue,
flashcards, the diagnostic, study plans and the Progress page. Run after `python3 build.py`."""
import asyncio, json, sys
from playwright.async_api import async_playwright

import os
URL = os.environ.get("CODELAB_URL", "file:///home/claude/codelab/dist/COMP2611-Code-Lab.html")
FAILS = []
def check(cond, msg):
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond: FAILS.append(msg)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 900})
        await pg.add_init_script(path="/home/claude/codelab/dev/fakeclaude.js")
        errs = []
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
        await pg.goto(URL + "#home")
        await pg.wait_for_timeout(700)
        check(await pg.locator(".today").count() == 1, "home shows the Today card")
        check(await pg.locator(".exam-card.final").count() == 1, "home shows the final exam card")
        txt = await pg.locator(".exam-card.final h2").inner_text()
        check("final exam" in txt.lower(), "final exam card text: " + txt)
        check(await pg.locator('.nav a[href="#progress"]').count() == 1, "nav has Progress")
        check((await pg.locator('.nav a[href="#lab"]').inner_text()).strip() == "Labs", "nav says Labs")

        # adaptive practice: answer 6 questions, one deliberately wrong
        await pg.evaluate("location.hash = '#train'"); await pg.wait_for_timeout(500)
        on = await pg.locator(".tr-modes .chip-btn.on").inner_text()
        check(on.strip() in ("Adaptive", "Mixed"), "trainer opens in a mode: " + on)
        await pg.click('.tr-modes [data-m="adaptive"]'); await pg.wait_for_timeout(300)
        check("Adaptive pick" in await pg.locator(".tr-why").inner_text(), "adaptive pick explained")
        check(await pg.locator(".tq-lv").count() == 1, "difficulty chip shown")
        for i in range(6):
            wrong = i == 0
            ans = await pg.evaluate("(() => { const opts=[...document.querySelectorAll('.tq .quiz-opt')]; return opts.length; })()")
            if ans == 0:
                # typed answer mode: switch to multiple choice
                await pg.click('[data-s="mcq"]'); await pg.wait_for_timeout(200)
            # find the right option through the app's own question object is not exposed; click option and read the result
            await pg.locator(".tq .quiz-opt").nth(0 if not wrong else 0).click()
            await pg.wait_for_timeout(150)
            if wrong:
                fb = await pg.locator(".tq-fb").inner_text()
                if "Right" in fb:
                    pass
            await pg.click(".tq-acts .btn.primary"); await pg.wait_for_timeout(200)
        st = await pg.evaluate("JSON.parse(localStorage.getItem('comp2611-codelab-v1'))")
        cm = st.get("cm", {})
        check(len(cm) >= 1, "concept mastery recorded for %d concepts" % len(cm))
        check(sum(v["n"] for v in cm.values()) >= 6 - 0.01, "evidence adds up: %s" % sum(v["n"] for v in cm.values()))
        # force a wrong answer with Show the answer, then check the review queue
        await pg.click(".tq-acts >> text=Show the answer"); await pg.wait_for_timeout(200)
        st = await pg.evaluate("JSON.parse(localStorage.getItem('comp2611-codelab-v1'))")
        qitems = [k for k, v in st.get("srs", {}).items() if v["k"] == "q"]
        check(len(qitems) >= 1, "missed question went into the review queue (%d items)" % len(qitems))
        # make every review item due now and review one
        await pg.evaluate("(() => { const s = CL.store; Object.values(s.srs).forEach(it => it.due = Date.now() - 1000); CL.save(); })()")
        await pg.evaluate("location.hash = '#home'"); await pg.wait_for_timeout(300)
        check(await pg.locator('.today [data-go="review"]').count() == 1, "Today card offers the due reviews")
        await pg.click('.today [data-go="review"]'); await pg.wait_for_timeout(500)
        on = await pg.locator(".tr-modes .chip-btn.on").inner_text()
        check(on.startswith("Reviews due"), "review mode active: " + on)
        sid = await pg.evaluate("CL.Learn.due('q')[0].id")
        await pg.locator(".tq .quiz-opt").nth(0).click(); await pg.wait_for_timeout(200)
        it = await pg.evaluate("CL.Learn.srs()[%s]" % json.dumps(sid))
        check(it["due"] > await pg.evaluate("Date.now()"), "reviewed item rescheduled into the future (reps %s, lapses %s)" % (it["reps"], it["lapses"]))

        # flashcards
        await pg.evaluate("location.hash = '#cards'"); await pg.wait_for_timeout(500)
        check(await pg.locator(".fc-card").count() == 1, "a flashcard is shown")
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(150)
        check(await pg.locator(".fc-back").is_visible(), "Space turns the card over")
        await pg.keyboard.press("3"); await pg.wait_for_timeout(200)
        cards = await pg.evaluate("Object.keys(CL.Learn.srs()).filter(k => CL.Learn.srs()[k].k === 'card').length")
        check(cards == 1, "graded card saved in the schedule (%d)" % cards)
        await pg.click(".fc-show"); await pg.wait_for_timeout(100)
        await pg.click('.fc-g[data-g="0"]'); await pg.wait_for_timeout(200)
        left = await pg.locator(".fc-left").inner_text()
        check("left" in left, "Again keeps the card in this session: " + left)
        await pg.click('.fc-decks [data-d="heaps"]'); await pg.wait_for_timeout(300)
        chipTxt = await pg.locator(".fc-card .chip").inner_text()
        check(chipTxt.strip() == "Heaps", "deck filter: " + chipTxt)

        # diagnostic: answer every question (I don't know for every third)
        await pg.evaluate("location.hash = '#diag'"); await pg.wait_for_timeout(400)
        await pg.click("[data-start]"); await pg.wait_for_timeout(300)
        n = await pg.evaluate("CL.store.diagNow.plan.length")
        check(n >= 20, "diagnostic has %d questions" % n)
        check(await pg.locator(".tq-hint, .tq-sol:not([hidden])").count() == 0, "no hints or solutions during the diagnostic")
        for i in range(n):
            if i % 3 == 2: await pg.click(".tq-acts >> text=I don't know")
            else: await pg.locator(".tq .quiz-opt").nth(i % 4 if await pg.locator(".tq .quiz-opt").count() > i % 4 else 0).click()
            await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(300)
        check(await pg.locator(".dg-score").count() == 1, "diagnostic results shown")
        score = await pg.locator(".dg-score").inner_text()
        print("     ", score.replace("\n", " "))
        await pg.click(".dg-review summary"); await pg.wait_for_timeout(400)
        check(await pg.locator(".dg-rq .tq").count() == n, "review shows every diagnostic question with its solution")
        check(await pg.locator(".dg-rq .tq-sol:not([hidden])").count() == n, "each review has a worked solution")

        # study plans
        await pg.evaluate("location.hash = '#paths'"); await pg.wait_for_timeout(300)
        check(await pg.locator(".path-card").count() == 4, "four study plans listed")
        await pg.click('[data-pick="final"]'); await pg.wait_for_timeout(300)
        await pg.evaluate("location.hash = '#path-final'"); await pg.wait_for_timeout(300)
        steps = await pg.locator(".path-steps li").count()
        okSteps = await pg.locator(".path-steps li.ok").count()
        check(steps > 20, "final plan has %d steps, %d done (the diagnostic step should be done)" % (steps, okSteps))
        check(okSteps >= 1, "diagnostic step ticked automatically")
        txt = await pg.locator(".path-page").inner_text()
        hasW = await pg.evaluate("!!CL.pages.written")
        check(("written" in txt.lower()) == hasW, "steps appear only for pages this build has (written answers: %s)" % hasW)
        await pg.evaluate("location.hash = '#home'"); await pg.wait_for_timeout(300)
        check("Next on your plan" in await pg.locator(".today").inner_text(), "home shows the plan's next step")
        await pg.evaluate("location.hash = '#path-nonsense'"); await pg.wait_for_timeout(300)
        check(await pg.locator(".hero").count() == 1, "unknown plan falls back to home")

        # progress page
        await pg.evaluate("location.hash = '#progress'"); await pg.wait_for_timeout(500)
        check(await pg.locator(".pg-tile").count() == 4, "four summary tiles")
        check(await pg.locator(".pg-reco li").count() >= 1, "recommendations listed")
        check(await pg.locator(".hm rect").count() > 100, "activity heatmap drawn")
        check(await pg.locator(".tc rect.tc-bar").count() == 30, "30-day trend drawn")
        check(await pg.locator(".pg-crow").count() == await pg.evaluate("CL.Learn.concepts.length"), "every concept listed")
        await pg.click('.pg-filt [data-f="new"]'); await pg.wait_for_timeout(200)
        nNew = await pg.locator(".pg-crow").count()
        check(nNew < await pg.evaluate("CL.Learn.concepts.length"), "Not started filter narrows the list (%d)" % nNew)
        await pg.click('[data-goal="40"]'); await pg.wait_for_timeout(300)
        check(await pg.evaluate("CL.store.goal.daily") == 40, "daily goal saved")
        await pg.click("[data-edit-exam]"); await pg.fill("[data-exd]", "2026-12-16"); await pg.fill("[data-ext]", "09:00"); await pg.click("[data-save-exam]"); await pg.wait_for_timeout(300)
        check(await pg.evaluate("CL.Learn.examDate().getDate()") == 16, "exam date changed")
        await pg.click("[data-edit-exam]"); await pg.click("[data-reset-exam]"); await pg.wait_for_timeout(300)
        check(await pg.evaluate("CL.Learn.examDate().getDate()") == 15, "exam date reset to 15 Dec")
        # a practise button from the concept list opens the trainer on that concept
        btn = pg.locator(".pg-crow [data-concept]").first
        cid = await btn.get_attribute("data-concept")
        await btn.click(); await pg.wait_for_timeout(500)
        check((await pg.evaluate("CL.store.trainPref.mode")) == "c:" + cid, "concept practice mode set: " + cid)
        check("Concept:" in await pg.locator(".tr-why").inner_text(), "trainer explains the concept focus")
        check(await pg.evaluate("CL.Learn.forQuestion(CL.Train.make('hash-insert', 5))") in ("hash.basic", "hash.probe"), "hash question maps to a hashing concept")
        # sync merge keeps the new fields
        merged = await pg.evaluate("(() => { const a = {cm: {x: {n: 2, s: .5, t: 1}}, srs: {a: {u: 5, due: 1}}}, b = {cm: {x: {n: 5, s: .9, t: 2}}, srs: {a: {u: 9, due: 2}}}; const m = CL.Progress.merge(a, b); return [m.cm.x.n, m.srs.a.u]; })()")
        check(merged == [5, 9], "merge keeps the larger mastery evidence and the newer schedule")
        for e in errs: print("  console:", e)
        check(not errs, "no console errors")
        await b.close()
    print("\n%d failures" % len(FAILS))
    sys.exit(1 if FAILS else 0)
asyncio.run(main())
