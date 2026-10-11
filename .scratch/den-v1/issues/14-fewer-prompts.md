# 14: Fewer permission prompts for den-started agents

**Type:** feature

**Priority:** P1

**Blocked by:** den-v1/13 (merge)

**Status:** ready-for-human

**Serves:** Den loop step 4. Live run 5 (den-v1/13) needed seven approvals for a one-line task; the user asked for fewer (2026-10-10).

## What to build

Two steps, decided by the user (question tool, 2026-10-10): allowlist first, then try auto mode.

1. **Allowlist.** The adapter's inline settings allow routine calls unasked for den-started agents, with the default permission mode kept:
   - `Read` anywhere in this repo's main checkout.
   - The board CLI as the agent actually calls it: `node apps/organism-infra/board.mjs …` (the project settings already allow the `npm run board` forms).

   Anything else still raises a request. The four deny rules stay and still win.
2. **Auto mode, live check only.** Run the real CLI with `--permission-mode auto` under the bridge and record what happens: does it run headless with the stdio permission prompt on this plan, and does what it escalates still show in Needs you. Report to the user. It becomes a default only if the user says so.

## Rules

- ADR 0016 decision 6 holds: no client string reaches argv or the prompt template.
- Only `apps/bridge/cells/claude-adapter.mjs` names a Claude flag or message shape.
- No change under `.claude/`. If one is needed, write it as a gated patch for the user.
- The allow rules are built from the bridge's own root path, never from the task text.

## Acceptance criteria

- [ ] A failing adapter test first (`claude-adapter.test.mjs`): the inline settings carry the two allow rules, built from the repo root, beside the ticket-file rule.
- [ ] A test shows a Read outside the repo, and a Bash call that is not the board CLI, still raise a request.
- [ ] A test shows the deny rules (`git push`, `gh pr create`, and the other two) are unchanged.
- [ ] `npm run smoke:live`: a Read of a main-checkout file and a board CLI call raise no request on the real CLI; the fixtures are recorded.
- [ ] An ADR 0016 amendment records the allow rules and why.
- [ ] Step 2's finding is written here as a comment, with the recorded stream, before any default changes.
- [ ] `npm test`, risk-check and gitleaks are green apart from known failures.

## Open questions

- Does a Bash allow rule for `node apps/organism-infra/board.mjs` match when the agent runs it from its worktree with a relative path, an absolute path, or both? The live check settles the rule's wording.
- The agent wrote its handoff under `/tmp` in run 5, which raised a request. Whether to allow one handoff path is not decided.

## Comments

- 2026-10-10, plain session (Opus 5.5): filed from den-v1/13's "Next" section. Not started. After this ticket, the plan is a scoping ticket for the testbed (ADR 0019 decision 9): what it takes to point the den at one small real repo.
