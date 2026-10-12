# 08: The closed-den janitorial slot runs the retro

**Type:** feature

**Priority:** P3

**Class:** product

**Blocked by:** None

**Status:** needs-triage

**Serves:** ADR 0021, janitorial work when the den is closed (its list names "board audit and triage drafts" and "retro").

## What to build

When the den is closed, the janitorial slot runs `pipeline-retro` without the orchestrator session asking for it, and leaves its findings for the user to rule on when the den opens.

The retro it runs is the skill as it stands after gated patch `221-retro-review-step` (user, 2026-10-11), which adds:

- **Review of earlier retro tickets (step 1b):** every ticket an earlier retro filed that is not resolved or closed gets an unpark, close-as-duplicate, close or keep recommendation.
- **Steering-file trim:** rules in genomes, skills and `CLAUDE.md` that code now enforces, proposed for deletion.
- **Review-side rules:** judgement rules moved to the reviewing cell's genome.
- **Missing guardrails:** a check proposed for an incident no existing check could catch.

The last three come from comparing `pipeline-retro` with the aihero.dev retro skill (https://www.aihero.dev/skills-retro; only the page and a summary of the skill were read, not its full text).

## Open before this is ready

- Which ticket builds the janitorial slot. None is filed yet as far as the orchestrator checked on 2026-10-11; this ticket is blocked by it once it exists.
- The retro ends with a question to the user. A closed den has no user, so decide where the findings wait (a draft on the board, a gate request) and what the slot may do unasked. ADR 0021 lets Bao merge a janitorial PR only when the diff touches docs and test files alone.
- Whether unparking or closing a ticket counts as a triage draft or needs the user's yes each time.

## Acceptance criteria

- [ ] To be written at triage, once the three points above are settled.

## Comments

- 2026-10-11, orchestrator: filed on the user's answer "Retro now, janitor later". The skill change is the gated patch; this ticket is the janitor half.
