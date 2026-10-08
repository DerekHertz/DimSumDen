```json
{
  "ticket": "den-v1/05-transcript-f",
  "cell": "designer",
  "mode": "spec",
  "current_step": "Mockup published and the six open questions are settled; the user has NOT yet seen the mockup or signed off. Next: the user opens the mockup, marks it up or says yes; then the spec in handoffs/05-designer-spec.md (with the deltas below) is the final spec to copy into the ticket and hand to qa specify.",
  "artifacts": [
    {
      "path": "https://claude.ai/artifact/TrxWBn9H1igYsiybKEctDa",
      "note": "Static mockup: desktop dark and light (tool expanded, scrolled up with Jump to latest), phone sheet dark and light, and six states (empty, reconnecting, bridge offline, pending permission, malformed event, agent ended failed)."
    }
  ],
  "decisions": [
    "Q1 right side panel, bottom sheet under 600px (user, 2026-10-08)",
    "Q2 buffer cap 200 events per agent",
    "Q3 panel stays pinned to its agent when the user walks away",
    "Q4 tool calls collapsed by default",
    "Q5 Jump to latest (n), no pause toggle",
    "Q6 walk mode only, not from the diorama"
  ],
  "failures": [],
  "pending": [
    {
      "item": "User reviews the mockup and signs off (or annotates). Needs a session with AskUserQuestion; this cell had none and hit its context budget.",
      "owner": "orchestrator"
    },
    {
      "item": "After sign-off: copy the final spec into the ticket, add story 23 to the criteria, then qa specify",
      "owner": "orchestrator"
    }
  ]
}
```

State: spec complete, awaiting user sign-off. Do not send to qa specify until they have signed off.

## What changed from the draft

The draft spec in `handoffs/05-designer-spec.md` stands. The user's answers match what it drafted, so the open-questions section is closed and only the following are made firm:

- Layout, Entries, Behaviour, States, Copy and Accessibility: as drafted (right panel `right:16px; top:88px; bottom:124px`, width `min(420px, calc(100vw - 32px))`; phone bottom sheet). The mockup is drawn at reduced scale; the drafted pixel values are the spec.
- `TRANSCRIPT_CAP = 200` per agent.
- Pinned to the agent id: walking away leaves the panel open; the header carries name and state, so it needs no card.
- Open from walk mode only; no diorama entry.
- Pending-permission row shows the tool name, a lantern icon and "Waiting on you", with no buttons (A/D is ticket 06). Header state for a waiting agent reads "Needs your answer" (same word as the card).
- Tool status words: `running`, `ok`, `failed`; `failed` uses `alarm` plus the word.
- Mockup choices to confirm with the user: header shows the role beside the state (the draft showed id and state); 32px Close on desktop, 44px on phone; the `Jump to latest (n)` pill floats at the bottom centre of the body.

## Token check

Every token the spec names exists in the design system: surface-glass, surface-300, surface-200, line, line-strong, ink, ink-muted, qi, focus-ring, lantern, alarm, radius-s/m/l, space-1..7, shadow-panel, dur-fast, dur-base, ease-soft, and type styles heading, body, small, overline, code, code-small. The draft's `Transcript` header uses `overline` plus `heading`. Nothing new needs adding to the design system.

## For qa specify

Criteria mapping at the end of the earlier handoff is unchanged (buffer, `transcriptView`, F with no agent, story 23 "opening, streaming and closing the transcript issues no network request", `npm test`). Add: the panel stays open when the card changes (Q3), and F does not open from the diorama (Q6).

## Next step

Ask the user to open the mockup, then record sign-off in a ticket comment and dispatch qa specify.
