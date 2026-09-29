# 51: `board handoff` validates the State block at publish time

**Type:** feature

**Priority:** P0

**What to build:** Today a bad State block is accepted by `board handoff` and only rejected later by `board release`, so the cell has already moved on. Happened 3 times in session 8 (45 developer, 45 qa verify, 49 qa specify). `board handoff <ref> --from <file> --name <n>` runs `validateState` from `apps/organism-infra/schemas.mjs` before publishing. On failure it publishes nothing, exits non-zero, and prints each problem plus the schema example from the `handoff` skill. From pipeline-retro, 2026-09-29.

**Blocked by:** None (can start immediately).

**Status:** claimed

- [ ] An invalid State block (missing field, `pending` as strings) is refused at publish, nothing is written, and stderr shows the problems and the example (tests)
- [ ] A valid block publishes as today (test)
- [ ] `scripts/cell-start.mjs --base <sha> --branch <name>` works when the branch already exists (the developer after qa specify): it checks it out and fast-forwards to `--base`, refusing if that isn't a fast-forward (tests). Added 2026-09-29 from 50's developer.
- [ ] `log-cell.mjs` refuses to write a cell row unless the ticket has a handoff whose State block `cell`/`mode` match `--cell`/`--mode` and was published within the last 24 hours. Stderr names the missing handoff so the orchestrator sends the cell back. An `--allow-no-handoff "<reason>"` escape logs the reason in the row. (tests) Added 2026-09-29: two cells in a row (49 qa verify, 50 qa specify) finished without claiming or handing off, and it was caught only by reading their reports.

## Comments

- **Created (orchestrator, 2026-09-29):** pipeline-retro fix #2, approved by the user.
- **orchestrator, 2026-09-29:** Retro 2026-09-29 (user-approved): raised to P0, before dimsumden-ui-v0/04. Scope added: (a) board handoff fills cell/mode from the claim lock when missing and rejects a file with no JSON State block at publish; (b) the lock holder may overwrite its own earlier draft instead of getting 'different cell/mode' (6 incidents across tickets 02-03 left stray 02-developer.md, 02-qa-verify.md, 03-security.md); (c) scripts/usage.mjs prints 'run claude /login' on HTTP 401.
- **qa, 2026-09-29:** qa specify: failing tests on organism-infra/51-tests @ 6e4bd79; see handoffs/51-qa-specify.md. No human-verified criteria.
