# 117: apply-gated: apply exactly the bytes the user reviewed

**Type:** fix

**Priority:** P2

**Blocked by:** 108

**Status:** ready-for-agent

## What to build

Security review of 108 (handoff `108-security.md`, pass with nits) found:

1. **Medium:** `scripts/apply-gated.mjs` re-reads the patch file after the `y` prompt, so a writer to `gated/` can swap it between review and apply. Read each patch once and feed those same bytes (stdin) to `git apply --stat`, `--check`, the apply and any revert.
2. **Low:** `printable()` strips C0 and DEL but not C1 controls (U+0080–U+009F) or bidi controls (U+202A–U+202E, U+2066–U+2069), so a diff can display differently from what applies. Strip or escape those too.

Files: `scripts/apply-gated.mjs`, `scripts/apply-gated.extra.test.mjs`.

## Acceptance criteria

- [ ] A patch file replaced after the prompt is not what gets applied: the reviewed bytes are applied, or the run refuses when the file changed
- [ ] C1 and bidi control characters in a patch's name, subject or diff are not written raw to the terminal
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed from 108's security review. Finding 3 (commit runs repo hooks; only matters if `core.hooksPath` points at a tracked dir) noted, not in scope.
