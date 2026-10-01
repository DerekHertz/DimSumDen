```json
{
  "ticket": "organism-infra/79-route-advisory-live",
  "cell": "developer",
  "current_step": "Implemented on feat/79-route-advisory-live at f3d8a69; all qa tests pass unedited, full suite 1245/1245. Genome edit waits on the user's run of /tmp/79-claude-edits.mjs.",
  "artifacts": [
    "scripts/jev.mjs",
    "scripts/jev-report.mjs",
    "scripts/jev-advisory-cli.test.mjs",
    "docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md",
    "/tmp/79-claude-edits.mjs"
  ],
  "decisions": [
    "Advisory applies to both route halves (route and route-bounce); the CLI refuses --mode advisory for every other point (exit 2).",
    "Outcome rows get a log-only CLI point: advisory-outcome --ticket --orchestrator --jev <label|none> --user --bounced true|false. All fields are explicit, and nothing is derived from events.",
    "Scope [S1] is wired as a log-only CLI point: order --actual <ref,...>. It reads the P-level, the unblock count (unresolved same-feature tickets that list it under Blocked by) and the latest scope row from the board.",
    "jev-report's advisory section also carries bounced and orchestratorAgreed counts, which it prints on one summary line."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User runs `node /tmp/79-claude-edits.mjs` (applies the orchestrator.md genome edit and commits it in /home/dhertzell/dsd-79-dev) before qa verify",
      "owner": "orchestrator"
    },
    {
      "item": "qa verify of feat/79-route-advisory-live (light: qa specified)",
      "owner": "qa"
    }
  ]
}
```

## State

Done. The code and ADR are committed. The genome edit is scripted and waits for the user.

## What changed

Branch `feat/79-route-advisory-live`, commit `f3d8a69`, on top of qa's `dd3038b`.
- `scripts/jev.mjs`: `decide` keeps `pick` and `conf` in the result when route runs with `mode:"advisory"`. `effective` stays `orchestrator` and `applied` stays false. The CLI accepts `--mode advisory` on `route` and `route-bounce` only, and adds the log-only points `priority-verdict`, `advisory-outcome` and `order`.
- `scripts/jev-report.mjs`: `report.advisory` is always present, and `formatReport` prints the advisory route header, one agreement line per label and a summary line.
- `scripts/jev-advisory-cli.test.mjs`: 10 developer tests for the parts qa left open.
- ADR 0015: Status note plus **Amendment 1** at the end of the file.
- `/tmp/79-claude-edits.mjs`: makes three insertions in `.claude/agents/orchestrator.md`: step 5 (order row), step 6 (advisory route at the dispatch step, plus outcome logging) and the usage.jsonl rows line (new row kinds, plus priority verdicts). It checks that each anchor occurs exactly once and changes nothing otherwise. A dry run found all three anchors once each.

## Decisions made

See the State block. qa's pinned contracts are followed as written.

## Next step

The orchestrator has the user run `/tmp/79-claude-edits.mjs`, then dispatches qa in light verify on the new head.

## Suggested skills

`organism-protocol`, `code-review`

## Gotchas

- Anchoring: advisory shows the pick, so ADR 0015 decision 3's shadow claim-join agreement is now anchored for advisory rows. `routeReport` still counts them. The amendment's last bullet leaves this to the architect and the user. It is not changed here.
- Priority flags are hidden from the shadow result, so nothing shows the user a flag to rule on today. The genome line only covers logging a verdict once one is given.
- After a bounce, relay autonomy re-dispatches without asking the user, so `--user` there means the cell actually dispatched. Whether the ticket's "user approves every dispatch" should add a stop after a bounce is a question for the orchestrator and the user.
- `/code-review` was not run as parallel sub-agents, because this session can't spawn them. I self-reviewed the diff instead.
