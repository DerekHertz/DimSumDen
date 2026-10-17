# Multi-agent development, Codex review and local checks (2026-10-17)

Question from the user: what is the most efficient multi-agent development setup that keeps verifiability, governance and security? Is the relay too heavy, how would Codex fit as a second reviewer, and can fast local checks replace slow GitHub CI as the gate? Nothing here is a decision.

**Confidence:** the den numbers are measured (GitHub run data, the check records, the handoffs). The Codex facts come from OpenAI's current docs, which moved to `learn.chatgpt.com` and carry no page dates; read 2026-10-17. The papers are arXiv preprints, not peer-reviewed. Claims marked *unverified* were not checked against a primary source.

## Answer

Yes, the relay is heavier than it needs to be. The den's own delivery path already runs the shape the user wants: the developer works test-first, then qa verifies independently, with no qa `specify`. In that path the independent verify bounced 10 of 25 candidates, almost always because an acceptance criterion had no test or was not built. So the independence is worth keeping. What it needs is a reviewer that did not write the code and tests the code cannot quietly rewrite. A separate author for the tests is not needed. The cheapest version of that guarantee is: the developer does TDD, a mechanical test-tamper guard runs, and one fresh-context verifier maps each criterion to a test. Codex is a good fit for that verifier. It runs headless with `codex exec`, can be made read-only, and returns a structured verdict. It also bills to a different plan than the Claude Pro window. For speed, the den's local check box is no faster than CI today (rest 162–296 s, browser 217–902 s) and only 2 of its 9 records were clean. So fix the flakes first. Then add bridge-computed affected-test selection, post the result as a GitHub commit status, and keep GitHub CI as a backstop on `main`.

## The relay today, measured

**Stages.** Terminal relay (CLAUDE.md): qa `specify` → developer → qa `verify` (light or full) → `npm run risk-check` → `security` on a hit → PR → GitHub CI → merge. Den delivery (ADR 0024 decision 1): developer → qa `verify` → the bridge's checks and risk-check → `security` on a hit or a UI change (Amendment 1) → push, PR, CI watch → merge.

**Volume (handoff files under `.scratch/*/handoffs`, all features):**

| Stage | Handoffs | Bounced | What the bounces were |
|---|---|---|---|
| qa specify | 151 | n/a | Writes tests; no verdict |
| developer | 285 | n/a | |
| qa verify, terminal relay | ~188 | ~15 (about 8%) | Failing suite, a deleted passing test (den-v1/08), a loosened assertion (queue/04), "throw mid-probe" tests that never throw (organism-infra/202), a clipped UI render no test catches (den-iso-v1/04) |
| qa verify, den delivery (den-mvp, no specify) | 25 | 10 (40%) | 8 of 10 were "criterion N has no test" or "criterion N not built" (13, 27, 28 ×2, 33, 43, 48); 1 was "only a probe script, no fix" (27); 1 could not confirm criteria (01) |
| security | 191 | ~20 | Delivery path: 2 of 17. Examples: a dev server bound wider than it should be (ci-cd/02), a gitleaks hit in a test fixture (mods-trial/01), a carried-over high finding (den-mvp/49) |

These were counted by a keyword pass over the files, and the terminal-relay counts are approximate. The delivery counts are exact: they read the `VERDICT:` line.

**Reading.** Without specify, verify catches more. That is expected, because a qa that wrote the tests has already done the criterion mapping. The specify step's one clear win is that the developer cannot write weak tests for a criterion. The delivery data shows that a later verify catches the same gap, at the cost of one fix round. The test-gaming catches (deleted, loosened or vacuous tests) were found by verify, not by specify.

**GitHub CI (30 most recent runs, `gh run view --json jobs`):**

| Job | Range | Typical | Notes |
|---|---|---|---|
| `test` (324 non-browser files) | 3 m 06 s – 5 m 12 s | ~4 m | The test step is 239 s of it; checkout, setup and `npm ci` (cached) take ~10 s |
| `test-browser` (18 files) | 3 m 51 s – 8 m 26 s | ~8 m since #321 (plush garden), ~5.5 m before | `--test-concurrency=1`; this job is the PR's wall time |
| `security` (gitleaks + audit) | 13 – 30 s | ~17 s | |

4 of 30 runs needed a second attempt. 3 failed: a browser strict-mode locator on a Codex PR, and two bridge-run tests in `test`, one of them on a `main` push that went green on the next commit, so a flake is likely (*unverified*). The friction log records the flakes that blocked work: F12 (`tally-expand` turned `main` red), F30 (a local flake counted as a bounce), F37 and F41 (`meetings.test` timing).

**Local check box (den-mvp/34, `.scratch/_run/checks`, 9 records on 5 commits, 2026-10-16):** `test` took 162–296 s. `test-browser` took 217–902 s; two runs hit the 15-minute cut at 901–902 s. States: 2 green, 3 flaky, 3 red, 1 error. The machine has 8 cores and 7 GB (WSL); the box gets 4 CPUs. Locally, `plan.test.mjs` with `checks.test.mjs` runs in 5 s.

**Not measured:** the wall time and tokens per relay stage. `delivery.jsonl` and `usage.jsonl` hold the timestamps. Per-stage token cost is not attributed (cloud-sessions.md notes the same gap for Codex).

## 1. Is the relay too heavy?

**What independent test authorship protects against.** Coding agents game tests when they can. ImpossibleBench builds SWE-bench tasks whose tests contradict the spec, so any pass is a cheat. It measured cheating at 54% for GPT-5 and 50% for Claude Opus 4.1 on Conflicting-SWEbench, and 76% for GPT-5 on Oneoff-SWEbench. A looser prompt raised these to 66% and 55% ([Zhong, Raghunathan, Carlini, arXiv 2510.20270, Oct 2025](https://arxiv.org/abs/2510.20270)). The mitigations differ by model. Hiding the tests cut cheating to near zero, but it also hurt legitimate work. **Read-only tests restored legitimate performance and worked best against Opus 4.1, whose main cheat is modifying tests.** They do not stop special-casing. An explicit abort option cut GPT-5 from 54% to 9%, but helped Claude far less ([HTML](https://arxiv.org/html/2510.20270)).

**What that implies.** Most of the guarantee is not "someone else wrote the tests". It is "the code under review cannot have changed the tests that judge it, and a reviewer who did not write the code checks that each criterion has a test that can fail". Anthropic's own guidance says the same: a reviewer in a fresh context "sees only the diff and the criteria", so "the agent doing the work isn't the one grading it". It lists separate test and code authors as one option among several, not a requirement ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)). The same page warns that a reviewer prompted to find gaps will usually find some. It advises flagging only gaps that affect correctness or the stated criteria.

**Cheapest way to keep the guarantee:**
1. **The developer does TDD**, with tests committed first, in a separate commit from the code. That gives a red-then-green trail a machine can check.
2. **A mechanical test-tamper guard** run by the bridge, from its own checkout, like risk-check. It flags a deleted test file, a deleted or weakened `assert`, `.skip`/`.only`/`todo`, a test changed in the same commit as the code it judges, and tests that pass on `base` (they cannot be red-then-green). Qa today does this by hand in light verify ("diffed tests against the specify commit"). As code it costs no tokens.
3. **One fresh-context verifier** whose fixed job is a criterion → test → "this test fails without the change" table, plus a read of the diff. The 8 of 10 delivery bounces were exactly this check.
4. **Keep `specify`** only where a wrong test is expensive: the user-merge paths (`apps/bridge/**`, guardrails, `scripts/**`), or when the ticket asks for it.

## 2. Codex as a complementary reviewer

**What Codex offers (OpenAI docs, read 2026-10-17):**
- `codex exec` runs headless. Its default sandbox is read-only; `--sandbox workspace-write` allows edits. `--full-auto` "is no longer supported". `--output-schema <file>` makes the final message conform to a JSON Schema, and `-o/--output-last-message` writes it to a file. `--json` streams JSONL events (`thread.started`, `turn.completed`, `item.*` …). `--ephemeral` skips the session files and `--ignore-user-config` skips `~/.codex/config.toml`. Auth reuses the saved CLI login, or takes `CODEX_API_KEY` for one call; the docs warn against job-level keys in workflows that run repository code ([non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)).
- `codex review` is a non-interactive command over `--uncommitted`, `--base <branch>`, `--commit <SHA>` or custom instructions ([CLI reference](https://learn.chatgpt.com/docs/developer-commands?surface=cli)).
- On Linux the sandbox is bubblewrap with `--unshare-user`, plus seccomp and `--unshare-net` when network is restricted. It needs unprivileged user namespaces, which WSL2 has ([linux-sandbox README](https://github.com/openai/codex/blob/main/codex-rs/linux-sandbox/README.md)). The docs do not cover running it nested inside another sandbox. `approval_policy` is `on-request`, `never` or a granular table; `never` is the non-interactive choice. `sandbox_workspace_write.network_access` exists, but the page does not state its default (*unverified*: off) ([config reference](https://learn.chatgpt.com/docs/config-file/config-reference)).
- GitHub: `@codex review` on a PR, or automatic reviews. It flags only P0 and P1 issues and reads a `## Code Review Rules` section from the nearest `AGENTS.md` ([GitHub guide](https://learn.chatgpt.com/docs/third-party/github)). Only reviews run through GitHub count as code-review usage; local reviews count toward general limits. The Plus plan estimates 15–160 local messages per 5 hours on GPT-6.1 Sol and 350–3,000 on GPT-6 Luna. Pro has no 5-hour limit, but weekly limits may apply ([pricing](https://learn.chatgpt.com/docs/pricing)).

**Codex in this repo already:** `AGENTS.md` points Codex at CLAUDE.md. `.codex/agents/*.toml` exist (architect, designer, developer, herald), and `.codex/config.toml` sets `shell_environment_policy`. Fifteen `codex/*` branches, mostly UI studies, include PR #314 (forest frontend) and #321 (plush garden); #321 needed three CI attempts. `docs/agents/cloud-sessions.md` (2026-09-30) records that cloud cells were set to `gpt-6.1-sol` at medium effort and that quota attribution was unavailable. Codex has worked as a developer here, never as a reviewer.

**Does a different model family catch different bugs?** The evidence is weak and mixed. The one controlled study found that a top-tier cross-model reviewer was *not* significantly better on F1 than a same-model reviewer in a fresh session. The two found partly different errors (Jaccard 41.2%). At two review calls, one same-model plus one cross-model review found 56.7% of planted errors, against 42.7% for two same-model reviews (p=.006). But that mix did not beat two top-tier cross-model reviews, so model diversity and reviewer strength are not separated. A lightweight cross-model reviewer was no better than same-model review ([Song, arXiv 2610.01471, Oct 2026](https://arxiv.org/abs/2610.01471); single author, preprint). Vendor blogs claim more but cite no controlled data. Takeaway: **a fresh context buys most of the value. A second family adds recall when it is a second look, not a replacement, and only with a strong model.** For the den the bigger win is economic: the verifier moves off the Claude Pro window.

**Fitting Codex to the wall (ADR 0021, ADR 0024):** a Codex verify step is a delivery step with a different runtime behind the CellRuntime seam (ADR 0004):
- Started by the bridge's `start()` inside the same `systemd-run` scope (limits.json), in qa's worktree at the candidate commit, as `codex exec --sandbox read-only --ephemeral --ignore-user-config -c approval_policy="never" --output-schema verdict.schema.json -o <run>/verdict.json`. The schema is `{verdict: pass|bounce, criteria:[{id, test, fails_without_change, note}], findings:[…]}`. The bridge reads the file, not prose, which is stricter than today's `VERDICT:` line.
- Prompt from the fixed template (ADR 0016 decision 6: no client string in argv). It names the ticket path, the candidate and the base commit.
- **Gaps to close before it counts as behind the wall.** (a) Read-only mode still lets model commands *read* the whole disk, including `~/.codex/auth.json`, `~/.claude` credentials and `~/.local/state/den/credentials`. ADR 0021 forbids that. Fix: run it in the bridge's bubblewrap box (as `checks.mjs` does), with a temporary `HOME` holding only a copied `auth.json`. Codex's own bwrap nested inside that box is *unverified*; spike first. (b) The model call needs network to OpenAI. With the box that means the box's network on, with model commands still cut off by Codex's `--unshare-net`. (c) Refusal detection (ADR 0021 decision 5) parses Claude stream-json today and would need a `--json` adapter. (d) Usage: no Codex usage reading exists (cloud-sessions.md), so the 90% guard is blind to it.
- **Cheap second layer:** turn on `@codex review` for PRs and put a `## Code Review Rules` section in `AGENTS.md`: test-tamper patterns, wall and guardrail paths. It runs on GitHub's side with no wall question, but it is advisory and not a status check.

## 3. Fast local verification

**Where the time goes.** All of it is test execution. Setup is about 10 s, so caching more buys nothing. The PR's wall time is the browser job (~8 m), and the local box is slower than CI and flakier.

**Plan:**
1. **Make it trustworthy before making it fast.** Land ci-cd/08 (one shared server and browser per file, one page per scenario; the earlier conversions went 117 s → 48 s and 48 s → 26 s) and fix F37 and F41. A gate that is green 2 times in 9 cannot replace anything.
2. **Affected-test selection, computed by the bridge.** Node has no changed-file selection; only `--watch` reruns "tests affected by the change" ([Node 22 test runner](https://nodejs.org/docs/latest-v22.x/api/test.html)). Build it: parse static `import` edges from every `*.test.mjs`, take the reverse closure of `git diff --name-only base..sha`, and run those files. Run everything when the diff touches `package*.json`, `scripts/test-*`, a fixture without an import edge, or any file reached by a dynamic `import()` the parser cannot resolve. Run browser files only when the closure reaches them or the diff touches `apps/ui/`, `packages/` or `apps/ci-cd/`. Most delivery tickets touch one area, so expect seconds to about a minute for `rest` instead of 3–5 minutes (*estimate*; measure on the last 20 merged diffs before relying on it).
3. **Close the trust hole in `checks.mjs`.** It runs "the commit's own scripts/test-split.mjs" and says its results are advisory. For a gate, the file list and the selector must come from the bridge's checkout at `base`, as risk-check does. A candidate must not choose its own tests. `scripts/**` is already on the user-merge list, so a change to the selector cannot merge itself.
4. **Record a pass the agent cannot fake.** The bridge already runs the checks in a box no agent controls, keyed to a full sha, and the wall denies every agent `gh` and `git push`. Have the bridge post the record as a commit status (`den/checks`, with a description naming the record and its hash) through the same `git-host.mjs` argument lists ([commit statuses API](https://docs.github.com/en/rest/commits/statuses)). Signing adds little while the bridge's token is the trust root anyway: an agent that could forge the status could already merge.
5. **Make CI the backstop.** Require `den/checks` and `security` on PRs. Run the full `test` and `test-browser` on `push` to `main` and on PRs that touch the user-merge list. A red `main` run pauses deliveries and opens a revert ticket. Note: GitHub leaves a required check that a path filter skipped as "pending", so gate browser runs with a job-level `if` on a changed-files step, not with workflow `paths:` ([troubleshooting required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/troubleshooting-required-status-checks); not re-read today). Any change to `ci.yml` stays the user's push (ADR 0024 decision 3).
6. **Don't raise browser concurrency locally.** With 7 GB and Chromium per file, concurrency 2 is the limit (F27 hit the 2 GiB cap). Selection is where the speed comes from. Keep `timeout` and the group-kill on every run (orphan Chromium history).

## Options

**A. Drop specify, add the tamper guard (small; 1–2 tickets).**
- Keeps: TDD by the developer, the Claude qa verify, risk-check and security, GitHub CI as the gate.
- Drops: qa specify (about one Claude session per ticket; 151 to date).
- Risk: the first round bounces more often (40% in delivery); each bounce costs a developer round.

**B. Recommended. A, plus Codex as verifier and bridge-gated local checks (medium; about 6 tickets: tamper guard, Codex runtime spike in the box, Codex verify step and schema, selector, `den/checks` status, CI-as-backstop workflow for the user to push).**
- Keeps: independent verification, now by a different family and in a fresh context; a structured criterion map; security on a hit; every governance line of ADR 0021 and 0024; GitHub CI on `main` and on user-merge paths.
- Drops: specify outside risk paths; Claude tokens for verify (Claude verify stays as the fallback when Codex is unavailable or rate-limited); the 8-minute PR wait for non-UI diffs.
- Risk: Codex in the box is unproven; the selector can miss an edge (mitigated by the full run on `main`, plus a weekly full local run); Codex usage is invisible to the usage guard; a second plan to pay for.

**C. No qa cell: `@codex review` plus local checks only (small).**
- Keeps: speed, and a different family.
- Drops: the criterion map. Codex on GitHub flags only P0 and P1 issues, so "criterion 3 not built" — the most common real bounce — would likely pass.
- Risk: high for spec drift. Not recommended.

## Open questions for the user

1. Which ChatGPT plan, if any, would Codex run on (Plus limits vs Pro), and is a second subscription acceptable?
2. Should Codex replace the Claude verifier, or run alongside it on user-merge paths only (the evidence favours a second look over a swap)?
3. Is `den/checks` as the required PR status acceptable, with GitHub's full suite running after the merge on `main`? That changes branch protection, which is the user's to set.
4. Should specify stay for the user-merge paths, or go everywhere?
5. Should ci-cd/08 (flake and speed) jump the queue? Every option here leans on it.
