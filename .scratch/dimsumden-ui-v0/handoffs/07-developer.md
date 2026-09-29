```json
{
  "cell": "developer",
  "ticket": "dimsumden-ui-v0/07-ui-shell",
  "status": "in-review",
  "branch": "feature/dimsumden-ui-v0-07-ui-shell",
  "commit": "8dd351365216ff8dc74f40e9a97764237a6d75db",
  "current_step": "developer done: 43 state tests green, npm test 492 pass, build + bridge smoke clean, released at in-review",
  "artifacts": [
    "feature/dimsumden-ui-v0-07-ui-shell @ 8dd3513",
    "apps/ui/",
    "apps/bridge/server.mjs",
    "apps/bridge/bridge-static.test.mjs"
  ],
  "decisions": [
    "React 19.3.0 with R3F 9.8.1, vite 8.3.1, three 0.170.0",
    "bridge static serving implemented in 07 per ADR 0011",
    "oxc jsx automatic runtime for Vite 8",
    "provisional colour tokens, system font stacks"
  ],
  "failures": [],
  "pending": [
    {
      "item": "designer to supply real tokens and review shell",
      "owner": "designer"
    },
    {
      "item": "security to review vite/esbuild/rolldown tree",
      "owner": "security"
    }
  ]
}
```

# 07 developer handoff

## Done
- qa's 43 state tests pass unedited (`apply-event.mjs`, `connection.mjs`, `live-store.mjs` in `apps/ui/src/state/`). Full `npm test`: 492 pass, 0 fail.
- Vite app: `apps/ui/{index.html,vite.config.mjs,src/main.jsx,App.jsx,live.js,styles.css}`. Grid `1fr 440px`, `main[aria-label="Den scene"]` with an R3F canvas (aria-hidden), `aside[aria-label="Control panel"]` with header, connection pill, and five section slots (headings only; 09-11 fill them). Before the first snapshot the panel shows "Connecting to the den...". All snapshot text renders through React (escaped), no innerHTML.
- Bridge static serving (ADR 0011 decision 2, last route row; ADR assigns it to 07): `serveStatic` in `apps/bridge/server.mjs`, `uiDir` defaults to `apps/ui/dist`, extensionless unknown path serves index.html, missing asset 404, traversal 403, MIME via `contentTypeFor` now exported from `apps/ci-cd/dev-server.mjs`. Test: `apps/bridge/bridge-static.test.mjs` (5 tests).
- npm scripts: `ui`, `ui:build`, `ui:dev` (proxy to 4317).

## Dependencies (exact, user-approved)
react 19.3.0, react-dom 19.3.0, three 0.170.0, @react-three/fiber 9.8.1 (React 19 with R3F 9 pair); vite 8.3.1 (dev). `npm audit`: 0 vulnerabilities.

## Smoke
`npm run ui:build` succeeds (one 1.08 MB JS chunk, size warning only). Served through `startBridge` on a fixture root; Playwright chromium at 1440x900: main and aside landmarks present, 5 sections, 1 canvas, pill "Live", no console errors or page errors. Only headless-GL warnings ("GPU stall due to ReadPixels"). Not a committed script; ticket 13 owns the committed smoke mode.

## Notes for the orchestrator
- Vite 8 uses oxc, so JSX is configured as `oxc: { jsx: { runtime: "automatic" } }` (ADR says esbuild; same effect).
- Colour tokens in `styles.css` are provisional approximations (no tokens.json in the repo); designer review should supply real values. Fonts are system stacks (user decision).
- Scene is a placeholder sphere; Bao and plushes are ticket 08. Queue slot shows only a ticket count.
- Security: vite brings esbuild/rollup/rolldown native binaries; review the lockfile tree.
- I did not run the /code-review sub-agent fan-out (token budget); self-reviewed instead.
- Unapproved out-of-scope: none added.
