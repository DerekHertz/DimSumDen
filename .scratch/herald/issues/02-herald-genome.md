# 02: Herald genome and draft-shape check

**Type:** feature

**Priority:** P1

**What to build:** Per `.scratch/herald/spec.md`: `.claude/agents/herald.md`, a Front of House cell on Sonnet. It reads the repo only, plus Write for the draft and Agent for scout. It has no Bash, web or GitHub write tools, so it can't publish. It runs on demand, reads `docs/agents/herald-voice.md`, and writes one 1-3 paragraph draft outside the repo, with a source header. Also a draft-shape check script with tests: the header is present, there are at most 3 paragraphs, sources are listed, and there are no emails or secrets. There is also a test on the genome's tool list.

**Blocked by:** None

**Status:** in-review

- [ ] The draft-shape check passes on a good fixture and fails on each bad one
- [ ] A test asserts the genome's tools exclude Bash, WebFetch and GitHub write tools
- [ ] The genome is delivered as a diff for the user to apply (`.claude/` gate)
