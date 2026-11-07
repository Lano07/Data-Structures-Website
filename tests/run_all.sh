#!/bin/sh
# Runs every check for COMP 2611 Code Lab. Build first:  python3 build.py   (validates all content against g++)
cd "$(dirname "$0")/.."
fail=0
run() { printf "%-34s " "$1"; shift; out=$("$@" 2>&1); code=$?; echo "$out" | tail -1; [ $code -eq 0 ] || fail=1; }
run "interpreter vs g++ (tests/progs)" node --stack-size=4000 tests/diff.js
run "C++ feature matrix" node --stack-size=4000 tests/features.js
run "Trace Trainer generators" python3 dev/trainer_test.py
run "lab Your turn questions" python3 dev/yourturn_test.py
run "memory lab demos vs g++" node --stack-size=4000 tests/memdemos.js
for t in tests/e2e_*.py; do run "$t" python3 "$t"; done
run "every page, phone and desktop" python3 tests/crawl.py
[ $fail -eq 0 ] && echo "ALL CHECKS PASSED" || { echo "SOME CHECKS FAILED"; exit 1; }
