---
name: handoff
description: Compact the current work into a handoff document for the next cell to pick up. Use at the end of every cell's task (apoptosis), before exiting, or when the user asks for a handoff.
argument-hint: "What will the next cell be used for?"
---

Write a handoff document so a fresh cell can continue the work without reading this conversation.

Save it on the board, not in the OS temp dir: `.scratch/<feature-slug>/handoffs/<NN>-<cell-type>.md`, where `<NN>` is the ticket number you worked. If there is no ticket, use `.scratch/_handoffs/<YYYY-MM-DD>-<cell-type>.md`. Overwrite an earlier handoff from the same cell type on the same ticket. Then append a one-line pointer to the ticket's `## Comments`.

Keep it under 60 lines. Start the file with a fenced `json` State block (ADR 0009 decision 4). `board release --status in-review|resolved` parses the first `json` fence in the ticket's newest handoff and refuses the release if it's missing or invalid:

```json
{"ticket": "<feature>/<NN>", "current_step": "one line: where the work stands",
 "artifacts": ["paths you changed or wrote"], "decisions": ["choices not in an ADR or the ticket"],
 "failures": ["what failed or was refused, or leave empty"],
 "pending": [{"item": "what's left", "owner": "<next cell type>"}]}
```

`pending` is `[]` when nothing is left. Otherwise every item needs a non-empty `item` and a named `owner`. You can't hand back an interim status with unowned work. Validate the block with `validateState` from `apps/organism-infra/schemas.mjs` if you're unsure.

Then these sections:

- **State**: done / partial / blocked, in one line.
- **What changed**: branch name and commit SHAs. Reference diffs, specs, ADRs, and tickets by path; don't duplicate them.
- **Decisions made**: only ones not already in an ADR or the ticket.
- **Next step**: the single next action, and which cell type should take it.
- **Suggested skills**: the skills the next cell should load.
- **Gotchas**: anything that cost you time.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If arguments were passed, treat them as what the next cell will focus on and tailor the doc accordingly.

<!-- Adapted from mattpocock/skills productivity/handoff (MIT). See .claude/skills/VENDORED.md. -->
