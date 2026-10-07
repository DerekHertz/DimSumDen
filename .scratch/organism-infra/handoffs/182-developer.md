# Handoff 182-developer

```json
{
  "ticket": "organism-infra/182-user-owns-visual-critique",
  "cell": "developer",
  "current_step": "Gated edits written as two patches in the main checkout's .scratch/_handoffs/gated/. Nothing is applied; the user applies them. No code changed, no branch commits.",
  "artifacts": [
    "/home/dhertzell/dimsumden/.scratch/_handoffs/gated/182-user-owns-visual-critique.patch (orchestrator.md, designer.md, CLAUDE.md)",
    "/home/dhertzell/dimsumden/.scratch/_handoffs/gated/182b-developer-asset-critic.patch (developer.md step 5, optional)"
  ],
  "decisions": [
    "Patches are format-patch files with commit messages; both pass git apply --check against main at 61a4bb8.",
    "Also edited orchestrator step 8 (reviewer list no longer names designer critique) and the 'ready-for-human gets it before stage 3' sentence, which would contradict the new post-verify critique stage.",
    "182b is split out because developer.md is outside the three files the ticket names; the user can skip it. Without it, developer.md step 5 still says designer critiques asset exports.",
    "Left unchanged: orchestrator step 7 mentions designer critique in the --detach flags list (the mode still exists when the user asks), and docs/agents/issue-tracker.md claim modes (still valid)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User runs !npm run apply-gated from the main checkout and answers y to 182-user-owns-visual-critique.patch (and optionally 182b-developer-asset-critic.patch). The stale 136-jev-go-live-genome.patch in the queue fails git apply --check against current main (orchestrator.md hunk at line 36), so it will be reported and left in place; not caused by 182.",
      "owner": "orchestrator"
    }
  ]
}
```

## What changes (exact text is in the patches)

- `.claude/agents/orchestrator.md`, "Code relay": the designer block is replaced. UI ticket relay reads designer spec (with the user, detailed spec plus static mockups) → qa specify → developer → qa verify → user visual critique (`ready-for-human`) → risk-check → PR. Findings go to one developer fix round, the user's yes unlocks stage 4. Asset tickets: the user critiques in place of `critique` mode. No designer `review` or `critique` dispatch on the relay; the block says this stays until a cheaper automated critique exists. Step 8 drops "designer critique" from the reviewer list; the "ready-for-human before stage 3" sentence gets a visual-critique exception.
- `.claude/agents/designer.md`: description, intro, `inputs` line updated; `spec` is interactive with the user and produces low-cost static visuals for sign-off; `review` and `critique` headings say they are off the relay, run only when the user asks.
- `CLAUDE.md`: "designer specs UI tickets with the user (a detailed spec plus low-cost mockups), and the user does all visual critique of UI and asset tickets until a cheaper automated critique exists."

## Acceptance criteria

- [x] Orchestrator genome no longer dispatches designer in review or critique mode on the relay (patch 182).
- [x] UI relay reads as specified, verbatim.
- [x] designer.md describes spec as collaborative with low-cost visuals for sign-off.
- [x] CLAUDE.md matches.
All four hold once the patch is applied; verified by git apply --check, not by a live apply.

## Comments for the orchestrator

- Only the user can apply: `!npm run apply-gated`. Release at `in-review` is a formality: there is no code branch to PR until the patch is applied and committed (apply-gated commits to the main checkout).
- The ticket has no tests and no `npm test` impact; `npm test` was not run.
