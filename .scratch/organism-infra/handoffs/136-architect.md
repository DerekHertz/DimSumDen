# Handoff: 136 architect (partial, context budget reached)

Branch `docs/136-jev-go-live-amendment`: origin/main merged in (merge commit 1431100, no conflicts). No further edits were made. The old draft (fa3181f) is intact and STALE against the nine settled decisions in the ticket's 2026-10-07 comment.

```json
{
  "ticket": "organism-infra/136-jev-go-live-amendment",
  "cell": "architect",
  "current_step": "Merged origin/main into the branch; read the draft ADR 0010 Amendment 1, ADR 0015 Amendment 2, docs/jev-usecases.md and all nine settled decisions. Rewrite not started (context budget hit at 80k).",
  "artifacts": ["docs/adr/0010-jev-precheck-tier-and-verify-depth.md", "docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md", "docs/jev-usecases.md"],
  "decisions": [
    "Ticket 160 (merged) already fixed the verify shadow baseline (jev.mjs: baseline is light when qa specified). The draft's 'bug logged 2026-10-05' text in ADR 0010 Amendment 1 is stale: say it was fixed by 160, and the go-live ticket only keeps a regression test across modes and fallbacks.",
    "Verify (settled item 2): lift the qa-unspecified floor: light when Jev picks light at conf >= 0.8, all tests green, risk-check clean. This makes the draft's 0.65 floor moot (on a qa-specified ticket light is already today's rule, Jev only raises). Surface that 0 of 42 shadow light picks reached 0.8, so check how many were on qa-unspecified tickets before promising savings. Any escaped bug turns it off. Verify can now save tokens, so replace the draft's 'no worse only' measure (C3 resolved by user).",
    "Route new-ticket (item 1): live at conf >= 0.8, below falls back and shows both. Pre-go-live: normalize advisory-outcome aliases (qa=qa-specify, developer=developer-direct; true agreement 27/39 = 69%), add security to labels, code-built header on state (Type, files touched, gated-path flags, relay defaults; jev-1.13 has a 32k-token window), sharper criteria text, plus an atomic yes/no version composed in code; replay both on the 39 labelled tickets, keep the higher, go live only at >= 80% agreement; then 10-ticket trial, one safety miss turns it off. Supersedes the 85% bar of 0015 decision 5.",
    "Wake (item 4) live despite ADR 0019 decision 5 (user settled C1); code wakes on any user-authored comment; judge on safety only. Keep draft's informational floor 0.9 as architect adjustment with reason.",
    "Priority and scope (item 5): displayed suggestions only, collecting data (config mode advisory); they do NOT feed the order; the old 0015 decision 4 bars (70%/10 flags, 60% tercile/20, no small in top tercile) become the bar for promoting to applied. Draft said scope feeds the combined order: remove that.",
    "Tier (item 8): retune from the 98 shadow rows; Haiku 5.5 (claude-haiku-5-5, Claude Code 2.1.293 installed here) may take developer work on tickets rated small at conf >= 0.8; one Haiku bounce turns lowering off; light verify moves to Haiku with it. Architect suggestion: replay the retuned rubric on history (as for route) instead of the draft's separate 10-ticket shadow run; flag as adjustable. Weights haiku 0.5/sonnet 1/opus 2 stay the user's until changed; build ticket checks Haiku 5.5 price.",
    "Done-check 74 (item 3): escalate-only; fail raises (light to full verify, full back to developer); pass changes nothing; sending the diff waits for 42 (un-parked, runs right after 136). Bounce routing, handoff trimming and done-check also wait on 42.",
    "Finding information (item 7): start-here context file goes to every cold hop (full qa verify, security, scout), scout calls jg before grepping. Touches ADR 0014 decision 4 and orchestrator step 0 (now architect, qa specify, developer only); amend 0014 or note it, and write the role-file edit as gated text.",
    "Gated edits (item 9, C5): write the exact new text for .claude/agents/*.md and CLAUDE.md into the ticket as a comment or section, user applies interactively without auto mode. The old patch .scratch/_handoffs/gated/136-jev-go-live-genome.patch targets an older orchestrator.md (it already matches some lines on main, which still says 'In shadow' at steps 1, 5, 6, 3); regenerate against current main.",
    "The draft's 'Conflicts, surfaced and not resolved' (C1-C7) in ADR 0015 Amendment 2 must become 'Conflicts and how the user settled them 2026-10-07'."
  ],
  "failures": ["Context budget (80k) reached before any edit; outcome: partial"],
  "pending": [
    {"item": "Rewrite ADR 0010 Amendment 1, ADR 0015 Amendment 2 and docs/jev-usecases.md to the nine settled decisions listed above; keep baseline definition and floors-with-reasons; add trial and use-case entries for route, verify, wake, priority, scope, tier, done-check, handoff trimming", "owner": "architect"},
    {"item": "Add CONTEXT.md terms (Trial, Use case, Label set, Wake-up gate, Reserved budget, Safety miss, Advisory mode, Config row); edit the Shadow mode entry whose _Avoid_ lists trial", "owner": "architect"},
    {"item": "Write the go-live build-ticket scopes into the ticket answer: (A) route prep (alias normalization, security label, header, atomic version, replay, config rows), (B) verify floor lift plus config-row mode resolution in jev.mjs plus regression test of the shadow baseline, (C) wake live, (D) priority/scope display, (E) tier retune and replay with Haiku, (F) log-cell --model on every dispatch, (G) 42 security review, then 74 criteria, handoff trimming, context-file hops", "owner": "architect"},
    {"item": "Write the exact gated .claude/ and CLAUDE.md text into the ticket; do not apply", "owner": "architect"}
  ]
}
```
