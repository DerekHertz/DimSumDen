# 03: `scripts/metrics.mjs --json`

**Type:** feature

**Priority:** P0

**What to build:** Per `.scratch/dimsumden-ui-v0/spec.md`: print throughput (tickets resolved per 5-hour window), tokens per resolved ticket by cell type, incidents per ticket by tool (map older free-text tools onto the fixed list in `scripts/log-cell.mjs`), and the latest usage %. Derive from `usage.jsonl` and `events.jsonl` only. Text output without `--json`.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] Fixture `usage.jsonl`/`events.jsonl` produce an expected JSON with the four keys (test)
- [ ] Malformed lines are skipped, not fatal (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** QA pass: 414/414, no skips, specify tests unchanged, all criteria mapped, only scripts/metrics.mjs added.
- **security, 2026-09-29:** Security pass. gitleaks clean; read-only script, no shell/network/write. Low: scripts/metrics.mjs:51-54 cell name __proto__/constructor crashes (TypeError, no pollution); scripts/metrics.mjs:113-118 raw row strings in text output. Non-blocking. See handoffs/03-security.md.
