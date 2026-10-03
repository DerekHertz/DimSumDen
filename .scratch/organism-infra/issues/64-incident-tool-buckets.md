# 64: Disambiguate "other" in incidents by tool

**Type:** feature

**Priority:** P3

**What to build:** `scripts/metrics.mjs` maps free-text incident `tool` values onto 11 buckets by exact match, so "other" swallows most rows (15 literal `other` plus ~70 free-text misses on 2026-09-30). Normalize before matching (lowercase, spaces to dashes: `board release` → `board-release`), add buckets for what actually occurs (`cell-start`, `risk-check`, `jev`, `usage`, `browser`, `dispatch`, `guard`, `shell`, `process` for judgment/rule mistakes), validate `tool` against the enum when incidents are written, and keep TOOLS in step with `scripts/log-cell.mjs`.

**Blocked by:** None

**Status:** closed

- [ ] Normalized and new buckets map today's `usage.jsonl` so "other" is a handful (test against a fixture of real rows)
- [ ] Writing an incident with an unknown `tool` is refused with the allowed list (test)
- [ ] The Tally incidents-by-tool chart shows the new buckets

## Comments
- **Idea (user, 2026-09-30):** logged as a low-priority idea.
- **orchestrator, 2026-10-03:** Closed: hand-written logging rituals dropped (refocus, docs/refocus/triage-2026-10-02.md)
