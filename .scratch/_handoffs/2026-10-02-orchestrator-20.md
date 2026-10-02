# Orchestrator handoff 20 (2026-10-02, pre-compact)

## In flight
- **organism-infra batch K (97+91)**, branch feat/jg-limit-batchK at ba57b9a (91 done). qa is re-specifying the 4 `[97] fix` tests (handoff 97-qa-specify-2.md). On return, log the cell from the notification, then: `jev tier`, then the developer fix round on that branch (cell-start --detach at the new qa sha, `git checkout feat/jg-limit-batchK`, `npm ci`). jg 0.8.0 is now installed (env fix done). Then qa verify, risk-check, and full security (the jg.mjs allowlist change). One PR resolves both.
- **den-scene-v1/07**, feat/floating-cards07 at f787331. qa light verify passed (07-qa-verify-4.md). Next: risk-check (scout), PR, merge on green, resolve. The user looked at it live and is happy with the overlays. Open: whether the designer should look at the 600–709 and 900–959px bar and at the jump from centred at 900 to x=160 at 899. Ask the user, or merge.

## Decisions this stretch
- Batch K approved; 91 stays in the batch. 97 scope: excludes for files over 16 MiB, `--max-output-bytes` added to the allowlist, version check wired in.
- 07: N1 fixed in 07. N2 (Gated chip contrast) went to den-scene-v1/13.
- Filed organism-infra/101 (usage meter at 90%) and den-scene-v1/14 (scene haze, needs-triage; the user confirmed the haze live).

## Queue
90, 98, 101, 03, batch L (99+89), 100, 13, 14, 88.

## Cleanup
Harness-locked reviewer worktrees: agent-ab2a8ee2, a49b9036, a8aefdc1, a48bbfad. tests/ worktrees for 07 and K are left until their PRs merge.

## Readings
5-hour 64%, weekly 46%, context about 80k.
