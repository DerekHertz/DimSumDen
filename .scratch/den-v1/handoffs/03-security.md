# Security review: den-v1/03-walk-mode (batch D1 with 01, PR #151)

Branch codex/procedural-den-frontend @ 0604c76. Full review is in the batch handoff 01-security.md; the same diff and verdict apply.

```json
{
  "ticket": "den-v1/03-walk-mode",
  "cell": "security",
  "current_step": "Security pass on batch D1 (01+03) at 0604c76. No critical, high or medium findings; gitleaks clean.",
  "artifacts": [],
  "decisions": [
    "Pass: walk mode is client-side only (pointer lock, keyboard, touch pad); no shell, file, daemon, dependency or CI change",
    "gitleaks detect origin/main..0604c76: 4 commits, no leaks"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Open the PR / merge on green CI",
      "owner": "orchestrator"
    }
  ]
}
```

## Walk-mode specifics
- Pointer lock is requested only on the Enter click and a dblclick while active, with a drag-look fallback; Esc and pointerlockchange both exit. All listeners are removed in dispose.
- Keys are ignored when focus is in a form control, link, button or dialog.
- No untrusted text reaches the walk code: it consumes only key codes and pointer deltas.

## Findings
- Low, apps/ui/src/scene/procedural/explorer.mjs:44: keydown handler reads `e.target.closest`; would throw on a non-Element target (synthetic only). Optional hardening.
- Low, apps/ui/src/scene/procedural/CameraRig.jsx:24: pad-button bindings made once per effect run. Reliability only.

## Verdict
Security pass.
