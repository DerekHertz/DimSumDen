# 217: `board claim` accepts `--cell`

**Type:** bug

**Priority:** P3

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Testbed friction. `board claim` was called with `--cell` (or `--as`) four times since 2026-10-02 (incidents in `.scratch/usage.jsonl`, `"tool":"board-claim"`/`"board"`), by cells and by the orchestrator. On `claim` the cell is positional (`claim <ref> <cell>`), but `board handoff --template` takes `--cell <type>`, so the CLI is inconsistent and the flag gets guessed. The failed claim has led to handoffs published with no claim and to releases with no handoff.

## What to build

1. `board claim <ref> --cell <type>` works the same as `board claim <ref> <type>`.
2. Any unknown flag on `claim` (for example `--as`) is refused with a non-zero exit and a message that prints the correct usage. It is never silently ignored.

## Acceptance criteria

- [ ] `board claim <ref> --cell qa` claims exactly as `board claim <ref> qa` does (test).
- [ ] `board claim <ref> --as qa` exits non-zero and prints the usage line, with no lock written (test).
- [ ] Giving the cell both positionally and with `--cell`, with different values, is refused (test).
- [ ] `npm test` is green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the retro on the user's yes (4 repeats, no earlier rule change).
