```json
{"ticket": "organism-infra/77", "cell": "security",
 "current_step": "Done. Security bounce: one High finding (author=undefined gap in codeWakes). Two open questions ruled.",
 "artifacts": [],
 "decisions": [
   "Q1: decide() must be the last line of defense. author===undefined must code-wake (same as an unknown string author).",
   "Q2: exit 2 for a refused --tests path is acceptable and preferable. Genome wording needs updating (user permission).",
   "No new dependencies. No secrets committed. gitleaks clean on 190902c..62ace3b."
 ],
 "failures": [],
 "pending": [
   {"item": "Developer: fix codeWakes (jev.mjs:108) and ok 652 author field. One-liner.", "owner": "developer"},
   {"item": "Genome update: orchestrator.md 'always exits 0' → 'exits 0 on API/env failure; exits 2 on invalid args including refused --tests'. Requires user permission (genome change).", "owner": "orchestrator"}
 ]}
```

## State
Done. Security bounce. Released at in-review.

## Scope

Branch `dev/77-shared-exposure-module` at `62ace3b`, base `190902c`.  
Files reviewed: `scripts/exposure.mjs` (new), `scripts/jev.mjs` (rewired), `scripts/risk-check.mjs` (re-export), `apps/organism-infra/board-service.mjs` (AC5 cleanup).

## Checks

- **gitleaks**: `gitleaks detect --log-opts="190902c..62ace3b" --no-banner` — clean, no leaks.
- **npm audit**: 0 vulnerabilities.
- **No new dependencies** in this diff. Lockfile committed.
- **No CI/CD or `.github/workflows/` changes** in this diff.
- **ReDoS**: Developer ran 200k-char probe; every pattern <20 ms; quadratic URL-credential regex was fixed. Confirmed in developer handoff.
- **False-positive scan**: only positive fixtures hit (risk-check.test.mjs, ticket 08, handoff 38-security). Confirmed.

## Findings

### HIGH — `scripts/jev.mjs:108`: author=undefined reaches Jev (BOUNCE)

```
function codeWakes({ newComment, author, verdict }) {
  if (verdict || !newComment || /scope added/i.test(newComment)) return true;
  return author !== undefined && !CELL_TYPES.includes(author);  // ← line 108
}
```

When `author` is `undefined`, `author !== undefined` is `false`, so `codeWakes` returns `false` and `decide()` proceeds to call Jev with the comment text. An absent author is neither a known cell type nor parseable.

67's policy (handoffs/67-security.md, "Wake rules code must own"): *"Wake without calling Jev on: … unknown or unparseable author."* An omitted author satisfies neither the "known cell type" nor "parseable" condition.

**Fix (one line):** `jev.mjs:108`
```
// before
return author !== undefined && !CELL_TYPES.includes(author);
// after
return author == null || !CELL_TYPES.includes(author);
```

Test ok 652 (wake happy-path "includes new comment") must also add `author: "qa"` (or any CELL_TYPES member) to its decide call so the test matches the corrected guard.

### LOW — `jev.mjs` INPUTS.wake uses ticketHeader, not full ticketText for secret check

`INPUTS.wake` returns `ticketHeader(a.ticketText).slice(0, WAKE_CAP) + newComment.slice(0, WAKE_CAP)`. The secret check runs on this assembled text (correct: hasSecret runs before truncation at MAX_CHARS). The ticket header is only the `#` title line and `**Status:**` line. This is intentionally narrow per 67's design ("ticket title and Status line plus the one new comment"). Not a bug — consistent with the spec. Noted for clarity only; no action needed.

### LOW — Genome wording lag: orchestrator.md "always exits 0"

`orchestrator.md` states jev always exits 0 so a jev outage never blocks dispatch. A refused `--tests` path now exits 2. This is not a code defect — exit 2 for invalid arguments is the right behaviour — but the genome wording is stale. No security risk. Genome edit requires user permission (pass gate).

## Open questions ruled

### Q1: Must `decide()` be the last line of defense for author=undefined?

**Ruling: Yes.** `decide()` must code-wake on `author == null`, treating it identically to an unknown string author. Reasons:

1. 67's policy is unambiguous: "only a comment from a known cell type … may reach Jev." `undefined` is not a known cell type.
2. Defense in depth: if ticket 72 ever omits `author` due to a bug, the guard must catch it at the point of call, not rely solely on ticket 72's discipline.
3. Cost: one-liner fix. If `author` is truly an internal system call, ticket 72 should pass a known cell type (e.g. `author: "orchestrator"`).

The developer's interpretation — `undefined` = programmatic internal = trusted — is reasonable intent but not an adequate security boundary when the function's input includes untrusted `newComment` text from agents.

### Q2: Acceptable for a refused `--tests` path to exit 2?

**Ruling: Exit 2 is acceptable and preferred. No change to the exit code.** The genome wording must be updated (user permission needed).

The genome's "always exits 0" was about Jev API or environment failures (TypeSafe down, no key, cap hit, usage-read error). Those remain exit 0 and fallback. A refused `--tests` path is an invalid-argument error — the caller passed something the CLI declared it would not accept. Exit 2 for invalid arguments is the existing convention (bad ticket, bad mode) and surfaces misconfiguration early before any board row is written.

Operational implication: test output saved under `.claude/worktrees/...` or any hidden path will be refused. Orchestrators and the verify flow must write test output to `/tmp/<slug>-tests.txt` or a non-hidden path. The genome note in developer's handoff (§"For the orchestrator") is the right place to record this; the genome update needs the user's yes.

## Verdict

**Security bounce.** One High finding: `jev.mjs:108` — `undefined` author bypasses the code-wake guard and reaches Jev in violation of 67's policy. Fix is a one-liner; one test update. Everything else passes.

## Next step

Developer: fix `jev.mjs:108` (`author == null || !CELL_TYPES.includes(author)`) and update ok 652 to pass `author: "qa"`. Re-run `npm test`. Then qa light-verify. Then security re-reviews (fast — one-line diff).

Orchestrator (pending user permission): update `orchestrator.md` "always exits 0" wording.

## Failed calls
None.

## Worktree receipt
Worktree: `/home/dhertzell/dsd-77-verify` — clean (security made no product code changes).
