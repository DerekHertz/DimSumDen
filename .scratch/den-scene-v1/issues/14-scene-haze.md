# 14: Haze over the whole 3D scene

**Type:** bug

**Priority:** P2

**Blocked by:** None

**Status:** resolved

## What to build

The user sees a haze over the entire den scene in a live `npm run ui` (2026-10-02, branch feat/floating-cards07 at f787331). The 07 designer captures show the same washed look, which was first put down to the capture's `lightenScene` step, but it is there live too. The overlay changes in 07 are CSS only, so the cause is likely in the scene (fog, tone mapping, a light or a translucent full-scene plane). The 07 captures also show a pale shape overlapping the top of the panda's head in every view; check whether it is related. Find the cause, then fix it.

## Acceptance criteria

- [ ] The cause of the haze is found and recorded (handoff)
- [ ] The scene renders without the haze in light and dark (user-verified, designer review)
- [ ] The pale shape on the panda's head is explained, and fixed or ticketed

## Comments
- **orchestrator, 2026-10-02:** Filed on the user's live look during 07's review. Screenshots from the 07 re-review: scratchpad shots2/ (d-light.png, d-dark.png). Needs a scout or architect look at the scene's fog and lighting before a relay.
- **orchestrator, 2026-10-02:** Folded into den-scene-v1/07 on the user's ruling; resolves with 07's PR.
