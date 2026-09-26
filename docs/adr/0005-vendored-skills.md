# Skills are vendored from mattpocock/skills and adapted in place

Selected skills are copied into `.claude/skills/` rather than installed as the auto-updating plugin, so they can be adapted to the organism. For example, `handoff` writes to the board, and `implement` claims tickets. Every change is logged in `.claude/skills/VENDORED.md` with the upstream commit, so upstream updates can be diffed and merged by hand.
