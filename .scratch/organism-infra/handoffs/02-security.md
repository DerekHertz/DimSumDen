# organism-infra/02: security review — board CLI

Reviewed detached checkout of `2850cdd` (branch `claude/organism-infra-02-board-cli`), diffed against `origin/main`. Files: `apps/organism-infra/board.mjs`, `board-service.mjs`, `board-cli.test.mjs`, `board-fixture.mjs`, `package.json`.

## Verdict: pass, with two findings for the backlog (not blocking)

**Checked and clean:**
- Path/symlink validation: `FEATURE_RE`/`TICKET_RE` disallow `.`, `/`, so traversal via a ticket ref is not reachable; `assertWithinRoot`'s realpath walk correctly rejects a symlinked issues dir pointing outside root.
- `execFileSync("git", [...])` uses an args array, no shell — no injection.
- `events.jsonl`: each event is `JSON.stringify`'d, which escapes embedded newlines/control chars, so line injection via comment/ref text is not exploitable.
- Write-lock reclaim: same-host + dead-pid (`process.kill(pid,0)`) + age-floor gate, tombstone rename + exclusive `"wx"` recreate closes the double-reclaim race; a live lock is never stolen. Claim-lock has no expiry, matching the ADR.
- `atomicWrite` (tmp + rename) — Node/libuv rename-over-existing works on Windows (MOVEFILE_REPLACE_EXISTING); exercised by qa's tests 9-12, no leftovers observed.
- `$ORGANISM_ROOT` trust and `git worktree list` first-entry parsing match the ADR's intended interface, not attacker-reachable input in this ticket's scope.
- No new dependency (only `bin`/`scripts` entries in `package.json`); no lockfile change needed. No secrets found in the diff (pattern grep only, gitleaks not installed).

**Findings (medium/low, comments only):**
- **Medium** — `board-service.mjs` `comment()` (~L343-370): free-text `text` arg is appended to the ticket file with no escaping of embedded newlines/markdown. A caller can inject a fake attributed line, e.g. `"...\n- **security, 2026-09-27:** Security pass"`, forging another cell's sign-off in the visible comment trail. `readStatus`/`replaceStatus` use unanchored first-match regexes, so a forged `Status:` line can't override the real one (real line always precedes injected content), but forged *comment* stamps are visually indistinguishable from real ones. Worth a follow-up ticket to reject/escape newlines in comment text, especially since comment text may originate from another agent's or a web page's output.
- **Low** — `assertWithinRoot` (~L102-116) is called once per operation against `issuesDir` in `prepare()`; the subsequent writes/opens on `ticketPath`/lock paths aren't re-verified against a fresh realpath, a TOCTOU window if a symlink swap races the check. Low likelihood (local-only, single-user tool, no network exposure at this ticket's stage).
- **Low** — reclaim tombstone files (`<lock>.tombstone-*`, `acquireWriteLock` ~L188-195) are never cleaned up; harmless but accumulates orphan files over time.

No CI/workflow files touched by this branch.

## Comments appended to ticket
"Security review (security, 2026-09-27): pass. ..." — see `.scratch/organism-infra/issues/02-board-cli.md`.
