# Security review: den-v1/01-resident-pandas-take-over (batch D1 with 03, PR #151)

Branch codex/procedural-den-frontend @ 0604c76, diffed with `origin/main...0604c76` (the two-dot diff against origin/main is polluted by board files that landed on main later).

```json
{
  "ticket": "den-v1/01-resident-pandas-take-over",
  "cell": "security",
  "current_step": "Security pass on batch D1 (01+03) at 0604c76. No critical, high or medium findings; gitleaks clean.",
  "artifacts": [],
  "decisions": [
    "Pass: front-end only diff, no shell, file, daemon, dependency or CI change",
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

## Scope
Hand review of the 25 changed files under apps/ and docs/design (reviewed by hand, /security-review not run). The four risk-check hits (App.jsx, den-scene.mjs, den.css, frontend.test.mjs) are false positives for board/lock/daemon: they match words like "lock" (pointer lock), "frontier" and "board".

## Checks
- Shell, files, network: no child_process, fs, fetch, WebSocket or EventSource in the diff. apps/bridge, package.json, package-lock.json and .github are untouched, so daemon binding and dependencies are unchanged (no new deps).
- Untrusted text (ticket refs, ticket bodies): refs reach three.js userData and Map keys only. Canvas labels draw fixed strings. PandaCard renders the existing Detail/markdown component through React text nodes; links pass the existing SAFE_HREF (http/https only) with rel=noopener noreferrer. No innerHTML or dangerouslySetInnerHTML.
- Pointer lock: requested only in the Enter click path and on dblclick while active; failure falls back to drag-look; exit on pointerlockchange. All document/window listeners are removed in dispose.
- Keyboard: walk keys are ignored when focus is in input/select/textarea/button/a/dialog. Esc always leaves walk mode.
- Secrets: `gitleaks detect --log-opts="origin/main..0604c76"` found no leaks.

## Findings
- Low, apps/ui/src/scene/procedural/explorer.mjs:44: the keydown handler reads `e.target.closest`; a synthetic keydown with a non-Element target (document) would throw. Browsers target body in practice. Optional hardening.
- Low, apps/ui/src/scene/procedural/CameraRig.jsx:24: `querySelectorAll('[data-den-walk]')` binds pad buttons once per effect run; stale if the pad were ever conditionally re-rendered. Reliability only, not security.

## Verdict
Security pass.
