# 136: Jev go-live amendment to ADRs 0010 and 0015, plus the use-case ledger

**Type:** design-question

**Priority:** P0

**Blocked by:** None

**Status:** resolved

**Serves:** ADR 0019 decision 5 (Jev routes each step and is judged by outcomes). The user settled the go-live terms in a grilling on 2026-10-04 and confirmed the list ("yes to the jev list"). Nothing is live yet; this amendment comes first.

## What to build

Amend ADR 0010 (`docs/adr/0010-jev-precheck-tier-and-verify-depth.md`) and ADR 0015 (`docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md`) so they record the go-live terms below, and write the ledger `docs/jev-usecases.md`. Read ADR 0019 decision 5 first: it already amends 0010 decision 10 and 0015 decisions 4-5, so say where this amendment follows it and surface any conflict.

The user's confirmed list (copied from orchestrator handoff 33, `.scratch/_handoffs/2026-10-04-orchestrator-33.md`; points 1 to 9 are this ticket's scope):

1. Live now: `verify`, `route` (new-ticket half), `wake`. `priority` and `scope` live as a displayed suggestion.
2. `tier` is retuned before it goes live: may lower a small ticket to Haiku as well as raise; `hard` rubric tightened; labels and thresholds re-derived objectively from measured outcomes in the shadow rows (tokens, bounces), which the user asked for explicitly. A Haiku developer that bounces is a safety miss and turns lowering off.
3. ADR 0015 authority rules stay (allowed options only, never skip, never bypass a gate; the user approves every ticket). Only "shadow first, then exit review" is replaced.
4. Trial: 10 resolved tickets per use case, then one keep-or-kill verdict. One safety miss turns the use case off.
5. Tracking: `docs/jev-usecases.md` (start date, mode, what is sent to TypeSafe, what it touches, measure, baseline, kill condition); a `config` row per go-live; `jev-report.mjs` per use case.
6. Measure: weighted tokens per resolved ticket against the last 10 tickets before go-live, bounce rate no worse.
7. Confidence: live picks below 0.8 fall back; architect may adjust per point.
8. One `security` review before any use that sends handoff text (bounce routing, handoff trimming).
9. New use cases: qa done-check (74) first, then handoff trimming; security second opinion (75), partial-return check and compaction filtering stay parked.

For context only, not this ticket's work:

10. Close 68 (its numbers become the baseline); keep 124.
11. Queue: `architect` (ADR 0010/0015 amendment plus the ledger) right after 134, then a go-live ticket, then 99.

Also write the scope of the follow-up go-live ticket into this ticket's answer, so the orchestrator can file it. It must include this known bug: `jev.mjs verify` in shadow with fallback `no-key` printed `effective: full` on a qa-specified ticket, though shadow is meant to equal today's rule (incident logged in `.scratch/usage.jsonl`).

Files: `docs/adr/0010-*.md`, `docs/adr/0015-*.md`, `docs/jev-usecases.md` (new). No code. Any edit this needs in `.claude/` or `CLAUDE.md` (the orchestrator role file names the shadow rules) is user-gated: write the exact edit into the handoff and do not apply it.

## Acceptance criteria

- [ ] ADR 0010 and ADR 0015 each carry a dated amendment covering the points of the list that touch them, with every replaced decision named by number
- [ ] `docs/jev-usecases.md` exists with one entry per use case in points 1, 2 and 9, each with the fields of point 5
- [ ] The baseline in point 6 is defined well enough to compute from `.scratch/usage.jsonl` (which rows, which tickets, which weighting)
- [ ] Each point's confidence floor (point 7) is stated, with a reason wherever it differs from 0.8
- [ ] Conflicts with ADR 0019 decision 5 or any other ADR are surfaced, not resolved silently
- [ ] The go-live ticket's scope is written in this ticket's answer, including the `jev verify` shadow fallback fix
- [ ] Gated `.claude/` or `CLAUDE.md` edits are in the handoff as one apply command, not applied

## Comments

- **Created (orchestrator, 2026-10-05):** Filed and dispatched on the user's yes ("yes start dispatching"). The list was confirmed by the user on 2026-10-04.
- **architect, 2026-10-06:** architect died with no handoff (handoff 36); user parks 136 until den-v1 works
- **orchestrator, 2026-10-06:** Parked: User 2026-10-05: park until den-v1 works. The stalled architect's uncommitted partial work (ADR 0010/0015 edits, docs/jev-usecases.md) lives only in the Mac worktree agent-aa4acad29a81bddf3; the gated patch is at .scratch/_handoffs/gated/136-jev-go-live-genome.patch.
- **architect, 2026-10-06:** stale lock from the architect that died on 2026-10-05 (handoff 36), no handoff left; force-cleared on the user's yes, 2026-10-05. Ticket stays parked; partial work stays in worktree agent-aa4acad29a81bddf3
- **orchestrator, 2026-10-06:** With the user's yes, the dead architect's drafts are WIP-committed as fa3181f on local branch `docs/136-jev-go-live-amendment` (worktree agent-aa4acad2, now clean; pushed to origin with the user's yes, 2026-10-06). Resume from that commit; ADR 0015 Amendment 2 lists conflicts for the user to settle.
- **orchestrator, 2026-10-07 (un-parked, P0):** User: "we need to start actually letting jev help with making decisions and finding information for agents ... bump the priority." Grilling settled the draft's conflicts C1-C7; user confirmed "yes to 136". The architect resumes from fa3181f (`docs/136-jev-go-live-amendment`), writes these into ADR 0010/0015 and `docs/jev-usecases.md`, adds new terms to `CONTEXT.md`, and scopes the build tickets:
  1. **Route, new tickets (C2):** live. The orchestrator proposes Jev's pick at conf ≥ 0.8; below that it falls back and shows both; user approves every dispatch. Before go-live: normalize label aliases in advisory-outcome rows (`qa`=`qa-specify`, `developer`=`developer-direct`; real agreement 27/39 = 69%); add `security` to route's labels; prepend a code-built header to `state` (ticket Type, files touched, flags for gated `.claude/`/`CLAUDE.md`, `.github/workflows`, `apps/ui`/assets, relay defaults; jev-1.13 has a 32k-token window); sharpen the criteria text; also build an atomic version (yes/no questions: scope open → product, design/ADR → architect, UI/visual → designer, CI/deps/secrets → security; else qa-specify or developer-direct, composed in code; TypeSafe advises "atomic questions composed in code"). Replay both on the 39 labelled tickets; keep the higher; go live only at ≥ 80% agreement. Then a 10-ticket trial; one safety miss turns it off. TypeSafe offers no few-shot or fine-tuning.
  2. **Verify (C3):** lift the qa-unspecified floor: light verify when Jev picks `light` at conf ≥ 0.8, all tests green, risk-check clean. Any escaped bug turns it off.
  3. **Done-check (74):** escalate-only. Jev judges criteria from criteria + test output + diff; `fail` → full verify or back to developer; `pass` changes nothing. Sending the diff waits for 42.
  4. **Wake (C1):** live despite ADR 0019; code wakes on any user-authored comment; trial judged on safety only.
  5. **Priority and scope (C6):** displayed suggestions only, collecting data; not live until the data supports it.
  6. **Handoff text and diffs to TypeSafe (C4):** un-park 42 (security review) right after 136; bounce routing, handoff trimming and done-check wait on it.
  7. **Finding information:** the start-here context file goes to every hop that starts cold (full qa verify, security, scout); scout calls `jg` before grepping.
  8. **Tier (C7):** retune from the 98 shadow rows; Haiku 5.5 (`claude-haiku-5-5`, Claude Code ≥ 2.1.293) may take developer work on tickets Jev rates `small` at conf ≥ 0.8; one Haiku bounce turns lowering off. Light verify moves to Haiku with it.
  9. **Gated edits (C5):** the cell writes the exact new text for `.claude/`/`CLAUDE.md` into the ticket; the user applies it in an interactive session without auto mode. Same method unblocks 182.
- **architect, 2026-10-07:** architect returned partial (context budget 80k hit, SubagentHandback refused by hook). Merged origin/main into docs/136-jev-go-live-amendment (1431100, local, unpushed); no doc edits made. Status stays claimed, no lock. Full report in handoffs/136-architect.md: re-dispatch a fresh architect to rewrite ADR 0010/0015 amendments and docs/jev-usecases.md to the 9 settled decisions.
- **architect, 2026-10-07:** Round 2: ADR 0010 Am.1, 0015 Am.2, 0014 Am.1, docs/jev-usecases.md and CONTEXT.md rewritten to the 9 settled decisions (pushed, 10f0b4d). Build tickets A-H scoped in handoffs/136-architect-2.md. Not done: exact gated .claude/CLAUDE.md text (needs a fresh cell reading orchestrator.md and scout.md only). Verify caution: 0 of 52 shadow light picks reached 0.8.
- **architect, 2026-10-07:** **orchestrator, 2026-10-07 (user verdict):** user agrees to all three findings: (1) verify floor stays 0.8 for now; (2) tier validated by replay on history, not a 10-ticket shadow run; (3) wake keeps the 0.9 floor. Thresholds do not move until build ticket B's replay results are in; then revisit.
- **architect, 2026-10-07:** Architect round 3: proposed wording for the gated files, for the user to review and apply interactively (nothing here edited the files). Each pair is the exact text on current main (each Before checked to occur exactly once) and its replacement; apply a pair only after the build ticket named in its header has merged, because the text describes the behaviour that ticket adds. 'apply now' means it is true today. Spread over several comments (4000-char limit): O1-O9 orchestrator.md, S1 scout.md, C1-C2 CLAUDE.md. Notes and open points follow the pairs.
- **architect, 2026-10-07:** O1 (.claude/agents/orchestrator.md, Loop step 1, wake; after build C)
  Before:
  ````
  In shadow it only logs `jev` rows; carry on whatever `wake` says.
  ````
  After:
  ````
  It prints one JSON line. If the line has `"wake": false`, the wake was suppressed (`wake` is live: an `informational` label at confidence 0.9 or more; the code never suppresses a user-authored comment, `Scope added`, a `--verdict` comment, an unknown author, a `_requests` row or any code-decidable condition), so end your turn with one line saying so. Any other result, including an error or no `wake` field, means carry on.
  ````
  
  O2 (.claude/agents/orchestrator.md, Loop step 5, order; after build D)
  Before:
  ````
  (ADR 0015 decision 4, shadow; it only logs a `jev-order` row).
  ````
  After:
  ````
  (ADR 0015 decision 4 and Amendment 2; it logs a `jev-order` row). Code keeps the order, and an explicit Priority line always wins. `priority` and `scope` are displayed suggestions in `advisory` mode: in the proposal, show Jev's `mismatch` flag and its `small | medium | large` scope label beside each ticket where the command prints one, and never reorder, skip or promote a ticket on one.
  ````
  
  O3 (.claude/agents/orchestrator.md, Loop step 6, route; after build A)
  Before:
  ````
  For the first cell of a fresh ticket, and for the next cell after a bounce, settle your own pick first, in route's labels (`product`, `architect`, `designer`, `qa-specify`, `developer-direct`, `user`; after a bounce `developer`, `qa`, `architect`, `user`). Then run `node scripts/jev.mjs route --ticket <ref> --mode advisory` (`route-bounce` after a bounce) and show Jev's `pick` and `conf` beside yours (ADR 0015 amendment 1). With no `pick` (a fallback), show yours alone. Jev never picks the cell: the user approves every dispatch. When the ticket resolves or its relay stops, log one row per advisory dispatch: `node scripts/jev.mjs advisory-outcome --ticket <ref> --orchestrator <your pick> --jev <Jev's pick, or none> --user <the cell dispatched> --bounced true|false`. Pass `true` when that cell's work later drew a bounce verdict.
  ````
  After:
  ````
  For the first cell of a fresh ticket, run `node scripts/jev.mjs route --ticket <ref>`; the mode comes from the `route` use case's latest `config` row (ADR 0015 Amendment 2). Route's labels are `product`, `architect`, `designer`, `security`, `qa-specify`, `developer-direct`, `user`. If the mode is `live` and the output has a `pick` that is not `other` with `conf` of 0.8 or more, propose that pick as your dispatch proposal without settling your own first. Otherwise (a fallback with no `pick`, `other`, `conf` below 0.8, or a mode that is not `live`), settle your own pick in the same labels and show Jev's `pick` and `conf` beside it, or yours alone when there is no `pick`. For the next cell after a bounce, settle your own pick first (`developer`, `qa`, `architect`, `user`), then run `node scripts/jev.mjs route-bounce --ticket <ref> --mode advisory`; the bounce half stays advisory (ADR 0015 Amendment 1), so show Jev's `pick` and `conf` beside yours. Jev never picks the cell: the user approves every dispatch. When the ticket resolves or its relay stops, log one row per route dispatch: `node scripts/jev.mjs advisory-outcome --ticket <ref> --orchestrator <your pick, or none when you proposed Jev's pick unchanged> --jev <Jev's pick, or none> --user <the cell dispatched> --bounced true|false`. Pass `true` when that cell's work later drew a bounce verdict. It is a safety miss when a live pick would have skipped a required cell (for example `developer-direct` on a ticket that needed qa tests), or when the wrong first cell is named as the cause of a bounce: turn `route` off (see Rules).
  ````
- **architect, 2026-10-07:** O4 (.claude/agents/orchestrator.md, Code relay stage 2, tier; after build E)
  Before:
  ````
  (ADR 0010) and dispatch with the Agent `model` set to its `effective` field.
  ````
  After:
  ````
  (ADR 0010 Amendment 1) and dispatch with the Agent `model` set to its `effective` field. `effective` can be `haiku` for a ticket Jev rates `small` at confidence 0.8 or more (the one place a developer runs below its genome model) or `opus` for `hard`; log the run with `--model` (see Rules). A Haiku developer that bounces is a safety miss: tell the user and turn lowering off (see Rules).
  ````
  
  O5 (.claude/agents/orchestrator.md, Code relay stage 3, verify; after build B)
  Before:
  ````
  3. `qa` in `verify` mode checks the developer's branch: light verify if qa ran `specify` for this ticket, full verify otherwise. Right before dispatching it, save the developer's test output to a non-hidden scratch path such as `/tmp/<NN>-tests.txt` (`npm test > <file> 2>&1` in its worktree) and run `node scripts/jev.mjs verify --ticket <ref> --tests <file>`. Once ticket 40 has defined light verify's scope in the qa genome, dispatch light verify with Agent `model: haiku`; full verify keeps the genome model. In shadow mode (the default), `effective` always equals today's rule, so the relay is unchanged; the script logs the `jev` row itself.
  ````
  After:
  ````
  3. `qa` in `verify` mode checks the developer's branch. Today's rule is light verify if qa ran `specify` for this ticket, full verify otherwise. `verify` is live (ADR 0010 Amendment 1), so Jev's pick sets the depth within these limits: it may raise light to full on any ticket, and it may lower full to light on a ticket qa never specified only at confidence 0.8 or more. First have `scout` run `npm run risk-check` on the branch (stage 4 reuses this result). Then save the developer's test output to a non-hidden scratch path such as `/tmp/<NN>-tests.txt` (`npm test > <file> 2>&1` in its worktree) and run `node scripts/jev.mjs verify --ticket <ref> --tests <file>`. Dispatch the depth in its `effective` field: light verify with Agent `model: haiku`, full verify with the genome model. Whatever `effective` says, dispatch full verify if any of the developer's tests is red or `risk-check` hit. When the mode is not `live`, `effective` equals today's rule. The script logs the `jev` row itself. It is a safety miss when light verify ran on Jev's pick and a defect that a full verify would plausibly have caught is later found by `security`, in review or after merge, judged from the handoffs: turn `verify` off (see Rules).
  ````
  
  O6 (.claude/agents/orchestrator.md, Code relay stage 4, risk-check; after build B)
  Before:
  ````
  4. Risk-size stage 4: have `scout` run `npm run risk-check` on the branch. Clean exit skips full `security`.
  ````
  After:
  ````
  4. Risk-size stage 4: use the `npm run risk-check` result that `scout` produced before stage 3 (run it again only if the branch changed since). Clean exit skips full `security`.
  ````
  
  O7 (.claude/agents/orchestrator.md, Code relay step 0, which cells get start-here; after build H)
  Before:
  ````
  prints the line below for `architect`, `qa` in `specify` mode and `developer` (fix rounds included), and for no other cell:
  ````
  After:
  ````
  prints the line below for `architect`, `qa` (`specify` and `verify` modes), `developer` (fix rounds included), `security` and `scout`, and for no other cell:
  ````
- **architect, 2026-10-07:** O8 (.claude/agents/orchestrator.md, Rules, log-cell; apply now (log-cell.mjs already has --model))
  Before:
  ````
  run `node scripts/log-cell.mjs --ticket <ref> --cell <type> [--mode <m>] --tokens <n> --ms <n> --outcome "<text>"` with the subagent usage numbers.
  ````
  After:
  ````
  run `node scripts/log-cell.mjs --ticket <ref> --cell <type> [--mode <m>] --model <id> --tokens <n> --ms <n> --outcome "<text>"` with the subagent usage numbers. `--model` is the model you dispatched the cell on (the Agent `model` you passed, for example `claude-haiku-5-5`, or the genome's model when you passed none), on every dispatch, so a Haiku run is weighted as Haiku in the trial measures.
  ````
  
  O9 (.claude/agents/orchestrator.md, Rules, config rows; after build A)
  Before:
  ````
  When the loop config changes (models, relay, limits), append `{"kind":"config",...}`.
  ````
  After:
  ````
  When the loop config changes (models, relay, limits), append `{"kind":"config",...}`. A Jev use case's `config` row (a `jev_usecase` field and a `mode` of `live`, `shadow`, `advisory` or `off`; written at go-live, keep, kill, safety miss and promotion) is different: it is written only by the config command of `scripts/jev.mjs`, never by hand, and `jev.mjs` reads it to resolve each use case's mode (`docs/jev-usecases.md`, "Config row"). One safety miss, as that file defines it for the use case, turns it off at once: write its `mode: off` row with the reason, and tell the user. After a trial reaches 10 tickets, the keep-or-kill verdict is the user's: show the use case's `jev-report.mjs` section with the question.
  ````
  
  S1 (.claude/agents/scout.md, jg first; after build H)
  Before:
  ````
  - For a "where is X / how does Y work" search you may run `node scripts/jg.mjs "<question>" [root]`, where root is your checkout or a non-hidden subdirectory of it, with no flags. If it prints `jg: no result`, exits non-zero, or returns nothing useful, fall back to `rg` and say so in one line. Never run `jg` directly.
  ````
  After:
  ````
  - If your prompt names a Start-here context file, read it before searching.
  - For a "where is X / how does Y work" search, run `node scripts/jg.mjs "<question>" [root]` first, before any `rg`, `grep` or Glob search; root is your checkout or a non-hidden subdirectory of it, with no flags. Use what it returns, and search further only for what it did not answer. If it prints `jg: no result`, exits non-zero, or returns nothing useful, fall back to `rg` and say so in one line. A task that is not a search (a test run, a log read, a doc or web lookup) skips it. Never run `jg` directly.
  ````
  
  C1 (CLAUDE.md, relay sentence; after build B)
  Before:
  ````
  qa `verify` checks (light verify if qa specified, full otherwise), then `npm run risk-check`: a clean exit skips `security`, a hit dispatches it.
  ````
  After:
  ````
  `npm run risk-check` runs, then qa `verify` checks (light verify if qa specified, or if Jev picks it at confidence 0.8 or more with tests green and a clean risk-check; full otherwise), then a clean risk-check skips `security` and a hit dispatches it.
  ````
  
  C2 (CLAUDE.md, Jev pointer (optional); after build A)
  Before:
  ````
  Every cell follows the `organism-protocol` skill: claim before working, stop at pass gates, hand off, then end.
  ````
  After:
  ````
  Jev (`scripts/jev.mjs`) picks or raises some hops. Each use case runs a 10-ticket trial from its `config` row; its terms and kill condition are in `docs/jev-usecases.md`, and one safety miss turns it off. Every cell follows the `organism-protocol` skill: claim before working, stop at pass gates, hand off, then end.
  ````
- **architect, 2026-10-07:** Notes on the pairs (architect round 3).
  1. Order of application: O8 now (log-cell.mjs already has --model). Then each pair after its build ticket merges: O3, O9, C2 after A; O5, O6, C1 after B; O1 after C; O2 after D; O4 after E; O7, S1 after H. A pair applied early describes behaviour the scripts do not have yet.
  2. Sequencing change you should rule on (O5, O6, C1): the lifted verify floor needs risk-check clean, but today stage 4 (risk-check) runs after stage 3 (verify). The pairs move the scout risk-check ahead of the verify dispatch and let stage 4 reuse it. Cost: one scout run, which stage 4 needed anyway. If you would rather keep the order, drop O5's risk-check clauses and O6, and the lift cannot fire.
  3. O5 makes the orchestrator enforce 'tests red or risk-check hit means full' itself, so the rule holds even if build B's script does not receive the risk-check result. Build B may add a flag for it; then O5 can name it.
  4. O3 relies on build A: `route` reading its mode from the config row (so no --mode on the new-ticket call), `advisory-outcome` accepting `--orchestrator none`, and an explicit --mode advisory on `route-bounce` still forcing advisory. If A resolves any of these differently, adjust O3 (one phrase each).
  5. O9 and the safety-miss clauses (O3, O4, O5) say 'turn it off' and point at O9's 'config command of scripts/jev.mjs'. Docs/jev-usecases.md says rows are appended by a jev.mjs command but names none; once a build ticket names it, put the exact command line in O9. For tier, the ledger turns off lowering only (raising stays on trial); how that sits in a config row is build E's call, so O4 says 'turn lowering off' without a row shape.
  6. O1 is also an authority change: a suppressed wake ends the orchestrator's turn. The always-wake list in the text is the one in ADR 0015 Amendment 2; the code owns it.
  7. Not in scope but implied: .claude/agents/qa.md still defines light verify as 'you ran specify for this ticket' (line 33). Once the floor is lifted, light verify can run on a ticket qa never specified, so qa.md needs a short rule for what a light verify without a specify handoff checks. I did not read or draft it; it is a fourth gated file for ticket 182's method.
  8. CLAUDE.md names no shadow rules. C1 is needed only because it states 'light verify if qa specified, full otherwise'. C2 is optional: CLAUDE.md does not mention Jev today and the file is meant to stay short.
  9. Not changed: orchestrator.md Rules lines about jev.mjs/jev-wake-prelude.mjs appending their own rows (still true), and the frontmatter.
- **orchestrator, 2026-10-07:** **orchestrator, 2026-10-07 (user verdict):** move risk-check before verify (architect note 2): keep O5's risk-check clauses and O6; build ticket B is scoped on that order. O8 applied (PR #182).
