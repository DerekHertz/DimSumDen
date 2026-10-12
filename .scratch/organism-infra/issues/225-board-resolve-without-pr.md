# 225: board resolve works for a ticket with no PR

**Type:** code

**Priority:** P3

**Status:** ready-for-agent

**Source:** orchestrator

**Class:** pipeline

**Origin:** added

**Serves:** finding:queue/07-genome-and-settings-patch (pipeline-retro 2026-10-12; second by-hand resolve of a ticket with no PR)

## What to build

`board resolve <ref> --pr <n>` refuses without `--pr`. A gated-edit ticket whose only deliverable is a patch the user applies with `apply-gated` has no PR, so the orchestrator claims, hands off and releases by hand, which its genome tells it not to do.

- Add a way to resolve with no PR that names what landed instead, for example `board resolve <ref> --commit <sha>`. The design is the developer's; keep `--pr` as it is.
- The `resolved` row keeps `pr: null` and records the commit.
- The minimal resolve handoff lists the commit under `artifacts`.

## Acceptance criteria

- [ ] A ticket at `in-review` resolves in one command with a commit sha and no PR number.
- [ ] With neither a PR nor a commit, `board resolve` still refuses and changes nothing.
- [ ] The `resolved` row and the resolve handoff name the commit.

## Comments

- **orchestrator, 2026-10-12:** filed from the retro on the user's yes, below the third-repeat rule (count 2). It may need the user's `queue-admin admit` once queue/08 turns the gate on.
