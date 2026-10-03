# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`. In Agent Office this is the **board**.

## Organism additions

- **One board.** The board is `.scratch/` in the **main checkout**. `board` finds it from any worktree through `git worktree list` (the main checkout is listed first), so cells need no setup; `$ORGANISM_ROOT` is an optional override, e.g. outside a git checkout. Never use a worktree's copy.
- **Status values:** `ready-for-agent` → `claimed` → `in-review` → `resolved`. `in-review` means a developer finished a code ticket and it is going through the qa and security review stages; only the orchestrator moves it to `resolved`, after the merge. A `security` or `qa --mode verify` claim on an `in-review` ticket keeps it `in-review` (ADR 0008 decision 10); check the `.lock` to see if a review is running. `blocked` and `ready-for-human` can come from any state. Always add a reason in `## Comments`.
- **Claim lock:** `.scratch/<feature>/issues/<NN>-<slug>.lock`, created atomically by `board claim` (see the `organism-protocol` skill). The lock holder owns the ticket. Lock files are git-ignored.
- **Claim modes:** `board claim <ref> <cell> --mode <m>`. `qa` must pass `--mode specify` or `--mode verify`. `designer` may pass `--mode review`, `spec`, `critique` or `direction` (a designer verdict needs `review`). Other cells may pass `specify` or `verify` but need no mode. Any other value is refused.
- **Handoffs:** `.scratch/<feature>/handoffs/<NN>-<cell-type>.md` (see the `handoff` skill). The State block names its author: `cell` (and `mode` for moded cells such as qa). `board release --status in-review|resolved` accepts only a handoff whose `cell`/`mode` match the claim and whose mtime is not older than the claim lock, so an earlier hop's handoff never satisfies it (ADR 0008 decision 11). Write your handoff after claiming and before releasing. `board handoff <ref> --template` prints a State block that already passes validation, with the ticket, cell and mode filled in; draft the handoff under `/tmp`, because `board handoff --from` refuses a file inside a worktree.
- **Resolve:** `board resolve <ref>... --pr <n> [--note "<text>"]` is the orchestrator's one-step resolve after a merge. It claims each ticket as orchestrator, publishes a minimal orchestrator handoff (`<NN>-orchestrator-resolve.md`, `current_step: resolved`, the PR in `artifacts`), and releases with `--status resolved --pr <n>`, which writes the usage.jsonl resolved row. Several refs share one `--pr` (a batch). Every ref is checked before the first write: a missing or invalid `--pr`, a missing ticket, an already-resolved ticket, or a lock held by another cell refuses the whole command and changes nothing. A failure after writes began names the refs already resolved and the ref it stopped on. The `claim` / `handoff` / `release` path still works.
- **Park and close:** `board park <ref>... --reason "<text>"` sets `parked` (off the relay until there is a reason to bring it back); `board close <ref>... --reason "<text>"` sets `closed` (will not be done); `board unpark <ref>... --reason "<text>"` returns a parked ticket to `ready-for-agent`. Each appends an orchestrator comment with the reason and one event per ref. Every ref is checked first: a missing, claimed or resolved ticket, or one already at the target status, refuses the whole command and changes nothing. No cell can release into `parked` or `closed`; the frontier and the idle audit skip them. Park anything that cannot name the v1 step or testbed friction it serves (refocus, `docs/refocus/triage-2026-10-02.md`).
- **Board audit:** `board audit [--stale-days N] [--feature F] [--json]` lists board inconsistencies: a claimed or in-review ticket with no lock, a lock with no matching branch or worktree (a branch named in the ticket or its handoffs counts), a `blocked` ticket whose blockers are all resolved, a `Blocked by` ref that does not exist, a handoff `pending` item naming another ticket that is missing or resolved with no comment recording it, and open tickets idle for N days (default 7). It never writes. Exit 0 clean, 1 findings, 2 bad arguments.
- **Release events** carry `force: true|false`; `--force` shows in the audit trail.

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
- **Priority**: a `**Priority:** P0|P1|P2|P3` line near the top (P0 urgent, P1 next, P2 normal, P3 someday). No line means P2. Set it when filing a ticket.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed. Order by priority, then by age (oldest first), then by number. A ticket that has stayed on the frontier through 3 orchestrator sessions (3 new `.scratch/_handoffs/*-orchestrator-*.md` files) moves up one level, so nothing waits forever (user, 2026-09-29).
- **Claim**: set `Status: claimed` (or keep `in-review` for a review claim) and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
