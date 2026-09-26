# 04: One cell shows its state

**What to build:** A cell in the scene shows its state through body language. The character director (a pure module per 02's ADR) maps each of the 8 states (idle, working, waiting_on_user, blocked, done, failed, throttled, terminated) to a looping clip, an entry one-shot, a face frame, and a held pose for reduced motion. State changes cross-fade immediately (`dur-fast`), even mid one-shot. The director is wired into the scene, where a mock state source or dev control switches one cell's state. The state's icon and word are shown alongside the pose.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Director tests cover every state's loop, entry one-shot, face frame and held pose
- [ ] Director tests cover immediate interrupts and the calm rule (no loop, blink or glance spaced shorter than `dur-heartbeat`)
- [ ] With reduced motion, every state shows its held pose and face frame, with no loops, breathing or blinks
- [ ] In the running scene, switching state on one cell visibly changes pose and expression
- [ ] State is also shown by icon and word, never by motion alone

## Comments
