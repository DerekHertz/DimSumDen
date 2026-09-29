```json
{
  "cell": "designer",
  "mode": "review",
  "ticket": "dimsumden-ui-v0/07-ui-shell",
  "status": "ready-for-agent",
  "branch": "feature/dimsumden-ui-v0-07-ui-shell",
  "commit": "8dd351365216ff8dc74f40e9a97764237a6d75db",
  "current_step": "designer review done: Design bounce (token values and type scale), layout and a11y structure pass",
  "artifacts": [
    ".scratch/dimsumden-ui-v0/handoffs/07-designer-review.md",
    "apps/ui/src/styles.css"
  ],
  "decisions": [
    "bounce on token values: 08-11 build on these variables, so fix now",
    "real values from design system project/tokens.json v1 listed below"
  ],
  "failures": [
    "board claim --mode review rejected (designer has no modes in board)",
    "pkill of the bridge exited 144 (killed own shell); server did stop"
  ],
  "pending": [
    {"item": "developer: replace styles.css tokens and type scale per this handoff", "owner": "developer"},
    {"item": "designer: quick re-review after the fix", "owner": "designer"}
  ]
}
```

# 07 designer review: Design bounce

Build runs: `npm run ui:build` ok, `npm run ui` served on 127.0.0.1:4317, Playwright chromium 1440x900, light and dark, reduced motion. No console or page errors.

## Pass
- Grid `1fr 440px`, 100vh, no page scroll; `main[aria-label="Den scene"]`, `aside[aria-label="Control panel"]`, canvas `aria-hidden`, 5 `section aria-labelledby` slots in spec order; pill has dot + text (not colour alone); system font stacks per user decision; reduced-motion rule present.

## Findings (fix in this order)
1. `apps/ui/src/styles.css:3-39` colour tokens do not match the design system. Notably `qi` is green (#1c7a4d) instead of teal, and `focus-ring` is Google blue instead of `{qi}`: the brand accent and focus ring are the wrong hue. Replace with:

| token | light | dark |
|---|---|---|
| surface-000 | #efe8d8 | #111418 |
| surface-100 | #f8f3e8 | #171b20 |
| surface-200 | #fffdf7 | #1f252b |
| surface-300 | #e6dcc6 | #29313a |
| ink | #1d2124 | #eceee9 |
| ink-muted | #5a605d | #a4ada9 |
| ink-faint | #80847c | #7a8480 |
| line | #d8ceb8 | #343d45 |
| line-strong | #8c8069 | #66727d |
| qi | #006c71 | #3aced3 |
| qi-fill | #007a7f | #3aced3 |
| on-qi | #fffdf7 | #0d1417 |
| focus-ring | var(--qi) | var(--qi) |
| lantern | #905d00 | #f8bd40 |
| lantern-fill | #f8bd40 | #f8bd40 |
| on-lantern | #1b1d20 | #1b1d20 |
| alarm | #c1291b | #f45340 |
| alarm-fill | #c1291b | #f45340 |
| on-alarm | #fffdf7 | #111418 |

   Also (theme-independent): `--dur-fast: 160ms` (was 120ms), `--radius-full: 9999px`, add `--ease-soft: cubic-bezier(0.22, 1, 0.36, 1)`, `--space-1: 4px`, `--radius-s: 6px`, `--radius-m: 10px`, `--radius-l: 16px`, `--opacity-dim: 0.55`. Add the state, shadow (`glow-lantern`) and remaining tokens when 08-10 need them. All ink/qi/alarm pairs are documented 4.5:1+ on surface-000..200.
2. `styles.css:48-49` type scale. h1 measured 24px/700/normal; h2 20px/700. Spec: header and section headings use `title` = 20px / 28px line-height / weight 800. Set both to that (h1 may stay `title`; do not use 24px).
3. `styles.css:54` `.pill` measured 14px/400. Spec: `small` = 12px / 16px / weight 600. Padding should be tokens: `var(--space-1) var(--space-2)`, gap `var(--space-1)`.
4. `styles.css:53` `.small` 0.875rem (14px): make it the `small` style (12px/16px/600) so 09-11 inherit the right metadata style.
5. Minor: body should default to `body` (14px/20px/400); panel currently inherits 16px.

## Not checked
- Focus ring visible state: shell has no focusable elements yet (Tab lands on body); re-check in 08-10.
- Reconnecting / offline pill states were not forced live; covered by qa state tests.
- Mobile widths: spec is desktop-only (min 1280px).

## Next
Developer applies 1-5 (CSS only), then designer re-review (short).
