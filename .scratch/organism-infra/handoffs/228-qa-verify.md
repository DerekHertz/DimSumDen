```json
{
  "ticket": "organism-infra/228-ui-run-any-frontier-ticket",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA pass (light verify, plus a code read of the component wiring). Branch feature/organism-infra-228-ui-run-any-frontier-ticket @ b0f959c. Suite from orchestrator: 4487 pass, 0 fail, 0 skipped. Specify tests (054e0fa) unchanged. Notes below for the user's visual check.",
  "artifacts": [
    "branch feature/organism-infra-228-ui-run-any-frontier-ticket @ b0f959c"
  ],
  "decisions": [
    "Pass. No finding breaks a spec line.",
    "run-model.test.mjs and bridge-client-dispatch.test.mjs: no diff between 054e0fa and b0f959c. floating-cards.test.mjs: one added line (a capacity key in the fixture); no assertion touched.",
    "Out-of-scope files: none. The 7 files changed are all in the ticket's area (App.jsx one prop, Cards.jsx, floating-cards.test.mjs fixture, overlay-model.mjs, run-model.mjs, bridge-client.mjs, styles.css)."
  ],
  "failures": [],
  "pending": [
    {"item": "User visual verdict (both themes, 375px, reduced motion). See the notes in the qa verify comment/report for what to look at.", "owner": "orchestrator"}
  ]
}
```

# 228 qa verify handoff

Verdict: QA pass. Checked by reading the code against the spec; nothing was run by me beyond git diffs (suite result supplied by the orchestrator).

## Spec lines checked in the code
- Refusal line: Cards.jsx RunControl renders `<p className="small gate-error" role="alert">` with a React text node, text `Couldn't run: <status> <reason>` (status omitted when 0). No dangerouslySetInnerHTML in Cards.jsx. Cleared on the next press of that ref and when the row's settled (enabled, reason) signature changes. No retry anywhere; client `dispatch` makes one request.
- In flight: `useRunner.start` guards with a synchronous ref Set, so a second click cannot send a second POST even before re-render. Button reads "Starting…", `aria-busy="true"`, `disabled`.
- Keys a, d, m: NeedsYouCard onKeyDown returns early when `!prompt.show`, before any preventDefault. Only dispatch gates get the hidden prompt; permission requests are untouched.
- Slots unavailable, bridge offline (no snapshot), Capacity unknown (runState null capacity, Run disabled), empty frontier text kept, demo (`title` and reason, Run disabled), no session (reason text "Couldn't send: not signed in to steer"): all present.
- a11y: Run `aria-label="Run <ref>"`; visible `<label htmlFor>` on every select; reason `<p id>` linked by `aria-describedby`; strip is `<section aria-label="Slots">`; pips and tag `aria-hidden` with a hidden label text per row.
- Client dispatch: same `call()` as the other steering calls (injected session fetch, token never touched in this module). The ref goes in the JSON body, not the URL.
- CSS: tokens only, no hex; `lantern` and `alarm` absent from the strip rules (`alarm` only through existing `.gate-error`).

## Choices beyond the spec: none breaks a spec line
- "Started. Usage reading unavailable." also under the strip: fine, and needed once the row leaves the list. See the race in the notes.
- `flex-shrink: 0; max-height: 55vh` on Needs you: not in the spec; does not contradict it. Check the Needs you card at 375px and short viewports.
- `dispatchPrompt` show:true on unknown capacity: spec only hides at room 0, so unknown keeps today's behaviour. Fine.
- Session-cap reason lists live refs only: spec says "uses live and cap", refs unspecified. Fine.
- One hook at Cards level: fine, but see the duplicate-alert note.

## Notes for the user's eye (none is a bounce)
1. Usage note can be lost: the signature effect in RunControl clears a row's result on any state change. If the agent frame lands while the row is still listed ("Also running" to "Already running"), the "Started. Usage reading unavailable." note is cleared before it is seen. If the ticket leaves the list first, it shows under the strip. Order depends on frame timing; unverified.
2. Same ref in both cards: a refusal for a ref that is both a Needs you dispatch gate and a Stations row shows in both (two role="alert" if both cards are open). Spec says "shown once".
3. A refusal on row A stays when you press Run on row B (only a press on the same ref, or a state change, clears it). Spec says "the next press"; ambiguous.
4. Offline with a stale snapshot: the strip shows the stale slots and Run stays enabled on stale capacity (the strip text only appears with no snapshot at all). This follows the existing "stale data stays on screen" rule. A press then shows "Couldn't run: Could not reach the bridge." Spec line "No snapshot or bridge offline" could be read to want the offline text here too.
5. After a 201 and before the agent frame arrives, Run re-enables (in flight is over, no optimistic state per the spec). A very fast second click would POST again and get a 409.
6. Ticket Type `design` (8 board tickets) defaults to orchestrator, not designer, because the spec table names "UI or asset work" and qa pinned only spec, ui and asset. Raised in specify; unchanged.
7. `.queue-title` lost its single-line ellipsis (now wraps); it is used only in the Stations rows. `.code-small` is now defined twice in styles.css (second adds overflow-wrap). Harmless.
8. Not looked at by the developer running: reduced motion, focus ring, no-capacity text, Starting… state, usage note, refusal clearing, demo title. These are worth a real click-through.
