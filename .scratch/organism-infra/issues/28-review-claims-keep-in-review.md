# 28: Review claims should not clobber in-review status

**Type:** bug

**What to build:** When qa (verify) or security claims a ticket at `in-review`, the claim rewrites the status to `claimed`, and neither cell can set `in-review` back. Found in the ticket 24 relay. A verify or security claim should keep `in-review`, or release should restore the pre-claim status.

**Blocked by:** 24 (same CLI surface)

**Status:** ready-for-agent

- [ ] A qa-verify or security claim on an `in-review` ticket leaves it `in-review` after release
- [ ] Tests cover both cells

## Comments
- **Evidence (orchestrator, 2026-09-29):** `release --keep-status` from a non-review claim left status `claimed` instead of the prior status (designer on showcase-v1/07, qa specify on organism-infra/30).
- **Retro (user-approved, 2026-09-29):** also let `board comment --verdict` accept designer pass/bounce (the genome counts a design bounce like a qa bounce), and make `--keep-status` restore the status from before the claim (left `claimed` 3 times on 2026-09-29).
