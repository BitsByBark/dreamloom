# bug reports

2026-06-05 — cursor temp memory
- what was wrong: whole window went black, then after sittin there a bit the build failed too. cursor temp memory was cooked apparently.
- what was fixed: nuked `/tmp/cursor-sandbox-cache` with `rm -rf /tmp/cursor-sandbox-cache` and it stopped being stupid.

2026-06-05 — windows github action
- what was wrong: windows built the app fine, then msi bundling ate shit because `0.1.0-beta` isnt a valid msi version.
- what was fixed: switched the windows artifact to a portable `dreamloom.exe`, removed msi from the bundle targets, and updated the readme instructions.
