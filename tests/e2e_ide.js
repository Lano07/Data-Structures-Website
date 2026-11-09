// The runner, the terminal, the Playground IDE, the Code Gym and your-own-values labs, in a real browser.
// Run after `python3 build.py`:  node tests/e2e_ide.js
const path = require("path"), fs = require("fs"), os = require("os");
const { chromium } = require("playwright");
const REPO = path.dirname(__dirname);
const URL = process.env.CODELAB_URL || "file://" + REPO + "/dist/COMP2611-Code-Lab.html";
let fails = 0;
const check = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const wait = (pg, ms) => pg.waitForTimeout(ms);
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errs = [];
  pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.addInitScript({ path: path.join(REPO, "dev", "fakeclaude.js") });
  await pg.goto(URL + "#play"); await wait(pg, 1300);
  check(await pg.evaluate("CL.Runner.workersAvailable()"), "programs run in a Web Worker");
  const term = () => pg.locator(".ide-term .term-out").innerText();
  const setCode = (c) => pg.evaluate((c) => { const t = document.querySelector(".ide-ed:not([hidden]) .ed-ta"); t.value = c; t.dispatchEvent(new Event("input")); }, c);
  // interactive input: the program waits for each line
  await setCode('#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n\tstring name; int a, b;\n\tcout << "Name? ";\n\tgetline (cin, name);\n\tcout << "Two numbers: ";\n\tcin >> a >> b;\n\tcout << name << " " << a + b << endl;\n\treturn 0;\n}\n');
  await pg.click(".ide-runbtn"); await wait(pg, 900);
  check(/waiting for input/.test(await pg.locator(".ide-term .term-status").innerText()), "the terminal waits for keyboard input");
  await pg.keyboard.type("Ada"); await pg.keyboard.press("Enter"); await wait(pg, 700);
  await pg.keyboard.type("3 4"); await pg.keyboard.press("Enter"); await wait(pg, 900);
  let t = await term();
  check(/Name\? Ada\nTwo numbers: 3 4\nAda 7/.test(t), "typed lines appear where the program read them, and the program finishes");
  check(/exit code 0/.test(t), "the exit status is shown");
  // a runaway loop: the page stays responsive and Stop ends it
  await setCode('#include <iostream>\nusing namespace std;\nint main() {\n\tlong long i = 0;\n\twhile (true) i++;\n}\n');
  await pg.click(".ide-runbtn"); await wait(pg, 1200);
  const lat = await pg.evaluate(() => { const t0 = performance.now(); return new Promise((r) => setTimeout(() => r(performance.now() - t0), 50)); });
  check(lat < 300, "the page stays responsive while a program runs (" + Math.round(lat) + " ms timer)");
  await pg.click(".ide-term [data-a='stop']"); await wait(pg, 400);
  check(/Stopped/.test(await term()), "Stop ends a runaway program");
  // compile errors, the g++ way
  await setCode("#include <iostream>\nusing namespace std;\nint main() {\n\tint x = 5\n\tcout << x;\n}\n");
  await pg.click(".ide-runbtn"); await wait(pg, 700);
  check(/main\.cpp:4:\d+: error:/.test(await term()), "compile errors are printed as file:line:column: error");
  // shell commands and a multi-file project with prepared input
  await pg.click('[data-a="projects"]'); await wait(pg, 200);
  await pg.click("text=New project…"); await wait(pg, 300);
  await pg.click("text=Linked list project"); await pg.click(".ide-dlg-f .primary"); await wait(pg, 800);
  check((await pg.locator(".fx-row").allInnerTexts()).length === 3, "the linked list template has three files");
  await pg.click('[data-p="input"]'); await pg.fill(".ide-inp-ta", "3\n10\n20\n30\n20");
  await pg.click(".ide-runbtn"); await wait(pg, 1300);
  t = await term();
  check(/g\+\+ -std=c\+\+17 -Wall main\.cpp LinkedList\.cpp/.test(t) && /Your list: 10 20 30/.test(t) && /\n10 30/.test(t), "main.cpp + LinkedList.cpp + LinkedList.h compile together and run with prepared input");
  await pg.click(".ide-term .term-body");
  for (const c of ["ls", "g++ main.cpp LinkedList.cpp -o app", "echo 1 > in.txt", "echo 5 >> in.txt", "cat in.txt"]) { await pg.keyboard.type(c); await pg.keyboard.press("Enter"); await wait(pg, 300); }
  t = await term();
  check(/LinkedList\.cpp/.test(t) && /compiled main\.cpp LinkedList\.cpp → \.\/app/.test(t) && /1\n5/.test(t), "shell: ls, g++ -o, echo > and >>, cat");
  // zip in and out
  const zipPath = path.join(os.tmpdir(), "codelab-e2e.zip");
  const bytes = await pg.evaluate(async () => { const blob = await CL.Project.zip({ "proj/main.cpp": "#include <iostream>\nusing namespace std;\nint main(){ int a; cin >> a; cout << a * 2 << endl; }\n", "proj/data.txt": "21\n" }); return Array.from(new Uint8Array(await blob.arrayBuffer())); });
  fs.writeFileSync(zipPath, Buffer.from(bytes));
  await pg.click('[data-a="projects"]'); await wait(pg, 200);
  await pg.click("text=New project…"); await wait(pg, 300);
  await pg.click(".ide-dlg-f .primary"); await wait(pg, 700);
  await pg.setInputFiles(".ide-f-zip", zipPath); await wait(pg, 700);
  if (await pg.locator(".ide-dlg").count()) { await pg.click(".ide-dlg-f .primary"); await wait(pg, 400); }
  check((await pg.locator(".fx-row").allInnerTexts()).some((x) => /data\.txt/.test(x)), "a .zip upload adds its files (top folder removed)");
  await pg.click(".ide-term .term-body");
  for (const c of ["g++ main.cpp -o dbl", "./dbl < data.txt"]) { await pg.keyboard.type(c); await pg.keyboard.press("Enter"); await wait(pg, 600); }
  check(/\n42\n/.test(await term()), "./prog < file redirects cin");
  // the Code Gym runs its tests in the background and has a your-own-values terminal
  await pg.goto(URL + "#ex-list-delete-key"); await wait(pg, 800);
  const sol = await pg.evaluate("CODELAB_DATA.exercises.find(x => x.id === 'list-delete-key').solution");
  await pg.evaluate((c) => { const t = document.querySelector(".ex-work .ed-ta"); t.value = c; t.dispatchEvent(new Event("input")); }, sol);
  await pg.click('[data-a="run"]'); await wait(pg, 1800);
  check((await pg.locator(".summary").innerText()).startsWith("All"), "the model solution passes every Code Gym test");
  await pg.click(".ex-try > summary"); await pg.click("[data-try]"); await wait(pg, 1200);
  check(/Process finished/.test(await pg.locator(".ex-try .term-out").innerText()), "Try it with your own values runs your own main()");
  // every code-tracing question rebuilds into a program that prints its answer
  const qres = await pg.evaluate(() => {
    const T = CL.Train, bad = [];
    ["bt-code", "ll-code", "ll-ops", "rec-trace", "cpp-ptr", "sq-ops"].forEach((gid) => {
      for (let i = 0; i < 25; i++) {
        const q = T.make(gid, (i * 2246822519 + 777) >>> 0), src = T.program(q), r = CPP.run(src, { maxSteps: 2000000 });
        let got = r.ok ? T.norm(gid === "ll-code" ? r.out.trim().split("\n").slice(1).join("\n") : r.out) : "ERR";
        if (got !== T.norm(q.answer) && !(q.nospace && got.replace(/\s/g, "") === T.norm(q.answer).replace(/\s/g, ""))) bad.push(gid + " " + i);
      }
    });
    return bad;
  });
  check(!qres.length, "Run it with your own values: every question's program prints its answer " + qres.slice(0, 3).join(", "));
  // labs take your own values
  await pg.goto(URL + "#lab-graph"); await wait(pg, 700);
  await pg.selectOption("#gr-g", "custom"); await pg.fill("#gr-spec", "S A 7\nS B 2\nA C 1\nB A 3\nB C 8\nC D 2"); await pg.click("#gr-draw"); await wait(pg, 300);
  await pg.selectOption("#gr-alg", "dijkstra"); await pg.selectOption("#gr-s", "S"); await wait(pg, 300);
  await pg.click('.viz-ctl [data-a="last"]'); await wait(pg, 200);
  check(/Cost to D: 8/.test(await pg.locator(".player-say").innerText()), "Graph lab: Dijkstra on your own undirected graph");
  await pg.goto(URL + "#lab-traversal"); await wait(pg, 600);
  await pg.selectOption("#tv-tree", "own"); await pg.click('.tv-mode [data-m="prein"]');
  await pg.fill("#tv-pre", "A B D E C F"); await pg.fill("#tv-in1", "D B E A F C"); await pg.click("#tv-build"); await wait(pg, 300);
  await pg.selectOption("#tv-kind", "post"); await wait(pg, 300); await pg.click('.viz-ctl [data-a="last"]'); await wait(pg, 200);
  check(/D E B F C A/.test(await pg.locator(".player-say").innerText()), "Traversal lab: a tree rebuilt from preorder + inorder");
  for (const e of errs) console.log("  error:", e);
  check(!errs.length, "no page errors");
  await b.close();
  console.log("\n" + fails + " failures");
  process.exit(fails ? 1 : 0);
})();
