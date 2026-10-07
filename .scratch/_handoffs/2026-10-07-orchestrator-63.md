# Orchestrator handoff 63 (2026-10-07, WSL): 183 in flight; 182 blocked by classifier; model-levels talk open

State, not rules; the genome wins. Written at 92k context, ahead of a /compact.

## In flight
- **183** (CI Playwright install hang): developer cell (sonnet, developer-direct, background, isolation worktree), branch `feat/183-ci-playwright-install-hang` from `199ca45`. Handoff due at `.scratch/organism-infra/handoffs/183-developer.md`. On return: log-cell from the task notification, then **full** qa verify (qa did not specify), then **full security** (touches CI workflows, so no risk-check skip), PR, merge on green.
  - My pick developer-direct vs Jev `qa-specify` (0.56). I told the user Jev's pick was closer to the genome default. Log `advisory-outcome` when 183 resolves.

- **183 update (after handoff written):** developer returned `in-review`, commit `309ab8e` on `feat/183-ci-playwright-install-hang`, worktree `.claude/worktrees/agent-a54d6c41c82f6e4a5` (clean). Logged. Change: drops `--with-deps`, install step `timeout-minutes: 8` with two `timeout 180` attempts, `actions/cache` (pinned 55cc834…, v6.1.0, new action: security must check) keyed on Playwright 1.63.0; new `scripts/ci-workflow.test.mjs`. npm test 2405 pass. Unverified on CI: cache miss→hit, smoke finding Chrome. **Next hop: full qa verify** (save test output to /tmp/183-tests.txt, run `jev.mjs verify`), then full security, then PR and watch CI.

## Blocked / waiting on the user
- **182** (genome edit, user does visual critique): the auto-mode classifier denied the developer dispatch as "Auto-Mode Bypass" (a cell scripting edits to gated `.claude/` + `CLAUDE.md` files for the user to apply). Not retried; must not be routed around. Options given to the user: (1) the user runs `claude --agent developer` on it themselves, (2) the user adds a permission rule, then re-dispatch, (3) defer and keep following the den-v1/05-07 comments. No answer yet. Advisory: mine developer-direct, Jev `designer` 0.39 (log advisory-outcome once it's dispatched).
- den-v1/04 visual verdict (draft PR #178): unchanged, still the user's.

## Open discussion: Jev, and model levels per role
- Scout survey (logged): route sends the whole ticket markdown (16k cap) zero-shot to `jev-1.13.0` (TypeSafe API); `conf` = the model's probability for the label it picked, uncalibrated; no history goes in. 39 advisory-outcome rows, 54% agreement. My read for the user: the 182 miss was the ticket's vocabulary pulling it toward designer; Jev can't see the touched files or the gating. Offered: a scout computes bounce rate when the dispatch matched Jev vs matched the orchestrator. User has not chosen.
- **User's new ask:** "haiku 5.5 is pretty powerful; should we look into model levels for agent roles again?" Current genome models: orchestrator opus; product, architect, qa, developer, security, herald, designer sonnet; scout haiku. ADR 0010 covers developer tier (Jev `tier`, shadow) and light verify on haiku (pending ticket 40). Caveat to raise: the claude-api skill's cached table (2026-09-25) lists Haiku 4.5 as the current Haiku and no Haiku 5.5; confirm what `haiku` resolves to in Claude Code before planning on it. Next step per genome 2b: a scout pulls tokens/run, bounce rate and outcome by cell type × model from `.scratch/usage.jsonl`, then run `grilling` with `domain-modeling` (ADR 0010 is in scope; dispatch architect if boundaries move). Do NOT load the claude-api skill in the orchestrator again (it cost ~45k; incident logged).

## Owed (carried from 62)
- Incident: `dispatch-prompt.mjs` rejects short refs (`organism-infra/182`); full slugs work. Candidate small ticket.
- ADR 0016 REF_RE one-line edit (architect); 162 live check; security genome gitleaks path (gated); pipeline-retro after the next resolve; `worktree-gc.mjs` re-run (agent-a338042c… was locked by pid 9891).
- Next after 183/182: 143 criterion (security finding 3 from PR #177) → 141 → 142 → 143 → 106 → 107; den-v1/05-06 after 106, 07 after 107.

## Readings
- Usage 5-hour 16%, weekly 42%. Context 92k at handoff.
