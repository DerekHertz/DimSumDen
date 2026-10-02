# 07: Meeting rejoin with core members

**Type:** feature

**Priority:** P2

**Blocked by:** 04, 06

**Status:** ready-for-agent

**Design refs:** ADR 0017 decisions 8, 11, 12

## What to build

A closed meeting can be rejoined for 24 hours. The rejoin starts a fresh chair run that reads the meeting files and seats the chair plus core members: by default the participants whose takes back the chosen option, adjustable by the user. A re-asked participant's new take is appended and the old one kept. After 24 hours only the decision and summary remain; reopening then starts a new meeting linked to the old summary.

## Acceptance criteria

- [ ] Core members default to the participants cited as backing the chosen option
- [ ] Adding or dropping a seat changes who is re-asked, and only those
- [ ] A rejoin writes new files and never overwrites an earlier take
- [ ] After compaction a rejoin is refused with a pointer to the summary and a new linked meeting
- [ ] A rejoin counts as one chair run plus re-asked takes in the usage estimate

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
