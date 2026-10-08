```json
{"ticket": "den-v1/07-message-t", "cell": "qa", "mode": "verify", "current_step": "Full verify of feat/07-message-t at ceffa71: QA pass. Verdict comment written. Ticket stays in-review for the user's visual critique (ready-for-human path).",
 "artifacts": ["apps/ui/src/state/bridge-client-message.test.mjs", "apps/ui/src/overlay/message-composer.test.mjs", "apps/ui/src/overlay/message-wiring.test.mjs"],
 "decisions": ["Full verify, not light: this cell did not run specify (the specify tests come from 07-qa-specify.md, commit 5b46f9d).", "Suite result taken from /tmp/07-tests.txt as instructed, not re-run: 2955 tests, 127 suites, 2955 pass, 0 fail, 0 skipped, 0 todo."],
 "failures": [],
 "pending": [
  {"item": "User visual critique of the layout, 320px width, phone bottom sheet, motion, contrast, focus return and the spinner (human-verified criteria in the specify handoff).", "owner": "orchestrator"},
  {"item": "Live wiring: feed the agent event stream into composer.observe so the card's Message received line works in the running app (den-v1/11).", "owner": "developer"}
 ]}
```

## State
QA pass. Full verify of `feat/07-message-t` at `ceffa71` (developer commit on top of specify commit `5b46f9d`). The saved suite run is 2955 of 2955 passing, with 0 failing and 0 skipped. The three specify files ran in that suite. No bounce findings. Five non-blocking notes below.

## Checks run
- `git diff 5b46f9d HEAD` on the three specify test files: empty. No assertion was removed, loosened or changed.
- `git diff --stat 5b46f9d HEAD`: six product files, all in the ticket's scope (bridge client, composer controller, composer component, card, App mount, den.css).
- Read the controller, the component, the card and App diffs. The byte check runs on trimmed UTF-8 text; the in-flight guard, the ack id match, the 20 s stall (counted from the 200) and the Enter/Esc/Shift+Enter/IME key rules are in the code the tests exercise.

## Criterion-to-test map
- Enter sends exactly one request with text and token; Esc cancels without sending: `apps/ui/src/overlay/message-composer.test.mjs` "Enter sends exactly one request" (incl. Shift+Enter, IME, in-flight guard) and "Esc closes without sending"; token and POST path: `apps/ui/src/state/bridge-client-message.test.mjs` "POSTs /agents/:id/message once, with the session token".
- Over 2 KB refused before sending: `message-composer.test.mjs` "size and emptiness are refused..." (2,048 sends, 2,049 refused, multi-byte, whitespace); `bridge-client-message.test.mjs` "over 2,048 UTF-8 bytes ... send nothing".
- Card shows sent, then received on ack: `message-composer.test.mjs` "a successful send" (ack by id, other id ignored, late ack after stall, 20 s stall); "the status line follows the card's agent".
- Stub client and fixture ack, no live runtime: `message-composer.test.mjs` "no live runtime is needed" (global fetch poisoned).
- `npm test` green: saved run, 2955 pass, 0 fail, 0 skipped.
- Human-verified (in the specify handoff): layout, 320px width, phone sheet, motion, dot cross-fade, contrast, focus ring and return, spinner.

## Notes (non-blocking)
1. `apps/ui/src/state/bridge-client.mjs:5`: `FALLBACK` line reformatted as `const FALLBACK =(status)`. Unrelated whitespace change in a file the ticket touches; ask the developer to revert it in the fix round, if there is one.
2. `apps/ui/src/overlay/message-wiring.test.mjs:23-60`: these tests grep source text (copy strings, `isComposing`, `aria-live`, `prefers-reduced-motion`). They are implementation-coupled. The behavior criteria are covered by the controller tests, so I'm not bouncing on them. Keep them in mind for the next specify.
3. `apps/ui/src/App.jsx:84-85`: the card's "received" line can only fire from a fixture ack. Nothing calls `composer.observe` in the running app, so criterion 3 is met in the stub only, which matches the den-v1/11 split in the ticket.
4. `apps/ui/src/App.jsx:81`: with `?demo=approval`, T is enabled but the approval demo client has no `sendMessage`. A send shows `Not sent. The bridge did not answer.` That's misleading. Scope question for the orchestrator; the developer marked it out of scope.
5. `apps/ui/src/overlay/message-composer.mjs:128`: a 401 that arrives after the composer was closed is dropped silently, so the session-ended banner never shows. Low severity; no criterion names it.

## Next step
Orchestrator: the user's visual critique (ready-for-human). If the user wants changes, one developer fix round. Then risk-check and the PR per the relay.

## Gotchas
- The developer's saved run is the suite result; this cell did not re-run `npm test`, as instructed.
- No failed calls in this session.
