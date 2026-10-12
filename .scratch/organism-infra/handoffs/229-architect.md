```json
{
  "ticket": "organism-infra/229-relay-through-the-bridge",
  "cell": "architect",
  "current_step": "ADR 0022 (proposed) answers the six questions; slice 1 tickets drafted below; waiting for the user to read it and answer seven decisions",
  "artifacts": ["docs/adr/0022-relay-through-the-bridge.md"],
  "decisions": ["new ADR 0022 rather than an 0016 amendment (0016 already carries 13 amendments)", "the bridge's end row, not handoff text, is the source of a hop's base sha and branch", "slice 1 calls no Jev: tier is in shadow and equals the rule"],
  "failures": [],
  "pending": [
    {"item": "user reads ADR 0022 and answers the seven decisions", "owner": "orchestrator"},
    {"item": "file the slice 1 tickets below after the user says yes", "owner": "orchestrator"}
  ]
}
```

**State:** done. Design only, no code. Branch `architect/229`, commits ff3d81f and b83366f (head b83366f).

**What changed:** `docs/adr/0022-relay-through-the-bridge.md` (status: proposed). Amends ADR 0016 decision 3 (relay-hop 409, "Slice 3"); builds the runner ADR 0019 decision 3 placed in `apps/bridge/relay/`. ADR 0016, 0019, 0021 and CONTEXT.md are untouched.

**The answers in one line each.**
1. Hop dispatch: pure `nextHop(facts)` in `apps/bridge/relay/plan.mjs`; base sha and branch come from the bridge's own `end` rows; the route keeps its body and admits only the planned hop (409 otherwise). Hop table shared with `dispatch-prompt.mjs`.
2. Default role: the snapshot's `relay[ref].next`, same function as the host check; `defaultRole` uses it.
3. Finish event: `onEnd(run)` in the host; a runner (bridge code) advances deterministic hops while the ticket's relay is `on`; an orchestrator session is woken only at a stop that needs judgment. Relay state persists in `sessions.jsonl`; a restart starts nothing.
4. Stops: needs-you, ready-for-human, failed-twice, usage, no-room, hop-failed, no-handoff, user-stopped, bridge-restart, environment, ready-to-merge. The bridge does not open the PR or merge in this ADR.
5. Ceilings: architect and product and designer `worktree`, orchestrator and herald `none`, all with no hosts; what each may do and still asks is a table in the ADR. The board (outside the wall) is the remaining source of requests and is unproved; no `.scratch/**` grant is proposed.
6. Slices: 1 planner and direct hop dispatch (click per hop), 2 finish event and Run relay, 3 ceilings.

**Shared with organism-infra/230:** the snapshot key `relay[ref].stop` and its reason strings (one vocabulary for 230's plain-words approval reason and relay stops); Stop is the existing `POST /agents/:id/stop` and a user stop sets the relay `user-stopped`. I design no UI.

**Decisions for the user** (also at the end of the ADR; each recommended option is first):
1. Next hop at a finish: bridge code plus a woken orchestrator only at stops / Opus orchestrator at every finish / bridge code only.
2. Auto-advance: click per hop in slice 1 then a per-ticket Run relay switch / always click / auto on every started ticket.
3. First hop of a code ticket: developer test-first / qa specify first / developer unless a risk marker.
4. Ceilings for the five roles: accept the table / widen one / only architect.
5. Hop agents' board writes: keep asking and measure / grant `<root>/.scratch/**` / bridge board calls first.
6. Relay ends at: ready to merge / bridge opens the PR / wait for ADR 0021 steps 4 and 6.
7. Interactive roles (designer spec, product): never auto-advanced / run headless with questions in a handoff.

**Next step:** the user reads the ADR; the orchestrator then files the tickets below (slice 1 only; slices 2 and 3 are named in the ADR and ticketed after slice 1 shows its friction, per ADR 0019 decision 8).

**Gotchas:** (a) The orchestrator genome and ADR 0019 decision 4 disagree about the first hop (qa specify vs developer test-first); decision 3 above asks. (b) Whether `npm run board` from inside a den worktree is a request or a refusal under today's spawn flags is unproved (the repo's allow rules load via `--setting-sources project`, but the wall blocks writes outside the worktree); slice 1 ticket C measures it. (c) The `.claude/` worktree copy of settings was not checked for the board allow rules beyond `Bash(npm run board:*)` being present.

## Draft tickets (slice 1). Paste each as a ticket file under `.scratch/organism-infra/issues/`.

### A. Relay hop planner (pure) and the shared hop table

**Type:** feature   **Priority:** P1   **Class:** product   **Blocked by:** none (ADR 0022 accepted)   **Serves:** Den loop: the den can say which agent a ticket needs next (ADR 0022 decisions 1 and 2).

**What to build.** `apps/bridge/relay/plan.mjs` exporting `nextHop(facts)` as ADR 0022 decision 1 defines it, plus `readFacts(root, ref)` beside it. Move the `SPECS` table of `scripts/dispatch-prompt.mjs` (style, release, context, handoff stem, modes) into a data module both import; `dispatch-prompt.mjs` output must not change byte for byte. `nextHop` is pure: no fs, no clock, no spawn. Rules are the table in decision 1 (frontier code ticket: developer; developer in-review: qa verify light; qa pass: risk step; bounces; second bounce stops; partial retries once; designer and product are a `needs-you` stop). `readFacts` reads status, type, holder and handoff State blocks through the board service, the verdicts the bounce count reads, and the bridge's `sessions.jsonl` `end` rows.

**Acceptance criteria.**
- [ ] A table test maps facts to hops for every row of decision 1, including the stop rows.
- [ ] `nextHop` returns a stop, never a hop, for a ticket with a live agent, a blocked ticket and an unknown type.
- [ ] A test shows base sha and branch come from `end` rows and that handoff text naming another sha is ignored.
- [ ] `dispatch-prompt.mjs` output is unchanged for every cell and mode (existing tests green) and imports the shared table.
- [ ] `npm test` green.

**Expected files.** `apps/bridge/relay/plan.mjs`, `apps/bridge/relay/facts.mjs`, `scripts/hop-table.mjs` (or beside the planner), `scripts/dispatch-prompt.mjs`, tests beside each.

### B. The host starts the planned hop

**Type:** feature   **Priority:** P1   **Class:** product   **Blocked by:** A   **Serves:** Den loop: the user starts developer, qa or security on a ticket from the den (ADR 0022 decision 1).

**What to build.** (1) The `end` row carries `sha` and `branch` (from `workspaces.publish`); replay tolerates rows without them. (2) The workspace module can create a hop's worktree detached at a given base sha, not only at `HEAD`. (3) `POST /agents` for a relay-hop role runs `nextHop` and starts the hop only when `role` and `mode` match the plan; otherwise 409 with the text "the next hop for this ticket is <role> <mode>". The body stays `{ ref, role, mode? }` and no client string reaches argv, the prompt, a base or a branch. (4) A hop prompt: a fixed template over the plan's validated fields (role, mode, ref, handoff name, release flag). (5) Eligibility for a hop is "relay state and no live agent", not the frontier. Capacity, the 90% usage refusal and the single synchronous reservation apply unchanged. The host may need a `lockedRefs` and `readFacts` parameter; tests pass fakes.

**Acceptance criteria.**
- [ ] With the fake runtime: a ticket whose plan is `developer` accepts `developer` and refuses `qa` and `security` with 409 naming the planned hop.
- [ ] A developer `end` row with a sha makes the next accepted hop `qa` `verify`, whose worktree base is that sha (asserted on the fake runtime's spawn input).
- [ ] The prompt contains no client string and no handoff text (assert on spawn input).
- [ ] Two concurrent starts of one hop: exactly one starts (the existing double-click test shape).
- [ ] A direct `POST /tasks` agent is unchanged; the 409 for a relay-hop role with no planned hop is unchanged.
- [ ] `npm test` and risk-check green; this touches `apps/bridge/cells/`, so qa specify and full security run.

**Expected files.** `apps/bridge/cells/host.mjs`, `apps/bridge/cells/workspace.mjs`, `apps/bridge/server.mjs`, `apps/bridge/cells/policy.mjs` (only if a constant), tests `host-relay-hop.test.mjs`.

### C. The den defaults to the first agent needed

**Type:** feature   **Priority:** P1   **Class:** ui   **Blocked by:** B   **Serves:** Den loop (ADR 0022 decision 2). The user's request: "the default in the drop down was the first agent needed".

**What to build.** The hub adds `relay: { "<ref>": { next, stop } }` to the snapshot (additive; `next` is the planner's hop role and mode, `stop` its kind and reason). `defaultRole(ticket, relay)` in `apps/ui/src/overlay/run-model.mjs` returns the planned role when there is one, else today's type map; `ROLE_OPTIONS` for a ticket include the planned hop's role. The select shows the planned mode beside a `qa` role (for example "qa, verify"). A stale snapshot's 409 text is shown as the Run control's existing error line. No other UI change; no Stop control, receipt or approval reason (organism-infra/230). The user critiques the result visually (Class ui: no designer spec beyond the label, since the control exists).

**Acceptance criteria.**
- [ ] `run-model.test.mjs`: a ticket with `relay.next` `developer` defaults to developer and the select offers it; a ticket with none keeps today's map; a relay-hop role is never offered when the plan is something else.
- [ ] A bridge test: the snapshot's `relay[ref].next` equals what `POST /agents` accepts for the same ref.
- [ ] A recorded live check: start a developer hop from the den on a small ticket; note every permission request and refusal by cause (board calls vs file vs shell), and the token cost. This is the data for ADR 0022 decision 5.
- [ ] The user's visual verdict (`ready-for-human`).
- [ ] `npm test` green.

**Expected files.** `apps/bridge/snapshot.mjs`, `apps/ui/src/overlay/run-model.mjs`, `Cards.jsx`, tests.

## Slice 2 and 3 titles (not drafted; ticket after slice 1)
- Slice 2: the host `onEnd` hook and `relay/runner.mjs`; relay state lines in `sessions.jsonl` and the restart rule; bridge-run risk-check; "Run relay" switch and stop items in Needs you (shares vocabulary with 230).
- Slice 3: `ceilings.json` entries for the five roles (guardrail path: the user's gate; full relay with security) and a live count of requests by cause.

## Suggested skills for the next cell
`to-tickets` (orchestrator, filing), `domain-modeling` (if the user accepts the two CONTEXT.md terms).
