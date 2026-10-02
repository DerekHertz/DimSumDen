# qa verify: organism-infra/110-sessionstart-pickup (batch M)

```json
{
  "ticket": "organism-infra/110-sessionstart-pickup",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify passed: all 1880 tests pass unchanged, gated patch verified, all acceptance criteria mapped to passing tests.",
  "artifacts": [
    "branch feat/batch-m-hooks @ a1e49c4",
    "scripts/session-start.mjs (developer)",
    "scripts/hook-io.mjs (helper, shared with 109/110/111)"
  ],
  "decisions": [],
  "failures": [],
  "pending": [
    {
      "item": "Apply the gated patch (.scratch/_handoffs/gated/01-batch-m-settings.patch) with !npm run apply-gated.",
      "owner": "orchestrator"
    },
    {
      "item": "Confirm SessionStart plain stdout reaches the orchestrator's context.",
      "owner": "orchestrator"
    }
  ]
}
```

## Light verify results

All tests pass: 1880/1880 (0 failed, 0 skipped). Gated patch touches only `.claude/settings.json` and correctly points to scripts/session-start.mjs. All acceptance criteria have passing tests.

## Acceptance criteria coverage

| AC | Test file: test names |
|---|---|
| Names latest handoff, open PRs with check state, pending requests, usage | session-start.test.mjs: "AC1: for the orchestrator...", "AC1: asks gh for...", "AC1: latest handoff chosen...", "AC1: no orchestrator handoff...", "AC1: runs for startup..." |
| Output < 400 tokens; graceful degradation on gh/usage failure | session-start.test.mjs: "AC2: gh failure...", "AC2: missing gh...", "AC2: hanging gh...", "AC2: failing usage...", "AC2: hanging usage...", "AC2: malformed stdin...", "AC2: output stays under 400 tokens..." |
| Non-orchestrator sessions get no output | session-start.test.mjs: "AC3: other cells get no output...", "AC3: session with no agent_type..." |
| Settings patch in gated/ | human-verified in .scratch/_handoffs/gated/01-batch-m-settings.patch |
| npm test green | 1880/1880 |

## QA pass
