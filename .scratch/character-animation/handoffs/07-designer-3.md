# Handoff: ticket 07, design critique round 3, now ready-for-human

**Mode:** critique, round 3. I reviewed `worktree-agent-aad01bd255e8ec60a` at `5009afd` read-only and committed nothing there.

## Verdict: no HIGH findings, so the ticket is `ready-for-human`

- **HIGH-2 (props buried in the paw) is fixed.**
  - Check first passes: in `blueprint_unroll` from the front, the whole wisteria sheet shows.
  - The fan wedge and the scroll rod both show from the front and from the near three-quarter, through the whole loop and in both themes.
  - Share of each prop's box outside the paw: fan 99%, scroll 100%, blueprint 100%.
  - I accept the developer's two deviations: the scroll's length is along world X, and the blueprint's centre is 0.30.
- **The deferred LOW (do the habits read as different?) is fine.** Each habit has its own arm silhouette and prop shape: one arm raised with a wedge, one paw forward with a rod, or both arms spread with a sheet.
- **MEDIUM, open: the blueprint is too small.** It is 0.20 x 0.26, about 30x40 px next to a 305 px panda, and reads as a card. The target is a landscape sheet 0.34 to 0.38 wide and 0.24 to 0.30 tall (`build_props.py:49`).
- **Four LOWs, all optional:**
  - The flat props go edge-on from the far three-quarter view.
  - The fan partly covers the cheek from the near three-quarter.
  - The scroll reads as a stick; end knobs would fix that.
  - The right paw is empty in `blueprint_unroll`.

The targets and the numbers table are in the ticket's `## Comments`.

## How I measured

- I served the branch with a scratch `ThreadingHTTPServer` (it sets the `.mjs` MIME type and `no-store`) on port 8163. The server is stopped.
- I used the Browser pane at 800x600 and orbited about 45 degrees each way for the three-quarter views.
- The scratch script `normals.mjs` is in the session scratchpad, not a repo. It imports the branch's `prop-placement.mjs` and samples each flat prop's face normal and share outside the paw at 9 times through its loop.
- `measure-glb.mjs` gave the head width (1.35) and the panda's height (2.0).

## Next

The user gives the visual verdict in `dev-scene.html`, or waives the MEDIUM. Then qa verify, security, and the merge proposal. If the user wants the blueprint enlarged, a developer changes `BLUEPRINT_W, BLUEPRINT_H` and its test, then re-exports the props.

## Environment issues

1. **The first load in a newly opened Browser pane rendered an empty canvas.** The HUD was there and the emote bubble was pinned at x=0, but the console was clean. Loading the same URL again fixed it. My guess is that the pane was 0 wide when the page loaded. Fix: after `preview_start`, navigate once more before judging. Or make `dev-scene.mjs` size the renderer on the first frame, not only at load and on resize events.
2. **There is still no committed dev server that sets the `.mjs` MIME type and `no-store`.** This is round 2's env issue 1. I used a scratch server again.
