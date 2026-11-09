# COMP 2611 Code Lab

An interactive website for learning **COMP 2611 Data Structures** (C++, University of the West Indies, St. Augustine). It follows the lecture notes lecture by lecture, adds the course-outline topics the notes have not reached yet, and turns studying into a game: every answer earns XP.

The whole site is one HTML file. It runs real C++ in the browser, so it works offline and nothing you type leaves your device.

## What's inside

| | |
|---|---|
| **Quest: The Lost Index** | A 16-bit story campaign through the whole course. Professor Ramdeen has vanished, and her field journal leads you and her friends (Marco, captain of the *Kiskadee*, and Pip the parrot) to real places in history, one per topic: Port Royal for pointers, the Inca roads for linked lists, Chichén Itzá for recursion, the Panama Canal for stacks and queues, Taíno caves for binary trees, the Archive of the Indies for BSTs, Giza for heaps, Bletchley Park for hashing, Königsberg and Caribbean telegraph cables for graphs, Hollerith's census machine for sorting, and Trinidad's Pitch Lake for the finale. **12 chapters, 62 levels**, each a story you play: dialogue, journal pages that teach, and challenges you must solve with your hands before the story moves on. Mistakes cost hearts and stars, never progress. Relics carry real history, every level adds its key points to your journal (a revision summary of the course), and each chapter ends with its boss. |
| **Learn by doing** | The Quest's challenges: multiple choice, typed answers, predict the output (checked, then runnable and editable), put the code in order, fill the gaps, match terms, click a traversal / search path / insertion spot / successor on a tree, click the BFS, DFS, Dijkstra or Prim order on a map, pick Kruskal's edges, probe a hash table, run binary search, choose every swap in maxHeapify, insert and extract, *be* bubble, selection, insertion sort, partition and merge, rewire linked-list pointers (lose a node and you see it fall), write real functions against tests, and open any lab with your own values. |
| **Learn** | 74 lessons in 14 parts, from C++ foundations and pointers to graphs and sorting, mapped to Lectures 1–21. Every part ends with a **deep-dive theory lesson**: invariants, proofs, cost derivations, worked exam problems and exam traps. Lessons have runnable code, quick checks, code puzzles, predict-the-output exercises and explain-it-back prompts. |
| **Course outline topics** | Part N covers what the course outline lists but the notes don't yet: sequential and binary search, special matrices (triangular, symmetric, band, sparse), Floyd's algorithm, graph isomorphism, counting and radix sort, and structural induction. |
| **Visual Labs** | 14 labs: memory, linked lists, stacks and queues, recursion, traversals, BSTs, AVL trees, heaps, hashing, graphs, sorting, matrices, Floyd and integer sorting. Each one steps through the course code line by line, and *Your turn* mode asks you to predict every step. **Every lab takes your own values**: type any graph (edge lists, one-way edges, adjacency lists, weights; drag the vertices), any binary tree (level order with gaps, brackets, or rebuilt from preorder or postorder plus inorder), your own matrix, Floyd graph, keys, arrays and operations. |
| **Coursework Exam #2** | Everything for the second coursework exam (Tuesday 17 November, 9:00 to 10:30 am, JFK Auditorium; 4 short-answer questions, 40 marks, 20%), from the course's "what to expect" sheet: the five areas and their marks, with links to the lessons and labs for each; **three mock papers in its format** (Q1 linked lists, stacks and queues 9, Q2 binary trees and BSTs 11, Q3 heaps and priority queues 10, Q4 hashing and graphs 7 plus performance 3), sat against a 90-minute clock with a box for every part, then marked point by point against a marking scheme (by you, or strictly by the tutor), with the ideal answer, *Test my code* for code parts, and your score for each area; the questions can be printed to answer by hand. An **eight-day plan** (one area a day, weighted by its marks, then the papers), a 30-question multiple-choice drill on the same topics, and a countdown card on the home page. The questions are original, written for this site; every code answer is compiled with g++ when the site is built. |
| **Practice** | Endless exam-style questions with worked solutions, flashcards with spaced repetition, written answers marked against a scheme, a diagnostic test, and timed mock exams. Every question lets you try it yourself: picture questions open the matching lab with their values, and code-tracing questions become a complete program you can edit, run and step through. |
| **Playground IDE** | A real development environment: **projects** with folders and many kinds of files (.cpp, .h, .txt, .in, .csv, .md, .json, images), tabs, and templates (linked list, BST, stack and queue, files, graph from a file, an interactive menu). **Add files from your computer**: single files, whole folders, .zip archives, a link (GitHub, Gist), pasted text, or (in Chrome and Edge) open a folder straight from disk and save your changes back to it; Google Drive and OneDrive work through their folders on your computer. Download a file, a project or every project as .zip. **Multi-file builds** like `g++ main.cpp list.cpp` with headers and include guards, and errors that point at the right file and line. |
| **Terminal** | Programs run in the background (a Web Worker), so the page never freezes; output streams in while the program runs; **`cin` waits for you to type**, right where the program asks, like a real console; Stop (Ctrl+C) ends a runaway loop at once; Ctrl+D ends input; errors are printed the way g++ prints them and clicking one jumps to the code. The IDE's terminal is also a shell: `g++ a.cpp b.cpp -o prog`, `./prog < input.txt`, `ls`, `cat`, `mkdir`, `mv`, `rm`, `echo … > file` and more. Lesson examples run in the same terminal. |
| **Code Gym** | 92 coding exercises with hidden tests, hints and model solutions, in a **workspace that works like a small compiler**: type your code, press **▶ Run** to compile it with `main.cpp` and run it in the terminal, or **✓ Submit** to run every test in the background (with progress and Stop). `main.cpp` calls your function: it starts as the first test, and you change the values or read them with `cin` (the terminal waits for you to type). One click runs a failing test in the terminal. If your code has its own `main()`, Run uses it and Submit leaves it out. The Quest's coding challenges use the same workspace. |
| **Arcade** | 8 timed games that drill exam skills: Big-O Blitz, Traversal Sprint, BST Builder, Heap Hero, Hash Dash, Dijkstra Dash, MST Rush and Sort Showdown. They have combos, lives, high scores, a review of your mistakes, and a double-XP game of the day. |
| **Boss Battles** | One boss per topic plus the Final Exam, fought with fresh exam-style questions: fast answers are critical hits, and every miss shows the worked solution and joins your review queue. |
| **Algorithm Cards** | 27 collectible revision cards (costs on the front; power and exam trap on the back), unlocked by deep dives and bosses; master both and a card turns holographic. |
| **Home** | A dashboard: *Jump back in* cards for your Quest chapter and your next lesson (with their scenes and progress), your level, streak, XP, lessons, exercises, relics and achievements with pixel icons, today's quests, and the course part by part. |
| **Game layer** | XP for every answer, lesson, exercise, puzzle, Quest level and mock exam. Levels with rank titles (Null Pointer → Data Structures Legend), combo multipliers, daily quests with a bonus chest, 59 achievements, a study streak, a 14-day XP chart, sound effects and phone vibration (with one mute button) and a Trophy Room. |
| **Look and feel** | A **pixel-art style** in the spirit of 16-bit games: a near-black navy night (or daylight in the light theme), flat cards with thin borders and slightly rounded corners, pixel-font headings, chunky yellow and blue buttons, and painted pixel scenes: a night harbour with teal clouds on the home page and the Quest, and a scene for every chapter. No neon or glow effects. Pixel-art characters you can customise. It respects *reduce motion*. |

## Using it

- **Open the built page**: `docs/index.html` is the complete site. Open it in any browser.
- **Live site**: <https://lano07.github.io/Data-Structures-Website/>, served by GitHub Pages from the `docs/` folder of `main` (*Settings → Pages*). The address keeps the repository name's capital letters; the all-lowercase version does not work.

Progress (lessons, XP, the Quest) is saved in your browser. Use *Settings → your data* to download a backup and restore it on another device. Playground projects are kept in the browser's own database: use *Download › Every project as one .zip* to keep a copy.

## Building

```bash
python3 build.py
```

This checks every lesson program, quiz, exercise solution and Quest "predict the output" program by compiling it with **g++** and comparing the output with the in-page C++ interpreter. Then it writes `dist/index.html` (for embedding), `dist/COMP2611-Code-Lab.html` and `docs/index.html` (standalone pages). It needs Python 3, Node.js and g++.

```bash
python3 build.py --quick
```

This skips the g++ checks for a fast rebuild while editing.

## Testing

```bash
sh tests/run_all.sh
```

Runs the interpreter-versus-g++ tests, the C++ feature matrix, the question-generator checks and the browser tests (Python Playwright for the older ones; `tests/e2e_ide.js` and `tests/e2e_quest.js` use Node's Playwright and are skipped if it is not installed). `node tests/e2e_quest.js` plays every Quest level with an automatic solver and fails if any challenge cannot be finished without a mistake.

## Layout

- `content/`: lessons (`lessons/*.md`), exercises (`exercises/*.txt`), the Quest's chapters (`quest/*.md`), the lecture map, the glossary, the mock exam bank, written questions (`written.md`) and the Coursework Exam #2 mock papers (`cw2.md`)
- `src/`: the app. It includes the C++ interpreter (`cpp_*.js`), the runner, terminal, coding workspace and IDE (`runner.js`, `terminal.js`, `workspace.js`, `project.js`, `ide.js`), the labs (`lab_*.js`), the Quest (`quest.js`, `quest_widgets.js`, `quest_art.js`, which also paints the pixel scenes), the Arcade (`arcade*.js`), the game layer (`game.js`), the Coursework Exam #2 pages (`pages_cw2.js`), effects (`fx.js`) and styles (`style.css` for the layout, `game.css`, `ide.css`, `quest.css`, `home.css`, `cw2.css`, and `theme.css`, which sets the colours)
- `tests/`, `dev/`: interpreter-vs-g++ tests, the C++ feature matrix, and browser end-to-end tests

### Writing a Coursework Exam #2 mock paper

`content/cw2.md` uses the written-answer format (`=== id`, `key: value` lines, then `--- question`, `--- rubric`, `--- answer`, and for code `--- given`, `--- check`, `--- expect`). Each block is one **part** and also has `paper:` (A, B, C...), `q:` (1 to 4), `part:` (a, b, c...) and `area:` (`lsq`, `trees`, `heaps`, `hashgraph` or `perf`). Part a of a question may have a `--- stem`, the text shared by all its parts. The build checks that every paper has questions 1 to 4 and exactly the outline's marks per area (9, 11, 10, 7 and 3), that each rubric adds up to its part's marks, and runs every code answer through g++ and the interpreter.

### Writing Quest content

Each chapter is a Markdown file in `content/quest/`: a `# world:` header, then `## level-id | Title` levels made of beats. `@say who: text` (marco, pip, prof, silas, you, narrator), `@scene`, `@learn Title` (Markdown, with runnable code) and `@journal` (bullet points) tell the story and teach; `@quiz`, `@type`, `@predict`, `@order`, `@fill`, `@match`, `@tree`, `@graph`, `@array`, `@heap`, `@sort`, `@listsim` and `@code` are challenges; `@lab`, `@memory`, `@relic` and `@boss` are extras. The build checks every beat, and runs every `@predict` program through the interpreter and g++ to fix its expected output.
