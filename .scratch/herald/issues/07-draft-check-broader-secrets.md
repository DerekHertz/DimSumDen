# 07: Broaden draft-check secret patterns

**Type:** task

**Priority:** P3

**What to build:** Security M2 on herald/02: `scripts/draft-check.mjs` catches only ghp_, sk-ant, AKIA and api_key=. Add github_pat_, gho_ and ghs_, sk- and sk-proj-, Slack xox*, JWT and Bearer, PEM private-key headers, aws_secret_access_key=, token= and password= pairs, JSON-quoted "api_key", lowercase akia, zero-width-character splits, and reject an empty body (L2).

**Blocked by:** herald/02

**Status:** ready-for-agent

- [ ] One failing fixture per new pattern, then passing
