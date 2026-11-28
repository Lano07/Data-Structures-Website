// Written mock papers: Coursework Exam #2's page, a mock paper sat, typed, marked and saved, the marking schemes,
// printing, the plan; the final exam revision page, a whole-course paper, every paper's schemes and diagrams, and the final
// plan's paper steps; merging backups keeps every paper's best result. Run after `python3 build.py`:  node tests/e2e_cw2.js
const path = require("path");
const { chromium } = require("playwright");
const REPO = path.dirname(__dirname);
const URL = process.env.CODELAB_URL || "file://" + REPO + "/dist/COMP2611-Code-Lab.html";
let fails = 0;
const check = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const wait = (pg, ms) => pg.waitForTimeout(ms);
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  pg.on("pageerror", (e) => errs.push(String(e)));
  // the papers follow the outline: 4 questions, 40 marks, 9 / 11 / 10 / 7 + 3 by area
  await pg.goto(URL + "#cw2"); await wait(pg, 900);
  const D = await pg.evaluate(() => {
    const c = CODELAB_DATA.cw2;
    return c.papers.map((p) => { const by = {}; p.questions.forEach((q) => q.parts.forEach((x) => { by[x.area] = (by[x.area] || 0) + x.marks; })); return { id: p.id, marks: p.marks, qs: p.questions.length, by }; });
  });
  check(D.length >= 3 && D.every((p) => p.marks === 40 && p.qs === 4 && p.by.lsq === 9 && p.by.trees === 11 && p.by.heaps === 10 && p.by.hashgraph === 7 && p.by.perf === 3), "every mock paper has 4 questions and the outline's marks per area");
  check((await pg.locator(".cw-area").count()) === 5, "the exam's page lists the five areas with their marks");
  // sit paper A: the clock, typed answers, leaving and coming back
  await pg.goto(URL + "#cw2-A"); await wait(pg, 600);
  await pg.click("[data-start]"); await wait(pg, 600);
  check(/^\d+:\d\d$/.test((await pg.locator(".cw-clock").innerText()).trim()), "the 90-minute clock runs");
  await pg.locator('.cw-part[data-id="cw2-a1b"] textarea').click(); await pg.keyboard.type("2 9 6");
  await pg.locator('.cw-part[data-id="cw2-a1a"] .ed-scroll').click();
  await pg.keyboard.insertText("Node * insertAtTail (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tif (top == NULL)\n\t\treturn newNode;\n\tNode * curr = top;\n\twhile (curr->next != NULL)\n\t\tcurr = curr->next;\n\tcurr->next = newNode;\n\treturn top;\n}\n");
  await wait(pg, 900);
  await pg.goto(URL + "#cw2"); await wait(pg, 300); await pg.goto(URL + "#cw2-A"); await wait(pg, 700);
  check((await pg.locator('.cw-part[data-id="cw2-a1b"] textarea').inputValue()) === "2 9 6", "leaving the page keeps the answers and the clock");
  // finish and mark
  await pg.click(".cw-bar [data-finish]"); await wait(pg, 200);
  await pg.click(".cw-bar [data-finish]"); await wait(pg, 700);
  check((await pg.locator(".cw-mark").count()) === (await pg.locator(".cw-part").count()), "marking shows a scheme for every part");
  for (const id of ["cw2-a1a", "cw2-a1b"]) {
    const rows = pg.locator('.cw-part[data-id="' + id + '"] .wr-sp');
    for (let i = 0; i < await rows.count(); i++) { const btns = rows.nth(i).locator("button"); await btns.nth((await btns.count()) - 1).click(); }
  }
  check((await pg.locator(".cw-totalbar .cw-total b").innerText()) === "7", "the total adds the points awarded");
  await pg.locator('.cw-part[data-id="cw2-a1a"] [data-test]').click(); await wait(pg, 400);
  check(/expected output/.test(await pg.locator('.cw-part[data-id="cw2-a1a"] .wr-tout').innerText()), "Test my code runs the typed answer against the model's output");
  await pg.locator(".cw-totalbar [data-save]").click(); await wait(pg, 700);
  const res = await pg.locator(".cw-score").innerText();
  check(/Your mark: 7\s*\/ 40/.test(res) && /Linked lists, stacks and queues\s*7 \/ 9/.test(res), "the score shows the total and each area");
  await pg.goto(URL + "#cw2"); await wait(pg, 600);
  check(/Best: 7\/40/.test(await pg.locator(".cw-papers").innerText()), "the exam's page shows the best score");
  // the schemes without sitting, and printing
  await pg.goto(URL + "#cw2-B"); await wait(pg, 500); await pg.click("[data-review]"); await wait(pg, 600);
  check((await pg.locator(".cw-ideal").count()) === (await pg.locator(".cw-part").count()), "every part's ideal answer can be read");
  await pg.goto(URL + "#cw2-C"); await wait(pg, 400); await pg.click("[data-print]"); await wait(pg, 500);
  check((await pg.locator(".cw-printable .cw-q").count()) === 4, "Print the questions lays out all four questions");
  // the plan and the home card
  await pg.goto(URL + "#path-cw2"); await wait(pg, 700);
  check((await pg.locator(".path-grp").count()) === 8 && (await pg.locator('.path-grp a[href="#cw2-A"]').count()) === 1, "the eight-day plan links to the mock papers");
  check((await pg.locator('.path-grp a[href^="#written-"]').count()) >= 10, "the plan's written-answer steps link to their questions");
  // merging a backup keeps each paper's best result from either device
  const mg = await pg.evaluate(() => {
    const here = { cw2: { att: { A: { best: 20, last: 20, n: 1, t: 100 } }, drafts: { "cw2-a1a": "mine" }, run: {}, marks: {} } };
    const backup = { cw2: { att: { A: { best: 30, last: 18, n: 3, t: 200 }, F1: { best: 25, last: 25, n: 1, t: 300 } }, drafts: { "cw2-a1a": "theirs", "fin-1-1a": "theirs" }, run: {}, marks: {} } };
    const M = CL.Progress.merge(here, backup).cw2;
    return [M.att.A.best, M.att.A.n, M.att.A.last, M.att.F1.best, M.drafts["cw2-a1a"], M.drafts["fin-1-1a"]].join(",");
  });
  check(mg === "30,3,18,25,mine,theirs", "merging a backup keeps the best result of every paper (" + mg + ")");
  // the final exam revision page and a whole-course paper
  const F = await pg.evaluate(() => CODELAB_DATA.final.papers.map((p) => { const by = {}; p.questions.forEach((q) => q.parts.forEach((x) => { by[x.area] = (by[x.area] || 0) + x.marks; })); return p.marks === 40 && p.questions.length === 4 && by.core === 10 && by.trees === 10 && by.hashgraph === 10 && by.sortperf === 10; }));
  check(F.length >= 4 && F.every(Boolean), "every whole-course paper (" + F.length + ") has 4 questions of 10 marks, one per area");
  await pg.goto(URL + "#final"); await wait(pg, 800);
  check((await pg.locator('.cw-paper a.btn.primary[href^="#final-"]').count()) === F.length && (await pg.locator('.cw-paper a.btn.primary[href^="#cw2-"]').count()) >= 3, "the final revision page lists the whole-course papers and the Coursework Exam #2 papers");
  await pg.goto(URL + "#final-F1"); await wait(pg, 600);
  await pg.click("[data-start]"); await wait(pg, 600);
  await pg.locator('.cw-part[data-id="fin-1-1a"] textarea').click(); await pg.keyboard.type("30 8 30 30");
  await wait(pg, 800);
  await pg.click(".cw-bar [data-finish]"); await wait(pg, 200); await pg.click(".cw-bar [data-finish]"); await wait(pg, 700);
  const rowsF = pg.locator('.cw-part[data-id="fin-1-1a"] .wr-sp');
  for (let i = 0; i < await rowsF.count(); i++) { const btns = rowsF.nth(i).locator("button"); await btns.nth((await btns.count()) - 1).click(); }
  await pg.locator(".cw-totalbar [data-save]").click(); await wait(pg, 700);
  const resF = await pg.locator(".cw-score").innerText();
  check(/Your mark: 3\s*\/ 40/.test(resF) && /Pointers, recursion and linked lists\s*3 \/ 10/.test(resF), "a whole-course paper is sat, marked and scored by area");
  check(/Back to Final exam revision/.test(resF), "its results lead back to the final revision page");
  // the final plan's last two weeks send the student to the whole-course papers, and sitting one ticks its step off
  await pg.goto(URL + "#path-final"); await wait(pg, 700);
  check((await pg.locator('.path-steps a[href^="#final-F"]').count()) === F.length, "the final plan links to every whole-course paper");
  check((await pg.locator('.path-steps li.ok a[href="#final-F1"]').count()) === 1 && (await pg.locator('.path-steps li.ok a[href="#final-F2"]').count()) === 0, "sitting a whole-course paper ticks off its step in the plan");
  // the newer papers: every marking scheme and diagram can be read without sitting them
  for (const id of ["F3", "F4"]) {
    await pg.goto(URL + "#final-" + id); await wait(pg, 500); await pg.click("[data-review]"); await wait(pg, 700);
    const nParts = await pg.locator(".cw-part").count();
    check(nParts === 12 && (await pg.locator(".cw-ideal").count()) === nParts, "Whole-course paper " + id.slice(1) + ": all 12 parts show their marking schemes");
    const dg = await pg.evaluate(() => { const ds = [...document.querySelectorAll(".diagram")]; return { n: ds.filter((d) => d.querySelector("svg")).length, bad: ds.some((d) => /could not be drawn/.test(d.textContent)) }; });
    check(dg.n >= 1 && !dg.bad, "Whole-course paper " + id.slice(1) + ": every diagram is drawn (" + dg.n + ")");
  }
  await pg.goto(URL + "#home"); await wait(pg, 900);
  check((await pg.locator('.exam-card a[href="#final"]').count()) >= 1, "the home page's final exam card links to the whole-course papers");
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const r of ["#cw2-A", "#final", "#final-F2", "#final-F4", "#path-final"]) {
    await ph.goto(URL + r); await wait(ph, 700);
    check(await ph.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no sideways scrolling on a phone: " + r);
  }
  for (const e of errs) console.log("  error:", e);
  check(!errs.length, "no page errors");
  await b.close();
  console.log("\n" + fails + " failures");
  process.exit(fails ? 1 : 0);
})();
