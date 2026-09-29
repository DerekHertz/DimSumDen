```json
{"ticket": "dimsumden-ui-v0/14", "cell": "designer", "mode": "review", "current_step": "Design pass on 58d84f6 (code, tokens, user verdicts); three low-severity follow-ups",
 "artifacts": [".scratch/dimsumden-ui-v0/handoffs/14-designer-review.md"],
 "decisions": ["Design pass: layout bands, tokens, states and a11y match the spec", "Tea house top at y 0.94 (1.1x Bao cap from test 3b) accepted over spec's 1.2 body height", "Findings below are follow-ups, not bounces; the user already passed light and dark visually"],
 "failures": ["No browser in this dispatch: review is code + tokens + the user's visual verdicts, no own screenshots or contrast/fps measurement"],
 "pending": [{"item": "Follow-up ticket: fix left-facing leaf culling (backdrop.mjs:24-29)", "owner": "orchestrator"}, {"item": "Propose decor-bamboo / decor-bamboo-far values (approved Q1) and swap into backdrop", "owner": "designer"}, {"item": "Layout polish: plush overlap left of Bao (user note)", "owner": "orchestrator"}]}
```

**State**: complete. Design pass.

# Ticket 14 design review: Paper-cut grove backdrop

Reviewed branch at 58d84f6: `apps/ui/src/scene/backdrop.mjs`, `Backdrop.jsx`, `Den.jsx` diff, `styles.css` tokens, ticket Comments.

## Matches spec
- Bands: ground plane y 0 from z -1.5 to -9; near stalks at |x| >= 2.3 (keep-out [-1.6, 1.6] held); counter + 2 steamer stacks left, 2 unlit lanterns right; tea house with 3 stepped eaves and ridge centred at z -4.75; 10 mid stalks; 12 far stalks at z -8.
- Tokens: only surface-000/100/300, line, line-strong, ink-faint, read from CSS vars (all defined light and dark in styles.css:4-50). No qi/lantern/alarm/organ/state/panda hues; no emissive.
- 5 merged meshes, Lambert flatShading, no shadows, raycast no-op, no useFrame. Fog surface-100 near 8 far 20; background surface-100.
- States: backdrop outside the panda Suspense and behind an error boundary (loading and error covered); theme change recolours in place via matchMedia; reduced motion N/A (static).
- User verdicts: light and dark pass.

## Findings (all low severity, ranked)
1. `backdrop.mjs:24-29`: leaves with dir = -1 wind clockwise, so their face normal points -z and FrontSide culls them from the camera. Half the leaves (the ones leaning left) are invisible. Fix: add `side: THREE.DoubleSide` to the `line` material, or reverse vertex order when dir < 0.
2. Tea house is squat (body 0.6, ridge top 0.94) vs spec body 1.2, due to test 3b's 1.1x Bao cap. Accepted; reads as a low pavilion. No change.
3. Approved `decor-bamboo` tokens (Q1) not yet in the design system or build; stalks are neutral line/line-strong. Follow-up: designer proposes values, user approves, then swap `line`/`line-strong` on stalks and leaves.
4. Far stalks use `line` without `opacity-dim`; fog does the fade. Fine.
5. Theme listens only to `prefers-color-scheme`; no in-app theme toggle exists today, so fine. If one is added, Backdrop must also observe `data-theme`.

**Next step**: orchestrator proceeds with security review/merge; file follow-ups 1 and 3 (and the user's plush overlap note).
**Suggested skills**: organism-protocol.
**Gotchas**: none.
