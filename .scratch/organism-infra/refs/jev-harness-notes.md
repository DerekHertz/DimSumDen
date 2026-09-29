# Jev in a coding harness (user-supplied article, 2026-09-28)

Secondary source: an article about keel 0.2.0, a Rust/gpui Mac coding app that uses Jev (hosted) or laya (local) as a decision layer. The author reports **no measured coding-quality or cost gains**; the evaluation loop is proposed, not run.

## Contract
- The host (app code) prepares a finite menu of candidate ids; the selector picks one or abstains; the host re-validates against current state before acting, else uses a predefined fallback.
- Filter the options before asking: offer only routes the host can actually run (provider installed, model exists, reasoning level supported).
- The selector can't choose a good option the host forgot to offer.
- Selection is not permission. The normal permission path and user approval still apply, and high confidence grants nothing.
- Pinned user choices and running or resumed sessions bypass selection.

## Decision sites in keel
1. **Route for a new task:** which provider/model handles an unpinned task.
2. **Next-step focus inside a host-owned loop:** inspect / implement / verify / answer. Each focus maps to a host-defined tool bundle; `answer` means no tools. Tools are re-checked against current definitions at dispatch.
- Provider-owned agent loops (ACP providers) are not controlled. A listed slash command or capability is not an API the host can call.

## Records
- Per decision: candidates, choice or abstain, whether validation accepted it, fallback used, downstream outcome. Not chain-of-thought.
- Count a fallback separately so it isn't scored as a selector win.
- Judge the extra call by total task cost: selector time + worker + retries + review effort.

## "Self-improving" = reviewed replay, not training
- A receipt becomes a replayable scenario: same candidates and flags, run baseline vs. changed policy, compare valid selection, abstention, fallback, latency and outcome; a human approves the new baseline.
- Keep a separate held-out task set, keep the failures, and keep a rollback path.

## Starting checklist
One decision; the exact choices it can see; what happens on abstain; how you'll know the outcome helped.

## Mapping to the organism (orchestrator, 2026-09-28)
- **Best first decision: model tier per cell dispatch.** Menu: haiku / sonnet / opus. Fallback: the genome default. Pins: a ticket or user pin always wins. Check: the relay itself (qa verify, security); a bounce counts against the pick.
- Record `{"kind":"decision",...}` in `.scratch/usage.jsonl`: candidates, pick or abstain, accepted, fallback, and the ticket's total tokens and bounces.
- Shadow first: Jev labels, the genome default decides, for 5-10 tickets; then compare total cost per ticket.
- Input is ticket text and size only; no source code leaves the machine.
