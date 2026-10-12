# 04: User-only entry point `queue-admin`

**Type:** code

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** 02

**Status:** in-review

**Serves:** `.scratch/queue/spec.md` decisions 3, 7 (admit); ADR 0015 Amendment 3.

**Security:** full `security` review (permission boundary).

## What to build

Only the user sets the active feature or admits a refused ticket, through `npm run queue-admin`. Design: ADR 0015 Amendment 3 and `.scratch/queue/handoffs/01-architect.md` (Q3).

- `scripts/queue-admin.mjs` with `active <feature>` and `admit <ref> --reason "<why>"`. Each asks for a `y` on stdin before it writes.
- `active` writes a `queue_active` config row; `admit` writes a `queue-admit` row; both carry `by: user`.
- The Queue (`apps/organism-infra/frontier-queue.mjs`) reads both rows.
- `.claude/settings.json` is gated: write the two deny rules from the architect's handoff as a patch in the developer handoff and stop there. Ticket 07 applies it.

## Acceptance criteria

- [ ] `queue-admin active <feature>` with `y` on stdin writes one `queue_active` row; without `y`, or with empty or non-TTY stdin, it writes nothing and exits nonzero.
- [ ] `queue-admin admit <ref> --reason` behaves the same way and refuses a missing reason.
- [ ] `board queue` puts the active feature's tickets in the active tier and treats an admitted ticket as admitted.
- [ ] The settings deny patch is in the handoff, not applied.
- [ ] The handoff states the result of testing, in the main session, whether the user's `!npm run queue-admin ...` runs when the deny rules are in place (the architect did not prove it). If it cannot be tested before ticket 07, the handoff says so.

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q3) on the user's approval. Do not run at the same time as ticket 03. The user ruled that den-v1 is the active feature; it is set in ticket 08, not here.
- **orchestrator, 2026-10-12:** user rulings on the three scope questions in `04-qa-specify.md`, settled before the developer starts. (1) `admit` refuses a `<ref>` that is not a real ticket: it writes nothing and exits nonzero. (2) The Queue ignores a `queue_active` or `queue-admit` row that does not carry `by: "user"`. (3) With no `--root`, `queue-admin` writes to the main checkout, resolved the way the board resolves it; `--root` still wins. The qa specify tests do not cover (1) and (2) and pin cwd for (3): the developer adds or adjusts those tests test-first and names each change in the handoff, and qa verify checks them.
- **qa, 2026-10-12:** QA bounce (light verify): scripts/queue-admin.test.mjs:96 loosens the .scratch listing check via the allow list. Make it exact after putTicket. Details in handoffs/04-qa-verify.md.
- **qa, 2026-10-12:** QA pass (light verify, round 2). Step 1 saved suite 4382 pass, 0 fail, 0 skipped. Step 2: no removed or loosened assertion; the round 1 allow list is now an exact .scratch snapshot (scripts/queue-admin.test.mjs:99). Step 3: every criterion and ruling mapped. Step 4: scripts/queue.test.mjs is outside scope (by:user fixtures only). Handoff 04-qa-verify-2.md.
