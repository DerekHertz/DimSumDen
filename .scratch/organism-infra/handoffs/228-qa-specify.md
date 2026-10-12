```json
{
  "ticket": "organism-infra/228-ui-run-any-frontier-ticket",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/organism-infra-228-ui-run-any-frontier-ticket (054e0fa). 42 tests, 42 fail now (missing exports, no dispatch on the client, stationsModel cuts the list to 3). A throwaway reference sketch of run-model.mjs plus client dispatch turned 41 of 42 green (the 42nd is the stationsModel change); the sketch was deleted and is not committed.",
  "artifacts": [
    "branch tests/organism-infra-228-ui-run-any-frontier-ticket @ 054e0fa",
    "apps/ui/src/overlay/run-model.test.mjs",
    "apps/ui/src/state/bridge-client-dispatch.test.mjs"
  ],
  "decisions": [
    "Model file: apps/ui/src/overlay/run-model.mjs (next to Cards.jsx, like overlay-model.mjs and message-composer.mjs). Exports: ROLE_OPTIONS, defaultRole, slotRows, runState, capacityFromSnapshot, dispatchPrompt. Contract is in the header comment of run-model.test.mjs.",
    "Shapes I had to choose (the spec names the functions, not the shapes): ticket for defaultRole is the snapshot ticket (uses ticket.type, already lowercased by the bridge); inflight is a boolean for this ref; steer is { state: 'ready'|'starting'|'none', demo?: boolean } where state is useSession().state; runState returns { enabled, reason } with reason = the visible text or null; slotRows rows are { ref, kind, role, tag, label }.",
    "Reason text lists refs joined with ', ' in strip order (running first, then locks, each by plain string compare of the ref). 'Also running:' uses the same order and leaves out the row's own ref.",
    "Session-cap variant: when cap - live <= max - load and room is 0, the text is '<live> of <cap> running: <refs>'. The test only covers a case with no locks, so refs = live refs either way.",
    "Recompute between snapshots is a pure capacityFromSnapshot(snapshot): live refs = snapshot.agents not in done|failed|terminated; locked refs = tickets with a holder (same rule as server.mjs lockedRefs); max and cap from snapshot.capacity; returns null when the snapshot has no capacity key. It calls the shared capacity() from apps/bridge/cells/capacity.mjs.",
    "dispatchPrompt(capacity) -> { show, line }: room 0 gives { show: false, line: 'No room to dispatch: <load> of <max> running.' }, room > 0 gives { show: true, line: null }.",
    "The ready-list criterion is tested at the model: stationsModel(snapshot).next must list every frontier row (today it slices to 3). If the developer prefers to render queueModel(snapshot).frontier directly in the component, they still must change stationsModel.next (or ask qa to move the test); the existing overlay-model tests only assert next is [] with no snapshot."
  ],
  "failures": [],
  "pending": [
    {"item": "Build to the tests: create apps/ui/src/overlay/run-model.mjs, add dispatch(ref, { role }) to apps/ui/src/state/bridge-client.mjs (POST /agents, body { ref, role }, call() already rejects { status, reason } with the bridge's error text), make stationsModel.next list all frontier rows, then wire StationsCard, the dispatch card and App to them.", "owner": "developer"},
    {"item": "Human-verified (no automated test): slot strip layout and pips, both themes, 375px, reduced motion, focus ring and tab order, aria-describedby / role=alert / aria-busy wiring, 'Starting…' label, 'Started. Usage reading unavailable.' line, error clearing on next press, 'Slots unavailable, bridge offline' empty state, 'The susan is empty.', the stale-lock explanatory line, role select being per-ticket state, keys a/d/m doing nothing while the dispatch prompt is absent. The user does the visual verdict.", "owner": "orchestrator"}
  ]
}
```

# 228 qa specify handoff

Branch `tests/organism-infra-228-ui-run-any-frontier-ticket`, tests commit 054e0fa on base 6e070b1.

## Criterion to test map

Ticket criteria:
1. Run starts an agent for any frontier ticket, not only frontier[0]: run-model.test.mjs "it works for any frontier ticket, not only the first"; "stationsModel's next list is not cut to three rows"; bridge-client-dispatch.test.mjs "POSTs /agents once ... exactly { ref, role }". The new agent appearing through agent frames is existing behaviour (apply-event) and the UI adds nothing optimistic: human-verified.
2. Role menu and default: ROLE_OPTIONS (2 tests), defaultRole (5 tests).
3. Disabled with a visible reason at room 0 and re-enables when an agent ends: runState "room 0", "a lock with no agent fills a slot", "when the session cap binds", capacityFromSnapshot "an agent that ended no longer counts", "Run re-enables when the agent ends".
4. Every ref holding a slot visible, lock told from live: slotRows (5 tests). The rendering itself is human-verified.
5. 409 or 429 shows the bridge's text, nothing retried: bridge-client-dispatch.test.mjs 409, 429, 404/503, 401 and "two presses are two requests" tests (each asserts one request per call).
6. The user has looked at it: human-verified.

Spec items:
- "Also running": runState enabled-with-others test.
- Capacity unknown, not signed in, demo mode, in flight, ticket already live: runState tests.
- Dispatch prompt absent at room 0 with the "No room to dispatch" line, back when an agent ends: dispatchPrompt (4 tests).
- 201 with usageUnknown passes through: client test.

## Spec points not turned into a test, or interpreted

- Component-level behaviour (keys a, d, m doing nothing while the prompt is absent; the prompt not rendering) needs React; only the model decision (`dispatchPrompt().show`) is tested.
- Order of reasons when several apply (demo vs signed-out vs capacity vs in-flight vs live agent) is not specified, so no test pins precedence; each test has one cause. The in-flight and already-live reasons have no spec text, so those tests only require a non-empty string.
- `steer.state === 'none'` is read as "no steering session". The spec says "401/403"; a lost session ends in state 'none' (session.mjs end()), and a first load with no launch link is also 'none'. If the developer wants the 401 from a Run press to show the same text, that is the component's job (the client test asserts the rejection carries status 401).
- Type strings: the spec says "spec work" and "UI or asset work". I pinned `spec`, `ui`, `asset`. Real board tickets also use `design` (8 tickets), `code`, `task`, `fix`, `infra`, `chore`; only chore and empty are tested as unrecognised. `design` is left unpinned (designer would be a reasonable choice, but the spec does not say). Flag to the orchestrator if `design` should map to designer.
- dispatchPrompt with an unknown capacity (older bridge) is unspecified and untested.
- Cap-binding reason with locks present (refs: live only or all?) is not pinned.

## Environment note

None. Worktree base and `npm ci` fine.
