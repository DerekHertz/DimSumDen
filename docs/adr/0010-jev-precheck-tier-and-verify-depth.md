# Jev pre-checks pick a developer model tier and a qa verify depth, in shadow mode first

**Status:** accepted (2026-09-28: decisions 1-12 of the grill in `.scratch/organism-infra/issues/04-jev-precheck-design.md`). Implementation is gated: adding an SDK dependency (if `fetch` is not enough) and the `TYPESAFE_API_KEY` each need the user's explicit yes. `security` reviews the Data exposure section.

**Context.** The goal is near 24/7 work inside the 5-hour and weekly Claude limits (ADR 0002). Two relay decisions are made by the orchestrator's own judgment today: which model a developer needs, and how hard qa verify must look. Both are cheap classification over text the orchestrator already holds. Jev (TypeSafe's typed-decision model) answers such questions in about 100 ms at $0.042 per million input tokens, output free (secondary sources, `refs/jev-engineering-notes.md`; our own numbers come from shadow mode). Jev bills on API credits, not the subscription, so it is a small metered cost beside plan limits, not a way around them. ADR 0001 forbids calling the *Claude* API from the office and the cells stay unmodified `claude` CLI processes; Jev is a different vendor and never runs a cell, so 0001 is not contradicted. ADR 0004 (OS-agnostic) holds: the script is plain Node with no shell.

**Decision.**

1. **What Jev decides, and what stays out.**
   - *Developer model tier* (point `tier`): `sonnet` or `opus`.
   - *qa verify depth* (point `verify`): `light` or `full`.
   - Not Jev's: security review depth (`risk-check` still gates it, ADR 0009 / ticket 08), tool routing (ticket 37 trims `tools:` lists), dispatch routing, board triage, scout filtering, the wake-up check, and parallel threads (wait for a shadow-mode throughput baseline). Later candidates from `jev-engineering-notes.md` are weighed only after shadow results.

2. **Invocation: a script, not a cell, MCP server or skill.** `node scripts/jev.mjs`, run by the orchestrator. Costs no context tokens, is not an LLM cell, is testable, and has one owner of the key. One script with two points, not two scripts: cap, redaction, fallback and logging live once (deletion test: two scripts would copy all four).

3. **Interface.**
   ```
   node scripts/jev.mjs <tier|verify> --ticket <feature>/<NN-slug> [--tests <path>] [--mode shadow|live]
   ```
   - *Inputs* (the script assembles them; the caller passes references): `tier`: the ticket markdown (What to build, criteria, Comments scope). `verify`: the same, plus the developer's test output file at `--tests`. Nothing else is read or sent. Text over 16k characters is tail-truncated. Diff metadata (paths, line counts, risk-check categories) is **not** an input in shadow mode; the exit review may propose it.
   - *Call points, once each per ticket.* `tier`: right before the developer dispatch. `verify`: right before qa verify dispatch, after the developer's tests were run.
   - *Questions* (one judgment each, `other` exit on every Choice, all in one call, per the Jev rules in `jev-engineering-notes.md`): `tier` asks `standard | hard | other`; `hard` means the ticket spans several modules or a lock, race or migration concern, or its spec is ambiguous. `verify` asks `light | full | other`; `light` only when the test output shows every test passing with none skipped and the ticket adds no new behavior beyond its listed criteria. The rubric text lives in the script; the model is pinned (`jev-1.13.0`).
   - *Output*: one JSON line on stdout and the same fields as a `kind:"jev"` row (decision 5). Exit code is always 0, unless the arguments are invalid (exit 2). The orchestrator reads `effective`.
   - *Applying a pick.* `effective = max(minimum, pick)` under the order haiku < sonnet < opus. `other`, low confidence, or any failure gives `effective = fallback default`. In `shadow` mode `effective` is always the fallback default and `applied` is false; the pick is only logged. The default of `--mode` in the script is `shadow`, so going live is a reviewed code diff.
   - *Confidence.* Jev's distribution is recorded as `conf` (probability of the pick). No threshold is applied in shadow mode; live thresholds are set from the bands that matched in shadow (Jev rule: shadow first).

4. **Fallback: the organism never blocks on Jev.** The fallback is exactly today's behavior: the cell's genome model (the minimum tier below) and full qa verify. It triggers on: no `TYPESAFE_API_KEY`, network error, non-2xx, a 10 s timeout, unparseable answer, an input that matches a secret pattern from `scripts/risk-check.mjs` (`blocked-input`), or the daily cap. The row records the reason in `fallback`; the script prints it and still exits 0.

5. **Shadow-log row**, appended by `jev.mjs` to `.scratch/usage.jsonl`, one per call (including fallbacks):
   ```json
   {"kind":"jev","ts":"2026-09-29T01:20:00Z","ticket":"feature/NN-slug","point":"tier|verify",
    "pick":"sonnet|opus|light|full|other|null","actual":"sonnet|opus|light|full",
    "cost":0.0007,"conf":0.93,"mode":"shadow|live","fallback":null,"ms":112,"model":"jev-1.13.0"}
   ```
   The grill fixed `kind, ticket, point, pick, actual, cost`. `ts` is added because the cap (decision 6) sums today's rows. `conf`, `mode`, `fallback`, `ms`, `model` are added so the exit review can read bands, failures and latency without new instrumentation. `actual` is what the orchestrator will dispatch with (equal to the fallback default while in shadow). `cost` is `usage.cost` from Jev's response, or 0 when no call was made. Outcomes are not written here: the analysis joins on `ticket` to the existing `cell` rows (tokens) and `resolved` rows (bounces).

6. **Daily cap $0.50.** Before every call `jev.mjs` sums `cost` over `kind:"jev"` rows whose `ts` falls on today's UTC date. At or above $0.50 it makes no call, logs a row with `fallback:"cap"` and `cost:0`, and the relay runs on the minimum tiers and full verify. A single call is at most about $0.003 (64k tokens), so the cap is overshot by that much at most; the $0.50 cap is about 180 max-size calls.

7. **Minimum tiers per cell** (the genome model is the minimum; Jev may raise, never lower, except where noted; Jev only decides the two cells marked):

   | Cell | Minimum | Jev may raise to |
   |---|---|---|
   | orchestrator | opus | (not dispatched) |
   | product, architect | sonnet | never |
   | qa specify | sonnet | never |
   | developer | sonnet | opus (`tier`) |
   | qa verify, full | sonnet | never |
   | qa verify, light | **haiku** | never |
   | security | sonnet | never |
   | scout | haiku | never |
   | designer, debugger | opus | (not decided) |

   qa verify's *genome* stays `sonnet`; `light` is the one place a dispatch goes below the genome, per grill decision 9. `full` is the fallback, so a Jev failure can only cost tokens, never verification quality.

8. **Model override at dispatch.** The orchestrator passes the model explicitly on the dispatch call: the `Agent` tool's `model` parameter (`sonnet|opus|haiku`), which takes precedence over the agent definition's frontmatter. For a developer: `model` = `effective` from the `tier` call. For qa verify: `light` dispatches with `model: "haiku"` and a prompt line `verify depth: light`; `full` dispatches with `model: "sonnet"` and `verify depth: full`. A run from a terminal uses `claude --agent qa --model haiku`. Nothing edits a genome file. Applying this in the orchestrator genome, and defining light and full in the qa genome, is `.claude/` work behind the user's permission (follow-ups B and C).

9. **Data exposure** (for `security`). *Leaves the machine, to TypeSafe's API only:* ticket markdown and the developer's test output, truncated to 16k characters, plus the pinned model name. The user allowed source excerpts in the 2026-09-28 discussion; test output may carry excerpts through stack traces or assertion diffs, which is the only source that can leave. *Never leaves:* `.env` files, secrets, credentials, diffs, source files, transcripts, the board's locks, handoffs. `jev.mjs` reads the ticket and the `--tests` file only, and blocks the call (`blocked-input`) when the assembled text matches a `risk-check` secret pattern. *Key:* `TYPESAFE_API_KEY` in the user's own environment, set by the user. The script reads `process.env` only, never writes the key to a file, log or row, and never prints it. No cell creates an account or enters a key. *Local proxy:* not used; a proxy adds a process for one text stream that is already limited to two inputs. The user's earlier retention question stays open, since pricing and retention facts are from secondary sites (`security` should check TypeSafe's primary docs).

10. **Shadow mode and its exit.** Shadow runs on the next 5 code tickets, both points on each, with the old path deciding. Exit review = the orchestrator reports the numbers to the user; the user decides per point whether to go live. Go-live for a point needs all of:
    - *Coverage:* at least 5 tickets have a `jev` row at that point; fallbacks (not counting `cap`) are at most 1 in 5 and median `ms` is under 2000.
    - *Safety:* for `verify`, no ticket where Jev picked `light` had a finding or bounce at full verify or security that a light verify would have missed; for `tier`, no ticket where Jev picked `sonnet` bounced for a capability reason. The orchestrator judges each from the handoffs and lists them. One miss keeps the point in shadow for 5 more tickets, or ends the trial.
    - *Value:* the counterfactual (apply each pick to that ticket's `cell` token rows, weighted by tier as fixed before the results are read) projects at least 30% fewer tokens per resolved ticket with unchanged bounces (grill decision 4), plus tickets resolved per 5-hour window no lower than the shadow baseline.
    - *Spend:* the daily cap never fired for a reason other than heavy use, and total `jev` cost per ticket stays under 1% of a ticket's plan usage.
    A point that fails value or safety stays off. A local-model comparison (RTX 3060 Ti, scope added 2026-09-27) becomes worth doing only if the Jev path fails on data exposure or cost; it replaces the resolved-ticket trial in ticket 04's second checkbox, which shadow mode supersedes with real, live tickets.

**Considered options.**
- *A Jev cell (an agent that calls Jev).* Rejected: a cell spends Claude tokens to decide whether to spend Claude tokens, and Jev's own cost is on API credits, so it should be called on demand.
- *Jev as an MCP server or skill.* Rejected: tool and skill descriptions cost context in every session, and the model would choose when to call it; the two call points are fixed, so code calls them.
- *One script per call point.* Rejected as shallow: cap, redaction, fallback and logging would be duplicated.
- *Jev may lower any tier.* Rejected (grill 2): an error cannot then break a cell that today works. Only qa light verify goes below its genome, and its fallback is full.
- *Jev also picks security depth.* Rejected (grill 3): `risk-check` is scripted and free.

**Consequences.**
- Test seam: the exported `decide({point, ticket, tests, now, usageRows, transport})` returns the result and row; the CLI is a thin wrapper. The one seam is `transport`: real `fetch` in production, a fake in tests (two adapters). Cap, redaction, fallback, `max(minimum, pick)` and row shape are tested through `decide`. Nothing else is mocked.
- The `kind:"jev"` row extends the `usage.jsonl` kinds listed in the orchestrator genome; the genome line changes only with the user's permission.
- `CONTEXT.md` terms proposed, not added (a brain gate): **minimum tier**, **shadow mode**, **verify depth**.
- Open, for the exit review: whether diff metadata may be an input; live confidence thresholds; the Jev SDK is Python only per the secondary notes, so follow-up A first checks whether the primary docs offer plain HTTP (no dependency) and otherwise asks the user before adding one.
- Follow-up tickets are proposed in ticket 04's Comments and are not published.
