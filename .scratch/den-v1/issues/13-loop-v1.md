# 13: Den Loop v1 (start, accept, work, permission, result)

**Type:** feature

**Priority:** P1

**Status:** ready-for-human

**Serves:** the v1 den loop (refocus 2026-10-02): start a Claude agent from the den and follow it to its result with no terminal after the bridge is up.

**Spec:** <https://claude.ai/artifact/MpcNDZyyH2oGetuUaSWQ1E> (Den Loop v1, decisions settled 2026-10-10). The rules for what a client may send are in [ADR 0016](../../../docs/adr/0016-ui-steering-channel.md), decision 6 and amendments 8 to 12.

**Branch:** `feat/den-loop-v1` (from `main` at 5a47409).

## How this ticket was run

One plain Claude Code session built the whole loop, by the user's instruction. No relay, orchestrator, qa cell, security cell or Jev call. Kept: a failing test first per slice, `npm test`, `npm run risk-check`, gitleaks, and the user approving every push and merge. The waiver is a `config` row in `.scratch/usage.jsonl` (2026-10-10).

## The loop

1. **Start.** T beside a resident panda with no agent, type a task. The bridge writes a ticket under `.scratch/den/` and starts that role's agent.
2. **Accept.** The agent runs in its own git worktree under `.claude/worktrees/`, on a `den/<ref>-<id>` branch.
3. **Work.** Tool labels on the panda; R opens the live transcript. In the overview, clicking a panda opens the same card walk mode shows.
4. **Permission.** A tool outside the allowlist shows as waiting on you: on the panda's card, in the Needs you card and in the transcript's waiting row. E or Q (or the Deny and Allow buttons) opens the request with its full input; E allows and Q denies there (A and D walk). Ten minutes of silence is a deny.
5. **Result.** The final reply and a cost badge on the card. Model, tokens by tier, cost, duration and outcome go to `.scratch/usage.jsonl`.
6. **Ship it.** Deferred; not part of this ticket.

## Slices

| Slice | What | State |
|---|---|---|
| S0 | A fresh worktree per bridge-started agent; a write outside it is denied or raises a request | built |
| S3 | Live conformance check against the real CLI (`npm run smoke:live`), with recorded fixtures | built, GO on CLI 2.1.293 |
| S1 | `POST /tasks`: the den creates the ticket and starts the role's agent, under the 2-agent and 90%-usage gates | built |
| S2 | Live transcript over `/events` (text, tool results, reply) | built |
| S4 | Run record in the ledger and the cost badge | built |
| S5 (stretch) | A message to a running agent (`POST /agents/:id/message`), queued then received | built |

## Acceptance criteria

- [x] One recorded live run (real claude, default permission mode, project and local settings only) passes steps 1 to 5 from the den. Its event log replaces the demo fixture (`apps/ui/src/demo/demo-fixture.mjs`). **Done by user decision (2026-10-10):** the run passed (run 5, below) and is the demo's scout storyline; the developer and qa agents stay staged so the demo keeps a split-off panda and a message (`apps/ui/src/demo/README.md` says which is which; `demo-recorded-run.test.mjs`).
- [x] The agent's working directory is a fresh worktree. A write attempted outside it is denied or raises a permission request, shown by a test (`workspace.test.mjs`, `host-workspace.test.mjs`, and the recorded live fixture in `conformance-live.test.mjs`).
- [x] The cost badge matches the CLI's own reported cost for the run, or the difference is explained. Run 5: the agent row, the badge's source, and the run record all hold 0.00375692 USD (badge "≈0.38¢ API-equiv"). The row's figure is the CLI's `total_cost_usd` passed through by the adapter, which a test pins against a recorded CLI capture; the CLI's raw output for run 5 itself was not captured.
- [x] Every bridge-run agent leaves a run record: model, tokens by tier, cost, duration, outcome (`host-run.test.mjs`).
- [x] Each new route, event and UI state has a test against the fake runtime or the claude stub. `npm test`, risk-check and gitleaks are green apart from the two items under Known failures.
- [ ] A 20 to 30 second GIF of the loop is in the README. The README's "Not built yet" line is updated (done on the branch).

## Known failures

- `scripts/jev-hardening.test.mjs` "Low-80" fails on this machine because an empty `/tmp/.git` directory exists. Not caused by this branch.
- `floating-cards.test.mjs` and `tally-expand.test.mjs` can time out when the suite runs alongside other heavy work. They pass alone and in a clean full run.
- `proximity-card.browser.test.mjs` (walk away and the card hides) fails when headless Chrome's software renderer drops under about one frame a second in walk mode. On 2026-10-10 it failed the same way on a clean copy of `main` and passed again minutes later.
- risk-check reports hits on this branch (bridge routes, shell-out, new test files and fixtures). No security cell reviewed them; that gate was waived for this session.

## Open items

- Transcript text, the reply excerpt and message text travel on the unauthenticated `/events` and `/state`, cleaned and masked. The user has deferred the choice to keep them there or move them behind the token.
- The `git push` and `gh pr create` deny for den-started agents is set in the adapter's inline settings and tested against the stub only, not the real CLI.
- A bridge row's `tokens` is the four tiers summed. Subagent model usage is not broken out.
- The reply is not kept across a bridge restart.
- Whether a second result line's cost and usage are cumulative is unverified; the recorded message run had one result line.
- From organism-infra/107, not built: cancel while a message is queued, and the hand-over flow.
- No containment claim is made beyond what the tests show: the worktree is a working directory, not a sandbox.

## First live run from the den (2026-10-10)

A scout task started from the den did not pass steps 2 to 5. The recording showed three faults, all fixed on the branch and not yet re-run from the den:

- The agent's first act, reading its ticket file in the main checkout, raised a permission request, so it waited on the user before it could claim. Fix (user decision): the adapter's inline settings allow `Read` on that one file (ADR 0016 amendment 13). `npm run smoke:live` shows the ticket read raising no request and a read of the file next to it still raising one (fixtures `live-ticket*.jsonl`).
- The den did not show the wait. The panda took its state from the board claim only. Fix: an agent the bridge runs drives its role's panda from the start, and a held request shows as needs-you (`apps/ui/src/review/live-actors.mjs`).
- A and D, the answer keys, are also the walking keys. Fix (user decision): Q deny, E allow, R transcript, T message. The dashboard's request card keeps a and d, which act only with focus inside that card.

Also seen: the CLI ran `node --version` without asking, so that command is no test of step 4. The run left ticket `den/01-scout` (`ready-for-agent`), a worktree and a `den/` branch behind. The run record matched the CLI's cost (0.21 cents).

## Later den runs (2026-10-10)

- Run 2: an old browser tab with a dead session, so no task started. The message now says to restart the bridge and open the new launch link.
- Run 3 (`den/02-scout`): the ticket read raised no request (the amendment 13 rule held). The scout then asked to read `package.json` in the main checkout, the planned step 4. The request was on the stream and the panda showed needs-you, but the user could not find a way to answer it; it was denied when the bridge stopped. Cost in the run record matched the agent row (0.22 cents).

Built after run 3 (user decisions, mockup approved in chat), not yet tried on a live agent:

- **Needs you card.** A permission request the bridge holds is a request in the existing card, before the board's gates: who asks, the ticket, the tool, the target and the time left, with Deny (Q) and Allow (E). Both open the permission review; the card sends nothing (`overlay-model.mjs`, `Cards.jsx`).
- **Transcript.** The waiting row of the pending request names its target and has Deny and Allow, which open the review. The panel header reads "Needs your answer" for a held agent (`transcript-view.mjs`, `TranscriptPanel.jsx`).
- **Overview click.** Clicking a role panda in the overview opens the card walk mode shows (Start task, Transcript, Message, Allow, Deny), with a Close button; R, T, E and Q act on it. The ticket chip still opens the ticket card (`RestaurantDen.jsx`, `App.jsx`, `proximity-card.mjs` `pickedCard`).
- **E and Q with no panda card.** They open the first waiting permission request, in the overview and in walk mode. With the cursor free in walk mode the keys still do nothing and the buttons are clicked.
- Tests: `den-request.test.mjs` (models) and `den-request.browser.test.mjs` (the overview flow in headless Chrome). No bridge route, event or rule changed.

## Run 4 and the root cause (2026-10-10)

Run 4 (`den/03-scout`) used the new UI and still could not be answered: the request was on the stream for 75 seconds and the page showed none of it.

**Root cause.** The page's event reducer (`apps/ui/src/state/apply-event.mjs`) had no case for `approval` and dropped every one. A permission request reached the page only when the page was loaded after the request was raised. This is why runs 1, 3 and 4 all stalled at step 4; the earlier fixes changed where a request would show, not whether it arrived. Each side was tested against its own stub and no test fed the bridge's stream to the UI.

**Fix.** The reducer keeps approvals (added, replaced by id, kept with their state once settled). `apps/ui/src/state/bridge-stream.test.mjs` runs a real bridge with the fake runtime, feeds its `/events` frames to the reducer and checks the result against `GET /state`, the Needs you model and the panda card, through a request, an allow and a whole run. A one-off headless run of the built UI against a real bridge and the stub CLI then passed steps 1 to 5: task from a clicked panda, request shown, E opens it with the full input, E allows, reply and cost badge on the card. That run is not a kept test.

Also fixed: the review showed the input's line breaks as `\u000a` (structural line breaks are now kept; one inside a value stays escaped), and the Needs you expiry could read a minute over the limit (now whole minutes, rounded down).

## Run 5: steps 1 to 5 passed (2026-10-11 00:23 UTC)

`den/04-scout`, Haiku, started from the den by the user after the reducer fix. Task: read `package.json` in the main checkout and reply with the package name.

- Start and accept: ticket written, agent in worktree `den-den-04-scout-…`, ticket read with no request.
- Work: tool rows and the transcript live.
- Permission: seven requests, each shown and allowed from the den (one Read outside the worktree; six Bash: a listing of the board folder, board claim, handoff template, a handoff written under `/tmp`, two releases).
- Result: state `done`, the reply on the card ("The package name is `dim-sum-den` …"), 10 turns, 76 s, 88,241 tokens, 0.00375692 USD in the run record.

User feedback after the run: answering every request is tedious; asked whether agents can run in auto mode behind guard rails. Not decided yet. The CLI (2.1.293) lists `--permission-mode` choices `acceptEdits`, `auto`, `bypassPermissions`, `manual`, `dontAsk`, `plan`; none has been tried under the bridge.

Left by the runs: tickets `den/03-scout` (`ready-for-agent`) and `den/04-scout` (`in-review`, released by the scout), four kept worktrees under `.claude/worktrees/` and their `den/` branches.

## Next, from the user after run 5 (2026-10-10)

Decided (question tool):

1. **Fewer prompts, step 1: allowlist.** The adapter's inline settings allow the routine calls unasked for den-started agents: Read anywhere in this repo's main checkout, and the board CLI (`node apps/organism-infra/board.mjs …`, as well as the `npm run board` forms the project settings already allow). Default permission mode stays. Needs a failing adapter test first, an ADR 0016 amendment, and a live check (`npm run smoke:live`). Not started.
2. **Fewer prompts, step 2: auto mode.** A live check of `--permission-mode auto` under the bridge (does it run headless with the stdio permission prompt, on this plan; what it escalates must still show in Needs you). Report to the user before it becomes a default. Not started.

Asked for, not yet scoped:

3. **Pandas near their stations.** A panda with no task should hang out around its work station, or move faster, so a new task does not look delayed while the panda walks over. (The agent itself starts at once; only the panda's walk lags.) This changes panda movement, which the session's opening rule kept out of scope; the user has now asked for it.
4. **Desks.** Agents should have desks, in the manner of Ado Kukic's setup, alongside the booths. This is scene layout and art: it needs a design session with mockups before any code.
5. **Walk speed.** First-person walking should be faster, set by a value the user can edit (today `WALK.speed` is 2.1 in the walk core). The same for panda speed would cover item 3's "move faster".

## Comments

- 2026-10-10, plain session (Opus 5.5): slices S0, S3, S1, S2, S4 and S5 are built and uncommitted on `feat/den-loop-v1`. Status is `ready-for-human` because the next steps need the user: review the diff, do the recorded live run from the browser, record the GIF, and decide on commits, push and PR.
