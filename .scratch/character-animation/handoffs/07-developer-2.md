# Handoff: ticket 07 (props on sockets + Brain idle habits) → fix round 1 → in-review

**Branch:** `worktree-agent-a926ab2096132ef97`, built on the designer-reviewed tip `beb4ea0` (merged `--ff-only`).
**Commits:**
- `24b2352` — "Ticket 07 review fix round 1: browser-load, prop visibility, organ hue"
- `a5e42bc` — "Ticket 07 fix round 1: address code review findings"

## What I fixed (designer bounce, handoffs/07-designer-1.md)

1. **HIGH — browser load.** `apps/ui/src/assets/panda-contract.mjs` imported `node:fs` at module top level, breaking `dev-scene.html` in every real browser. `readGlbFile` now dynamic-imports `node:fs` lazily (its only caller, Node-test-only); it's now `async`, so both callers in `panda-contract.test.mjs` now `await` it. Added a regression test, "does not import a Node built-in at the top level", that reads the module's source and fails if any top-level `import` line names a `node:` specifier.

2. **HIGH — props invisible in the paw.** Verified the actual cause against the exported `panda.glb`'s socket world matrices (not just the Blender rest pose) by walking the glTF node hierarchy in a scratch script.
   - **Fan:** its arc spread in local X/Z with the thin (solidify) axis on local Y. `paw_R`'s rest orientation carries local Y to world-up and local Z to world-depth — backwards from what a held-up fan needs, so the *tall* dimension was foreshortened into depth and the *thin* dimension was on world-up, reading as a near-invisible horizontal sliver. Swapped the arc to spread in local X/Y (thin axis now on local Z) in `make_fan` (`build_props.py`). Confirmed post-fix: world box is now `(0.262, 0.16, 0.024)` (X, Y, Z) — thin axis (0.024) lands on world depth, tall axis (0.16) on world-up.
   - **Scroll and blueprint:** both were centred on the socket origin, buried in the fist mesh. Added `GRIP_OFFSET = 0.06` and offset both along local Z (which `paw_L`'s rest orientation carries to world +Z, toward the camera) — confirmed each prop's world box shifted a full 6cm toward the camera post-export. The fan gets no offset (its hinge is the deliberate socket contact point, not a centred origin like the other two) — documented why in its docstring after code review flagged the asymmetry against the ticket's "all three props" wording.
   - Re-ran `build_props.py` in Blender (MCP) — first attempt put the grip offset on the wrong local axis (landed on world-up instead of world-depth); caught it by re-measuring the exported glb's world box before committing, and fixed the axis.
   - Re-exported all three `apps/ui/public/models/props/*.glb`.

3. **MEDIUM — prop colour.** Recoloured all three props from narrative colours (lacquer red / parchment tan / slate blue) into the organ-brain wisteria hue family (design system artifact's `cell-types.md`, hue ~264° from `#674698`/`#c3a5f9`), varied by lightness/saturation (fan mid, scroll light, blueprint dark) so the three stay distinguishable while sharing the organ hue.

**Left untouched:** the LOW finding (re-check habit distinctness once props are visible) — that's the designer's re-check per the ticket instructions.

## Code review (`/code-review`, fixed point `beb4ea0`, Standards + Spec axes in parallel)

Both findings addressed in `a5e42bc`:
- **Standards:** `apps/ui/assets-src/panda/README.md`'s "Props and hats" section was now stale — it still said every prop's origin sits at its own centre in the paw, contradicted by the new `GRIP_OFFSET`. Updated it to describe the offset and the fan's orientation fix, with the axis reasoning; also clarified `cell-types.md`/`tokens.json` are the external design system artifact, not repo files.
- **Spec:** the fan alone gets no `GRIP_OFFSET` despite the ticket's "for all three props" wording — added a docstring note explaining why (deliberate socket-contact hinge, unlike the scroll/blueprint's centred origin).
- Also de-duplicated a repeated rationale comment across `make_scroll`/`make_blueprint`.
- No scope creep or wrong-looking fixes found on either axis.

## Verification

- `npm test`: 30/30 pass (29 before this round + 1 new regression test), both before and after the code-review fixes.
- Confirmed `panda-contract.mjs` has zero top-level imports at all now, and loads standalone via `node --input-type=module -e 'import(...)'`.
- World-space bounding boxes for all three props, computed against the actual exported `panda.glb`'s socket world matrices (not assumed identity), before and after each fix.

## How to check it visually

```
python -m http.server 8124 --directory D:/claude_sessions/agent_office/.claude/worktrees/agent-a926ab2096132ef97
```
Open `http://localhost:8124/apps/ui/src/scene/dev-scene.html` (now loads — this was the HIGH-1 fix), click "working" then each of orchestrator/product/architect under "Cell type".

## Status

Ends at `in-review` (not `ready-for-human` or `resolved`) — the designer critiques next per the review relay.
