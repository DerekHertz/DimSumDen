```json
{
  "ticket": "agent-os/02-grants",
  "cell": "qa",
  "mode": "specify",
  "current_step": "PARTIAL: failing tests for the adapter, governance and POST /tasks halves committed on tests/agent-os-02-grants (28a0244); wall refusal notices, the pause at three, the Start box UI and the live checks are not yet specified",
  "artifacts": [
    "apps/bridge/cells/grants.test.mjs",
    "apps/bridge/cells/host-task-grants.test.mjs",
    "apps/bridge/cells/ceilings.test.mjs (two sandbox assertions relaxed, see Decisions)",
    "apps/bridge/cells/claude-runtime-wall.test.mjs (sandbox and deny assertions relaxed, see Decisions)"
  ],
  "decisions": [
    "Seam: compileCeiling(role, { worktree, grants }), grants = [{ kind: 'host'|'path', value }], max 6; anything else is a TypeError. scout takes no grant. POST /tasks body gains grants; runtime.spawn args gain grants. Option names beyond those are the developer's.",
    "Host grant -> sandbox.network.allowedDomains plus a read limit (sandbox.filesystem.denyRead non-empty, or permissions.blockReadsOutsideWorkingDirectories true). Path grant -> Write(//<p>/**), Edit(//<p>/**) and sandbox.filesystem.allowWrite. The allowWrite key is from the CLI settings docs, not from the spike: if the live check shows another name, bounce the test with evidence, do not weaken it.",
    "Governance rides only on compileCeiling: buildClaudeArgs without a ceiling still gives exactly the four deny rules (claude-adapter.test.mjs unchanged). Write denies are both permissions.deny Write/Edit rules and sandbox.filesystem.denyWrite entries, so a shell write is refused too.",
    "I RELAXED agent-os/04 assertions that this ticket must change: sandbox deepEqual now ignores a filesystem key (ceilings.test.mjs x2, claude-runtime-wall.test.mjs x4), and permissions.deny deepEqual in claude-runtime-wall.test.mjs became 'includes the four' (x3). Nothing else of 04 touched.",
    "Bypass forms use a reference matcher in grants.test.mjs (bashDenied) that applies every Bash deny rule to the WHOLE command string, the worst case where the CLI does not split on newline, $(), backticks or <(). So the plain 'Bash(git push:*)' is not enough; infix rules like Bash(*git push*) are needed. If the developer shows by a live CLI run that the CLI splits and checks each part, ask the orchestrator before loosening.",
    "INTERPRETATION TO CONFIRM: ticket says 'a deny is never lifted by a grant' and 'security may write CI paths only under a task grant'. I pinned: guardrail paths and all commands are never liftable; CI paths are denied for developer, qa, scout always, and for security unless a path grant covers exactly them (the one stated exception). Orchestrator or user: confirm or say the exception is not wanted."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa specify, second half. Not written (ran out of context budget): (1) wall refusal marks: fake runtime emits tool-result with a <sandbox_violations> block (host) and 'Read-only file system' (write; fixture lines in apps/bridge/cells/fixtures/wall.jsonl) into a bridge from makeBridge; pin agent.wall = { hosts?: {count, latest}, writes?: {count, latest} , paused? }, transcript tool status 'refused' for a host (stays 'failed' for a write) and a following notice entry, counts per kind, a file-tool request outside the worktree gets no wall mark; (2) the pause at three of one kind: state waiting_on_user, a pending wall request in Needs you listing the three targets, Keep refused / Grant for this task through POST /approvals/:id, count restarts; (3) UI per the designer spec criteria map in 02-designer-spec.md (Start box table lines from the bridge, add/refuse/remove, startTask receives grants in the fixed shape, 400 keeps text and grants, card folds, card and transcript notices, wall request panel). Seams in apps/ui/src/overlay/message-composer.mjs (createMessageComposer, client.startTask(role, { text, grants })), proximity-card.mjs, transcript-view.mjs, approval-review.mjs.",
      "owner": "qa (fresh specify cell, same branch)"
    },
    {
      "item": "Human-verified / live criteria, to run by the developer after the build: a den-started developer writes and runs tests in its worktree with no request and a write outside is refused (agent-os/04 live script exists); the read limit holds with a host granted (try denyRead plus allowRead, then blockReadsOutsideWorkingDirectories); git push and gh pr create still refused with the wall on is already live-checked in agent-os/04; .git/config of the main checkout probed; hardware limits decision (systemd-run argv, values per role, memory-kill policy).",
      "owner": "developer"
    },
    {
      "item": "Do not start the developer on the whole ticket until the second qa half lands; the adapter and POST /tasks halves can be built now.",
      "owner": "orchestrator"
    }
  ]
}
```

# qa specify (partial): agent-os/02

Branch `tests/agent-os-02-grants`, tests at 28a0244 on base 388906c. Run: `node --test apps/bridge/cells/grants.test.mjs apps/bridge/cells/host-task-grants.test.mjs`.

Result: grants.test.mjs 444 tests, 406 fail (missing feature: grants ignored, no governance deny, no host hardening), 38 pass as regression guards (already-true deny of plain git push and gh pr create, localhost). host-task-grants.test.mjs 20 tests, 18 fail, 2 pass as guards. The edited 04 tests (ceilings, claude-runtime-wall) still pass (34 of 34 with the new file's guards).

## Criterion to test map

| Criterion | Test |
|---|---|
| Adapter compiles each role's ceiling, and ceiling plus a grant, into the settings | grants.test.mjs "task grants compile into the recorded settings" (host, repeated host, path, ~/ path, none, argv unchanged outside --settings, scout none); 04's ceilings.test.mjs covers the bare ceilings |
| Grant outside the fixed shape is a 400; no grant string in argv or prompt | host-task-grants.test.mjs (15 bad shapes, scout, no-ceiling role, nothing written or spawned, prompt carries no value); grants.test.mjs "outside the fixed shape" (adapter TypeErrors, argv check) |
| Host names only (security review of agent-os/01) | grants.test.mjs "the wall's host list is names only" (IPs, localhost forms, .local .internal .lan .home.arpa, sparse arrays) |
| Read limit before any host | grants.test.mjs host-grant test asserts a read limit rides with a host; the live proof is human-verified (developer) |
| Forbid beats permit | grants.test.mjs "forbid beats permit" (3 roles x 11 grant sets x every deny path and command; security CI exception handled) |
| Governance denies, one test per entry | grants.test.mjs "the ceilings deny the governance paths and commands" (CI paths, guardrail paths, 7 commands, per role) |
| Bypass forms | grants.test.mjs "bypass forms" (6 commands x 11 wrappers per role, hooksPath forms, and a false-positive guard for ordinary work) |
| Live: write/run in worktree no prompt, outside refused | human-verified / live (developer) |
| Start box lists grants (UI test) | NOT YET WRITTEN, see pending |
| Refusal notice and the pause at three | NOT YET WRITTEN, see pending |
| `npm test`, risk-check, gitleaks | gates at verify |

## Notes for the developer

- ceilings.json top-level keys are pinned to exactly the four roles (04 test), so a governance list cannot be a fifth top-level key there; put it in each role's entry, or a sibling data file.
- risk-check's GUARDRAIL_PATHS should grow to cover whatever file holds the governance list (guardrail path, security review).
- The `.git/config` and `.git` writability of the main checkout is a live probe, not a unit test.
