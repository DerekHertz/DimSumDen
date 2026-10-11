```json
{
  "ticket": "agent-os/04-no-prompt-slice",
  "cell": "qa",
  "mode": "specify",
  "current_step": "failing tests committed on tests/agent-os-04-no-prompt-slice (353039c); 28 new tests fail for a missing feature, 7 pass as regression guards",
  "artifacts": [
    "apps/bridge/cells/ceilings.test.mjs",
    "apps/bridge/cells/claude-runtime-wall.test.mjs",
    "scripts/risk-check.ceilings.test.mjs",
    "apps/bridge/cells/conformance-live.test.mjs (one assertion updated, see Decisions)"
  ],
  "decisions": [
    "Pinned seam: compileCeiling(role, { worktree }) exported from claude-adapter.mjs, null/undefined for a role with no ceiling, otherwise options that spread into buildClaudeArgs. Option names are the developer's.",
    "buildClaudeArgs without a spread ceiling is unchanged, so the agent-os/01 tests keep passing (they build a scout with no wall).",
    "Worktree allow rules use the adapter's absolute-path form: Write(/${worktree}/**) and Edit(/${worktree}/**), same style as the ticket Read rule. An unwritable worktree is a TypeError in the adapter; the runtime keeps the wall and drops the write rules for such a cwd.",
    "conformance-live.test.mjs:386 asserted the scout argv equals plain buildClaudeArgs; that is now wrong by design (scout has a ceiling). I changed it to compose compileCeiling(LIVE_ROLE, { worktree: setup.worktree }). It fails today on the missing export. This is a corrected expectation, not a weakened one."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the tests pass: apps/bridge/cells/ceilings.json (keys scout, developer, qa, security only; no hosts), compileCeiling and the allow-rule option in claude-adapter.mjs, createClaudeRuntime.spawn passing compileCeiling(role, { worktree: cwd }), and a guardrail list in scripts/risk-check.mjs naming apps/bridge/cells/ceilings.json with a reason containing the word guardrail. Do not edit my test files.",
      "owner": "developer"
    },
    {
      "item": "Run the two live criteria (see the map): a den-started developer writes a file and runs tests in its worktree with no request, a shell write outside is refused, and git push / gh pr create are refused with the wall on. Record the result on the ticket.",
      "owner": "developer"
    }
  ]
}
```

# qa specify: agent-os/04

Branch `tests/agent-os-04-no-prompt-slice`, tests at 353039c on base 50a5649. Run: `node --test apps/bridge/cells/ceilings.test.mjs apps/bridge/cells/claude-runtime-wall.test.mjs scripts/risk-check.ceilings.test.mjs apps/bridge/cells/conformance-live.test.mjs`. Result: 35 new tests, 28 fail (all "claude-adapter.mjs must export compileCeiling", wrong settings, or no risk-check hit), 7 pass (no-ceiling roles unchanged at the runtime, roles list covered, sibling json clean). conformance-live: 1 of 43 fails, on the missing export.

## Criterion to test map

| Criterion | Test |
|---|---|
| Adapter compiles each of the four ceilings into the recorded settings | `ceilings.test.mjs` "compileCeiling: the four ceilings": wall block with empty hosts and four deny rules for each of scout, developer, qa, security; Write+Edit allow in worktree for developer, qa, security (with and without the ticket Read rule); none for scout; no extra host or path; argv unchanged outside --settings; bad worktree is a TypeError |
| `ceilings.json` is the one data file, four roles | `ceilings.test.mjs` "ceilings.json: one data file beside policy.mjs" |
| A role with no ceiling gets today's settings | `ceilings.test.mjs` "a role with no ceiling gets today's settings" (architect, designer, herald, orchestrator, product), and `claude-runtime-wall.test.mjs` same five at the runtime |
| Diff touching `ceilings.json` is a risk-check hit | `scripts/risk-check.ceilings.test.mjs` (create, edit, and a sibling json stays clean) |
| Runtime passes the wall for a role with a ceiling | `claude-runtime-wall.test.mjs` (developer, qa, security, scout argv via the stub; ticket rule kept; odd cwd keeps wall, drops write rules); `conformance-live.test.mjs` production argv for scout |
| `git push` and `gh pr create` still refused with the wall on | Static part tested: both deny rules stay in settings for all four ceilings (`ceilings.test.mjs`, `claude-runtime-wall.test.mjs`). The refusal itself needs the real CLI: **human-verified / live check**. |
| Recorded live check: developer writes and runs tests in worktree with no request; shell write outside refused | **human-verified / live** (needs the real CLI and tokens). Not automatable here. |
| `npm test`, risk-check, gitleaks green apart from known failures | gates at verify |

Carried items: `isWall` accepting an empty host list is covered by the existing agent-os/01 test and by every ceiling test here; no host is added (every ceiling asserts `allowedDomains: []`). Scope note: the guardrail list in risk-check does not exist yet as a list; the ticket asks the developer to add it, and only `ceilings.json` is pinned.

## Open question (not tested)

`failIfUnavailable` surfacing in the den: left untested, as the ticket leaves it open.
