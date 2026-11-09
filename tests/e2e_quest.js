// Quest: plays every level of The Lost Index with the solver (tests/quest_solver.js) and checks that each one can be
// finished with no mistakes (so every challenge has a reachable right answer), plus the map, the journal and the
// explorer setup. Run after `python3 build.py`:  node tests/e2e_quest.js [level-id-prefix]
const path = require("path");
const { chromium } = require("playwright");
const REPO = path.dirname(__dirname);
const URL = process.env.CODELAB_URL || "file://" + REPO + "/dist/COMP2611-Code-Lab.html";
const only = process.argv[2] || "";
let fails = 0;
const check = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.addInitScript({ path: path.join(REPO, "tests", "quest_solver.js") });
  // first visit: the explorer setup dialog
  await pg.goto(URL + "#quest"); await pg.waitForTimeout(900);
  check(await pg.locator(".qs-setup").count() === 1, "first visit asks who is joining the expedition");
  await pg.fill(".qs-setup input", "Tester");
  await pg.click('.px-swatch[data-k="skin"][data-v="c"]');
  await pg.click("[data-go]"); await pg.waitForTimeout(500);
  check((await pg.locator(".qh-me b").innerText()) === "Tester", "the map shows the explorer's name");
  const worlds = await pg.locator(".qw-world").count();
  check(worlds >= 12, "the map shows every chapter (" + worlds + ")");
  const ids = await pg.evaluate(() => CL.Quest.worlds().flatMap((w) => w.levels.map((l) => l.id)));
  let played = 0;
  for (const id of ids) {
    if (only && !id.startsWith(only)) continue;
    played++;
    await pg.evaluate((h) => { location.hash = h; }, "#quest-" + id); await pg.waitForTimeout(250);
    const log = [];
    for (let guard = 0; guard < 400; guard++) {
      const s = await pg.evaluate(() => ({ done: !!document.querySelector(".done-card"), dis: document.querySelector(".ql-next").disabled }));
      if (s.done) break;
      if (!s.dis) {
        await pg.evaluate(() => { const g = document.querySelector(".qb-glint"); if (g) g.click(); document.querySelector(".ql-next").click(); });
        await pg.waitForTimeout(15);
        continue;
      }
      const r = await pg.evaluate(() => window.__qsolve());
      if (r) log.push(r);
      await pg.waitForTimeout(r ? 60 : 250);
    }
    const res = await pg.evaluate(() => ({ done: !!document.querySelector(".done-card"), lost: document.querySelectorAll(".ql-heart.lost").length, bad: [...document.querySelectorAll(".qb-fb.bad")].map((x) => x.textContent.slice(0, 140)) }));
    check(res.done && res.lost === 0, id + (res.done ? "" : " (not finished)") + (res.lost ? " (" + res.lost + " mistakes: " + res.bad.join(" | ") + ")" : "") + " [" + log.join(", ") + "]");
  }
  if (!only) {
    await pg.goto(URL + "#journal"); await pg.waitForTimeout(500);
    const notes = await pg.locator(".qj-l li").count();
    check(notes > 100, "the journal holds the notes of finished levels (" + notes + ")");
    const st = await pg.evaluate(() => CL.Quest.stats());
    check(st.levels === ids.length && st.worlds === st.worldTotal, "every level and chapter is recorded as finished (" + st.levels + "/" + ids.length + ")");
    check(st.relics > 0, "relics were found along the way (" + st.relics + ")");
  }
  check(played > 0, played + " levels played");
  for (const e of errs) console.log("  error:", e);
  check(!errs.length, "no page errors");
  await b.close();
  console.log("\n" + fails + " failures");
  process.exit(fails ? 1 : 0);
})();
