# Handoff: queue/04-queue-admin-user-entry-point (qa specify)

```json
{
  "ticket": "queue/04-queue-admin-user-entry-point",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/queue-04-queue-admin-user-entry-point (sha c3db336): scripts/queue-admin.test.mjs, 31 tests, all fail now (missing script, and the gate not reading queue-admit rows). Next: developer implements scripts/queue-admin.mjs, the package.json script, and the gate's use of queue-admit rows.",
  "artifacts": [
    "branch tests/queue-04-queue-admin-user-entry-point",
    "scripts/queue-admin.test.mjs"
  ],
  "decisions": [
    "Interface pinned: node scripts/queue-admin.mjs [--root <dir>] active <feature> | admit <ref> --reason <why>; --root before or after the subcommand, default cwd, rows go to <root>/.scratch/usage.jsonl (same convention as apply-gated)",
    "Confirmation: one stdin line, trimmed, exactly y; n, empty, yes, Y, yy, EOF and /dev/null all refuse; no --yes/-y flag exists",
    "Feature must match ^[a-z0-9-]+$ (ADR 0008 decision 6), otherwise refuse even with y",
    "Negative tests also assert the script ran (no MODULE_NOT_FOUND, some output, the prompt names the feature or ref), so they cannot pass vacuously before the script exists"
  ],
  "failures": [],
  "pending": [
    { "item": "Implement scripts/queue-admin.mjs, the queue-admin npm script, and make the gate (gateRefusals/loadSnapshot) skip a ref with a queue-admit row", "owner": "developer" },
    { "item": "Write the settings deny patch (two rules from the architect handoff) to the developer handoff, not applied; test and report whether the user's !npm run queue-admin runs under the deny rules", "owner": "developer" }
  ]
}
```

## Criterion to test map

File `scripts/queue-admin.test.mjs`, run `node --test scripts/queue-admin.test.mjs`.

1. `active <feature>` with y writes one `queue_active` row; without y, empty or non-TTY stdin writes nothing, exits nonzero:
   - writes: "active <feature> with y on stdin appends exactly one queue_active config row by the user", "creates usage.jsonl when it is absent", "--root is accepted after the subcommand", "a second active command supersedes the first", "the active prompt shows the old and the new value" (ADR B(4)).
   - refuses: "active with stdin ..." (n, empty line, EOF, yes, Y, yy, no, x then y), "/dev/null stdin", "no flag that stands in for the y" (--yes, -y, --force, --confirm), "refuses a feature name outside ^[a-z0-9-]+$", "no feature or unknown subcommand".
2. `admit <ref> --reason` the same, refuses a missing reason: "admit <ref> --reason with y ... queue-admit row by the user", "keeps a reason with quotes, a backslash and unicode intact", "admit with stdin ..." (5 answers), "admit with a /dev/null stdin", "admit refuses a missing, empty or blank reason and a missing ref".
3. `board queue` active tier and admitted ticket: "board queue puts the active feature's tickets first after queue-admin active (and not before)", "a declined active leaves board queue as it was", "board gate lists a refused ticket until queue-admin admit with y; gate --apply then leaves it ready", "loadSnapshot and gateRefusals: a queue-admit row admits exactly the ticket it names" (reader seam, hand-written row).
4. Also covered: "package.json has a queue-admin script" (the `npm run queue-admin` entry the ticket names).
5. human-verified: criterion 4 (settings deny patch in the developer handoff, not applied; the test would break ticket 07, so it is checked by reading the handoff and `git diff` on `.claude/settings.json`) and criterion 5 (the `!npm run queue-admin` result under the deny rules, tried in the main session; or the handoff states it could not be tested before ticket 07).

## State of the run

All 31 fail. Failure reasons: 30 on `Cannot find module scripts/queue-admin.mjs` or the package.json script missing; 1 (reader seam) on the gate still listing the admitted ticket; none on setup or syntax. The control assertions inside them pass (for example, without an active row the number order holds). The "active already works" reader path (`queue_active` row to the active tier) is already implemented in queue/02, so the `board queue` test fails only because the script is missing.

I did not run the tests against an implementation, so a test could still be wrong in a detail only a real script shows (the exact prompt text is not pinned; the tests need only that the prompt names the feature or ref and, for `active`, the old value).

## Open scope questions (settle before verify)

- Does `admit` check that `<ref>` names a real ticket? The ticket and ADR do not say; the tests pin neither (a typo'd ref writes an inert row). Recommendation: refuse a ref that does not resolve, since the gate needs the ref to match exactly; if the user agrees, qa adds one test.
- Does the reader ignore a `queue_active` or `queue-admit` row without `by:"user"`? The tests pin that the script writes `by:"user"`, not that the reader enforces it. A hand-appended row can say `by:"user"` anyway (ADR 0015 Amendment 3 B), so enforcement adds little; left unpinned.
- `--root` default: the tests pin cwd as the default. Run from a worktree it would write that worktree's `.scratch`, not the main checkout's. The developer may resolve the main checkout (like `board`) as long as `--root` still wins.
