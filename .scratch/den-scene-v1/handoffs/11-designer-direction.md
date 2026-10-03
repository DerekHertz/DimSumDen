```json
{"ticket": "den-scene-v1/11-bigger-cuter-bao", "cell": "designer", "mode": "direction",
 "current_step": "Three renders-only options (A Steady host, B Soft bun, C Mochi bun) are done against the resynced design system; waiting on the user's pick",
 "artifacts": [
  "https://claude.ai/artifact/MyJvqgyB5A4h4qq7DUUUYc",
  ".scratch/den-scene-v1/refs/direction-11/ (A|B|C and now: -den, -close, -mobile PNGs)",
  ".scratch/den-scene-v1/refs/direction-11/harness/ (hook.js, plugin.mjs, render.mjs, seats.py, c5.json)"],
 "decisions": [
  "All options use Bao scale 2.1 (1.5x of 1.4), BAO.position [0, 2.1, -3.3], back kiosks (Steamers, Front of House) out by 0.6 to x +-3.6",
  "Cuteness is applied after mixer.update every frame, because every clip writes scale on every bone; no glb or rig edit"],
 "failures": ["The scratchpad directory was announced unavailable mid-task; harness moved to /tmp/designer-11"],
 "pending": [
  {"item": "User picks A, B or C (the orchestrator relays the artifact and asks)", "owner": "orchestrator"},
  {"item": "Spec the picked option (states, a11y, copy) once picked, then qa specify, developer build", "owner": "designer"}]}
```

## State

Direction done, awaiting the user's pick. Ticket released at `ready-for-human`. No repo files changed; the worktree is clean.

## What changed

No branch or commit. Renders came from the real den (unmodified repo code) with an in-memory Vite transform, so they show the shipped scene, grove, kiosks and chips. Files are listed in the State block.

## The three options (all at scale 2.1)

| | A Steady host | B Soft bun | C Mochi bun |
|---|---|---|---|
| head scale (x,y,z) | 1.12 all | 1.2, 1.18, 1.18 | 1.42, 1.3, 1.3 |
| root (body) squat | none | y 0.96 | y 0.90 |
| ears / arms | 1 / 1 | 1.05 / 1.1 | 0.9 / 1.2 |
| face frame | unchanged (half_lidded) | content_squint, patches lightened | neutral, patches lightened, blush |
| head / body width | 0.77 | 0.82 | 0.97 (today 0.68) |
| Pass seats | crown, both shoulders | crown, both outer shoulders | crown, both ears |

Seat points in Bao's local model units (feet at y -1; world = position + 2.1 * seat). The crown seat is on a rail across the ears.
- A: orchestrator (0, 1.067, -0.175); product (-0.79, 0.14, -0.05); architect (0.79, 0.14, -0.05). Rail y 4.316 z -3.6675 width 1.9 bell x 0.7.
- B: (0, 1.034, -0.185); (-0.82, 0.09, -0.04); (0.82, 0.09, -0.04). Rail y 4.2465 z -3.6885 width 2.0 bell x 0.75.
- C: (0, 1.0, -0.204); (-0.62, 0.99, -0.30); (0.62, 0.99, -0.30). Rail y 4.175 z -3.728 width 1.5 bell x 0.5.

Full config (head/root/arm/ear/soften/blush) is in `harness/c5.json`.

## Decisions made (needs the user's pick, then spec)

- Cuter versus shoulder seats pull against each other. A wider head hangs over the shoulder, so C moves the side pandas to the ears. A and B keep the shoulders but the ridge is narrow (a few hundredths of a unit), so the shoulder pandas lean on the cheek; tilt them toward his head in the build and check it in review.
- C bends two design-system lines: the sleepy half-lidded eyes (it uses open round eyes) and fur never tinted (blush is a decal, not fur, but needs a pink token; only `organ-heart-zone` is close and it is the Drum's planned hue). A and B need no design-system change beyond the Bao scale and Pass wording.
- Bao is 7x a cook at 2.1 (the design system says about 10x), closer than today's 4.7x.

## Next step

Orchestrator asks the user to pick (artifact link above), then dispatches designer `spec` for the pick, qa specify, developer.

## Build notes for the developer (not asked, but measured)

- Override bone scale after `mixer.update(dt)` in `Figure` for `id === "bao"` and set absolute values, not multiples. Clips (sit_still, breathe) write scale tracks on every bone each frame. Head scale carries the face decal and the ears with it; ear scale then multiplies on top.
- Softening the patches edits `COLOR_0` on the head mesh. Clone Bao's geometry first; the glb geometry is shared with every other panda.
- Face frame for Bao: the offset is set from `cmd.face` each frame; override for Bao only.
- Seats should follow Bao through the idle clip: Bao idles on `sit_still` (static, all scale 1), but `breathe` lifts the head about 0.025 model units (0.05 world), so anchor seats to the bone world position each frame, not to fixed fractions. The current `PASS` fractions put the shoulder pandas at x 1.1, y 0.44 against a shoulder at x 0.8, y 0.16, which is why they float.
- Moving Bao back changes: `BAO` z used by `RAIL`, `BELL`, the step-stone ring centre (it follows `BAO.position`; the ring tests use literal -2.4), `roam.mjs` avoid rect, `handoffs.mjs`, `market-extent.fixture.mjs`, `default-framing.test.mjs` `baoBox`. Back kiosks need x +-3.6 (0.4 touches Bao's arm; 0.6 clears) and the den-iso tests pin x +-3.0.
- The Library and Drum "coming online" pills sit at shoulder-panda height behind Bao; in A and B they sit about 5 px from the shoulder pandas at 1440x900.

## Not done on purpose (asset work, flagged)

Eye patches have ragged edges and a slight scowl slant painted into vertex colours; reshaping them is Blender work. A neck or head tilt needs the rig.

## Suggested skills

`organism-protocol`, `asset-critique` (for the review round).

## Gotchas

Measure seats from the posed skinned mesh, not from the bind pose or the glb node numbers. Run `harness/render.mjs` from a worktree that has `npm ci` done; it expects the worktree path set at its top (`WT`).
