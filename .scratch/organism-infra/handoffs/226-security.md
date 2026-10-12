# Handoff: organism-infra/226-dispatch-capacity-rule (security, batch 226-227)

```json
{
  "ticket": "organism-infra/226-dispatch-capacity-rule",
  "cell": "security",
  "current_step": "Security pass for batch 226-227 over 730cfc3..99d26c0. No blocking findings; one low finding (readLocked fails open on a non-array) recommended as a one-line tighten.",
  "artifacts": [],
  "decisions": [
    "Pass: steering gates unchanged. Origin, content-type and session token run in passesGate (server.mjs:114-130) before any handler; POST /agents and POST /tasks are auth:token. host.start is not a route (server.mjs:322 hands it only to the relay runner).",
    "Pass: race at one free slot. readLocked is awaited before the synchronous step; liveByRef is read and written with no await between full() and liveByRef.set (host.mjs:239-257), so two dispatches cannot both pass.",
    "Pass: new text exposure. 429 text and capacity.refs name refs of live agents and locked tickets; GET /state (auth none, loopback) already exposes every ticket ref and holder.",
    "Pass: gitleaks on 730cfc3..99d26c0, 2 commits, no leaks. No dependency changes. 88 of 88 capacity and host tests pass."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Optional before merge: make readLocked (host.mjs:204) return null for a non-array so it refuses 503 like a throw.",
      "owner": "developer"
    }
  ]
}
```

## Findings
- apps/bridge/cells/host.mjs:204 low, does not block. `Array.isArray(refs) ? refs : []` fails open: a reader returning undefined counts no locks. The bridge's own reader always returns an array, so this is latent. Recommend `return Array.isArray(refs) ? refs : null`, a one-line change that matches the throw path, with a test beside the existing 503 test.
- apps/bridge/cells/host.mjs:214 info. A stale lock held by a dead cell counts toward max and refuses dispatches (fail closed, an availability effect only). The 429 text names the refs so the user can reclaim them.
- apps/bridge/server.mjs:66-70 info. Frontier eligibility replaces the single dispatch gate, so any unblocked, unlocked ready ticket can be started up to 8 agents. Role checks (relay-hop roles refused) and the per-ref live-agent check are unchanged, and the click is the authenticated user's act.
