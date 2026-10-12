# 220: One context budget for every cell role: warn at 100k, stop at 150k

**Type:** infra

**Priority:** P1

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Token hygiene. A cell that hits its context stop returns partial, and a fresh cell has to read the ticket's state again. The user's view (2026-10-11) is that the lower budgets cause more partial returns and cost more over a ticket than they save per call.

## What to build

Every cell role gets the same context budget: a warning at 100k tokens and a stop at 150k. The orchestrator keeps its own budget of 70k and 80k.

Today `scripts/context-budget.json` has two tiers. developer, qa and designer warn at 100k and stop at 130k. Every other role (architect, security, scout, product, herald) uses the default of 70k and 80k. Of the 25 partial returns in `.scratch/usage.jsonl` on 2026-10-11, 12 were developer, 9 qa, 2 architect and 2 designer, so the stop for developer and qa has to rise for this to change much.

- **Config.** `scripts/context-budget.json` gives every cell role warn 100000 and stop 150000. The `orchestrator` entry stays at 70000 and 80000. Whether the per-role entries stay or collapse into `default` is the developer's choice, as long as a role with no entry gets 100k and 150k.
- **Readers.** Every reader of the config follows it without a number of its own: `scripts/context-budget.mjs`, `scripts/hooks/context-budget.mjs`, `scripts/cell-start.mjs`, `scripts/context.mjs` and `scripts/statusline.mjs`. Find any hard-coded 70k, 80k, 100k or 130k among them and remove it.
- **Docs.** `docs/agents/cell-start.md` states the new numbers.
- **Gated files.** The orchestrator genome (`.claude/agents/orchestrator.md`, "Partial returns") and the `organism-protocol` skill ("Context budget") state "130k for developer, qa and designer; 80k for the others". Cells cannot edit `.claude/`. The developer writes the exact edit as a script or a diff in its handoff, and the user applies it with one command before qa verify.
- **Config row.** After the merge the orchestrator appends a `{"kind":"config",...}` row to `.scratch/usage.jsonl` with the old and new budgets, so the retro can compare partial returns before and after.

Out of scope: the orchestrator's 70k and 80k limits, and organism-infra/219 (the hook counting the parent's transcript for a scout).

## Acceptance criteria

- [ ] Failing tests first: each cell role (developer, qa, designer, architect, security, scout, product, herald) and an unknown role resolve to warn 100000 and stop 150000.
- [ ] The orchestrator still resolves to warn 70000 and stop 80000, and `cell-start` still refuses at 80k of orchestrator context.
- [ ] The hook and `cell-start` tests that pin 80k or 130k for a cell role pin the new numbers.
- [ ] No reader of the config holds a budget number of its own.
- [ ] `docs/agents/cell-start.md` states the new numbers.
- [ ] The edit for the two `.claude/` files is in the developer's handoff as one command, and the user has applied it.
- [ ] `npm test` and risk-check are green apart from known failures.

## Comments

- 2026-10-11, orchestrator: filed at the user's request. User decisions (2026-10-11): stop at 150k for all cell roles with the warning at 100k; the orchestrator keeps 70k and 80k; run it first in the session after agent-os/02 resolves.
- 2026-10-11, orchestrator: qa specify done (tests/organism-infra-220-context-budget @ 98e5d11; handoff 220-qa-specify.md). User decision (2026-10-11) on the built-in fallback in `scripts/context-budget.mjs` (used when the config file is missing or invalid): raise it from 70k/80k to warn 100000 and stop 150000 for cell roles. This overrides qa specify decision 2. The developer updates the tests that pin the old fallback (`context-budget.test.mjs` "missing file", tiers "invalid or missing config", and the `context-budget-220.test.mjs` scan that allows the two built-in literals) and lists each changed assertion in its handoff for qa verify. Orchestrator reading, not asked separately: the orchestrator still resolves to 70k/80k under a missing or invalid config, since its limits are out of scope here; flag it in the handoff if that cannot hold.
