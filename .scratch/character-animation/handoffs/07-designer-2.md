# Handoff: ticket 07, design critique round 2, bounced to ready-for-agent

**Mode:** critique, round 2. I reviewed `worktree-agent-a926ab2096132ef97` at `a5e42bc` read-only and committed nothing there.

## Verdict: bounce

- HIGH-1 (browser load) is fixed. `dev-scene.html` loads, and every module and glb returns 200.
- MEDIUM (colour) is fixed. All three props are in the organ-brain wisteria family.
- **HIGH-2 (prop visibility) is still open.** The fan and scroll don't show at all in their habit loops, and the blueprint shows only a 1px sliver. Every prop still lies within about 0.19 of its socket, and 0.19 is the paw's own radius (arm tail thickness 0.38; the socket sits 0.19 inside the arm tip). The fixes and numeric targets are in the ticket's `## Comments`: grip offset 0.20 to 0.22, fan blade radius 0.24 to 0.28, the scroll turned across the paw, the blueprint stood up, and a check that at least 60% of each prop's box lies outside the paw sphere.
- LOW (habit distinctness) is deferred until the props show. The poses differ by which arm moves, but product and architect both use `paw_L` and look alike from the front.

## How I measured

- Scratch scripts (not in the repo) in the session scratchpad:
  - `world.mjs` computes each prop's rest-pose world box from `panda.glb`'s socket chain.
  - `sock.mjs` reads the prop glbs' bounds and colours.
- The skill's `measure-glb.mjs` measured the paw radius.

## Next

A developer applies the offset and orientation fixes in `apps/ui/assets-src/panda/build_props.py`, re-exports the props, runs the 60%-outside check, and gets eyes on `dev-scene.html` before designer round 3. Round 3 then checks prop visibility, starting with blueprint_unroll from the front, and judges the LOW finding.

## Environment issues

1. **Python serves `.mjs` as `text/plain` on Windows.** `python -m http.server` sends `.mjs` as `text/plain` and browsers refuse it as a module. I used a scratch `ThreadingHTTPServer` with a `.mjs -> text/javascript` override. Fix: commit a dev server script, or an `npm run dev-scene`, that sets the MIME type and sends `Cache-Control: no-store`.
2. **Stale browser cache on port 8124.** Round 1 served a different worktree on the same port, and the browser reused its cached, broken module graph. The page stayed on "loading…", and the server only saw a 304 for `dev-scene.mjs` and no module requests. `ctrl+shift+r` in the pane didn't bypass the cache, so I moved to port 8137. Fix: send `no-store` from the dev server, or use a fresh port per worktree.
3. **The Browser pane is small and its viewport emulation doesn't hold.**
   - The pane is 416x415, and the HUD covers the panda's upper body.
   - With emulation at 720x640 or 1100x700, the canvas still renders at about 416x415.
   - The emulation clears itself when the pane width changes.
   - The `zoom` region crop isn't supported.

   Fix: widen the pane, or add a HUD collapse toggle to `dev-scene.html`.
4. **The pane has no tool to read the console.** I could only check "no console errors" indirectly: every request returned 200 and the HUD status line rendered.
5. **The worktree-isolation guard refuses some Bash commands.** It refused compound commands, and `sed` calls with a variable path, that pointed at the reviewed worktree or the board. I had to use literal paths or a Write to scratch then `cat >>`. It slows board writes but doesn't stop them.
