# 102: Context step reads a ticket's `## What to build` heading

**Type:** bug

**Priority:** P2

**Blocked by:** organism-infra/97-jg-resource-limit-full-root (same file; sequence after batch K merges)

**Status:** resolved

## What to build

`parseTicket` in `scripts/dispatch-context.mjs` (line 49) takes the ticket text only from a bold `**What to build:**` line. Real board tickets use a `## What to build` heading, so every live context run sends jg the fixed question with no ticket text. For the same reason, the skip when a ticket names two paths never fires on real tickets. Make `parseTicket` read the section under a `## What to build` heading, up to the next `## ` heading, and keep the bold-line form working. Point any existing `Files:` or path detection at the same section.

Files: `scripts/dispatch-context.mjs`, `scripts/dispatch-context.test.mjs`.

## Acceptance criteria

- [ ] A ticket with a `## What to build` heading has that section's text, and nothing from `## Acceptance criteria` or `## Comments`, in the jg query (test)
- [ ] The bold `**What to build:**` form still works (existing tests stay green)
- [ ] A heading-form ticket that names two paths triggers the two-named-paths skip (test)
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Found by the batch K developer during 97's live AC1 run (handoff 97-developer-2.md). Filed on the user's yes.
- **qa, 2026-10-03:** All 1968 tests pass (0 skipped). 7 [102] tests cover all 4 ACs. Only scripts/dispatch-context.mjs changed (in scope). Tests untouched.
- **security, 2026-10-03:** Security pass. No critical/high. Low: dispatch-context.mjs:55 section text now reaches jg query (capped 1,500 chars, argv spawn, no shell). gitleaks clean. See handoffs/102-security.md.
- **orchestrator, 2026-10-03:** merged 046249a; security pass (2 low notes), CI green
