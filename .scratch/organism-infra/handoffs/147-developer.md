```json
{
  "ticket": "organism-infra/147-dispatch-prompt-script",
  "cell": "developer",
  "current_step": "scripts/dispatch-prompt.mjs written and committed on feat/147-dispatch-prompt-script @ 742898b; 55 of 55 tests in scripts/dispatch-prompt.test.mjs pass; orchestrator genome diff below (gated, not applied)",
  "artifacts": [
    "scripts/dispatch-prompt.mjs @ 742898b on feat/147-dispatch-prompt-script",
    "orchestrator genome diff in this handoff (git apply --check clean against 742898b)"
  ],
  "decisions": [
    "Output lines: Ticket (absolute path in the main checkout, with issues/), optional Batch line, the start note, one `node scripts/cell-start.mjs ...` line, refusal note, optional Start-here line, handoff line, release line",
    "--base is required for every cell (cell-start needs it); --branch is required for developer and qa specify; reviewers (qa verify, security, designer review/critique) always get --detach and ignore a given --branch; architect and designer spec/direction get --branch when given, else --detach",
    "Designer review releases with --keep-status (it cannot be told from a design-only review by arguments; spec and direction cover design-only work at ready-for-agent)",
    "A --mode on a cell that takes none (developer, architect, security) exits 2",
    "Start-here: dispatch-prompt spawns dispatch-context.mjs for architect, qa specify and developer only, so on a first run that script may write the context file and a jg usage row (its own behaviour); it reuses an existing file",
    "Handoff name: max existing suffix + 1 among <stem>.md and <stem>-<k>.md in the main checkout handoffs dir"
  ],
  "failures": [
    "npm test: 6 failures outside this ticket, all browser UI tests (smoke:ui timeout at 170s, 3 keyboard-approval tests, 2 pill tests); this script adds one file and no UI code, so they look environmental. Not re-run on main"
  ],
  "pending": [
    {
      "item": "apply the orchestrator genome diff below with `git apply` (gated, user runs `!npm run apply-gated` after writing it to .scratch/_handoffs/gated, or applies it in the developer worktree before qa verify)",
      "owner": "orchestrator"
    },
    {
      "item": "verify: check the 6 browser failures also fail on main",
      "owner": "qa"
    }
  ]
}
```

# 147 developer handoff

Branch `feat/147-dispatch-prompt-script`, head 742898b (one new file, `scripts/dispatch-prompt.mjs`). The 55 qa tests pass untouched. `npm test`: 2181 tests, 2175 pass, 6 fail (browser UI tests, see State block failures).

## Criteria

1. Table of flags per cell and mode: covered by the qa table tests, green.
2. Unresolvable ticket exits 2: green.
3. Start-here only for architect, qa specify, developer: green.
4. The orchestrator-genome diff is below, for the user to apply.

## Orchestrator genome diff (gated: `.claude/agents/orchestrator.md`)

Changes step 7 to paste `dispatch-prompt.mjs` output instead of hand-writing the dispatch lines, step 0 of the relay (the script prints the Start-here line), and the partial-returns note (new handoff name). It applies with `git apply` from the repo root.

```diff
--- a/.claude/agents/orchestrator.md
+++ b/.claude/agents/orchestrator.md
@@ -38,7 +38,7 @@
 4. If the spec has no tickets yet, run /to-tickets. Get the user's approval of the breakdown before publishing.
 5. Find the **frontier**: tickets that are ready, unblocked, and unclaimed. Log the order you will propose them in: `node scripts/jev.mjs order --actual <ref>,<ref>,...` (ADR 0015 decision 4, shadow; it only logs a `jev-order` row).
 6. Propose the next dispatch: which ticket, which cell type (`architect` for design questions, `product` for open requirements, the relay below for code), and why. Wait for approval of the ticket; after that, run its relay under "Relay autonomy" in `organism-protocol`. For the first cell of a fresh ticket, and for the next cell after a bounce, settle your own pick first, in route's labels (`product`, `architect`, `designer`, `qa-specify`, `developer-direct`, `user`; after a bounce `developer`, `qa`, `architect`, `user`). Then run `node scripts/jev.mjs route --ticket <ref> --mode advisory` (`route-bounce` after a bounce) and show Jev's `pick` and `conf` beside yours (ADR 0015 amendment 1). With no `pick` (a fallback), show yours alone. Jev never picks the cell: the user approves every dispatch. When the ticket resolves or its relay stops, log one row per advisory dispatch: `node scripts/jev.mjs advisory-outcome --ticket <ref> --orchestrator <your pick> --jev <Jev's pick, or none> --user <the cell dispatched> --bounced true|false`. Pass `true` when that cell's work later drew a bounce verdict.
-7. Sync `main` again and re-check the race rules below. Make sure the target branch isn't checked out in any worktree (`git worktree list`). If a clean worktree holds it, detach that worktree. Every relay dispatch prompt contains the literal `node scripts/cell-start.mjs ...` line for that cell, with the SHA and branch filled in; a prompt without it is incomplete. Tell each relay cell to start with one command (`docs/agents/cell-start.md`): a developer after qa specify runs `node scripts/cell-start.mjs --base <tests sha> --branch <feature branch> --ticket <ref> --cell developer`; reviewers run `node scripts/cell-start.mjs --base <sha> --detach --ticket <ref>` with `--cell qa --mode verify`, `--cell security`, or `--cell designer --mode critique`. `--ticket` claims the ticket, so a refused claim stops the cell before it does any work. Both run `npm ci`. Fix rounds reuse an existing branch, so they run `git checkout <branch>` then `npm ci`. Then dispatch through the Agent tool with `isolation: "worktree"` on every relay cell, so `cell-start` never runs in the main checkout. At most two cells run at once (`max_concurrent_cells: 2`), and only on different tickets whose files and branches don't overlap; within one ticket the relay stays one cell at a time. Give it the ticket path, the handoff path to write (written before `board release`), and for relay cells the mode and branch. The board finds the main checkout itself; don't pass `ORGANISM_ROOT`. Nothing else; it reads the rest itself.
+7. Sync `main` again and re-check the race rules below. Make sure the target branch isn't checked out in any worktree (`git worktree list`). If a clean worktree holds it, detach that worktree. Every relay dispatch prompt opens with the output of `node scripts/dispatch-prompt.mjs --ticket <ref> --cell <type> [--mode <m>] --base <sha> [--branch <b>] [--continue] [--batch <name>]`, pasted as printed (organism-infra/147): the ticket path (with `issues/`, checked to exist), the literal `node scripts/cell-start.mjs ...` line with the right flags for that cell and mode (`--base <tests sha> --branch <feature branch>` for a developer and for qa `specify`; `--base <sha> --detach` for qa `verify`, `security` and designer `critique`), the note that it runs inside the cell's worktree, the handoff path to write (a new `-2`, `-3` name once an earlier one is published), the release flag for that hop, and the Start-here line where step 0 below allows it. A prompt without that output is incomplete, and you never hand-write those lines. Exit 2 means a bad argument or a ticket that does not resolve: fix the call and run it again. `--ticket` in the `cell-start` line claims the ticket, so a refused claim stops the cell before it does any work (`docs/agents/cell-start.md`). Both run `npm ci`. Fix rounds reuse an existing branch, so they run `git checkout <branch>` then `npm ci`. Then dispatch through the Agent tool with `isolation: "worktree"` on every relay cell, so `cell-start` never runs in the main checkout. At most two cells run at once (`max_concurrent_cells: 2`), and only on different tickets whose files and branches don't overlap; within one ticket the relay stays one cell at a time. Add nothing the script already printed. The board finds the main checkout itself; don't pass `ORGANISM_ROOT`. Nothing else; it reads the rest itself.
    Before telling the user a background cell is still running, check it's alive: its worktree exists and its ticket `.lock` is held. If no notification has come after about twice that cell type's usual run time, treat it as dead: reclaim, remove its worktree, re-dispatch, and log an incident.
 8. When it returns, read its handoff and update the board. A reviewer (qa verify, security, designer critique) ran on a detached SHA, so remove its worktree right away (`git worktree remove <path>`) if its receipt says clean. Check for its leftover processes, locks, stash entries and worktrees (`docs/agents/process-hygiene.md`); show the user what you found and clear it only with their yes. If its report lists `Environment issues`, raise them with the user and agree on a fix together: propose one or two options with AskUserQuestion. Record the agreed fix in the ticket's `## Comments`, and hold any dispatch that depends on it until the fix is in place. Don't apply environment fixes yourself. Repeat from step 1.
 
@@ -46,14 +46,14 @@
 
 Every code ticket runs through these stages, one cell at a time per ticket:
 
-0. Context step (ADR 0014; ticket 87), once per ticket before the first stage that starts cold. Run `node scripts/dispatch-context.mjs --ticket <feature>/<NN-slug>`. It prints one JSON line `{path, bytes, skipped, fallback}`, exits 0 whatever happens (2 only for bad arguments), and reuses an existing file, so every later hop is free. Never read the file yourself. When `path` is non-null, add this line to the dispatch prompt of `architect`, `qa` in `specify` mode and `developer` (fix rounds included), and to no other cell: `Start-here context: <path> (jg output; read before searching; may be incomplete or stale)`. When `path` is null (skipped, or a fallback such as `jg-missing`, `not-authenticated`, `timeout`, `secret-in-root`), add nothing and dispatch as before. Run it with `--refresh` only after the ticket's What to build text changes.
+0. Context step (ADR 0014; ticket 87), once per ticket before the first stage that starts cold. Run `node scripts/dispatch-context.mjs --ticket <feature>/<NN-slug>`. It prints one JSON line `{path, bytes, skipped, fallback}`, exits 0 whatever happens (2 only for bad arguments), and reuses an existing file, so every later hop is free. Never read the file yourself. `node scripts/dispatch-prompt.mjs` runs it for you and prints the line below for `architect`, `qa` in `specify` mode and `developer` (fix rounds included), and for no other cell: `Start-here context: <path> (jg output; read before searching; may be incomplete or stale)`. When `path` is null (skipped, or a fallback such as `jg-missing`, `not-authenticated`, `timeout`, `secret-in-root`), the script prints no such line and you add nothing. Run it with `--refresh` only after the ticket's What to build text changes.
 1. `qa` in `specify` mode writes failing acceptance tests on a tests branch.
 2. `developer` starts from that branch and makes them pass. It ends at `in-review`. Right before dispatching it, run `node scripts/jev.mjs tier --ticket <feature>/<NN-slug>` (ADR 0010) and dispatch with the Agent `model` set to its `effective` field.
 3. `qa` in `verify` mode checks the developer's branch: light verify if qa ran `specify` for this ticket, full verify otherwise. Right before dispatching it, save the developer's test output to a non-hidden scratch path such as `/tmp/<NN>-tests.txt` (`npm test > <file> 2>&1` in its worktree) and run `node scripts/jev.mjs verify --ticket <ref> --tests <file>`. Once ticket 40 has defined light verify's scope in the qa genome, dispatch light verify with Agent `model: haiku`; full verify keeps the genome model. In shadow mode (the default), `effective` always equals today's rule, so the relay is unchanged; the script logs the `jev` row itself. A Jev outage, missing key or spend cap exits 0, so it never blocks a dispatch. Invalid arguments exit 2, including a `--tests` path the exposure check refuses (a denied path, a symlink, over 1 MB, or anything in a hidden directory).
 4. Risk-size stage 4: have `scout` run `npm run risk-check` on the branch. Clean exit skips full `security`. Any hit (or the ticket touching dependencies, CI workflows, or branch protection) dispatches full `security`.
 5. Once qa verify and security (or a clean risk-check) pass, push the branch and open the PR yourself, and wait for `gh pr checks` to go green. Then merge on green under "Relay autonomy" in `organism-protocol`, posting the PR link; if CI is red, the merge conflicts, or autonomy does not apply, propose the merge (a gate) with the PR link instead. After it merges, run `npm run board -- resolve <ref> --pr <n>`. It claims, publishes a minimal resolve handoff and releases in one step, and writes the `resolved` row; don't claim, hand off and release by hand. Then run `node scripts/worktree-gc.mjs`, show the user the dry run, and run it with `--apply` only on their yes. It removes merged worktrees whose only dirt is byte-identical copies of main's files or `.claude/` config, deletes their branches, and lists every other dirty worktree for the user to decide.
 
-**Partial returns (organism-infra/119).** A cell that reaches 80k of its own context commits work in progress, publishes a handoff of what is done and left, releases, and returns `outcome: partial` (see "Context budget" in `organism-protocol`). Dispatch a fresh cell of the same type and mode on the same branch, with that handoff named in the prompt. It is the same round: it is not a bounce and does not count toward fails-twice. Log the partial return with `--outcome "partial: <what is left>"` so the retro counts it. Pass `--context <n>` to `log-cell.mjs` from the cell's `final context` line. The `cell-start` line of every dispatch that is a fix round, a later hop of a ticket already in flight, or a re-dispatch after a partial gets `--continue`: it gets the 70k warning but never the 80k refusal, so the relay in flight can finish. Only the first hop of a new ticket omits it. Never pass `--force` without the user's yes. When `cell-start` refuses with `orchestrator context <n>k ≥ 80k`, write your session handoff and ask the user to `/compact`.
+**Partial returns (organism-infra/119).** A cell that reaches 80k of its own context commits work in progress, publishes a handoff of what is done and left, releases, and returns `outcome: partial` (see "Context budget" in `organism-protocol`). Dispatch a fresh cell of the same type and mode on the same branch, with that handoff named in the prompt; `dispatch-prompt.mjs` prints its new handoff name (`<NN>-<cell>[-<mode>]-2.md`) because `board handoff` refuses to overwrite one published under an earlier claim. It is the same round: it is not a bounce and does not count toward fails-twice. Log the partial return with `--outcome "partial: <what is left>"` so the retro counts it. Pass `--context <n>` to `log-cell.mjs` from the cell's `final context` line. The `cell-start` line of every dispatch that is a fix round, a later hop of a ticket already in flight, or a re-dispatch after a partial gets `--continue`: it gets the 70k warning but never the 80k refusal, so the relay in flight can finish. Only the first hop of a new ticket omits it. Never pass `--force` without the user's yes. When `cell-start` refuses with `orchestrator context <n>k ≥ 80k`, write your session handoff and ask the user to `/compact`.
 
 **One session per ticket (organism-infra/122).** When a ticket or batch resolves, do not dispatch the next one in the same session. Run `node scripts/worktree-gc.mjs` as above, write your session handoff, and tell the user to start a fresh session with `npm run next-session` (it prints `claude --agent orchestrator "<prompt>"` naming your latest handoff; `npm run next-session -- --run` starts it). Put the frontier ticket you would propose next in that same message. Every call re-reads the whole context, so a fresh session per ticket is cheaper than a long one. Compaction (`/compact`) is only the fallback for a ticket that hits the 80k gate mid-flight; it is not the way to move on to the next ticket.
 
```

## Notes for the orchestrator

- Designer `review` prints `--keep-status`. If you want a design-only review to release `--status ready-for-agent`, say so and a flag can be added.
- Every dispatch needs `--base <sha>`; the script refuses without it.
