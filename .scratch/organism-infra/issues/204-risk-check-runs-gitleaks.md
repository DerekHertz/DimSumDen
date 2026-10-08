# 204: risk-check runs gitleaks over the branch range

**Type:** task

**Priority:** P3

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay hygiene (pipeline-retro 2026-10-08). A mods-trial/01 fix round committed a fake test fixture with a literal `Authorization: Bearer` curl line. `scripts/root-secret-scan.test.mjs` passed it, gitleaks did not, and it cost a full security bounce plus a history rewrite. CI's required secret-scan check would have gone red.

## What to build

`npm run risk-check` runs `gitleaks detect --config .gitleaks.toml --log-opts=<merge-base>..HEAD --redact` on the branch range, as an extra check with its own category. A leak is a hit (exit 1, "escalate to full security review"), and the hit names the file and rule but never the value. When `gitleaks` is not installed, risk-check prints one "gitleaks not found, skipped" line and carries on. A missing binary never fails the check, so cells without gitleaks are not blocked.

Files: `scripts/risk-check.mjs` (or wherever risk-check lives), its tests; `docs/agents/` text that describes risk-check's checks, if any.

## Acceptance criteria

- [ ] A branch whose range adds a gitleaks-flagged literal makes `npm run risk-check` exit 1 with a gitleaks hit naming the file and rule, and the secret value appears nowhere in the output.
- [ ] A clean branch range adds no gitleaks hit.
- [ ] With no `gitleaks` on PATH, risk-check prints a skip line and its exit code depends only on the other checks.
- [ ] The scan honours `.gitleaks.toml` (an allowlisted path is not a hit).
- [ ] Tests fake the gitleaks binary; none need it installed.

## Comments
