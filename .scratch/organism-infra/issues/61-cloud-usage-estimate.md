# 61: Cloud usage estimate from session transcripts

**Type:** task

**Priority:** P2

**What to build:** Cloud sessions have no `~/.claude/.credentials.json`, so `scripts/usage.mjs` fails and the user reports cloud credits by hand. Session transcripts do carry per-message `usage` for the main session and every subagent, under `~/.claude/projects/<cwd-slug>/**/*.jsonl`.
1. A script (for example `scripts/usage-estimate.mjs`) that sums price-weighted tokens from those transcripts: input 1, cache write 1.25, cache read 0.1, output 5. It calibrates against the `cloud_credits` readings in `.scratch/usage.jsonl` (weighted tokens per credit, fitted over the readings in the window) and prints JSON: `{"source":"estimate","weighted_tokens","tokens_per_credit","credits_used_est","credits_left_est","last_reading":{"ts","cloud_credits"}}`.
2. `usage.mjs`: when credentials are missing and `CLAUDE_CODE_REMOTE` is set, fall back to the estimate instead of failing. The orchestrator logs it as `cloud_credits_est` next to any manual reading.
3. `scripts/context.mjs` returns null context in cloud even though the transcript exists. Fix it in the same change.

**Blocked by:** None

**Status:** resolved

- [ ] With fixture transcripts and readings, the estimate matches a hand-computed value
- [ ] With no readings, it prints weighted tokens and a null credit estimate
- [ ] `usage.mjs` falls back in cloud and is unchanged locally
- [ ] `context.mjs` reports this session's context in cloud
- [ ] `usage-watch` skill (gated `.claude/` edit, written as a diff for the user) says to use the estimate in cloud and ask for a real reading when it nears 80%

## Comments
- **Probe (orchestrator, 2026-09-29):** in the window from 59 to 48 credits (20:26Z to 21:38Z), 20 transcripts gave 1.57M new input (including cache writes), 41.4M cache reads and 79k output. That is about 6.4M weighted tokens, or roughly 580k weighted tokens per credit. One window only, so calibrate on more readings. The session ingress token is not a usage API; don't use it.
- **Decision (user, 2026-09-29):** wants a usage check that works in cloud sessions.
- **Scope note (user, 2026-09-29):** the cloud credits are a temporary gifted pool, and regular subscription tokens come later. Keep the credit calibration optional. The durable parts are the weighted token meter and the context.mjs fix. When on subscription, check whether cloud sessions can read the 5-hour window at all before building more.
- **qa, 2026-09-29:** qa specify: tests on organism-infra/32-tests (7dabe25), scripts/usage-estimate.test.mjs, 6 red 1 guard. usage-watch skill diff is human-verified. context.mjs cause unverified; see handoff.
- **Probe (orchestrator, 2026-09-29):** `context.mjs` works in cloud when run from the main checkout root (it reported 297k, 29.75%). My earlier null came from running it with the cwd inside `~/.claude/projects`. So the real bug is that it depends on the cwd: run from a worktree or subdirectory, it slugs the wrong path. qa's worktree-cwd test is the right target, and selecting by `CLAUDE_CODE_SESSION_ID` is a good addition.
- **qa, 2026-09-29:** QA pass (light verify): 7/7 tests pass, tests unchanged since 7dabe25, 5 browser smoke fails expected in cloud. usage-watch skill diff human-verified. See 32-qa-verify.md
- **security, 2026-09-29:** Security pass at 5b6bcbb. No critical/high. Low: scripts/context.mjs:56 CLAUDE_CODE_SESSION_ID unvalidated in path (reads only *.jsonl; suggest id regex + Number() on usage fields). Low: scripts/usage-estimate.mjs:65 echoes log ts string. Test spawn is benign (argv array, fixture HOME). gitleaks not installed; manual patch read found no secrets. See handoffs/32-security.md

- **Renumbered (orchestrator, 2026-09-29):** was cloud organism-infra/32; the local board used that number for a different ticket.
