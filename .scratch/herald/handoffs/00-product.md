```json
{"ticket": "herald/spec", "cell": "product", "current_step": "Spec written; two open decisions defaulted; CONTEXT.md terms proposed but not written",
 "artifacts": [".scratch/herald/spec.md", ".scratch/herald/handoffs/00-product.md"],
 "decisions": ["Herald sits in the Front of House station (architect may override)", "Sonnet, medium effort; read-only tools plus Write and Agent, no Bash, WebFetch or GitHub write tools", "Default draft location .scratch/herald/drafts/<series>-<NN>-<slug>.md", "Default image sourcing: reference existing screenshots only, never capture", "No ADR needed; publishing by herald would need one", "Test seam: one draft-shape check function plus genome tool assertions"],
 "failures": ["AskUserQuestion is unavailable inside a subagent, so the two open questions (draft location, image sourcing) were not asked; recommended defaults used"],
 "pending": [
  {"item": "Confirm with the user: draft location and image sourcing defaults in spec.md", "owner": "orchestrator"},
  {"item": "Ask the user to approve the proposed CONTEXT.md terms (Herald, Draft, Post series) under a Communication heading, then write them", "owner": "orchestrator"},
  {"item": "Run to-tickets on .scratch/herald/spec.md", "owner": "orchestrator"},
  {"item": "Apply the herald genome (.claude/agents/herald.md) with the user's permission once a ticket delivers the diff", "owner": "orchestrator"}
 ]}
```

## State
Partial: spec done, two user decisions defaulted and unconfirmed.

## What changed
No code, no branch. New files: `.scratch/herald/spec.md`, this handoff. `CONTEXT.md` unchanged (pass gate).

## Decisions made
See the State block. Details and rationale are in `.scratch/herald/spec.md` under Implementation Decisions.

## Next step
Orchestrator: confirm the two defaults with the user, get approval for the glossary terms, then run `to-tickets` on the spec. Next cell: `orchestrator`.

## Suggested skills
`to-tickets`, `domain-modeling` (for the glossary write once approved).

## Gotchas
- The genome is a `.claude/` edit: the orchestrator applies it, with the user's permission.
- The four series drafts depend on the genome being applied first.
- Nothing in this cell used the board CLI, so there is no claim or lock; the handoff was written directly into the path the task named.
