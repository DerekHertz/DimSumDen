# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`. In Agent Office this is the **board**.

## Organism additions

- **One board.** The board is `.scratch/` in the **main checkout**. Cells in worktrees use `$ORGANISM_ROOT/.scratch/` (fallback: the first path from `git worktree list`), never their worktree's copy.
- **Status values:** `ready-for-agent` → `claimed` → `in-review` → `resolved`. `in-review` means a developer finished a code ticket and it is going through the qa and security review stages; only the orchestrator moves it to `resolved`, after the merge. A `security` or `qa --mode verify` claim on an `in-review` ticket keeps it `in-review` (ADR 0008 decision 10); check the `.lock` to see if a review is running. `blocked` and `ready-for-human` can come from any state. Always add a reason in `## Comments`.
- **Claim lock:** `.scratch/<feature>/issues/<NN>-<slug>.lock`, created atomically by `board claim` (see the `organism-protocol` skill). The lock holder owns the ticket. Lock files are git-ignored.
- **Handoffs:** `.scratch/<feature>/handoffs/<NN>-<cell-type>.md` (see the `handoff` skill).

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- State is recorded as a `Status:` line near the top of each issue file (values above)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` (or keep `in-review` for a review claim) and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
