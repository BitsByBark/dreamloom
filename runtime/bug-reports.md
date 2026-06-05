# bug reports

2026-06-05 — cursor temp memory
- what was wrong: whole window went black, then after sittin there a bit the build failed too. cursor temp memory was cooked apparently.
- what was fixed: nuked `/tmp/cursor-sandbox-cache` with `rm -rf /tmp/cursor-sandbox-cache` and it stopped being stupid.
