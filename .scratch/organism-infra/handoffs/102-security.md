# Security review: organism-infra/102 @ 433a06d

```json
{
  "ticket": "organism-infra/102-context-step-reads-heading-tickets",
  "cell": "security",
  "current_step": "Security pass. Diff reviewed by hand against origin/main (2 files); gitleaks clean.",
  "artifacts": [
    "scripts/dispatch-context.mjs",
    "scripts/dispatch-context.test.mjs"
  ],
  "decisions": [
    "Pass: no critical or high findings.",
    "No new dependency, no CI change, no lockfile change."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Orchestrator: continue the relay (PR and merge on green CI).",
      "owner": "orchestrator"
    }
  ]
}
```

## Scope

`git diff origin/main..433a06d`: `scripts/dispatch-context.mjs` (+6 -2, `parseTicket` only) and `scripts/dispatch-context.test.mjs` (new tests). The `/security-review` skill was not run; reviewed by hand.

## Findings

- scripts/dispatch-context.mjs:55 - low - New `## What to build` section regex reads the ticket body to the next `## ` heading, so more ticket text can reach the `jg` query than before (previously often empty on heading-form tickets). It is still capped at `WHAT_MAX` (1,500 chars, line 134) and is board-local text, the same trust class as the bold-line form. No action needed.
- scripts/dispatch-context.mjs:55-56 - low - Both regexes use a lazy `[\s\S]*?` with a lookahead; they do not nest quantifiers and are linear in practice. No ReDoS concern on ticket-sized input.

## Checked, no issue

- Shell exposure: `what` reaches `jg` only as an element of an argv array through `spawn` (lines 123, 184-186), with no `shell: true`. The query is prefixed by the fixed question text, so ticket text cannot become a leading option flag.
- Paths: `namedPaths` (line 63) only runs `existsSync` on matched strings and never reads or writes them. The `..` segment match is pre-existing behaviour, and the section text only widens the match source. No traversal read or write is added.
- Board files and locks: no change to the `.scratch` write path (lines 225-246), the rename or lock logic.
- Network: no daemon or listener code touched.
- Secrets: `gitleaks detect --log-opts="origin/main..433a06d"` scanned 2 commits, no leaks found. Tests use placeholder strings only.
- Dependencies: none added or changed.

## Verdict

Security pass.
