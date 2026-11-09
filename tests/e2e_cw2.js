// Coursework Exam #2: its page, a mock paper sat, typed, marked and saved, the marking schemes, printing, the plan and
// the home card. Run after `python3 build.py`:  node tests/e2e_cw2.js
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
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ph.goto(URL + "#cw2-A"); await wait(ph, 700);
  check(await ph.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no sideways scrolling on a phone");
  for (const e of errs) console.log("  error:", e);
  check(!errs.length, "no page errors");
  await b.close();
  console.log("\n" + fails + " failures");
  process.exit(fails ? 1 : 0);
})();
