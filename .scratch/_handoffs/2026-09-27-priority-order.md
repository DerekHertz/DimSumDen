# Priority order (user-approved, 2026-09-27)

An efficient organism loop comes before animation polish. The base panda (ticket 03) is good enough to get the office up; animations get refined afterwards.

1. `character-animation/07`: close out as is (qa verify, security, merge). Its polish went to `character-animation/11`. **Done (PR #7).**
2. `ci-cd/02`: dev server (`.mjs` MIME type, no-store) plus the headless UI smoke check. **Done (PR #9).**
3. `organism-infra/08` (**done, PR #10**), `09` (**done, PR #11**), `10` (**done, PR #12**): token savings (risk-sized review, trimmed tools, session and report rules). Moved up by the user on 2026-09-27: they're cheap and cut the cost of every later ticket.
4. `organism-infra/01` → `02` → `11`: board ADR (CLI-only, no board IPC until parallel cells), `board` CLI, then the daemon↔UI↔cell channel design. `03` (daemon board service) is parked.
5. `organism-infra/05`: dispatch onto an existing branch, and worktree cleanup. Critical path with 02 and 11 (user, 2026-09-27): once they land, UI tickets can start; ci-cd/01 runs alongside them.
6. `ci-cd/01`: CI pipeline.
7. `organism-infra/04`: Jev. The user has access (2026-09-27). Discuss integration with the user once the loop works, then design.
8. Product MVP slice: the office up and running (`_handoffs/2026-09-27-new-scope-for-product.md`).
9. Then animation: `character-animation/05`, `06`, `08`, `09` (**done, PR #11**), `10`, `11`.

Fit in anywhere, when no cell is running: `organism-infra/06` (the user moves the repo to NVMe, after `ci-cd/02` merges) and `07` (disposable caches on `E:`).

**Parked (user, 2026-09-27):** Pipeline telemetry (`.scratch/pipeline-telemetry/spec.md`, brain gates decided) goes after step 8. Only its cell/ticket tag moves up, folded into `organism-infra/10`. The user's focus: get the agent loop wired up so development runs through the harness; no side quests ahead of steps 3-6.
