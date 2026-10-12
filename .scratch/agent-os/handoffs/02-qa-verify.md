```json
{
  "ticket": "agent-os/02-grants",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify on developer branch at 7be73f3: QA bounce. Suite green (3998 pass, 0 fail, 0 skipped). One specify-marked live probe is not done (.git/config of the main checkout). Two further findings for the orchestrator.",
  "artifacts": [
    "apps/bridge/cells/grants.test.mjs",
    "apps/bridge/cells/host-task-grants.test.mjs",
    "apps/bridge/cells/ceilings.test.mjs",
    "apps/bridge/cells/claude-runtime-wall.test.mjs",
    "apps/bridge/cells/grants-paths.test.mjs"
  ],
  "decisions": [
    "Suite result: used the developer's saved npm test output (/tmp/claude-1000/-home-dhertzell-dimsumden/42f9cc73-68e8-46c7-a47e-7e312c45880c/scratchpad/02-tests.txt), per the dispatch. Not re-run. It reports tests 3998, pass 3998, fail 0, cancelled 0, skipped 0, todo 0. The worktree HEAD is 7be73f3, the commit the developer ran.",
    "Step 2: git diff 28a0244 HEAD over the four qa test files is empty. No specify assertion was removed or loosened after specify. No .only, .skip or todo markers in the five test files.",
    "Relaxed agent-os/04 assertions (asked by the orchestrator): still held: the wall is on (sandbox.enabled, allowUnsandboxedCommands false, strictAllowlist true), no hosts (allowedDomains []), the four deny rules (checked by includes), the exact allow lists at runtime, and the no-ceiling buildClaudeArgs path, which keeps exactly the four denies (claude-adapter.test.mjs is unchanged). Lost: the bare-ceiling sandbox.filesystem block is no longer checked by 04 (ceilings.test.mjs:72, :86; claude-runtime-wall.test.mjs noFs uses from line 55). The 02 test at grants.test.mjs:119-125 checks allow and allowedDomains only. So a bare role that gained sandbox.filesystem.allowWrite would pass every test. This is a coverage gap in qa's own specify tests, not a 04 regression. Fix: qa specify adds one assertion to grants.test.mjs:119 (no sandbox.filesystem.allowWrite for a bare role).",
    "Exact deny list lost at runtime: now checked by includes. Extra denies only restrict, so no safety loss. Ticket governance denies need extra entries anyway.",
    "Gitleaks (developer's note): 0c918a1e is an ancestor of the base 388906c. 18c30d45 is in neither the base nor HEAD history, so this branch did not introduce either. risk-check: 3 hits, so security is dispatched as expected. I did not run gitleaks or risk-check (not in light steps).",
    "Scope items from the orchestrator (2026-10-12) are covered: a path grant containing the worktree is a 400 from POST /tasks (grants-paths.test.mjs:136-160), and a path grant inside the main checkout meets the governance denies (grants-paths.test.mjs:33-94).",
    "Decision for the orchestrator or user, not a bounce by itself: the scope text says a path grant inside the main checkout is covered by the governance denies. The governance list does not include .git, so a grant on <main>/.git is not denied (no test covers .git; grep of the grants test files finds none). The spike asked whether .git is writable from a worktree. The user should decide whether .git is a governed path before the probe result is read."
  ],
  "failures": [
    "Criterion neither tested nor human-verified: .git/config probe of the main checkout. The spike item (ticket line 39) was a developer live item in specify (02-qa-specify.md, human-verified list). The developer's round-2 handoff lists it as not done.",
    "npm test: pass (saved output). Gitleaks: 2 known findings as above. risk-check: 3 hits, security dispatched."
  ],
  "pending": [
    {
      "item": "Run the .git/config probe of the main checkout (live, from a worktree grant or a bare probe) and report whether a grant can write it. Then bring the result back to the orchestrator for the .git governed-path decision.",
      "owner": "developer"
    },
    {
      "item": "Decide whether .git (or .git/config, .git/hooks) is a governed path in the ceilings or governance data, given the scope text 'a path grant inside the main checkout is covered by the governance denies'.",
      "owner": "orchestrator (user decision)"
    },
    {
      "item": "Add a bare-ceiling assertion: no sandbox.filesystem.allowWrite (and no denyRead change) for scout, developer, qa and security with no grant, in grants.test.mjs near line 119. Keep the wall and four-deny assertions.",
      "owner": "qa (specify, short re-dispatch)"
    },
    {
      "item": "Security review of the risk-check hits (claude-runtime.mjs shell-out, governance.json guardrail, risk-check.governance.test.mjs shell-out).",
      "owner": "security"
    }
  ]
}
```

# qa verify (light): agent-os/02-grants, branch tests/agent-os-02-grants at 7be73f3

Verdict: QA bounce. One criterion has neither a passing test nor a human verification (the `.git/config` probe). Developer should run it and report. Two further items need a decision or a qa fix (below).

Mode: light, per the dispatch line. The suite result is the developer's saved output (3998 pass, 0 fail, 0 skipped, 0 todo), not re-run.

## Findings (file:line)

1. `.scratch/agent-os/issues/02-grants.md:39`: the `.git/config` probe of the main checkout was not run. Specify marked it as a developer live item, and the round-2 handoff says not done. Bounce.
2. `apps/bridge/cells/grants.test.mjs:119-125`: after qa's specify relaxation of 04 (`ceilings.test.mjs:72,86`, `claude-runtime-wall.test.mjs` noFs uses), no test pins that a bare ceiling has no `sandbox.filesystem.allowWrite`. Coverage gap in qa's tests, not a code defect. qa fix on re-dispatch.
3. Decision: scope item (2) says a path grant inside the main checkout is covered by the governance denies. `.git` is not in the governed list, so a grant on `<main>/.git` is not denied. User to decide.

## Criterion to test map

| Criterion | Test | Result |
|---|---|---|
| Adapter compiles each role's ceiling, and ceiling plus grant, into settings | grants.test.mjs:86-140; ceilings.test.mjs:51-90 (bare) | pass |
| Live: write and run in worktree with no request; write outside refused | human-verified (specify). Developer's live run: 0 permission requests (02-developer-2.md). Not re-run by qa. | human-verified |
| Grant outside fixed shape is 400; no grant string in argv or prompt | host-task-grants.test.mjs (15 shapes); grants.test.mjs:142-175 | pass |
| Forbid beats permit | grants.test.mjs:229-253 (3 roles x 11 grant sets) | pass |
| Governance denies, one test per entry | grants.test.mjs:191-226 | pass |
| Bypass forms refused | grants.test.mjs:255-276 | pass |
| Host names only (spike security) | grants.test.mjs:177-190 | pass |
| Read limit before any host | grants.test.mjs:87-98; live read-limit proof by developer (human-verified) | pass + human-verified |
| Ticket file readable under the read limit | grants-paths.test.mjs:120-134 | pass |
| Path grant containing worktree is 400 at POST /tasks (scope add) | grants-paths.test.mjs:96-118, 136-160 | pass |
| Path grant inside main checkout covered by governance denies (scope add) | grants-paths.test.mjs:33-94 | pass (see finding 3) |
| Deny rules hold with the wall on (git push, gh pr create) | grants.test.mjs:38 FOUR, asserted in each grant test; 04 live check | pass |
| `.git/config` probe of main checkout (spike) | none | NOT DONE (finding 1) |
| npm test, risk-check, gitleaks | npm test pass (saved output); risk-check 3 hits, security dispatched; gitleaks 2 known findings, not from this branch | as expected |

## Step 4: files changed since base 388906c, listed not judged

apps/bridge/cells/claude-adapter.mjs, claude-runtime.mjs, host.mjs, server.mjs; apps/bridge/cells/governance.json (sibling governance data file, allowed by the specify notes; not named in the ticket); scripts/risk-check.mjs and scripts/risk-check.governance.test.mjs (not named in the ticket; specify noted GUARDRAIL_PATHS should grow); tests: grants.test.mjs, host-task-grants.test.mjs, grants-paths.test.mjs, ceilings.test.mjs and claude-runtime-wall.test.mjs (the last two are agent-os/04 files edited at specify).

## Relaxed 04 assertions (answer to the orchestrator)

Still held: wall on, no hosts, strict allowlist, the four deny rules, exact runtime allow lists, and the no-ceiling path's exact four denies. Lost: the bare-ceiling `sandbox.filesystem` check (finding 2). No 04 requirement is broken; the gap is in 02's own coverage.
