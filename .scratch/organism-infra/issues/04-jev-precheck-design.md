# 04: Design question: Jev as a cheap pre-check before spending Claude tokens

**Type:** design-question

**What to build:** An ADR that decides whether, and where, the organism calls Jev (TypeSafe's typed-decision model) for cheap yes/no, classify and rank decisions before a Claude cell spends tokens. The ADR is backed by a small measured trial.

Candidate call sites:
- board triage: is this ticket ready, blocked or a duplicate?
- dispatch routing: which cell type does this ticket need?
- scout filtering: which log lines or test failures matter?
- later, the "anything worth doing?" wake-up check for always-on routines, which a product cell still has to spec (`_handoffs/2026-09-27-new-scope-for-product.md`)

It doesn't touch the Pro/Max limits on the cells themselves. Settle the choice against ADR 0001 (subscription CLI cells), ADR 0004 (runtime adapter, OS-agnostic) and ADR 0002 (relay, plan limits).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The ADR states which call sites use Jev and which stay with Claude, and how it's invoked (MCP server, skill or CLI) and why
- [ ] A trial on a small set of real, already-resolved board tickets compares Jev's verdicts with the known outcomes: agreement rate, latency, and cost per call. The ADR records these numbers; vendor claims (200-400x) don't count as evidence. _(superseded by shadow mode, ADR 0010; measured in 43)_
- [x] The ADR states a fallback for when Jev is down or has no key: the decision falls back to the cell or rule it replaces, and the organism never blocks on Jev
- [ ] Data exposure: what leaves the machine, what never does (source code, secrets, `.env`), where the key lives, and whether to route through a local proxy. `security` reviews this section. _(written in ADR 0010; security review is ticket 42)_
- [x] Any new domain terms are added to `CONTEXT.md` (brain gate: ask first)

Gates: adding Jev as a dependency, creating or storing a `TYPESAFE_API_KEY`, and sending any repo data to TypeSafe's API each need the user's explicit yes first. The user sets up the key; a cell never creates an account or enters a key.

## Comments

- **Created (orchestrator, 2026-09-27):** At the user's request, to evaluate Jev for efficiency gains. Scout findings (secondary sources; not yet checked against primary docs):
  - Jev returns typed answers with confidence scores.
  - It installs as an MCP server, a Claude Code skill or a CLI, and runs on Windows.
  - It needs its own API key; the Claude subscription doesn't cover it.
  - It is about a month old.
  - The vendor claims 200-400x cheaper and faster; LangChain reports about 23x faster than Opus at about 1/300 of the cost.
  - Sources: https://docs.typesafe.ai/introduction, https://www.langchain.com/blog/jev-agent-evals-langsmith, https://www.explainx.ai/blog/jev-speed-cost-claims-fact-check-2026, https://github.com/AbdelStark/awesome-typesafe-jev.
  - The user saved these posts: https://x.com/polydao/status/2103689373774483815 and https://x.com/N01ennn/status/2103542021071978601.
  - Run after ticket `character-animation/07` returns, since only one cell runs at a time.
- **Scope added (user, 2026-09-27):** Compare Jev with a **local model on the user's GPU** (RTX 3060 Ti, 8 GB VRAM) in the same trial: for example, a 7-8B quantized model through Ollama, with weights on `E:` (see `07`). A local model costs nothing per call, sends no data off the machine and needs no API key, but it may agree less often and competes for 16 GB of RAM with Blender and the browser. Run the same resolved-ticket set through both and let the numbers decide. A local-only result is a valid outcome. Installing Ollama or a model is a brain gate.
- **On hold (user, 2026-09-27):** Blocked until the user gets Jev access; they've applied for the waitlist, and it can't be tested before approval. Not needed for the loop.
- **Unblocked (user, 2026-09-27):** The user has Jev access and a loaded account. Once the loop works (02 → 13 → 05 → 11), discuss with the user what integrating Jev means, how it helps token consumption, and how to do it, before any design dispatch.
- **Reference added (user, 2026-09-28):** https://github.com/dzhng/jevgrep. The user wants it considered for this ticket. Nobody has read it yet or checked it against primary docs. Review it in the pre-design discussion with the user.
- **unknown, 2026-09-28:** Pre-design discussion (user, 2026-09-28): start with a jevgrep trial, not the full ADR. User allows repo source excerpts to go to TypeSafe cloud; .env and secrets stay excluded. User installs and auths jevgrep; orchestrator then runs one real ticket with and without it and compares tokens. Scout notes: Jev is cloud-only; pricing and retention facts are from secondary sites.
- **unknown, 2026-09-28:** Reference (user, 2026-09-28): .scratch/organism-infra/refs/jev-engineering-notes.md covers the PreToolUse Bash gate, the Stop-hook done check, the trigger gate and compaction. Candidate call sites to weigh after the jevgrep trial.
- **Plan (orchestrator, 2026-09-28):** After the harness article (refs/jev-harness-notes.md), the first Jev decision to trial is model tier per cell dispatch (haiku/sonnet/opus; fallback = genome default; pins win), shadow mode for 5-10 tickets, decision records in usage.jsonl, judged on total ticket cost. jevgrep so far (26, 28): jg 4 calls, grep 8; jg found the target in one call each time it was used; tickets that name their files give it nothing to do. Gates still open: SDK dependency, key location, sending ticket text to TypeSafe.
- **Direction (user, 2026-09-28):** Goal is near 24/7 work within the 5-hour and weekly limits. Jev decides security review depth and qa (verify) need, under a well-defined decision tree. Jev sees ticket text and test output only; never .env, secrets or source. Open: whether diff metadata (file paths, line counts, risk-check hit categories) counts as allowed input.
- **Grill round 1 (user, 2026-09-28):** (1) Jev runs in shadow mode for the next 5 code tickets. (2) Each cell has a fixed minimum model tier; Jev may raise it, never lower it. (3) Jev chooses only light or full qa verify; `risk-check` still gates security. (4) Success means 30% fewer tokens per resolved ticket with no rise in bounces, plus throughput (tickets resolved per 5-hour window) at a low failure rate. (5) Tool routing is out of Jev's scope; a separate ticket trims the fixed `tools:` lists. Jev gets its own cell that is called on demand, not always on, because Jev is billed on API credits, not the subscription.
- **Grill round 2 (user, 2026-09-28):** (6) Jev runs as a script, `node scripts/jev.mjs`, called by the orchestrator. It is not an LLM cell. (7) Jev is called at two points per ticket: model tier before developer dispatch, and light or full before qa verify. (8) A daily credit cap is logged in usage.jsonl; once it is hit, the relay falls back to the minimum tiers. The amount waits on Jev pricing. (9) qa light verify's minimum drops to haiku; the other cells stay as they are. (10) The shadow log uses `{"kind":"jev","ticket","point","pick","actual","cost"}` rows in usage.jsonl. (11) Parallel threads wait until shadow mode gives a throughput baseline.
- **Grill round 3 (user, 2026-09-28):** (12) The daily cap is $0.50, enforced by jev.mjs summing today's `jev` row costs. Pricing: $0.042 per million input tokens, output free, and each response reports `usage.cost` (refs/jev-engineering-notes.md). Grill closed. Next: architect writes the ADR (script interface, shadow log, minimum tiers including haiku for qa light verify via a dispatch model override).
- **architect, 2026-09-29:** ADR written: docs/adr/0010-jev-precheck-tier-and-verify-depth.md (decisions 1-12 unchanged; ts, conf, mode, fallback, ms, model added to the jev row; diff metadata excluded in shadow mode; ticket's resolved-ticket/local-model trial superseded by shadow mode). PROPOSED follow-ups, not published: (A) scripts/jev.mjs + tests via decide() with a fake transport; first check primary docs for plain HTTP vs an SDK dependency (user yes needed for a dependency and for TYPESAFE_API_KEY); (B) orchestrator genome + docs/agents: call points, Agent model override, jev row kind (.claude gate, user permission); (C) qa genome: define light vs full verify, haiku minimum for light (.claude gate); (D) scripts/jev-report.mjs: join jev rows with cell/resolved rows, counterfactual token projection, exit-criteria table; (E) security check of ADR 0010 Data exposure vs TypeSafe primary docs (retention); (F) after 5 shadow tickets: exit review with the user. Proposed CONTEXT.md terms (gate): minimum tier, shadow mode, verify depth.
- **architect, 2026-09-29:** Handoff: .scratch/organism-infra/handoffs/04-architect.md
- **architect, 2026-09-29:** ADR 0010 written; orchestrator resolves
- **Resolved (orchestrator, 2026-09-28):** User accepted the ADR 0010 picks and the CONTEXT.md terms. Follow-ups published as 38-43.
