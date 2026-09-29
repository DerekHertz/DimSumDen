```json
{"ticket":"organism-infra/49-verdict-roles-and-claim-status","cell":"security","current_step":"review done at 86fd86e, Security pass","artifacts":[],"decisions":["Security pass: no critical or high","gitleaks origin/main..86fd86e: no leaks","Requiring a claim lock for --verdict rated low: lock is itself self-declared (ADR 0008 decision 9), verdict feeds only the telemetry bounce count","log-cell writes through a symlinked .scratch dir (low); log-resolved refuses it"],"failures":[],"pending":[{"item":"orchestrator proposes merge","owner":"orchestrator"}]}
```

## Findings

1. **Low** `apps/organism-infra/board-service.mjs:1142` (verdict role check). With no lock, `--as qa|security|orchestrator` is self-asserted, so any cell can post a verdict. Impact is limited: the only consumer of `verdict` is the `bounces` count in the usage.jsonl resolved row (`appendResolvedRow`); nothing gates a merge on it. Requiring the poster to hold the ticket's claim lock would not make identity real (`claim <ref> qa` is equally self-declared, decision 9). It would add three things: it enforces the protocol step (a qa cell in this session posted a verdict unclaimed), it leaves a claim event in events.jsonl beside every verdict, and it stops a second cell forging a verdict on a ticket someone else holds. Recommend as a follow-up ticket, not a bounce: `--verdict` requires a lock held by qa/security/orchestrator (orchestrator would need to claim before verdict, or keep an explicit no-lock exemption). Would break existing tests that post `--as` verdicts with no lock, so it is a spec change.
2. **Low** `scripts/log-cell.mjs:52-60`. `O_NOFOLLOW` covers only the final path component. A symlinked `.scratch` directory is followed: verified, log-cell wrote `usage.jsonl` into the link target and exited 0. `log-resolved` refuses the same setup ("path escapes the board root", via prepare/assertWithinRoot). Impact is small (fixed filename, validated JSON row, planting a link needs prior write access to the checkout), but the two scripts are inconsistent. Suggest `lstat` on `.scratch` or an `assertWithinRoot`-style realpath check in log-cell.
3. **Low** `apps/organism-infra/board-service.mjs:854-864`. `logResolved` duplicate check (read `usage.jsonl`, then append) is not under a lock, so two concurrent runs can both append. Telemetry only. `release --status resolved` does not run the duplicate check at all, so a re-opened then re-resolved ticket gets two rows and `log-resolved` will then refuse.
4. **Info** `O_NOFOLLOW` is `undefined` on Windows, so `|` coerces it to 0 and the protection silently vanishes there. Project runs on WSL/Linux; ignore unless Windows becomes a target.

## Checked and fine

- Symlink refusal on the file: verified `usage.jsonl` symlink (existing target and dangling) refused with ELOOP by both scripts, victim untouched, dangling target not created. No TOCTOU: the check is the `open()` itself, not an lstat then open.
- Duplicate check: second `log-resolved` refused; ref normalized through `prepare`, `01-a.md` variant rejected as invalid segment; non-resolved ticket and missing `--pr` on code tickets refused.
- Length caps: `--outcome` 501 refused, 500 accepted; `--mode` 33 refused. `ticket` is bounded by the regex plus the file-must-exist check; `tokens`/`ms` are capped at 15 digits. `JSON.stringify` escapes newlines, so no row injection.
- Injection: no shell use in the changed code; `log-resolved` args are validated by `parseTicketRef` and `validatePrFlag`.
- `--pr` refusal on non-resolved release happens before any write. Release append failure wraps into a BoardError with the redo command and no secrets.
- gitleaks `origin/main..86fd86e`: 2 commits scanned, no leaks. No dependencies added or changed.
