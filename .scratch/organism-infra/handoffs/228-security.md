# 228 security handoff

Security pass at b0f959c (range origin/main...b0f959c, 9 files all under apps/ui/; bridge untouched).

## State

```json
{
  "ticket": "organism-infra/228-ui-run-any-frontier-ticket",
  "cell": "security",
  "current_step": "Security pass. No critical, high or medium findings; two low notes, neither blocks.",
  "artifacts": ["branch feature/organism-infra-228-ui-run-any-frontier-ticket at b0f959c"],
  "decisions": [
    "dispatch goes through the injected session fetch like every other client call (Bearer token attached by the session, 401 ends the session); route POST /agents is auth token, mutating, so the bridge also checks Origin and Content-Type",
    "no new dependency; no HTML sink; gitleaks clean on origin/main..b0f959c (2 commits)"
  ],
  "failures": [],
  "pending": [
    { "item": "orchestrator: hold for the user's visual verdict, then PR and merge", "owner": "orchestrator" }
  ]
}
```

## Answers

1. Consent model (ADR 0016): intact. `dispatch` calls the shared `call()` with the session-wrapped fetch (Cards.jsx useMemo over steering.session.fetch, same as App.jsx:97). The body is exactly { ref, role }. No retry in the client or the runner (useRunner.start: one press, one await). The only effect (RunControl useEffect) clears a stored error and never calls start. start is reachable only from the button onClick. Per-ref in-flight guard blocks a second POST. Run is disabled in demo mode and with no steering session.
2. Untrusted text: every bridge/board string (error text, ref, title, role, reason) renders as a React text node. No dangerouslySetInnerHTML, innerHTML, href, or attribute built from such text. Refs enter `id` attributes through idPart (non-[A-Za-z0-9_-] replaced) and `aria-label` as a string attribute, which is escaped by React. Refusal text from the bridge goes into a `<p role="alert">` as text.
3. bridge-client-dispatch.test.mjs: fixture only. TOKEN is the string "tok-test-228", assembled at runtime. The hit is the word "token"/"Bearer". gitleaks found nothing.
4. Role select: ROLE_OPTIONS is fixed (orchestrator, architect, product, designer, scout, herald), excludes developer, qa, security. A tampered DOM value can send any role, but the bridge host validates role and refuses developer/qa/security with 409, so this is not a UI-side boundary. No impact.
5. Locks, board, session state: the UI diff does not read or write any. capacityFromSnapshot is a pure computation over the snapshot (imports pure capacity() from apps/bridge/cells/capacity.mjs; no fs). Bridge route unchanged.

## Findings

- low, apps/ui/src/overlay/run-model.mjs:5 (import of ../../../bridge/cells/capacity.mjs): the UI bundle imports a bridge module across the app boundary. The file is pure (qa verified the suite), so no exposure; a note on coupling only. Safe to merge as is.
- low, apps/ui/src/overlay/Cards.jsx refusalText: the bridge's error string is shown verbatim, including any echoed ref. It is text only, so no injection; the string could be long. Cosmetic. Safe to merge as is.

Verdict: Security pass.
