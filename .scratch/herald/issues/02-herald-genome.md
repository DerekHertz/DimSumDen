# 02: Herald genome and draft-shape check

**Type:** feature

**Priority:** P1

**What to build:** Per `.scratch/herald/spec.md`: `.claude/agents/herald.md`, a Front of House cell on Sonnet. It reads the repo only, plus Write for the draft and Agent for scout. It has no Bash, web or GitHub write tools, so it can't publish. It runs on demand, reads `docs/agents/herald-voice.md`, and writes one 1-3 paragraph draft outside the repo, with a source header. Also a draft-shape check script with tests: the header is present, there are at most 3 paragraphs, sources are listed, and there are no emails or secrets. There is also a test on the genome's tool list.

**Blocked by:** None

**Status:** resolved

- [ ] The draft-shape check passes on a good fixture and fails on each bad one
- [ ] A test asserts the genome's tools exclude Bash, WebFetch and GitHub write tools
- [ ] The genome is delivered as a diff for the user to apply (`.claude/` gate)

## Comments
- **qa, 2026-09-29:** QA pass (light verify). 15/15 herald tests pass, tests unchanged since 8bc376f, genome matches spec. Only failures are 5 browser smoke tests (expected in cloud). Criterion 3 human-verified.
- **security, 2026-09-29:** Security pass at 8e30269. No critical/high. M1 herald.md:4 Agent unrestricted (scout has Bash; settings auto-allow feature/ push and gh pr create), restrict to Agent(scout). M2 draft-check.mjs:8 secret patterns narrow (github_pat_, sk-, xox, private keys, JSON api_key missed). M3 herald.md:26 Write unscoped. L1 check is advisory. Fixtures split, no real creds. gitleaks not installed, used pattern grep. Detail in 02-security.md.
