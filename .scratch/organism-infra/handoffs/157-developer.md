```json
{
  "ticket": "organism-infra/157-usage-reset-local-time",
  "cell": "developer",
  "current_step": "resets_local implemented and committed on feat/157-usage-reset-local-time (d4ea005); the 59 targeted tests pass. The usage-watch skill edit is a gated patch awaiting the user.",
  "artifacts": ["scripts/usage-local-time.mjs", "scripts/usage-claude.mjs", "scripts/usage-codex.mjs", ".scratch/_handoffs/gated/157-usage-watch-resets-local.patch"],
  "decisions": [
    "Shared helper toLocalReset in scripts/usage-local-time.mjs: Intl.DateTimeFormat en-US, hourCycle h23, system zone, short zone name; returns null for missing, null, empty or unparseable input.",
    "resets_at is untouched in both adapters (claude passes w.resets_at ?? null; codex keeps toISOString)."
  ],
  "failures": [],
  "pending": [
    {"item": "User applies the usage-watch skill patch with !npm run apply-gated (AC4).", "owner": "user"},
    {"item": "qa verify (light) then risk-check.", "owner": "qa"}
  ]
}
```

## State
Implementation done and committed. Ticket released at in-review.

## What changed
- New `scripts/usage-local-time.mjs` exporting `toLocalReset(resetsAt)`, which gives `YYYY-MM-DD HH:MM <abbr>` in the system zone (e.g. `2026-10-06 00:00 PDT`).
- `scripts/usage-claude.mjs` and `scripts/usage-codex.mjs` add `resets_local` to each window.
- `node --test scripts/usage-reset-local.test.mjs scripts/usage-keychain.test.mjs scripts/usage-provider.test.mjs`: 59 pass, 0 fail. Full `npm test` result is in my report.

## AC4: usage-watch skill edit (gated)
Patch: `.scratch/_handoffs/gated/157-usage-watch-resets-local.patch` (checked with `git apply --check`). The user runs `!npm run apply-gated`. It makes two edits to `.claude/skills/usage-watch/SKILL.md`:
1. After "Both providers retain the canonical ... window fields." it adds: each window also carries `resets_local`, the same instant in the system time zone with its abbreviation (e.g. `2026-10-06 00:00 PDT`), or `null` when unknown; `resets_at` stays the canonical UTC value for machine readers.
2. In the 90-94% row, "Tell the user the percentage and when it resets." becomes "... and when it resets, quoting `resets_local` (their own time zone), not the UTC `resets_at`."

## Next step
qa verify (light), then `npm run risk-check`.
