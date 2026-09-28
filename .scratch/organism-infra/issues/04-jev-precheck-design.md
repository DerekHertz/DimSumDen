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

**Status:** ready-for-agent

- [ ] The ADR states which call sites use Jev and which stay with Claude, and how it's invoked (MCP server, skill or CLI) and why
- [ ] A trial on a small set of real, already-resolved board tickets compares Jev's verdicts with the known outcomes: agreement rate, latency, and cost per call. The ADR records these numbers; vendor claims (200-400x) don't count as evidence.
- [ ] The ADR states a fallback for when Jev is down or has no key: the decision falls back to the cell or rule it replaces, and the organism never blocks on Jev
- [ ] Data exposure: what leaves the machine, what never does (source code, secrets, `.env`), where the key lives, and whether to route through a local proxy. `security` reviews this section.
- [ ] Any new domain terms are added to `CONTEXT.md` (brain gate: ask first)

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
