# Handoff: queue/06-retire-old-order (developer)

```json
{
  "ticket": "queue/06-retire-old-order",
  "cell": "developer",
  "current_step": "Old frontier order retired and queue.mjs switched to buildQueue; committed on tests/queue-06-retire-old-order. Next: qa verify (light, qa specified), then npm run risk-check.",
  "artifacts": [
    "branch tests/queue-06-retire-old-order",
    "scripts/jev.mjs (rankFrontier, orderRow, frontierTickets, the `order` log point and usage text removed)",
    "scripts/queue.mjs (readQueue now async; ready order and rank from buildQueue(loadSnapshot(root)); jev-order no longer read)",
    "apps/organism-infra/priority.mjs (aging bump removed; return shape kept)",
    "docs/agents/issue-tracker.md (Frontier bullet describes the Queue order)",
    "removed tests: scripts/jev-order.test.mjs (file), rankFrontier cases in scripts/jev-scope.test.mjs, orderRow cases in scripts/jev-advisory-report.test.mjs, order CLI cases in scripts/jev-advisory-cli.test.mjs",
    "stale comments fixed in apps/bridge/bridge-fixture.mjs and apps/ci-cd/smoke-ui.mjs"
  ],
  "decisions": [
    "queue.mjs: a ready ticket that buildQueue does not order (a blocker closed or parked, or a blocker ref not on the board) is ranked after the ordered ones, in board order (priority, feature, number), as qa asked. Locked ready-for-agent tickets stay in flight and take no rank.",
    "priority.mjs orderFrontier keeps { ref, priority, effectivePriority, bumps, bumped } with bumps 0 and bumped false; the only caller (apps/bridge/snapshot.mjs) still reads those fields, so it needed no change. handoffTimestamps stays a parameter and is unused (snapshot passes it and reports its length as `sessions`).",
    "jev.mjs logPointRow lost its unused root and usageRows parameters."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify. The stale `.claude/agents/orchestrator.md` and `.codex/agents/orchestrator.toml` still name `jev.mjs order`; that is ticket 07 (gated patch).",
      "owner": "qa"
    }
  ]
}
```

## Readers of jev-order rows, full-repo search (criterion 4)

Search: `grep -rn "jev-order|rankFrontier|orderRow"` over the whole checkout excluding node_modules, .git, usage.jsonl and events.jsonl.

Code (now none):
- `scripts/queue.mjs` was the only code that read the rows (`proposedOrder`). Removed; it now uses `buildQueue`.
- `scripts/jev.mjs` was the writer (`orderRow`, `order` point). Removed.

Tests (removed or rewritten): `scripts/jev-order.test.mjs` (deleted), `scripts/jev-scope.test.mjs`, `scripts/jev-advisory-report.test.mjs`, `scripts/jev-advisory-cli.test.mjs` (order cases deleted). `scripts/queue.test.mjs` now plants a jev-order row only to show it is ignored; `scripts/retire-old-order.test.mjs` scans for leftovers.

Docs and prose that still name it (history or other tickets, left alone):
- `docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md` (Amendment 3 describes the retirement).
- `.claude/agents/orchestrator.md` and `.codex/agents/orchestrator.toml` (the genome tells the orchestrator to run `jev.mjs order` and log a row): fixed by ticket 07, gated patch. Until then the command exits 2 and logs nothing.
- `.scratch/_codex-backup-2026-10-02/.codex/agents/orchestrator.toml`, `.scratch/_handoffs/gated/applied/*.patch` and `*.stale` (applied history).
- Board history under `.scratch/`: queue spec, tickets 01 and 07, `handoffs/01-architect.md`, `organism-infra` tickets and handoffs (71, 79, 136, 147, 212), `_handoffs/*orchestrator*`, `_context/organism-infra/*`, `.scratch/kanban/spec.md`.
- Not searched by text: `usage.jsonl` and `events.jsonl` themselves (jev-order rows stay as history). The bridge reads neither for these rows (`grep jev-order apps/` is empty).

## Run

- `npm test` full run on the commit (6d1098f): 4312 pass, 0 fail, 0 skipped (scout and my own run agree). smoke:ui passed in the full run.
- `apps/ci-cd/smoke-ui.test.mjs` run alone: 4 pass, so the UI snapshot builds and the head order 02, 07, 08 holds.
- Targeted: retire-old-order, queue, mods-queue, jev-scope, jev-advisory-report, jev-advisory-cli, priority, bridge-state: all pass once the deletions are staged (the AC1 scan uses `git ls-files`).

## Not proven

- The `/queue` slash command and the mods band were not driven live; their JSON contract (`proposed` shape) is covered by mods-queue.test.mjs.
