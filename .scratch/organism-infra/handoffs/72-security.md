```json
{"ticket": "organism-infra/72-jev-wake-gate-prelude-shadow", "cell": "security",
 "current_step": "Security pass on feat/72-wake-gate-prelude at 314bd8a; ready for orchestrator to merge.",
 "artifacts": [],
 "decisions": [
   "gh shell-out in readCi: execFileSync with hardcoded array args, 15s timeout, stderr ignored — no injection risk.",
   "ticketTextOf path join without normalization: Low only; local-only context, events.jsonl written by trusted board tool.",
   "Fake sk-test-KEYVALUE-wake-prelude-72-test in test:45: not a real secret, gitleaks clean, Low.",
   "Jev exposure conforms to ticket 67: ticketHeader(title+Status).slice(0,4000) + newComment.slice(0,4000); hasSecret() runs on assembled text before send.",
   "codeWakes author==null||!CELL_TYPES fix from 77 confirmed present.",
   "Genome commit 8b3c807: user-authored, minimal, accurate — no security concerns."
 ],
 "failures": [],
 "pending": [{"item": "orchestrator to open PR and merge on green CI", "owner": "orchestrator"}]}
```

**cell:** security | **branch:** feat/72-wake-gate-prelude | **commit:** 314bd8a
**ticket:** organism-infra/72-jev-wake-gate-prelude-shadow

## Verdict

**Security pass.** No critical or high findings.

## Checks run

| Check | Result |
|-------|--------|
| gitleaks | Clean — 4 commits, 0 leaks |
| npm audit | 0 vulnerabilities |
| New dependencies | None |
| CI/CD pipeline | No changes to `.github/workflows/` |
| gh shell-out | Safe (see below) |
| Jev exposure | Conforms to ticket 67 |
| Fake key in test | Low — not a real secret |
| Genome commit 8b3c807 | User-authored, minimal, scoped |

## Findings (Low only — no block)

### Low — `scripts/jev-wake-prelude.mjs:ticketTextOf` — path join without normalization

`ticketTextOf` builds a path as `path.join(scratch, feature, "issues", ticket + ".md")` where `feature` and `ticket` come from events.jsonl board events. No normalization or allowlist validates these fields. If an attacker could write a crafted event (e.g. `feature: "../../etc"`) they could read files outside `.scratch/`. In practice events.jsonl is written only by the organism's own board tool running locally. Not blocking; log for a future hardening pass.

### Low — `scripts/jev-wake-prelude.test.mjs:45` — `sk-` prefix in test constant

```
const KEY = "sk-test-KEYVALUE-wake-prelude-72-test";
```

This is a fabricated placeholder, never sent to a real API (every call in the test file uses an injected `transport` mock). gitleaks did not flag it. Not a real credential. The `sk-` prefix is mildly confusing; a future cleanup could rename to `test-key-...` to avoid pattern-scanner false positives.

## Risk-check hits reviewed

### `gh pr list` shell-out (`jev-wake-prelude.mjs:readCi`)

```js
execFileSync("gh", ["pr", "list", "--state", "open", "--json", "number,mergeable,statusCheckRollup"], {
  cwd: root, encoding: "utf8", timeout: GH_TIMEOUT_MS, stdio: ["ignore", "pipe", "ignore"],
})
```

- Array form of `execFileSync`: no shell interpolation, no injection risk.
- All arguments are hardcoded literals, no user input reaches the command.
- `timeout: 15000` bounds execution; `stderr: ignore` prevents leaking error text.
- On failure returns `{ ciUnknown: true }` which wakes the orchestrator (safe default).
- **Safe.**

### Board-reading code

`newInputs` filters `events.jsonl` by `op === "comment"` and `cell !== "orchestrator"`, then reads ticket text from `.scratch/<feature>/issues/<ticket>.md`. The `decide()` call receives the full `ticketText` but the INPUTS map for `wake` extracts only the ticket header (title + `**Status:**` line) capped at 4000 chars:

```js
wake: (a) => `${ticketHeader(a.ticketText).slice(0, WAKE_CAP)}\n\n--- new comment ---\n${a.newComment.slice(0, WAKE_CAP)}`
```

`hasSecret()` runs on the assembled text before any network call. This exactly matches ticket 67's ruling.

### Fake `sk-` key in test

Reviewed above — Low, not blocking.

## Jev exposure vs ticket 67

Ticket 67 ruling for wake: *"ticket title and Status plus the one new comment; _requests rows are never sent, code wakes on them."*

Current code:
- **Title + Status**: `ticketHeader()` extracts `# ...` and `**Status:**` lines only — ✅
- **One new comment**: `newComment.slice(0, WAKE_CAP)` — ✅
- **_requests**: `openVerdictRequest` detected from snapshot only; no request rows reach `decide()` — ✅
- **Secret scan**: `hasSecret(text)` runs on assembled text before send — ✅
- **author==null bypass fix (77)**: `codeWakes` in jev.mjs:135 checks `author == null || !CELL_TYPES.includes(author)` — ✅

## Genome commit 8b3c807 review

Two lines changed in `.claude/agents/orchestrator.md`:
1. Loop step 1 now starts with `node scripts/jev-wake-prelude.mjs --since last` in shadow mode.
2. `usage.jsonl` note extended: "jev-wake-prelude.mjs does the same for `wake` rows."

Both are accurate, minimal, and consistent with the ticket spec. Committed by the user. No security concerns.

## Next step

Orchestrator: open PR for `feat/72-wake-gate-prelude`, merge on green CI. No blockers.

## Worktree receipt

Worktree: `/home/dhertzell/dsd-72-security`
Status: **clean** (detached HEAD at 314bd8a, security review only — no files changed)

## Failed calls

None.
