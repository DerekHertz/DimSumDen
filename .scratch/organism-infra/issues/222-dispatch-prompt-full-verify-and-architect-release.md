# 222: `dispatch-prompt.mjs` cannot ask for full verify, and tells an architect design hop to release at `in-review`

**Type:** bug

**Priority:** P3

**Blocked by:** None

**Status:** parked

**Serves:** Retro 2026-10-11 (agent-os/07 relay). The orchestrator pastes `dispatch-prompt.mjs` output as printed and never hand-writes those lines. Twice in one relay the printed lines were wrong and it had to work around them.

## What to build

- **Full verify after an escalation.** The script prints "Verify mode: light" whenever a qa specify handoff exists. When light verify escalates, the next qa dispatch must be full verify, and no flag asks for it. On agent-os/07 the orchestrator added an override sentence under the printed lines. Add a way to ask for full verify (for example `--mode verify-full`, or `--full`), so the printed line says full.
- **Architect design hop on a code ticket.** For `--cell architect` on a ticket whose code is not built yet, the script printed a release at `in-review`. On agent-os/07 the orchestrator set the status back to `ready-for-agent` by hand before the developer dispatch. Print a release that keeps the status (`--keep-status`) for that hop, or the status the next cell needs.

## Acceptance criteria

- [ ] Failing tests first: with a qa specify handoff present, the full-verify option prints a full verify line and no light verify line; without the option the output is unchanged.
- [ ] Failing tests first: an architect dispatch on a ticket that is not yet built prints a release that leaves the ticket dispatchable to a developer.
- [ ] Failing tests first: with a qa specify handoff present, the script prints full verify without the option when the ticket has a process-only acceptance criterion (for example "full `security` reviews the branch") or the qa specify handoff's `pending` names an untested path; otherwise it still prints light.
- [ ] The orchestrator genome names the new option where it describes the qa verify dispatch (a gated `.claude/` edit: the developer writes the patch into its handoff).
- [ ] `npm test` is green apart from known failures.

## Comments

- 2026-10-11, orchestrator: filed from the retro on the user's yes (2026-10-11). Two incident rows dated 2026-10-12 on agent-os/07-grant-hardening in `.scratch/usage.jsonl`.
- 2026-10-12, orchestrator: widened from the retro on the user's yes (2026-10-12). The light verify escalated again on agent-os/09 for the same two reasons as on 07: a process-only criterion and an untested path that qa specify had flagged. The third criterion above makes the script choose full verify up front in those cases, so no Haiku cell is spent on an escalation.
- **orchestrator, 2026-10-12:** Parked: Held on the user's yes (2026-10-12 scope check): refocus guardrail, pipeline tickets only from a third repeat incident. Unpark when the cause repeats a third time.
