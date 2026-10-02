# den-scene-v1/07 security review

Security pass. Branch feat/floating-cards07 at dd3443a, diffed against origin/main (18 files, UI and smoke script only).

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "security",
  "current_step": "Reviewed the full diff at dd3443a against origin/main by hand. No critical, high or medium findings; one low note. gitleaks clean. No dependency or CI changes. Security pass.",
  "artifacts": [
    ".scratch/den-scene-v1/handoffs/07-security.md"
  ],
  "decisions": [
    "Security pass: no finding rates high or above",
    "Reviewed by hand (the /security-review skill was not run); the diff is UI-only and small enough to read in full"
  ],
  "failures": [],
  "pending": [
    {
      "item": "orchestrator: PR and merge per relay; 07 and 14 resolve together. Optional: a small ticket to deflake the Ctrl+Enter Note test (from qa).",
      "owner": "orchestrator"
    }
  ]
}
```

## What was checked

- Secrets: `gitleaks detect --log-opts="origin/main..dd3443a"` scanned 8 commits, no leaks.
- Dependencies and CI: `git diff origin/main...HEAD` over package.json, package-lock.json and .github shows nothing. No new or upgraded dependency, no workflow change. `npm ci` audit reported 0 vulnerabilities.
- Untrusted text to the UI (Cards.jsx, Bottom.jsx, overlay-model.mjs): ticket titles, refs, roles, and handoff text all render as React text nodes. No `dangerouslySetInnerHTML`, `innerHTML` or `eval` in the overlay, camera or rig files. Styles take only values from fixed token maps (`STATION_HUE`, `MARKER_COLOUR`) or numbers computed from timestamps (`left: ${m.at*100}%`), never agent strings. `STATION_HUE[current.station]` is keyed from `stationIdOf`, which maps unknown cell types to the cub station, so a hostile role cannot inject a CSS variable name.
- Shell and file paths: no shell-out, no fs access, no path building in the changed code. The approve/deny path is the existing `submitGate` (gates-model.mjs, unchanged) posting JSON `{kind, ref, note}` to the same-origin `/requests`. The ref comes from the board snapshot, and the bridge owns validation. Note is capped by `maxLength=500` in the textarea and trimmed in `submitGate`; bridge-side limits are out of this diff.
- Double-submit and races: `Decision.send` guards with an in-flight set per kind, a 409 locks the buttons, and `request.pending` hides the controls. Keyboard shortcuts are scoped to the card, ignore text fields and modifier chords, so a stray key cannot approve from the scene or the Tally dialog.
- Network exposure: the diff adds no listener. The only server is the test's Vite instance, bound to `127.0.0.1` on port 0 (floating-cards.test.mjs:60). Test POSTs to `/requests`, `/state` and `/metrics` are intercepted with `page.route` stubs (lines 119-121), so no test reaches the real bridge or writes to the board.
- Smoke script (apps/ci-cd/smoke-ui.mjs): selector changes only; the hunk that injected a style tag was removed.
- Intent bar: Send is inert (`onSubmit` calls preventDefault, aria-disabled). No intent text leaves the page. When den-scene-v1/13 or an intent endpoint wires it up, that ticket needs its own review (the text will be untrusted input headed for an agent).

## Findings

1. Low. apps/ui/src/overlay/Cards.jsx:166 (`<pre><code>{current.preview.join("\n")}</code></pre>`) shows the card title, an agent-controlled string, in a code well. It is a text node, so there is no injection; the only risk is a very long or multi-line title spoofing the card. Mitigation if wanted: truncate or `overflow` clip in CSS. Does not block.

## Failed calls

- None.
