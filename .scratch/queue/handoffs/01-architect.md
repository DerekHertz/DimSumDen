# Handoff: queue/01-queue-design (architect)

```json
{
  "ticket": "queue/01-queue-design",
  "cell": "architect",
  "current_step": "Design done: ADR 0015 Amendment 3 (proposed) and CONTEXT.md Queue written and committed on architect/queue-01-design; not pushed. Next: the user reads the amendment and the ticket breakdown, then /to-tickets.",
  "artifacts": [
    "branch architect/queue-01-design",
    "docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md (Amendment 3, status line)",
    "CONTEXT.md (Queue, Active feature, Board and Kanban lines)"
  ],
  "decisions": [
    "Class and Origin are ticket header lines written by board create, not feature-level",
    "Active feature is a kind:config row in usage.jsonl; the user-only command cannot verify identity, so it is a separate entry point scripts/queue-admin.mjs with a stdin y, deny rules and by:user",
    "The order leaves jev.mjs for a pure module in apps/organism-infra behind board queue; jev-order rows stay as history, nothing reads them",
    "Genome edits for loop steps 5 and 6 are the diff below (gated)"
  ],
  "failures": [],
  "pending": [
    { "item": "User reads Amendment 3, answers the three questions under 'For the user', accepts or edits it", "owner": "user" },
    { "item": "Approve the ticket breakdown below, then /to-tickets publishes it", "owner": "orchestrator" }
  ]
}
```

## For the user (three questions the amendment could not settle)

1. **One active feature or two.** ADR 0019 Amendment 1 runs den-v1 and den-layout together. The Queue allows exactly one (spec decision 3). Pick one active feature; the other competes in the rest, or the spec changes.
2. **Pipeline tickets that block the active feature.** ADR 0019 decision 8 allows them without three incidents. The spec dropped that. Recommendation: keep it, checked in code as "an active-feature ticket lists it in Blocked by". Yes or no?
3. **Backfill of Class.** 0 of 349 tickets have a Class line. Day one proposes pipeline for organism-infra, ci-cd, pipeline-telemetry and mods-trial, product for the rest, and writes nothing until you approve the list.

## Orchestrator genome edit (gated; loop steps 5 and 6 of `.claude/agents/orchestrator.md`)

Write this to `.scratch/_handoffs/gated/<NN>-queue-genome.patch` only after `board gate`, `board queue` and `board pick` exist (ticket Q6). Generated against main at d0aa6fa; Q6 regenerates it against current main.

```diff
--- a.claude/agents/orchestrator.md
+++ b.claude/agents/orchestrator.md
@@ -36,8 +36,8 @@ You are the **orchestrator** cell of the Pass station. You coordinate; you never
 2b. **Grill before you plan.** When the user brings a feature request, idea or change with no approved spec, or a spec with open choices, do not go straight to tickets or a dispatch. Grilling is part of planning: when the plan has open choices, run the `grilling` skill (with `domain-modeling`, so settled terms go to `CONTEXT.md` and hard-to-reverse choices to an ADR; this is `/grill-with-docs`). If there are none, lay out the plan without questions. Look up facts yourself or via `scout`; ask only decisions. When the answer touches module boundaries or an existing ADR, name the ADR and dispatch `architect`; when it leaves requirements open, dispatch `product`. A recommendation without questions is not a substitute (user, 2026-10-02).
 3. Read the spec and the board (`docs/agents/issue-tracker.md`). Read only the latest handoff per ticket.
 4. If the spec has no tickets yet, run /to-tickets. Get the user's approval of the breakdown before publishing.
-5. Find the **frontier**: tickets that are ready, unblocked, and unclaimed. Log the order you will propose them in: `node scripts/jev.mjs order --actual <ref>,<ref>,...` (ADR 0015 decision 4, shadow; it only logs a `jev-order` row).
-6. Propose the next dispatch: which ticket, which cell type (`architect` for design questions, `product` for open requirements, the relay below for code), and why. Wait for approval of the ticket; after that, run its relay under "Relay autonomy" in `organism-protocol`. For the first cell of a fresh ticket, and for the next cell after a bounce, settle your own pick first, in route's labels (`product`, `architect`, `designer`, `qa-specify`, `developer-direct`, `user`; after a bounce `developer`, `qa`, `architect`, `user`). Then run `node scripts/jev.mjs route --ticket <ref> --mode advisory` (`route-bounce` after a bounce) and show Jev's `pick` and `conf` beside yours (ADR 0015 amendment 1). With no `pick` (a fallback), show yours alone. Jev never picks the cell: the user approves every dispatch. When the ticket resolves or its relay stops, log one row per advisory dispatch: `node scripts/jev.mjs advisory-outcome --ticket <ref> --orchestrator <your pick> --jev <Jev's pick, or none> --user <the cell dispatched> --bounced true|false`. Pass `true` when that cell's work later drew a bounce verdict.
+5. Find the **Queue** (ADR 0015 Amendment 3): run `npm run board -- gate` (a dry run that lists tickets the admission gate would park; never pass `--apply` without the user's yes), then `npm run board -- queue`. The Queue is the frontier in its computed order, active feature first. You do not reorder it. You never set the active feature or admit a refused ticket: only the user does, with `npm run queue-admin`, which is denied to you.
+6. Propose the **top ticket of the Queue** and paste the first lines of `board queue` (rank, tier, unblock count, P, decay count left) with the proposal; when the top ticket is outside the active feature, say "idle fill". To propose a different ticket, say why in the same message; the user decides; log the outcome with `npm run board -- pick <ref> [--deviation "<why>"]`. If you think the active feature should change, say so and ask; do not act. Name the cell type (`architect` for design questions, `product` for open requirements, the relay below for code), and why. Wait for approval of the ticket; after that, run its relay under "Relay autonomy" in `organism-protocol`. For the first cell of a fresh ticket, and for the next cell after a bounce, settle your own pick first, in route's labels (`product`, `architect`, `designer`, `qa-specify`, `developer-direct`, `user`; after a bounce `developer`, `qa`, `architect`, `user`). Then run `node scripts/jev.mjs route --ticket <ref> --mode advisory` (`route-bounce` after a bounce) and show Jev's `pick` and `conf` beside yours (ADR 0015 amendment 1). With no `pick` (a fallback), show yours alone. Jev never picks the cell: the user approves every dispatch. When the ticket resolves or its relay stops, log one row per advisory dispatch: `node scripts/jev.mjs advisory-outcome --ticket <ref> --orchestrator <your pick> --jev <Jev's pick, or none> --user <the cell dispatched> --bounced true|false`. Pass `true` when that cell's work later drew a bounce verdict.
 7. Sync `main` again and re-check the race rules below. Make sure the target branch isn't checked out in any worktree (`git worktree list`). If a clean worktree holds it, detach that worktree. Every relay dispatch prompt opens with the output of `node scripts/dispatch-prompt.mjs --ticket <ref> --cell <type> [--mode <m>] --base <sha> [--branch <b>] [--continue] [--batch <name>] [--tests <file>]`, pasted as printed (organism-infra/147): the ticket path (with `issues/`, checked to exist), the literal `node scripts/cell-start.mjs ...` line with the right flags for that cell and mode (`--base <tests sha> --branch <feature branch>` for a developer and for qa `specify`; `--base <sha> --detach` for qa `verify`, `security` and designer `critique`), the note that it runs inside the cell's worktree, the handoff path to write (a new `-2`, `-3` name once an earlier one is published), the release flag for that hop, and the Start-here line where step 0 below allows it. A prompt without that output is incomplete, and you never hand-write those lines. Exit 2 means a bad argument or a ticket that does not resolve: fix the call and run it again. `--ticket` in the `cell-start` line claims the ticket, so a refused claim stops the cell before it does any work (`docs/agents/cell-start.md`). Both run `npm ci`. Fix rounds reuse an existing branch, so they run `git checkout <branch>` then `npm ci`. Then dispatch through the Agent tool with `isolation: "worktree"` on every relay cell, so `cell-start` never runs in the main checkout. At most two cells run at once (`max_concurrent_cells: 2`), and only on different tickets whose files and branches don't overlap; within one ticket the relay stays one cell at a time. Add nothing the script already printed. The board finds the main checkout itself; don't pass `ORGANISM_ROOT`. Nothing else; it reads the rest itself.
    Before telling the user a background cell is still running, check it's alive: its worktree exists and its ticket `.lock` is held. If no notification has come after about twice that cell type's usual run time, treat it as dead: reclaim, remove its worktree, re-dispatch, and log an incident.
 8. When it returns, read its handoff and update the board. A reviewer (qa verify, security) ran on a detached SHA, so remove its worktree right away (`git worktree remove <path>`) if its receipt says clean. Check for its leftover processes, locks, stash entries and worktrees (`docs/agents/process-hygiene.md`); show the user what you found and clear it only with their yes. If its report lists `Environment issues`, raise them with the user and agree on a fix together: propose one or two options with AskUserQuestion. Record the agreed fix in the ticket's `## Comments`, and hold any dispatch that depends on it until the fix is in place. Don't apply environment fixes yourself. Repeat from step 1.
```

The rest of step 6 (route advisory, advisory-outcome) is unchanged. Also in the Rules paragraph (line 106), remove the `order` and `jev-order` mentions: `scripts/jev.mjs advisory-outcome`, `priority-verdict` and `order` become `advisory-outcome` and `priority-verdict`, and `jev-order` leaves the list of rows never written by hand. Settings patch (same ticket): add to `permissions.deny` in `.claude/settings.json`: `"Bash(npm run queue-admin:*)"`, `"Bash(node scripts/queue-admin.mjs:*)"`.

## Proposed ticket breakdown (feeds /to-tickets; the user approves before publishing)

All in feature `queue`, Class product, Origin spec. Serves: the spec decisions named. P1 each, since spec decision 15 puts this before agent-os/03.

| # | Scope | Files | Blocked by | Security |
|---|---|---|---|---|
| Q1 | Order module and `board queue`: `loadSnapshot`, `buildQueue` (tiers: P0 with reason, active feature, rest; order unblock, P, number; one reason line per ticket; decay-left; planned/added counts; parked-by-gate list empty until Q2). Reads the active row (absent means no active feature, so one tier). Tests at `buildQueue` with literals, one temp-board CLI test. Decisions 1, 2, 4 (order), 5, 12, 14. | `apps/organism-infra/frontier-queue.mjs`, `board.mjs`, tests | none | No (read only); risk-check |
| Q2 | Admission gate: parse Class, Origin, Serves machine forms, P0-reason; `checkAdmission`; `board gate [--apply]` (dry run default; parks with reason through the existing park path); `board create --class --serves --origin --p0-reason` and the P0 refusal; the blocks-the-active-feature rule if the user says yes. Decisions 4 (refusal), 6, 7. | `frontier-queue.mjs`, `board-service.mjs` (createTicket), `board.mjs`, tests | Q1 | **Yes, full:** reads `spec:<feature>` paths named by ticket text, parks tickets |
| Q3 | User-only entry point `scripts/queue-admin.mjs`: `active <feature>`, `admit <ref> --reason`; stdin `y`; writes `queue_active` config row and `queue-admit` row; Queue reads both. Decisions 3, 7 (admit). Prepares the settings deny patch. | `scripts/queue-admin.mjs`, `frontier-queue.mjs`, tests, gated settings patch | Q1 | **Yes, full:** permission boundary |
| Q4 | Decay and the unplanned cap: decay count from resolved rows, `queue-pick` rows and readySince; `board pick`; `gate --apply` parks expired tickets; unplanned cap with security findings counted but exempt from refusal. Decisions 8 (pick resets), 9, 10. | `frontier-queue.mjs`, `board.mjs`, tests | Q2, Q3 (needs admit and active) | No; risk-check |
| Q5 | Retire the old order: remove `rankFrontier`, `orderRow`, the `order` CLI point and tests from `jev.mjs`; drop the aging bump from `priority.mjs` (check its callers first, the UI snapshot builder used it); switch `scripts/queue.mjs` `proposed` to `buildQueue`; update the Frontier paragraph of `docs/agents/issue-tracker.md`. | `scripts/jev.mjs`, `scripts/jev-order.test.mjs`, `scripts/jev-scope.test.mjs`, `apps/organism-infra/priority.mjs`, `scripts/queue.mjs`, docs | Q1 | No; risk-check |
| Q6 | Genome and settings patch: the diff above and the two deny rules, written to `.scratch/_handoffs/gated/`; the user applies with `!npm run apply-gated`. Decision 11 (must propose top; deviation logged). | gated patch only | Q1-Q5 merged | n/a (gated edit) |
| Q7 | **Day-one gate run** (decision 13), a user-in-the-loop step, not code: `board gate` dry run over every ready ticket; the user sees the failures and the proposed Class backfill (and rewrites the 13 ready tickets' free-text Serves to the machine form, or admits them); exceptions via `queue-admin admit`; then `gate --apply`; the user sets the active feature. Go-live after Q6 is applied. Decisions 13, 11, 15. | board data only | Q2, Q3, Q4, Q6 | n/a |

Order: Q1, then Q2, Q3 and Q5 can follow (Q2 and Q3 both touch `board.mjs` and `frontier-queue.mjs`, so they should not run at once; Q5 touches different files). Q4 after Q2 and Q3. Q6 and Q7 last. Decision 15 (before agent-os/03 continues) holds because agent-os/03 is not started; only agent-os/05 is ready.

## Not proven

- That a user's `!npm run queue-admin ...` bypasses a `permissions.deny` rule. This is how I read Claude Code's `!` mode (it is not an agent tool call), and `apply-gated` assumes it, but I did not test it. Q3 must test it in the main session before relying on it.
- That stdin is empty and non-TTY for an agent's Bash call (observed true here for a subagent; not checked for the main orchestrator session or the future bridge-started agents).
- That "three incidents with the same `tool`" is a good proxy for "same cause". I did not look at real incident rows for how consistent `tool` is. Q2 should run it over `usage.jsonl` and report how many organism-infra pipeline tickets would pass.
- ADR 0021's actual text on ADR 0019 decision 8 (I saw only its status line list it as amended). Reconcile before the amendment is accepted.
- The counts: 13 ready tickets, 0 with a Class line, 128 of 349 with a Serves line, all 13 ready with one, on 2026-10-12 from a scan of `.scratch/*/issues`. The user's figure of 12 ready and 68 parked for organism-infra differs slightly from my 9 ready and 71 parked; the board moves.
- That `jev-order` rows are read only by `scripts/queue.mjs` (grep of `scripts/`, `apps/`, `.claude/agents/`; not a full-repo check).
- Cost: the new order reads every ticket file on each call (349 today); not measured, expected to be milliseconds.
