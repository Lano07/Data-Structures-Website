# Restores the source tree from a backup.json (usage: python3 dev/restore.py path/to/backup.json)
import os, sys, json
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
data = json.load(open(sys.argv[1], encoding="utf-8"))
for rel, text in data.items():
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(text)
print("restored", len(data), "files")
