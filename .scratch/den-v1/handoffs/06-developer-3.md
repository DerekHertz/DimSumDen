```json
{
  "ticket": "den-v1/06-approve-deny",
  "cell": "developer",
  "current_step": "Dev-only ?demo=approval mode added on feat/06-approve-deny; npm test 2888 tests, 2887 pass; the one failure (mods-sleep-guard.test.mjs huge dash run, a 3s timing check) passes alone 67/67, a load flake. Ready for qa light verify, then the user's visual critique.",
  "artifacts": [
    "apps/ui/src/scene/approval-fixture.mjs",
    "apps/ui/src/scene/approval-fixture.test.mjs",
    "apps/ui/src/App.jsx"
  ],
  "decisions": [
    "?demo=approval is its own value of the existing `demo` query param. demoRequested() only matches `handoff`, so the handoff demo (A and D off) and this one cannot collide; this mode leaves the card's demo prop false so A and D work.",
    "Dev only: App.jsx calls approvalDemoParams(location.search, import.meta.env.DEV). A production build never activates it (test reads App.jsx for the gate).",
    "createApprovalDemo() is a tiny store (getSnapshot/subscribe/rearm) plus a stub bridge client. Snapshot: one claimed developer ticket demo/01-approval, one agent (needs-you, approve capability), one pending Bash approval whose input is longer than 200 chars so the panel shows the full input. Expiry 10 minutes.",
    "Answering allows or denies through the stub: the approval becomes allowed/denied and the agent goes running. After 6 seconds App.jsx calls rearm() so a fresh pending approval (new id) appears and the user can try again.",
    "&refuse=<400-599> makes every decide fail with that status and a reason, so the retryable banner (400, 429, 5xx) and the locked one (401, 409) can be seen. Example: ?demo=approval&refuse=409.",
    "While the demo is on, the live snapshot is ignored and the live connection placeholder is hidden; the live bridge client is not used (the stub client replaces it)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa light verify of the new mode (tests: approval-fixture.test.mjs). Then the user's visual critique in `npm run ui` at /?demo=approval: enter the den, walk to the developer panda (steamers), press A or D. Open items from earlier rounds still apply: the alarm banner colour (--surface-200 + --alarm, spec token alarm-zone does not exist) and the bridge-client.test.mjs fixture token edit for security.",
      "owner": "qa"
    }
  ]
}
```

# 06 developer round 3: ?demo=approval

Browser check (throwaway script, Chromium headless against the vite dev server): `/?demo=approval` and `/?demo=approval&refuse=409` render a Working chip for the seeded ticket with no page errors; `/` without the param is unchanged (Tally chip only). I did not walk to the panda in a browser; the card and review path through the seeded snapshot is covered by approval-fixture.test.mjs (cardFor, createApprovalReview and the stub client together).
