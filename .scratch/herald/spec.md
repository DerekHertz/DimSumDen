# Herald: a communication cell that drafts public posts

Status: ready-for-agent
Source: `.scratch/herald/brief.md` (user brief and answers, 2026-09-29)

Two decisions were not settled with the user (AskUserQuestion is unavailable in a subagent). This spec takes the recommended default for each and lists both under Open decisions. The orchestrator confirms them with the user before ticketing.

## Problem Statement

The user is building Dim Sum Den in public-worthy fashion, but nothing turns the organism's real work into something other developers can read. The raw material exists (usage numbers, handoffs, ADRs, the cloud-sessions log, merged PRs, showcase screenshots), yet writing LinkedIn and blog posts from it by hand means re-reading it all each time. The user wants concise, high-level posts about the business need, the problem solved and the efficiency gained, not code walkthroughs, and wants them for Dim Sum Den and for things built with it.

## Solution

A new cell type, **herald**, that on demand reads the organism's own record and writes one short draft post to a file. It never publishes, posts, or contacts anyone. The user reads the draft, edits it, and posts it themselves. A first post series (four posts) is drafted through this cell to prove it.

## User Stories

1. As the user, I want to run herald only when I decide to write a post, so that nothing is drafted or costs tokens unprompted.
2. As the user, I want herald to name the topic and the audience angle in its draft header, so that I can judge fit at a glance.
3. As the user, I want each draft to be 1 to 3 paragraphs, so that it suits LinkedIn and a short blog entry.
4. As the user, I want the tone to focus on business need, the problem fixed and efficiency, so that developers and tech-scene readers see the value without reading code.
5. As the user, I want every number in a draft traced to a source (a usage row, a PR, an ADR), so that I can defend each claim.
6. As the user, I want herald to say when the source material is too thin for a claim, so that it does not invent results.
7. As the user, I want herald never to publish, push, open a PR, or send anything, so that nothing leaves the repo without my yes.
8. As the user, I want the draft saved as a file I can copy out, so that I post it myself on LinkedIn or my blog.
9. As the user, I want a suggested image for each post, so that I know which screenshot to attach.
10. As the user, I want herald to draft about things built with Dim Sum Den as well as Dim Sum Den itself, so that later projects get posts too.
11. As the user, I want a first four-post series (inspiration, iteration, speed-up, lessons), so that I have a coherent opening run.
12. As the user, I want the speed-up post to use measured cost and time from `usage.jsonl`, so that the efficiency claim is real.
13. As the user, I want the lessons post to draw on incidents, retros and the cloud-sessions friction list, so that it is honest about what went wrong.
14. As the user, I want herald to avoid private detail (credentials, my email, internal paths beyond what helps the story), so that a draft is safe to post.
15. As the orchestrator, I want herald to be dispatchable like any other cell with a ticket, a claim and a handoff, so that it fits the relay.
16. As the orchestrator, I want herald's genome edit delivered as a diff, so that I can apply it with the user's permission.
17. As a later reader of the board, I want each draft's handoff to list its sources, so that the draft can be rechecked or refreshed.

## Implementation Decisions

- **Cell type:** `herald`, a communication and PR cell. Station: Front of House, alongside designer, since both shape what the outside world sees. Alternative: a new station; not chosen because a station is a place on Bao and one cell does not justify a new place. The architect may override.
- **Genome:** a new `.claude/agents/herald.md`. This is a `.claude/` edit, so the developer or product cell does not apply it. The ticketing cell writes it as a diff, and the orchestrator applies it only with the user's explicit permission (pass gate in `organism-protocol`). A Front of House membership change may also touch the station table in `design-brief.md`; the architect decides.
- **Model and effort:** Sonnet, medium. Drafting short prose from summarized sources does not need Opus.
- **Tools:** read-only on the repo (Read, Grep, Glob), Write for the draft file, Skill, and Agent to dispatch `scout`. No Bash, no WebFetch, no GitHub write tools. Merged-PR facts come through `scout` (git log or the GitHub MCP read tools). Herald itself holds no tool that can post.
- **Inputs:** `.scratch/usage.jsonl` (per-cell tokens, time, incidents, retros); handoffs under `.scratch/*/handoffs/`; ADRs in `docs/adr/`; `docs/agents/cloud-sessions.md`; merged PRs; the showcase-v1 story and screenshots; the user's brief. Verbose reading (large `usage.jsonl`, many handoffs) goes to `scout`, which returns a summary with source pointers.
- **Output:** one draft file per run, 1 to 3 paragraphs of post text, plus a short header with title, series and number (if any), channel (LinkedIn or blog), suggested image, and a sources list. The header is metadata for the user and is not part of the post text.
- **Draft location (default, unconfirmed):** `.scratch/herald/drafts/<series>-<NN>-<slug>.md`, e.g. `dim-sum-den-01-inspiration.md`. One-off posts use `single-<slug>.md`. The board is already the tracked place for cell output. The user copies the text out.
- **Image sourcing (default, unconfirmed):** herald only references screenshots already in the repo and names one suggested image per post. It never captures. When ci-cd/05's screenshot script exists, its output directory becomes another place herald may reference, with no herald change. If no suitable image exists, the draft says "no image" rather than blocking.
- **Trigger:** on demand only. The user or orchestrator dispatches herald with a topic and, for a series, the series and number. No hook, no post-merge trigger.
- **Never publishes:** publishing, posting, pushing, opening a PR and sending to any channel are outside herald. Its genome lists "handing the draft to the user" as its only exit, and the user's own posting is out of band. Any request to post is refused and returned to the user.
- **Privacy rules the genome states:** no credentials, no email addresses, no personal data; keep internal file paths out of post text unless they help the story.
- **Claims discipline:** each number or factual claim appears in the header's sources list. If a claim has no source, herald cuts it or marks it `[unverified]` for the user.
- **Vocabulary:** posts and drafts use the organism vocabulary from `CONTEXT.md` (cell, station, handoff, pass gate) but explain it in one clause the first time, since readers do not know it.
- **First series (four drafts), each a separate run:**
  1. **Inspiration:** why Dim Sum Den exists. The need to observe and steer several AI agents across the software life cycle without losing control, and the organism and dim sum framing that makes it approachable. Sources: the brief, `CONTEXT.md`, ADR 0002 (relay, not swarm), ADR 0001.
  2. **How we iterated:** from Agent Office to Dim Sum Den, the relay of cells, the showcase-v1 story (mound stele, "floating and small", moved beside the Cubs basket) as a small example of steering by feedback. Sources: showcase-v1 handoffs, ADRs 0012 and 0013, screenshots.
  3. **How it speeds up development:** measured cost and time per step (cloud cost table), the relay of qa, developer and security, mechanical checks, and the cloud session flow. Sources: `usage.jsonl`, `docs/agents/cloud-sessions.md`, ADR 0009.
  4. **What we learned:** friction and fixes (board commits from cells, resuming a finished cell loses its worktree, browser tests in cloud, retro items). Sources: incidents in `usage.jsonl`, retros, the friction list in `cloud-sessions.md`.
- **Glossary (proposed, not yet written; `CONTEXT.md` is a pass gate):**
  - **Herald**: The cell type that drafts public posts about the organism and what it builds. It writes a draft file and never publishes. _Avoid_: Marketer, publisher, PR bot
  - **Draft**: One herald output file, 1 to 3 paragraphs plus a source header, for the user to edit and post. _Avoid_: Post (a post is what the user publishes), article
  - **Post series**: An ordered set of related drafts, such as the first four. _Avoid_: Campaign

  Add these under a new **Communication** heading in `CONTEXT.md` once the user approves.
- **ADR:** none required. The choices are reversible and easy to explain. If the user later allows herald to publish, that would need an ADR.

## Testing Decisions

- **What a good test checks:** external behavior of the genome and outputs, not the wording of prose. Prose quality is judged by the user reading the draft.
- **Genome test (mechanical):** the existing genome checks (front matter parses, `name` matches file, skills exist, station is a known station) pass for `herald`. The tools list contains no Bash, WebFetch, or write-capable GitHub tool, and contains no path to publish. Prior art: whatever validates the other genomes in `.claude/agents/`; the ticketing cell finds it.
- **Draft shape check (mechanical, one seam):** a small check that a draft file has the metadata header, at most 3 paragraphs of post text, a non-empty sources list, and no email addresses or credential-looking strings. One seam: a function that takes a draft file's text and returns violations. Please confirm the user is happy with this seam.
- **Dry run:** the acceptance step for the first series is a real run per post, reviewed by the user. No automated test of writing quality.
- **Never-publishes check:** covered by the tools assertion above plus a review of the genome text.

## Out of Scope

- Posting, scheduling, or any integration with LinkedIn, the user's blog, or any other channel.
- Automatic triggers after merges or on a timer.
- Capturing screenshots or producing images; that is ci-cd/05 and the designer.
- A visual or brand direction for posts (the brief lists `designer` for direction; not needed for text-only drafts).
- Long-form articles, code walkthroughs, or per-PR release notes.
- Editing `CONTEXT.md`, ADRs or `.claude/` by herald itself.
- Analytics on how posts perform.
- Breaking this spec into tickets; the orchestrator runs `to-tickets` next.

## Further Notes

- **Open decisions for the user (defaults taken above):**
  1. Draft location: `.scratch/herald/drafts/` (default) versus a tracked docs folder or outside the repo.
  2. Image sourcing: reference existing screenshots only (default) versus requesting new ones from the designer after ci-cd/05.
- **Suggested ticket shape (for the orchestrator, not a breakdown):** one ticket for the genome diff and its mechanical checks, one for the draft-shape check, and four series drafts as dry runs after the genome is applied. The series drafts are blocked on the genome edit being applied with the user's permission.
- **Terms to add:** see the glossary above; not written to `CONTEXT.md` because that is a pass gate and the user was not reachable in this session.
- Herald's own drafts should not quote the user's private brief text verbatim beyond what the user wrote for public use.
