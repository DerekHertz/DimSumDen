# Handoff: ticket 04 (one cell shows its state) → paused mid-implementation (usage limit)

**State**: `in-progress`, not resolved. Paused by coordinator for a usage-limit wrap-up, not blocked on anything technical.

## Branch and commit

`worktree-agent-a919cafc1cb3eea97`, commit `9d15b01` (WIP, not code-reviewed).

## What's done

- `packages/character-director/` (new package per ADR 0007): `src/director.mjs` exports `STATES`, `STATE_MAP`, `DUR_FAST`, `DUR_HEARTBEAT`, `createCharacterDirector()`. Pure module, no renderer dependency. Maps all 8 states to a loop clip, entry one-shot, face frame and held pose (clip/face names drawn from `apps/ui/src/assets/panda-contract.mjs`'s `CLIPS`/`FACE_FRAMES`). Handles immediate interrupts (state change cross-fades for `dur-fast` even mid one-shot), the calm rule (blinks scheduled independently on the face channel, never closer than `dur-heartbeat`, injectable RNG for deterministic tests), and reduced motion (held pose + face, no loop/blink/crossfade).
- `src/mock-state-source.mjs`: `createMockStateSource()` per ADR decision 3, emits `{cell_id, state, ts}` events.
- Tests: `director.test.mjs` (9) + `mock-state-source.test.mjs` (3), zero-dependency `node:test`, following ticket 03's precedent. Root `package.json`'s test glob now also covers `packages/**/*.test.mjs`. `npm test` at repo root: 21/21 pass.
- `apps/ui/src/scene/dev-scene.{html,mjs}`: a running scene wiring the director to one panda cell, three.js via CDN import map (no new npm dependency, matching ticket 03's `viewer.html`). Dev-control buttons per state, a reduced-motion toggle, and an icon+word badge (state is never shown by motion alone). Run: `python -m http.server 8124 --directory apps/ui` then open `http://localhost:8124/src/scene/dev-scene.html`.

## STATE_MAP choices (judgement calls, not yet user-checked)

Every state's loop and held pose reuse the same clip (only `idle` has a distinct entry, `blink`, before settling into `sit_still`), because the asset contract has exactly one dedicated clip per state plus `blink`. Face frames were picked to match spec.md's per-state story text (e.g. `waiting_on_user`→`wide_eyes`, `blocked`→`narrowed`, `failed`→`sour_pucker`, `terminated`→`eyes_shut_savoring`). These are reasonable but unverified guesses — worth a look before calling this ticket done.

## Left to do

1. `/code-review` pass on the diff (Standards + Spec axes) — not run yet.
2. Open `dev-scene.html` in a browser and confirm the acceptance criteria visually: pose/expression change per state, reduced motion holds a still pose with no loop/blink, icon+word always visible. This developer session has no browser/computer-use tool, so this needs a session that does (or the user, manually).
3. Re-check `STATE_MAP`'s face-frame choices against spec.md story text once visible in-browser.
4. Ticket's checkboxes are still unchecked in the ticket file; check them off once verified.

## Blender probe (requested diagnostic, unrelated to this ticket's work)

`mcp__blender__*` tools were present in this session's tool set. Called `mcp__blender__get_objects_summary` once, read-only: it answered successfully, returning scene `PandaAsset` with `PA_Panda`, `PA_Rig` (armature), `SNAP_Cam`, and `face` objects — i.e. Blender is running and connected with ticket 03's panda asset scene still open. Nothing in Blender was modified.

## Suggested next steps

Resume this same branch/worktree (`worktree-agent-a919cafc1cb3eea97`), re-claim ticket 04, run `/code-review`, then get browser verification before moving to `resolved`.
