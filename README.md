# COMP 2611 Code Lab

An interactive website for learning **COMP 2611 Data Structures** (C++, University of the West Indies, St. Augustine). It follows the lecture notes lecture by lecture, adds the course-outline topics the notes have not reached yet, and turns studying into a game: every answer earns XP.

The whole site is one HTML file. It runs real C++ in the browser, so it works offline and nothing you type leaves your device.

## What's inside

| | |
|---|---|
| **Learn** | 63 lessons in 14 parts, from C++ foundations and pointers to graphs and sorting, mapped to Lectures 1–21. Every lesson has runnable code, quick checks, code puzzles, predict-the-output exercises and explain-it-back prompts. |
| **Course outline topics** | Part N covers what the course outline lists but the notes don't yet: sequential and binary search, special matrices (triangular, symmetric, band, sparse), Floyd's algorithm, graph isomorphism, counting and radix sort, and structural induction. |
| **Visual Labs** | 14 labs: memory, linked lists, stacks and queues, recursion, traversals, BSTs, AVL trees, heaps, hashing, graphs, sorting, matrices, Floyd and integer sorting. Each one steps through the course code line by line, and *Your turn* mode asks you to predict every step. |
| **Arcade** | 8 timed games that drill exam skills: Big-O Blitz, Traversal Sprint, BST Builder, Heap Hero, Hash Dash, Dijkstra Dash, MST Rush and Sort Showdown (partition and sorting passes). They have combos, lives, high scores, a review of your mistakes, and a double-XP game of the day. |
| **Practice** | Endless exam-style questions with worked solutions, flashcards with spaced repetition, written answers marked against a scheme, a diagnostic test, and timed mock exams. |
| **Code Gym** | 92 coding exercises with hidden tests, hints and model solutions. |
| **Game layer** | XP for every answer, lesson, exercise, puzzle and mock exam. Levels with rank titles (Null Pointer → Data Structures Legend), combo multipliers, three daily quests with a bonus chest, 43 achievements, a study streak, a 14-day XP chart, sound effects and phone vibration (with one mute button) and a Trophy Room. |
| **Look and feel** | A neon dark theme (a light theme is in settings), an animated background, a hero where data structures morph into each other, and glowing lab visuals. It respects *reduce motion*. |

## Using it

- **Open the built page**: `docs/index.html` is the complete site. Open it in any browser.
- **GitHub Pages**: in the repository's *Settings → Pages*, serve the `docs/` folder of this branch (or of `main` once merged), and the site is live at `https://lano07.github.io/data-structures-website/`.

Progress is saved in your browser. Use *Settings → your data* to download a backup and restore it on another device.

## Building

```bash
python3 build.py
```

This checks every lesson program, quiz and exercise solution by compiling it with **g++** and comparing the output with the in-page C++ interpreter. Then it writes `dist/index.html` (for embedding), `dist/COMP2611-Code-Lab.html` and `docs/index.html` (standalone pages). It needs Python 3, Node.js and g++.

```bash
python3 build.py --quick
```

This skips the g++ checks for a fast rebuild while editing.

## Layout

- `content/`: lessons (`lessons/*.md`), exercises (`exercises/*.txt`), the lecture map, the glossary, the mock exam bank and written questions
- `src/`: the app. It includes the C++ interpreter (`cpp_*.js`), the labs (`lab_*.js`), the Arcade (`arcade*.js`), the game layer (`game.js`), effects (`fx.js`, `hero.js`) and styles (`style.css`, `neon.css`)
- `tests/`, `dev/`: interpreter-vs-g++ tests, the C++ feature matrix, and browser end-to-end tests
