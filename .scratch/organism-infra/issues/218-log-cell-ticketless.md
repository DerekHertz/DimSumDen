# 218: `log-cell` logs ticketless runs

**Type:** bug

**Priority:** P3

**Blocked by:** None

**Status:** ready-for-agent

**Serves:** Spend accuracy. `log-cell` (and `jev route`/`tier`) require a real ticket ref, so subagent runs not tied to a ticket (README capture scouts, survey scouts) can't be logged. This happened twice (2026-10-01, 2026-10-08); the second time left two Haiku scout runs, about 58k tokens, out of the trial measures.

## What to build

`node scripts/log-cell.mjs --ticket none ...` writes the cell row with `"ticket": null`, keeping every other field and check (model, tokens, ms, `--transcript` totals). A ticketless row is not counted toward any ticket's totals, but it shows up in `npm run spend` under its role.

## Acceptance criteria

- [ ] `--ticket none` writes one row with `ticket: null`, with the same token/model fields a ticketed row has (test).
- [ ] An unknown ref other than `none` is still refused (test).
- [ ] `npm run spend` includes ticketless rows in the per-role totals and leaves them out of per-ticket totals (test).
- [ ] `npm test` is green.

## Comments
- **orchestrator, 2026-10-08:** Filed from the retro on the user's yes (2 repeats).
