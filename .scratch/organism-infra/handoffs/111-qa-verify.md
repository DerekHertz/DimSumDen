# qa verify: organism-infra/111-gate-notifications (batch M)

```json
{
  "ticket": "organism-infra/111-gate-notifications",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify passed: all 1880 tests pass unchanged, gated patch verified, all acceptance criteria mapped to passing tests.",
  "artifacts": [
    "branch feat/batch-m-hooks @ a1e49c4",
    "scripts/notify.mjs (developer)",
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
      "item": "Eyeball a real Windows toast to confirm delivery.",
      "owner": "orchestrator"
    }
  ]
}
```

## Light verify results

All tests pass: 1880/1880 (0 failed, 0 skipped). Gated patch touches only `.claude/settings.json` and correctly points to scripts/notify.mjs. All acceptance criteria have passing tests.

## Acceptance criteria coverage

| AC | Test file: test names |
|---|---|
| Notification events raise toast with message | notify.test.mjs: "AC1: Notification event raises...", "AC1: every Notification toasts..." |
| Stop raises toast only for new gates; same gate never notifies twice | notify.test.mjs: "AC2: Stop with no gate...", "AC2: Stop with ready-for-human...", "AC2: same gate never notifies...", "AC2: new gate after earlier...", "AC2: gate that cleared...", "AC2: Notification does not consume..." |
| No powershell falls back to bell, exits 0 | notify.test.mjs: "AC3: no powershell: Notification...", "AC3: no powershell: Stop...", "AC3: powershell failing..." |
| No model call | notify.test.mjs: "robustness: empty, malformed...", "AC4: no model or network call" |
| Settings patch in gated/ | human-verified in .scratch/_handoffs/gated/01-batch-m-settings.patch |
| npm test green | 1880/1880 |

## QA pass
