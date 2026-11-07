# Bundles every source file into build/backup.json (published beside the artifact so work can be restored).
import os, json
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out = {}
for d in ["src", "content", "tests", "dev", "server"]:
    for base, dirs, files in os.walk(os.path.join(ROOT, d)):
        dirs[:] = [x for x in dirs if x not in ("progs_out",)]
        for f in files:
            if f.endswith((".js", ".mjs", ".css", ".py", ".md", ".txt", ".cpp", ".in", ".json", ".sh")):
                p = os.path.join(base, f)
                out[os.path.relpath(p, ROOT)] = open(p, encoding="utf-8").read()
out["build.py"] = open(os.path.join(ROOT, "build.py"), encoding="utf-8").read()
json.dump(out, open(os.path.join(ROOT, "build", "backup.json"), "w"), ensure_ascii=False)
print("backup: %d files, %.0f KB" % (len(out), os.path.getsize(os.path.join(ROOT, "build", "backup.json")) / 1024))
