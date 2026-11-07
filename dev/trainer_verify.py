# Runs the code shown in code-tracing questions through the in-page interpreter (and a sample through g++)
# and checks that the program's real output matches the question's answer.
import asyncio, json, subprocess, sys, os, tempfile
from playwright.async_api import async_playwright
import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # the repository root
N = int(sys.argv[1]) if len(sys.argv) > 1 else 120
JS = r"""
(N) => {
  const T = CL.Train;
  const HDR = "#include <iostream>\nusing namespace std;\n\n";
  const NODE = "struct Node {\n\tint data;\n\tNode * next;\n};\n\nNode * createNode (int n) {\n\tNode * newNode = new Node;\n\tnewNode->data = n;\n\tnewNode->next = NULL;\n\treturn newNode;\n}\n\nvoid printList (Node * top) {\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tcout << curr->data << \" \";\n\t\tcurr = curr->next;\n\t}\n\tcout << endl;\n}\n\n";
  const LISTOPS = "Node * insertAtHead (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tnewNode->next = top;\n\treturn newNode;\n}\n\nNode * insertAtTail (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tif (top == NULL)\n\t\treturn newNode;\n\tNode * curr = top;\n\twhile (curr->next != NULL)\n\t\tcurr = curr->next;\n\tcurr->next = newNode;\n\treturn top;\n}\n\nNode * deleteAtHead (Node * top) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tNode * next = top->next;\n\tdelete top;\n\treturn next;\n}\n\nNode * deleteKey (Node * top, int key) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tif (top->data == key) {\n\t\tNode * next = top->next;\n\t\tdelete top;\n\t\treturn next;\n\t}\n\tNode * prev = top;\n\tNode * curr = top->next;\n\twhile (curr != NULL && curr->data != key) {\n\t\tprev = curr;\n\t\tcurr = curr->next;\n\t}\n\tif (curr != NULL) {\n\t\tprev->next = curr->next;\n\t\tdelete curr;\n\t}\n\treturn top;\n}\n\n";
  const STACK = "struct Stack {\n\tNode * top;\n};\n\nStack * initStack () {\n\tStack * s = new Stack;\n\ts->top = NULL;\n\treturn s;\n}\n\nbool isEmpty (Stack * stack) {\n\treturn stack->top == NULL;\n}\n\nvoid push (Stack * stack, int data) {\n\tNode * newNode = createNode (data);\n\tnewNode->next = stack->top;\n\tstack->top = newNode;\n}\n\nint pop (Stack * stack) {\n\tint save = -999;\n\tif (stack->top != NULL) {\n\t\tNode * toDelete = stack->top;\n\t\tstack->top = stack->top->next;\n\t\tsave = toDelete->data;\n\t\tdelete toDelete;\n\t}\n\treturn save;\n}\n\n";
  const QUEUE = "struct Queue {\n\tNode * head;\n\tNode * tail;\n};\n\nQueue * initQueue () {\n\tQueue * q = new Queue;\n\tq->head = NULL;\n\tq->tail = NULL;\n\treturn q;\n}\n\nbool isEmpty (Queue * queue) {\n\treturn queue->head == NULL;\n}\n\nvoid enqueue (Queue * queue, int data) {\n\tNode * newNode = createNode (data);\n\tif (queue->tail == NULL) {\n\t\tqueue->head = newNode;\n\t\tqueue->tail = newNode;\n\t}\n\telse {\n\t\tqueue->tail->next = newNode;\n\t\tqueue->tail = newNode;\n\t}\n}\n\nint dequeue (Queue * queue) {\n\tif (queue->head == NULL)\n\t\treturn -999;\n\tNode * toDelete = queue->head;\n\tint save = toDelete->data;\n\tqueue->head = queue->head->next;\n\tif (queue->head == NULL)\n\t\tqueue->tail = NULL;\n\tdelete toDelete;\n\treturn save;\n}\n\n";
  const BT = "struct BTNode {\n\tint data;\n\tBTNode * left;\n\tBTNode * right;\n};\n\nBTNode * createBTNode (int data) {\n\tBTNode * n = new BTNode;\n\tn->data = data;\n\tn->left = NULL;\n\tn->right = NULL;\n\treturn n;\n}\n\n";
  function build(spec) {
    const root = CL.parseTreeSpec(spec); let k = 0, lines = [];
    (function w(n, name) { if (!n.left && !n.right) return; if (n.left) { const c = "n" + (++k); lines.push("\tBTNode * " + c + " = createBTNode (" + n.left.key + ");"); lines.push("\t" + name + "->left = " + c + ";"); w(n.left, c); } if (n.right) { const c = "n" + (++k); lines.push("\tBTNode * " + c + " = createBTNode (" + n.right.key + ");"); lines.push("\t" + name + "->right = " + c + ";"); w(n.right, c); } })(root, "root");
    return "\tBTNode * root = createBTNode (" + root.key + ");\n" + lines.join("\n") + "\n";
  }
  const progs = [];
  ["bt-code", "ll-code", "ll-ops", "rec-trace", "cpp-ptr", "sq-ops"].forEach(gid => {
    for (let i = 0; i < N; i++) {
      const q = T.make(gid, (i * 2246822519 + 777) >>> 0);
      let src;
      if (gid === "bt-code") {
        const F = T.TREE_FN[q.fnIndex], spec = /^Tree: (.*)$/m.exec(q.ctx)[1];
        src = HDR + BT + F.code + "\n\nint main () {\n" + build(spec) + (F.out ? "\t" + F.call + ";\n\tcout << endl;\n" : "\tcout << " + F.call + " << endl;\n") + "\treturn 0;\n}\n";
      } else if (gid === "ll-code") {
        const F = T.LIST_FN[q.fnIndex], L = q.list;
        let mk = "\tNode * top = createNode (" + L[0] + ");\n\tNode * last = top;\n" + L.slice(1).map(v => "\tlast->next = createNode (" + v + ");\n\tlast = last->next;\n").join("");
        const call = F.call.replace("KEY", q.key);
        src = HDR + NODE + F.code + "\n\nint main () {\n" + mk + (F.out ? "\t" + call.replace(/\n/g, "\n\t") + (/;$/.test(call) ? "" : ";") + "\n\tcout << endl;\n" : "\tcout << " + call + " << endl;\n") + "\treturn 0;\n}\n";
      } else if (gid === "ll-ops") {
        src = HDR + NODE + LISTOPS + "int main () {\n\t" + q.code.replace(/\n/g, "\n\t") + "\n\treturn 0;\n}\n";
      } else if (gid === "rec-trace") {
        const callLine = q.recIndex === 5 ? "\t" + q.call + ";\n\tcout << calls << endl;\n" : /void f/.test(q.code) ? "\t" + q.call + ";\n\tcout << endl;\n" : "\tcout << " + q.call + " << endl;\n";
        src = HDR + q.code + "\n\nint main () {\n" + callLine + "\treturn 0;\n}\n";
      } else if (gid === "cpp-ptr") {
        src = q.full ? HDR + q.code + "\n" : HDR + NODE + "int main () {\n\t" + q.code.replace(/\n/g, "\n\t") + "\n\treturn 0;\n}\n";
      } else if (gid === "sq-ops") {
        const isStack = /Stack/.test(q.code);
        src = HDR + NODE + (isStack ? STACK : QUEUE) + "int main () {\n\t" + q.code.replace(/\n/g, "\n\t") + "\n\tcout << endl;\n\treturn 0;\n}\n";
      }
      const r = CPP.run(src, { maxSteps: 2000000 });
      const got = r.ok ? T.norm(r.out) : "ERROR " + JSON.stringify(r.err);
      let want = T.norm(q.answer);
      const ok = got === want || (q.nospace && got.replace(/\s/g, "") === want.replace(/\s/g, ""));
      progs.push({ gid, i, ok, got, want, src, ans: q.answer });
    }
  });
  return progs;
}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto("file://" + REPO + "/dist/COMP2611-Code-Lab.html#home")
        await pg.wait_for_timeout(500)
        progs = await pg.evaluate(JS, N)
        await b.close()
    by = {}
    for x in progs:
        d = by.setdefault(x["gid"], [0, 0, []]); d[0] += 1
        if not x["ok"]: d[1] += 1; d[2].append(x)
    for gid, (n, bad, xs) in by.items():
        print(f"{gid:10s} {n} programs, {bad} mismatches (interpreter)")
        for x in xs[:2]: print("   want", x["want"], "| got", x["got"][:200]); print(x["src"][-600:])
    # g++ on a sample
    gbad = 0; gn = 0
    d = tempfile.mkdtemp()
    for x in progs[::7]:
        gn += 1
        cpp = os.path.join(d, "p.cpp"); exe = os.path.join(d, "p")
        open(cpp, "w").write(x["src"])
        c = subprocess.run(["g++", "-std=c++17", "-w", "-o", exe, cpp], capture_output=True, text=True)
        if c.returncode: gbad += 1; print("G++ COMPILE", x["gid"], c.stderr[:300]); continue
        out = subprocess.run([exe], capture_output=True, text=True, timeout=5).stdout
        norm = " ".join(out.replace(",", " ").split()).upper()
        want = x["want"]
        if norm != want and norm.replace(" ", "") != want.replace(" ", ""): gbad += 1; print("G++ MISMATCH", x["gid"], "want", want, "got", norm)
    print("g++ sample:", gn, "programs,", gbad, "problems")
asyncio.run(main())
