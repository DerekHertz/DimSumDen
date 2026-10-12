```json
{
  "ticket": "organism-infra/230-den-stop-receipt-and-approval-reason",
  "cell": "designer",
  "mode": "spec",
  "current_step": "UI spec written; user signed off the mockups as drawn (2026-10-12). Ticket has a bridge part. Ready for qa specify.",
  "artifacts": ["https://claude.ai/artifact/VMQNN9qN5w7DQpkasKfuxL (mockups A thread, B Needs you card, C stop trail, D 375px)"],
  "decisions": [
    "The transcript panel becomes one conversation thread per agent: agent words, asks (reason first, command under it), your answers and notes, typed messages, receipts, stop. Composer and Stop sit at its foot.",
    "Reason source: the agent's own words (`says`) plus the tool's own `description` field (`intent`). Both need a bridge part. Fallback line: 'The agent didn't say why.'",
    "Stop: thread foot only, with a one-step confirm 'Stop this agent?' (Stop / Keep going). No hotkey, no button on the den card.",
    "Receipts say what was sent and what the agent did next. They never claim the agent read a note.",
    "Allow and Deny in the thread still open the existing permission review (the bridge refuses allow until the full input was fetched)."
  ],
  "failures": [],
  "pending": [
    {"item": "qa specify: failing tests from 'Acceptance for qa' below", "owner": "qa"},
    {"item": "Bridge part: `says`, `intent` on approvals; `approvalId`, `note`, `answeredAt` on permission transcript entries; a `stop` transcript entry (see Bridge part)", "owner": "developer"},
    {"item": "Shared with 229: the `stop` and `ended` session events and the `ended` transcript entry. 230 only reads them; 229 owns any change to them.", "owner": "architect"},
    {"item": "User visual verdict after the build, both themes, 375px, reduced motion", "owner": "orchestrator"}
  ]
}
```

# 230 UI spec: the Den as a conversation with each agent (mockups signed off by the user, 2026-10-12)

Vocabulary and tokens: design system https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j. Only token names that exist there are used. Mockups: https://claude.ai/artifact/VMQNN9qN5w7DQpkasKfuxL.

User direction: "it should be as if i'm talking directly to the agent not just seeing a list of commands with no context".

## What the code carries today (checked)
- A permission request frame (`apps/bridge/cells/approvals.mjs` `view`): `id, agentId, tool, summary, inputLength, truncated, ts, expiresAt, state, note, reason`. `summary` is the first of command, file_path, path, pattern, url, query, description found in the input. No plain-words reason. The full `input` comes only from GET /approvals/:id.
- The Bash tool input usually has a `description` field in plain words. It is in `input`, but `summary` prefers `command`, so the page never sees it.
- The agent's own words are already recorded: transcript entries `{kind:"message", role:"agent", text}` (host.mjs). They are sent to the page only for a transcript that is open.
- A deny note does reach the agent: `decide` passes it as the deny message in the control response (`encodeControlResponse`). Nothing in the Den says so. That is the missing receipt.
- Transcript entries today: `message` (user entries carry status queued, applied, undelivered), `tool`, `permission` (status allowed, denied, expired), `ended`. No entry for a stop. The permission entry does not carry the note or the approval id.
- `POST /agents/:id/stop` answers 202 `{ok:true}`, 409 "the agent has already ended", 404 "no such agent". It appends a `stop` session event, and the agent ends `terminated`. `apps/ui/src/state/bridge-client.mjs` has no stop call.

## Bridge part (needed; the ticket gets a bridge part)
1. Approval view gains `says`: string or null. The text of the newest agent `message` entry recorded before the request in the same turn (since the agent's last tool result or user message), passed through `cleanText`, clipped to 500 characters. Null when there is none. Untrusted text: the page renders it as a React text node only.
2. Approval view gains `intent`: string or null. `input.description` when it is a string, `cleanText`, clipped to 200. Null otherwise. `summary` is unchanged.
3. Permission transcript entries gain `approvalId`, `note` (cleaned, from `decide`) and `answeredAt` (ISO), set when the entry is resent with its answer. This lets the thread show your note and tie an entry to its approval without matching on tool name.
4. A `{kind:"stop", at, status}` transcript entry, recorded when stop is accepted (status "requested"). The `ended` entry with state `terminated` closes it. Without the stop entry a reload loses the trail.
5. No change to the approval answer route or to the stop route.
Shared with organism-infra/229, not designed here: the session events `stop` and `ended` and the transcript `ended` entry. 230 reads them and adds nothing to the relay.

## Where
- `TranscriptPanel` (apps/ui/src/overlay/TranscriptPanel.jsx) becomes the thread. Overline "Conversation" replaces "Transcript". It still opens with R and closes with Esc.
- The `MessageComposer` (T) text box also sits at the foot of the thread, with Send and Stop. The T key and its floating composer still work.
- Needs you permission cards (`permissionRequests` in overlay-model.mjs) lead with the reason; their button "Open thread" opens the thread for that agent.
- Out of scope: a chat with Bao, the relay (229), the Tally dialog.

## Layout: the thread (panel `surface-200`, `radius-l`, 1px `line`, `shadow-panel` as the panel has today)
1. Header: overline "Conversation" (`overline`, `ink-muted`), "<Role> · <short ref>" (`heading`), agent id (`code-small`), state at the right: pip plus word (Working in `state-working`, Needs your answer in `state-waiting`, Stopped / Done / Failed with the existing glyphs). State is shown by glyph and word, not hue alone.
2. Thread list, `space-4` padding, `space-4` between entries, scrolls inside the panel (the existing log behaviour: follow only when at the bottom, "Jump to latest").
   - Agent message: speaker line (`small`, `ink-muted`, time in `ink-faint`), text in a `surface-100` bubble, 1px `line`, `radius-m`.
   - Ask (permission entry): 2px `lantern` border, `radius-m`, `surface-100`, `space-3` padding. Line one: "Asking to run a command · waiting on you · expires in N min" (`body-strong`, `lantern`, ◆ glyph). Then the reason in quotes (`body`). Then, if `intent` exists and differs from `says`, "Why this command: <intent>" (`small`, `ink-muted`). Then a `<details>` "Show the command" with the full `summary` as `code-small` text (`overflow-wrap:anywhere`). Then Deny and Allow (existing `approval-deny` and `approval-allow` styles; Allow solid `qi-fill` and `on-qi`; Deny `alarm` outline) and "Opens the full request first" (`small`). An answered ask loses its buttons and border colour: "Asked to run a command · answered".
   - Your entry (right-aligned, `surface-300` bubble, 1px `line-strong`): "Denied." / "Allowed." plus your note in quotes; typed message text; "Stop".
   - Receipt under each of your entries: chips (`small`, 1px border, `radius-full`). Done step: "✓ <word>" in `qi` with a `qi` border. Pending step: dashed `line-strong` border. Failed step: `alarm` text and border, with a ✕ glyph. Step meaning is carried by glyph and words, not colour alone.
   - System line (centred, `small`, `ink-muted`): "Agent stopped by you · 11:32" and, if the ticket still holds a lock, "The ticket lock may still be held."
3. Foot: composer row (text input `surface-200`, 2px `line-strong`, `radius-m`, 36px high, 44px under 600px; Send; Stop agent in `alarm` outline). Under 600px Stop drops to its own full-width row.
4. Confirm: pressing Stop swaps the foot row for "Stop this agent?" with Stop (`alarm` outline) and Keep going. Esc or Keep going restores the row. Focus moves to Keep going (the safe choice).

## Layout: Needs you permission card (`surface-200`, `radius-l`, `space-4` padding, `space-2` between children)
- Overline "<Role> · <ref>"; title (`heading`) "Wants to <verb>": Bash "run a command", Write and Edit "change a file", Read, Glob and Grep "read a file" / "search files", WebFetch and WebSearch "open a web page" / "search the web", anything else "use <tool>". Pure `toolVerb(tool)`.
- Reason line (`body`): `says` in quotes. If `says` is null and `intent` exists, `intent`. If both are null: "The agent didn't say why." (`ink-muted`, italic).
- Detail row with 1px `line` top border: label ("Command" / "File" / "Query") in `small` and the `summary` in `code-small`, one line, ellipsis.
- Expiry (`small`, `ink-muted`) and "Open thread" button. Keys E and Q and the review panel are unchanged.

## Receipts (the pure model `receiptModel`)
Steps and exact copy:
- Answer (allow or deny, with or without a note): `sending` "Sending…" → `sent` "✓ Sent with your answer" (deny: "✓ Sent with your denial"; with a note: "…denial and note") when the answer route returns 200. Failure: "Couldn't send: <status> <bridge text>" (`alarm`, once, `role="alert"`).
- Then, from the next thread entry after the answer: `next` "Agent next: ran <tool name>", "Agent next: said <first 60 chars>…", or "Agent ended: <state>". With no entry 30 s after `sent`: "No reply yet" (`ink-muted`, dashed chip, not an alarm).
- Typed message: the existing "Queued", "Received", "Not delivered" labels, shown as chips.
- Stop: `pressed` "Stopping…" (pending chip, `aria-busy`) → "✓ Stop sent" on 202 → "✓ Agent ended" when the agent's state is terminated (the thread header also reads Stopped). After 10 s without an end: "Still stopping…" (muted). 409 "the agent has already ended": "Already ended: <state>" with the ended state from the agent. 404 or other: "Couldn't stop: <status> <bridge text>" in `alarm`, `role="alert"`. No automatic retry; pressing Stop again is the retry. Once the agent ended, Stop is gone and the composer is read-only: "The agent ended."
- Copy never says the agent "read" or "saw" a note.

## States
- Empty thread: "Waiting for the agent's first message." (existing).
- Loading or reconnecting: the existing banner "Reconnecting...".
- Bridge offline: "Bridge offline: run npm run ui"; Allow, Deny, Send and Stop disabled (`opacity-dim`) with that reason as visible text.
- No steering session (401/403): Stop and Send disabled with "Couldn't send: not signed in to steer". Demo mode: Stop and Send disabled, `title` "Demo mode: actions are off".
- Agent ended (done, failed, terminated): ask buttons gone, Stop gone, ended line "Agent ended: <state>" (existing).
- Dropped entries: existing "Earlier entries were dropped".
- Reduced motion: no animation added. Receipt chips swap instantly. Transitions use `dur-fast` and are off under `prefers-reduced-motion: reduce`. The pending pip does not pulse.
- Light and dark: every colour is a token (`surface-100`, `surface-200`, `surface-300`, `ink`, `ink-muted`, `ink-faint`, `line`, `line-strong`, `qi`, `qi-fill`, `on-qi`, `lantern`, `alarm`, `state-working`, `state-waiting`, `state-terminated`, `focus-ring`, `opacity-dim`), never a hex.
- 375px: panel goes full width; one column; 44px targets; Stop on its own full-width row; the command and refs use `overflow-wrap:anywhere`; no horizontal scroll.

## Accessibility (WCAG 2.1 AA)
- The thread is a `role="log"` region labelled "Conversation with <name>", `aria-live="off"` as today. A new ask announces once in the existing polite status region: "<Role> is asking to <verb>".
- Each ask is a labelled group. Allow and Deny accessible names: "Allow <verb> for <ref>", "Deny <verb> for <ref>". The `<details>` summary is native keyboard operable.
- Receipt chips are plain text with the glyph `aria-hidden`; step changes are announced by the polite status region ("Stop sent", "Agent ended"), one announcement per step. Errors use `role="alert"`.
- Stop confirm: focus moves to Keep going; Esc cancels; focus returns to Stop after cancel and to the composer after the agent ended.
- Text 4.5:1 on `surface-100` and `surface-200` in both themes (`lantern` on light is #905d00 on #f8f3e8; check it); borders and focus ring 3:1; the dashed pending chip border 3:1. Focus ring 2px `focus-ring` at 2px offset. Tab order: thread entries top to bottom (details, Deny, Allow), message box, Send, Stop.
- Untrusted text (`says`, `intent`, notes, agent messages) is rendered as React text nodes only.

## Client part
`createBridgeClient().stopAgent(agentId)` (name for qa to pin): POST `/agents/<id encoded>/stop`, no body, session token as the other calls, resolves `{ ok: true }` on 202, rejects `{ status, reason }` like `sendMessage`. No retry.

## Acceptance for qa
Pure models need no DOM:
- `toolVerb(tool)` for each tool above and an unknown tool.
- `reasonText({ says, intent })`: says wins; intent when says is null; "The agent didn't say why." when both null; trims and clips.
- `permissionRequests` card model carries `reason` and `detail` from the approval (`says`, `intent`, `summary`), with the fallback.
- `threadModel(buffer, { pending, now })`: ask row has reason, intent, command; answered asks lose buttons; your answer row carries the note; a stop entry then an `ended` terminated entry gives the stop trail.
- `receiptModel`: answer, then next-entry kinds (tool, message, ended); the 30 s "No reply yet"; stop pressed, accepted, ended, "Still stopping…" at 10 s, 409 text, error text; message statuses; no wording that says the agent read the note.
- Client `stopAgent`: URL, method, no body, token, 202 resolves, 409 and 404 texts surfaced, no retry.
- Bridge: approval view has `says` and `intent` (null cases, clean and clip, a secret in the text is masked); permission transcript entries resent with `approvalId`, `note`, `answeredAt`; a stop request records a `stop` transcript entry; the answer and stop routes are unchanged.
The user's visual verdict covers the rest.

## Next step
qa `specify`. Skills: tdd. Gotcha: `board comment` has an argument length limit, so the full spec lives here and the ticket carries a pointer. The developer touches both apps/bridge and apps/ui, so qa should split the failing tests that way.
