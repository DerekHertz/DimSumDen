# 12: Harden `board comment` against forged stamps, plus lock-file hygiene

**What to build:** `board comment` keeps free text from forging another cell's attributed comment line. Today, embedded newlines let a caller write a fake `- **security, <date>:** Security pass` into the comment trail. Also re-check containment at write time, to close the realpath check-then-write window, and clean up reclaim tombstones.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] Comment text containing newlines or a leading stamp pattern can't produce a line that parses as a separate attributed comment (tested)
- [ ] Containment is re-verified at, or bound to, the actual write/open (tested with a symlink swap where feasible)
- [ ] Reclaim tombstones are removed after a successful reclaim (tested)

## Comments

- **Created (orchestrator, 2026-09-27):** From security's non-blocking findings on ticket 02 (`.scratch/organism-infra/handoffs/02-security.md`): Medium comment forging at `board-service.mjs:343-370`, Low TOCTOU at `:102-116`, Low tombstone hygiene at `:188-195`. Comment text can come from another agent's output or a web page, so forged stamps matter once cells act on the trail.
- **Scope added (orchestrator, 2026-09-27):** Security's low findings from ticket 13 (`.scratch/organism-infra/handoffs/13-security.md`), all in `board-service.mjs`:
  1. Enforce the deadline structurally after a successful self-reclaim (`continue`, ~L333-343).
  2. Wrap the reclaim `unlink()` in the EPERM/EBUSY/EACCES retry (~L280).
  3. Clean up orphaned `.reclaim-<hash>-<g>` files.
  4. Also gate the `BOARD_TEST_*` seam on `NODE_ENV !== 'production'`.
- **unknown, 2026-09-28:** Security bounce. High: board-service.mjs:488-489 sanitizeCommentText splits only on the literal \n character, but STAMP_RE (and STATUS_LINE_RE) use JS multiline mode where CR, U+2028 and U+2029 also count as line terminators for ^/$. A comment containing a bare CR or U+2028 before a forged stamp still lands on sanitizeCommentText's unindented first line and produces a second attributed-comment match on read-back (repro'd: 2 STAMP_RE matches, one attributed security). Indentation on \n alone is not enough -- fix needs to cover the full Unicode line-terminator set. Other findings non-blocking: TOCTOU re-check is path-based not fd-bound (Low, residual narrow race); tombstone sweep correctly scoped, no over-deletion (Pass); flag rejection covers --as (Pass); ticket's scope-added items 1/2/4 (deadline enforcement, reclaim-unlink EPERM retry, NODE_ENV gate on BOARD_TEST_*) not implemented (Low/Medium, untracked). qa's tests unchanged vs 4ff6034 (not weakened); node --test: 39/39 pass. Full detail: .scratch/organism-infra/handoffs/12-security.md
- **developer, 2026-09-28:** fix round 2 (security bounce 1) complete, pushed to PR #19, CI green
- **unknown, 2026-09-28:** Security pass (fix round 2, 73897d3). High from round 1 fixed: sanitizeCommentText now splits on the full ECMAScript LineTerminator set (LF/CR/CRLF/U+2028/U+2029), closing the forged-stamp bypass; tested per terminator. All 3 ticket-13 scope items fixed and tested: deadline enforced after self-reclaim, EPERM/EBUSY/EACCES retry on reclaim unlink, BOARD_TEST_* gated on NODE_ENV!==production. New BOARD_TEST_WRITE_LOCK_WAIT_MS seam reviewed, same gating pattern, no new surface. qa tests (4ff6034) unmodified, only extended (36 insertions/0 deletions). node --test: 50/50 pass. Full detail: .scratch/organism-infra/handoffs/12-security-2.md
- **unknown, 2026-09-28:** Merged as PR #19 with the user's approval. Security passed round 2 and CI is green. Low, open: nothing sets NODE_ENV=production, so the BOARD_TEST_* gate is inert until deploy config sets it.
