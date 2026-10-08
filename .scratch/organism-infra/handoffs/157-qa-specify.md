```json
{"ticket": "organism-infra/157-usage-reset-local-time", "cell": "qa", "mode": "specify",
 "current_step": "Failing tests committed on tests/157-usage-reset-local-time (8414c48); 12 of 13 new tests fail for the missing resets_local field.",
 "artifacts": ["scripts/usage-reset-local.test.mjs", "scripts/usage-keychain.test.mjs", "scripts/usage-provider.test.mjs"],
 "decisions": [
  "Format pinned: 'YYYY-MM-DD HH:MM <abbr>' (e.g. '2026-10-06 00:00 PDT'), 24-hour clock; abbr from the system zone (PDT/PST, UTC).",
  "Unknown or unparseable reset time: resets_local is null (not absent, not 'Invalid Date'); resets_at is passed through unchanged.",
  "Existing tests usage-keychain and usage-provider deep-equal whole windows, so adding resets_local would break them. I extended their EXPECTED values with resets_local and pinned TZ=America/Los_Angeles in their env (a strict addition, nothing loosened).",
  "Cloud estimate path (usage-estimate.mjs) has no resets_at, so it is out of scope and untested."
 ],
 "failures": [],
 "pending": [{"item": "Implement resets_local in scripts/usage-claude.mjs and scripts/usage-codex.mjs (a shared helper is fine); write the exact usage-watch skill edit in the developer handoff for the user to apply (.claude/ is gated).", "owner": "developer"}]}
```

## State
Partial by design: tests written and red, awaiting implementation.

## What changed
Branch `tests/157-usage-reset-local-time`, commit 8414c48 on base 3a917d9. Tests only; no product code.

## Criterion-to-test map
Ticket AC1 (resets_local in system zone, resets_at byte-for-byte unchanged), in `scripts/usage-reset-local.test.mjs`:
- "AC1 claude: each window carries resets_local ... (PDT)"
- "AC1 claude: the ticket example ... 2026-10-06 00:00 PDT"
- "AC1 codex: each window carries resets_local ..."
- "AC1 claude: resets_at is passed through byte-for-byte, even when not canonical ISO" (raw stdout substring check)
- "AC1 codex: resets_at stays the canonical UTC ISO string" (already green; regression guard)
- "AC1: percent and every other existing key are unchanged; resets_local is the only added key"

Ticket AC2 (fixed TZ across a DST change, plus missing reset time):
- Autumn DST claude and codex (repeated 01:30 as PDT then PST), spring DST claude (01:59 PST, 03:00 PDT)
- "the zone is the system zone" (TZ=UTC gives 'UTC')
- missing reset key, explicit null, unparseable string (all give resets_local null)

Ticket AC3 (existing readers of resets_at still pass): `scripts/usage-keychain.test.mjs` and `scripts/usage-provider.test.mjs` (existing assertions, EXPECTED extended). Other readers (statusline, hook-io, conformance) only read resets_at and are untouched.

Ticket AC4 (usage-watch skill edit written in the handoff for the user to apply): human-verified. It is a `.claude/` edit and cannot be tested automatically; the developer handoff must carry the exact change (or a patch under `.scratch/_handoffs/gated/`).

## Next step
developer: make `npm test` green. Run `node --test scripts/usage-reset-local.test.mjs scripts/usage-keychain.test.mjs scripts/usage-provider.test.mjs` first.

## Suggested skills
tdd, implement, organism-protocol.

## Gotchas
- Use Intl with the system zone (TZ env); a hard-coded zone fails the TZ=UTC test. Short zone names from `Intl` in en-US give PDT/PST/UTC; en-US 24-hour clock may render midnight as '24:00' with hour12:false, so use hourCycle 'h23'.
- Codex passes `resetsAt` as epoch seconds and already emits ISO; derive resets_local from the same Date.
