# 41 security handoff: Security pass

Branch worktree-agent-a951332b2986b5f05 at 0f27002, diff vs origin/main (2 files: scripts/jev-report.mjs, scripts/jev-report.test.mjs). No dependency or lockfile changes, no workflow changes.

- Secrets: gitleaks (run as `detect --log-opts=origin/main..0f27002`, since the worktree guard refuses `gitleaks git`): 5 commits scanned, no leaks.
- Spawn (scripts/jev-report.test.mjs:110, :123): spawnSync(process.execPath, [SCRIPT, "--usage", file, ...]), array args, no shell, SCRIPT from import.meta.url, file from mkdtempSync. No untrusted interpolation. Clean.
- --usage path (scripts/jev-report.mjs, main): local CLI arg read with readFileSync in try/catch; a missing or unreadable file (or a string-too-long huge file) prints one stderr line and exits 1. No writes, no shell, no path-derived side effects. Malformed lines are skipped by JSON.parse try/catch. Whole-file read is fine for the local usage.jsonl size.
- Output leak: report prints only the ticket key (feature/NN), Number()-coerced counts and costs, and fixed labels. Probed a row with an extra `secret` field: it is not echoed. Text and --json output expose nothing else from usage rows.

Findings (none block):
- low, scripts/jev-report.mjs:32 (buildReport): a valid-JSON non-object line such as `null` throws TypeError and dumps a stack trace (exit 1). Guard with `if (!r || typeof r !== "object") continue`.
- low, scripts/jev-report.mjs:56-57: TIER_WEIGHT[pick] / VERIFY_WEIGHT[pick] look up inherited properties, so pick "constructor" or "toString" yields NaN in the report. Use Object.hasOwn.
- low, scripts/jev-report.mjs:12-15, :103-119: ticket key comes from `[^/]+` and is printed raw, so a feature slug with control or escape characters could inject terminal escapes or lines into output. A `|` in the slug also breaks the `id.split("|")` join. Only reachable by someone who can write usage.jsonl. Restrict the regex to `[\w.-]+`.

State:
```json
{"ticket":"organism-infra/41-jev-report-script","cell":"security","mode":"full","current_step":"Security pass","artifacts":[],"decisions":["spawn uses array args and no shell","output carries only ticket key and numbers","three low robustness findings do not block"],"failures":["gitleaks git refused by worktree guard; used gitleaks detect --log-opts instead"],"pending":[{"item":"merge proposal to user","owner":"orchestrator"}]}
```
