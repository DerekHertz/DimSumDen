# 31: Isolation guard stops matching "git" inside string content

**Type:** task

**Priority:** P3

**What to build:** The guard refuses commands whose text contains the word "git" anywhere, including inside a `node -e` string or a heredoc body ("names git in a form too complex to verify"). Match only git invoked as a command, not the word in data.

**Blocked by:** None (can start immediately).

**Status:** parked

- [ ] `node -e` with the word git inside a string literal is allowed (test)
- [ ] `git -C <main checkout> ...` is still refused (test)

## Comments

- **Created (orchestrator, 2026-09-28):** Friction reported by qa, developer and security cells during ticket 26's relay in WSL.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
