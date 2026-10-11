# skill-sources: what the den takes from six outside agent and skill repos

Status: draft for a grill (not approved). Source: reviews on 2026-10-11 of six repos (table under Vendoring) and two research reports, one on agency-agents' business and product agents, one on the other four repos. Depends on: ADR 0021 (role ceilings, the wall) and agent-os/02 (grants). ADR 0021 is on `docs/agent-os` and not yet on `main`.

## Problem Statement

The den can build what I specify, but nothing in it helps me decide what to build. Product grills me on an idea I already have. Nobody looks for ideas, checks whether a trend is real, or tests an idea before the developers spend a day on it. When I ask a model for market research it hands me confident claims with links that often do not say what it claims, and it tends to agree with my idea.

Meanwhile several public repos hold hundreds of agents and skills, some of them good. Most are persona prompts or prose rules an agent may or may not follow: no ceiling, no gates, no done condition, and success metrics nobody measures. A few hold things the den lacks: a check that catches an agent lowering the bar, a way to measure whether a skill helps at all, a single-agent harness to benchmark against, lists of paths and commands that must stay human-gated, and a way to draw a mechanism so it explains itself. I want what is good in them, rebuilt to work the way the den works: enforced below the model where it can be, every claim checkable, and me at the gate.

## Solution

Five tracks, all vendored with attribution and rewritten in house style. No upstream persona is imported as-is, and no upstream mechanism that keeps its approval or key where an agent can write is used.

- **Track A, discovery.** A pipeline from signal to spec that runs before product's grill: a new read-only cell type, scout-intel, gathers and grades trend evidence; a separate verifier re-fetches every quote; product gains an assess mode that frames an opportunity and a falsifiable hypothesis with a cheap test; Bao assembles a Gate 0 file that I sign. Only a signed GO reaches grill-me and to-spec.
- **Track B, fold-ins.** Rules go into the cell types and skills we already have, as three shared skills (`scope-check`, `evidence-gate`, `drift-audit`), short rule lists, and mechanics added to vendored skills; plus one new read-only cell type, the archaeologist.
- **Track C, the wall, the bridge and the checks.** Enforcement that sits below the model: a floor guard in risk-check, governance paths and commands denied in ceilings, a forbid-beats-permit rule in the grant compiler, bypass forms in the wall's tests, an append-only bridge log the sandbox cannot write, approvals held by the bridge, a tool-call counter that forces a handoff, and a `--no-verify` hook as defence in depth.
- **Track D, measurement.** A single-agent baseline arm for the harness benchmark, and evals that show whether each vendored skill triggers when it should and helps when it does.
- **Track E, figures.** The anatomy skill as a designer mode that draws the den's own mechanisms as working machines, and a PR card built from bridge data that borrows anatomy's rule that every number shown comes from one model.

## User Stories

Discovery (Track A)

1. As the user, I give the den a seed question or idea in neutral words, and scout-intel returns signals, each with a URL, a verbatim excerpt, publisher, publication date and retrieval date.
2. As the user, I read trend cards, each with at least two independent sources, a signal strength, a confidence level with its reason, a conflicts section, and the strongest evidence against it.
3. As the user, a claim whose quote the verifier cannot find on the page is struck, and I can see the strike.
4. As the user, I see an opportunity written as a job ("When [circumstance], [who] wants to [progress], but [obstacle]"), linked to the trend cards it rests on, with the dominant of Cagan's four risks named, and what not to build yet.
5. As the user, I see a hypothesis ("At least X% of Y will Z"), a cheap test, and a pass or fail line set before the test runs.
6. As the user, I get interview questions that follow the Mom Test for the real conversations I hold myself; agents prepare and synthesise them, never hold them.
7. As the user, I sign GO, NO-GO or PIVOT on a Gate 0 file. A NO-GO is archived with what was learned. Nothing reaches grill-me without my signature.
8. As the user, the signed hypothesis becomes the spec's success criterion, so qa can test or measure it.
9. As the user, I see each discovery run's verified-quote rate and struck-claim rate in its run record.
10. As the user, scout-intel cannot write outside its discovery folder, post, log in, or hold a credential, and the bridge enforces that, not its prompt.

Fold-ins (Track B)

11. As the user, a developer's handoff lists the follow-ups it noticed and did not do.
12. As the user, qa's full verify treats a perfect report from an earlier cell as a reason to look harder, and checks each claim in a handoff against the diff and the test output.
13. As the user, at a pass gate, a reviewer with a fresh context that sees only the artifact and the acceptance criteria tries to disprove the cell's claim of done.
14. As the user, review findings carry a severity label, and two reviewers' findings on the same line are merged into one.
15. As the user, grill-me states its current guess with a confidence number before each question, and stops when it reaches its stop line.
16. As the user, Bao sorts what reaches me into three tiers: ask now, handle and brief me later, park.
17. As the user, before agents start on a target repo, an archaeologist maps where its code disagrees with itself and with its docs, ranked by risk, and changes nothing.
18. As the user, while I am away, the archaeologist audits the commits since its last run and files findings as tickets for triage, never as ready work.
19. As the user, after a target project runs, herald can audit time from a clean clone to a running app, and whether Claude, ChatGPT and Perplexity describe the project correctly.

The wall, the bridge and the checks (Track C)

20. As the user, a diff that adds a suppression, skips or deletes a test, strips an assertion or lowers a threshold fails risk-check and goes to security, whatever the cell's prompt said.
21. As the user, each target project has a CONSTRAINTS.md with its quality bar in numbers, which I sign at the spec gate.
22. As the user, no cell but security can write CI or governance paths, and only under a task grant; no cell can run merge, release or review-posting commands; a forbid in a ceiling always beats a permit in a grant.
23. As the user, a command that hides a second command (a newline, `$(...)`, backticks, `<(...)`) inside an allowed one is refused, and a test shows it.
24. As the user, every privileged call and every refusal is a line in a hash-chained log the agents cannot write, and the den shows the chain head.
25. As the user, my approval in the den is a single-use token the bridge holds for one action, never a file an agent could create.
26. As the user, a cell that passes 60 tool calls is made to hand off and end, and one that passes 40 is told to checkpoint.

Measurement (Track D)

27. As the user, I can run one app spec through the den and through a single agent with the same model, and compare features passing, bar-lowering hits, refusals, my interventions and tokens per passing feature.
28. As the user, a check in CI shows each skill's description is found by the prompts that should find it and does not collide with another skill's.
29. As the user, for a skill I care about, I see its result with and without it on the same cases.

Figures (Track E)

30. As the user, I can ask the designer for a figure of one of the den's mechanisms (the wall, the bridge as kernel, a barrier, grant compilation), drawn as a working machine whose readouts come from a model of the real numbers, and its audits pass before I see it.
31. As the user, each PR has a card in the den drawn only from data the bridge holds: what it touched by station, tests added and removed, floor-guard hits, criteria mapped to tests, the risk-check result.

## Implementation Decisions

### Vendoring

| Repo | Commit | Licence | Local name | What we take |
|---|---|---|---|---|
| msitarzewski/agency-agents | `f99f6aa` (2026-10-08) | MIT | agency-agents | Tracks A and B rules |
| wshobson/agents | `46891e7` (2026-10-04) | MIT | wshobson-agents | Path and command lists, bypass hook, session thresholds, review merge rules, size caps |
| addyosmani/agent-skills | `1be8e34` (2026-10-10) | MIT | agent-skills | Floor guard, eval tiers, doubt step, interview mechanics, severity labels |
| anthropics/claude-quickstarts | `9ec32b9` (2026-10-07) | MIT | claude-quickstarts | autonomous-coding as the baseline arm; security.py's tests as a model |
| anthropics/knowledge-work-plugins | `02ffa99` (2026-10-11) | Apache-2.0 | knowledge-work-plugins | write-spec's sections; design skills already in use |
| wheresryan22/anatomy | `dbf697a` (2026-10-10) | MIT | anatomy | The skill, kit and audit scripts for Track E |

- Clone each at its commit into `vendor/<local name>/` (git-ignored), as with mattpocock's skills. Copy each MIT licence to `.claude/skills/<LOCAL-NAME>-LICENSE`.
- Apache-2.0 (knowledge-work-plugins): copy the licence, keep upstream notices, and put a change note at the top of any vendored file that we modify. There is no NOTICE file in that repo at `02ffa99` (checked with `git ls-files`). Using the plugin installed, not vendored, triggers none of this.
- VENDORED.md gets one table for all outside sources: `| local path | upstream repo | upstream path | commit | licence | mode (verbatim / adapted / pattern-only) | changes | date |`. Pattern-only borrowings are rewritten in our words and credited anyway.
- Every derived genome or skill names its upstream files and commit in a source line.
- Rewrite rules: drop identity, memory, emoji, "vibe" and success metrics. Keep only rules an artifact can show were followed. Templates become output schemas with required fields. Delete any ability the wall cannot grant.
- Size caps (from wshobson's ARCHITECTURE.md): CLAUDE.md and genome bodies at about 150 lines; skill bodies at 8 KB, with the rest in `references/`. Anatomy's SKILL.md is 31 KB; it loads only in its designer mode.
- Not yet read in full: agency-agents research-synthesist, sales-discovery-coach, project-management-experiment-tracker, marketing-x-twitter-intelligence-analyst, marketing-agentic-search-optimizer; wshobson before-you-build and the plugins in the skip list; addyosmani test-driven-development, code-review-and-quality, context-engineering, idea-refine and `evals/skill-impact.md`; knowledge-work-plugins apart from write-spec. Read each before it is vendored.

### Track A: discovery pipeline

| Stage | Who | Writes | Model |
|---|---|---|---|
| 1 Signal intake | scout-intel, gather | `signals/<date>-<slug>.md` | haiku |
| 2 Trend card | scout-intel, synthesise | `trends/<slug>.md` | sonnet (opus when sources conflict) |
| 3 Citation check | verifier, fresh context | strikes in the card, a line in the run record | haiku |
| 4 Opportunity | product, assess mode | `opportunity.md` | sonnet |
| 5 Hypothesis and cheap test | product, `pretotype-plan` skill | `hypothesis.md` | sonnet |
| 6 Gate 0 | Bao assembles, the user signs | `gate-0.md` | opus (Bao) |
| 7 Grill, spec, tickets | product and Bao, as today | `spec.md`, tickets | as today |

- **scout-intel.** New cell type. Sources: agency-agents product-trend-researcher (signal strength weak/moderate/strong, the triangulation step, "why now") and research-synthesist (source evaluation, citation tracing). Ceiling: web read, read the project, write only under its discovery folder, no shell, no Edit outside the folder, no forms, logins or posting. Dropped: the upstream forecasting claims ("80%+ accuracy for 6-month forecasts", ±20% sizing), paid tools, "15+ sources" (count is not the goal; independence is).
- **Signal schema.** claim, url, excerpt (verbatim, at most 50 words), publisher, published, retrieved, source type (primary data / peer-reviewed / vendor or SEO / community post). No interpretation.
- **Confidence.** High: two or more independent primary sources under 12 months old that agree. Medium: one primary, or several agreeing secondaries. Low: one secondary, vendor marketing, or sources in conflict. Unknown is allowed. Conflicts are stated, never averaged. These thresholds are a starting proposal, tuned from run records.
- **Verifier.** A separate session with no part in writing the card. Re-fetches each URL and checks the excerpt is on the page. A miss strikes the claim and logs it. A card whose remaining sources fall below its confidence level is downgraded.
- **Anti-sycophancy rules** in scout-intel and assess mode: the brief is phrased neutrally; the disconfirming section is written before the supporting one; my wording of the idea never counts as evidence; "users would love this" from any model is zero-weight; desk research yields hypotheses, never validation.
- **product, assess mode.** Sources: agency-agents product-manager (Opportunity Assessment; "lead with the problem"; "write the press release before the PRD"; "all feature ideas are hypotheses") and wshobson before-you-build (risk categories: demand, positioning, retention, trust, distribution, feature adoption; a "what not to build yet" list). Slimmed to: why now, evidence (each item linked to a trend card or a conversation), the four risks with the dominant one named, options, what not to build yet, decision (build / explore / defer / kill) and what would change it. Viability is read for this den as: does the project show governed autonomy and an applied-AI skill a hiring manager would value. A one-paragraph press release comes before the grill.
- **Skills.** `pretotype-plan` (Savoia's XYZ hypothesis, a narrowed xyz, test method, pass line set before the test, skin-in-the-game type), from experiment-tracker. `question-design` (Mom Test rules: their life not my idea, past specifics not future opinions, compliments count for nothing), from sales-discovery-coach.
- **Gate 0.** From agency-agents strategy/playbooks/phase-0-discovery: the GO / NO-GO / PIVOT decision and a checklist. Removed: the TAM gate, stakeholder sponsor, budget approval, and the agent gatekeeper. Checklist: the job statement; trend cards at Medium or better, verified; a disconfirming section; at least one human or market signal (a conversation or a pretotype result), or my written waiver; risks tagged; the press release; my signature and date.

### Track B: rule fold-ins to existing cell types

| Upstream | Into | Rule |
|---|---|---|
| agency-agents engineering-minimal-change-engineer | developer | Scope self-check before commit (`scope-check`). Handoff gains a required "Follow-ups noticed, not done" field. |
| agency-agents testing-reality-checker | qa, full verify | A perfect or zero-issue claim from an earlier cell is a red flag. Each claim in a handoff is checked against the diff and test output (`evidence-gate`). |
| agency-agents specialized-chief-of-staff | orchestrator (Bao) | Three tiers: ask now / handle and brief later / park, mapped to Needs you / janitorial / parked. "Act without being asked" is cut: it conflicts with gates. |
| agency-agents security-ai-generated-code-auditor | security | Untrusted input in a system prompt, combined with tool access, is high severity (a target repo's `.claude/` is that input). Never echo a secret. A fix is proved by a rescan. Findings carry a stable fingerprint. |
| agency-agents engineering-multi-agent-systems-architect | architect | Checklist for agent-system ADRs: least privilege, fallback ladder ending at the user, a shared trace id, no silent context truncation, evals with a recorded baseline. |
| agency-agents agentic-identity-trust | security, for agent-os step 4 | Principles only: an agent's claim of authority is not authority; fail closed; an agent cannot edit the log that audits it. No crypto identity. |
| agency-agents design-ui-finish-gate-reviewer | designer, spec mode | A design contract naming the generic defaults this product forbids; each finding paired with a verification condition. |
| agency-agents specialized-developer-advocate | herald, dx-proof mode | Time from a clean clone to a running app, graded; every code sample runs unmodified; every error has a message, a cause and a fix; never astroturf. |
| agency-agents marketing-ai-citation-strategist | herald, aeo-audit mode | A fixed prompt set asked of Claude, ChatGPT and Perplexity about the project; "never guarantee citation outcomes". One-off, after a target ships. |

### Track B: mechanics added to vendored skills

| Upstream | Into | Mechanic | Why not vendor the whole skill |
|---|---|---|---|
| addyosmani interview-me | grill-me (mattpocock) | State the current guess with a confidence number before each question; attach a best guess to each question; stop at the stop line; any confidence under about 70% carries a reason. | Its description lists "grill me" as a trigger (checked), so both would fight for the same prompt. |
| addyosmani code-review-and-quality | code-review (mattpocock) | Severity labels on every finding: Critical, Required, Nit, Optional, Consider, FYI. | The rest overlaps our code-review and evidence-gate. |
| wshobson agent-teams multi-reviewer-patterns | code-review | Same line, same issue: merge and credit both. Same line, different issues: keep both. Same issue, different lines: keep both, cross-referenced. Used when qa verify and security review one branch. | Its team presets spawn more cells than the two-cell cap allows. |
| knowledge-work-plugins write-spec | to-spec | The spec template gains Non-goals and Success metrics. | It is written for connectors the den does not have. |
| addyosmani doubt-driven-development | `evidence-gate` | At a pass gate or a risk-check hit, Bao spawns one read-only reviewer with a fresh context and only the artifact and the acceptance criteria, told to disprove. Disagreement is information, not a verdict. | It runs on every non-trivial decision (too costly on Pro), escalates to other vendors' CLIs (credentials outside the bridge), and says itself it is not for a persona's `skills:`. |

### Track B: shared skills

Rules that more than one cell uses are written once as a skill and listed in each genome's `skills:`, so the genomes stay short.

| Skill | Source | Loaded by | What it holds |
|---|---|---|---|
| `scope-check` | agency-agents engineering-minimal-change-engineer | developer; qa light verify reads its output | The self-check before commit: each touched file with the reason the ticket needs it; lines tempted but not written; abstractions rejected; diff size. Writes the "Follow-ups noticed, not done" handoff field. |
| `evidence-gate` | agency-agents testing-reality-checker; addyosmani doubt-driven-development (the fresh-context step) | qa full verify, security, designer review mode, Bao at gates | Default verdict is "needs work" until evidence shows otherwise. Each claim in a handoff is matched to a diff hunk, a test name or a recorded output, or marked unverified. A perfect score or "no issues" from an earlier cell means look harder. At gates, the fresh-context disprove step. |
| `drift-audit` | agency-agents specialized-codebase-archaeologist | archaeologist | Group history into eras; compare the same kind of file across eras; find one concept implemented two ways; trace state each event handler reads but did not create; trace what a value represents (units) across call sites; confirm two look-alikes share a purpose before calling them duplicates. Findings go to a drift registry with four views (by finding, era, responsibility, risk); none is deleted, "won't fix" needs a reason. |

### Track B: new cell type, archaeologist

- **Purpose.** Find drift that no single session would notice: half-migrated patterns, two implementations of one responsibility that disagree, docs that no longer match the code, handlers that assume an order nobody guarantees. It never fixes; it files findings.
- **Genome.** Source: agency-agents specialized-codebase-archaeologist. Skills: `organism-protocol`, `drift-audit`. Model: sonnet (finding drift needs judgment; scout can run the greps). Isolation: worktree.
- **Ceiling.** Read the project and its git history; write only its drift registry (`.scratch/drift/registry.md` in the repo it audits) and its handoff. No web, no shell writes, no Edit outside the registry. The simplest ceiling of any cell, so it can run before the four undecided ceilings are settled.
- **Inputs and outputs.** In: a repo path and a scope (whole repo, a directory, or the commits since its last audit). Out: registry updates, one ticket per Critical or Moderate finding (status `needs-triage`, never `ready-for-agent`), handoff.
- **Gates.** Filing a ticket is a proposal; the user or Bao triages it. It never marks a finding Fixed without re-reading both sides of the mismatch.
- **Done.** Every finding in scope has a severity (or "can't tell, and why"), an era and a responsibility; the risk view is current; a handoff is written.
- **Where it runs.** (a) First contact with a target repo, before scout-intel or a developer starts there (agent-os/03). (b) The janitorial queue while the user is away (agent-os step 7), on the commits since the last audit. (c) This repo, which many Claude and Codex sessions have built.

### Track C: the wall, the bridge and the checks

Most of these belong to agent-os tickets that already exist. This spec supplies the content; the grill decides whether each lands as an acceptance criterion on that ticket or as its own ticket.

| Item | Source | Where it lives | Goes with |
|---|---|---|---|
| **Floor guard** | addyosmani constraint-driven-development | `npm run risk-check`, deterministic, below the model. A hit dispatches security. Patterns: new `@ts-ignore`, `eslint-disable`, `# noqa`, `# type: ignore`; `it.skip`, `test.skip`, `pytest.mark.skip`; a deleted test file; an assertion removed from a test; a lowered threshold in a config (`--cov-fail-under`, coverage, budgets); a stub that throws "not implemented". A skip or deletion with a reason in the commit message is listed, not failed. | Its own ticket, before the first target-project ticket |
| **CONSTRAINTS.md** | constraint-driven-development's interview (at most four questions, each with a default) | One per target project, in its repo, signed at the spec gate; the floor guard reads its numbers | agent-os/03 |
| **Governance deny list** | wshobson review-agent-governance `review-policy-author.md` (lists only) | Ceilings data. Deny write: `.github/workflows/`, `.github/CODEOWNERS`, `.gitlab-ci.yml`, `Jenkinsfile`, and our guardrail paths. Deny run: `gh pr review`, `gh pr merge`, `gh issue close`, `gh release create`, push to a protected branch. Security may write CI paths only under a task grant; merge and PR stay bridge calls. | agent-os/02 |
| **Forbid beats permit** | the same file's deny-overrides rule | The grant compiler: a deny in a ceiling is never lifted by a grant. A test tries each grant shape against each deny. | agent-os/02 |
| **Bypass forms in the wall's tests** | anthropics/claude-quickstarts `autonomous-coding/security.py` and `test_security.py` (its allowlist misses these, per its open PR #496) | A table-driven test of the compiled rules with must-refuse cases: a newline between commands, `$(...)`, backticks, `<(...)`, `git -c core.hooksPath=/dev/null`. The wall (sandbox and systemd) is the boundary; this proves the compiled rules do not open a hole above it. | agent-os/02 |
| **Append-only bridge log** | agency-agents agentic-identity-trust (principle); our own design | One JSON line per privileged call and per refusal, each with `prev_sha256`, in a path outside every sandbox's write set. The den shows the chain head; retro records it. | agent-os step 4 |
| **Approvals as bridge tokens** | the flaw in review-agent-governance (below) | A gate click in the den becomes a single-use token in the bridge, scoped to one action (for example "merge PR 12 at sha X"). Nothing is written to a worktree. | agent-os step 4 |
| **Tool-call counter** | wshobson skill-forge-essentials session-guard (thresholds only) | The bridge counts tool calls per cell: past 40 it sends a checkpoint notice; past 60 it requires a handoff and ends the session. Alongside usage-watch's 90%. | agent-os step 5 (bridge relay) |
| **block-no-verify hook** | wshobson block-no-verify | A PreToolUse hook refusing `--no-verify`, `--no-gpg-sign` and similar, with a fixture test; each hit is logged to the bridge. Defence in depth only: it is string matching, and the bridge pushes and CI runs regardless. | Its own small ticket |

Decided against, and why (for the ADR):

- **review-agent-governance's mechanism.** Approval is `touch ./.review-approved` in the project directory, and the signing key is `./review-governance.key` beside it (both checked in its setup skill at `46891e7`). An agent that can write there can approve itself and read the key. It also runs `npx protect-mcp@0.7.4` on every tool call.
- **Cedar policies and Ed25519 receipts** (protect-mcp, signed-audit-trails). A second policy language beside the compiled sandbox settings, and a key that would live on the same machine as the agent it guards against. A hash chain in a path the sandbox cannot write gives the same tamper evidence against our threat. If benchmark logs are ever published, sign each run's chain head with a key only my user can read.
- **managed-agents self-hosted-sandboxes.** An API product, not the CLI on a Pro plan. Its environment worker that executes tool requests is prior art for the bridge as kernel; one line in ADR 0021.

### Track D: measurement

- **Baseline arm.** anthropics/claude-quickstarts `autonomous-coding`: an initializer turns an app spec into a JSON feature list, then a coding agent works feature by feature in fresh sessions, allowed only to flip a feature's `passes` field. Cut the list from 200 features to 20–30 (its documented knob is the initializer prompt). Same app spec, same pinned model and Claude Code version as the den arm. It runs on the Agent SDK; confirm it runs under my Pro login before anything depends on it.
- **Benchmark metrics.** Features passing, from recorded test runs, not self-report; floor-guard hits; bypass attempts refused; privileged-call refusals; my interventions at gates; tokens per passing feature.
- **Passes-only lists.** The baseline's rule that an agent may only flip a status field in a JSON list (Anthropic chose JSON because models overwrite it less than Markdown) applies to our own test lists where a cell tracks criteria.
- **Skill evals**, following addyosmani's tiers:
  - Tier 2, free and in CI: stemmed TF-IDF of each skill description against sample prompts; every skill reaches rank 1 on its own prompts at a 95% floor; two descriptions at 75% similarity or more fail, at 50% warn. Runs across mattpocock's skills, ours and every fold-in.
  - Tier 3, on demand: the same cases run with and without a skill, in a throwaway repo from a fixture, graded from the stream-json trace, model and Claude Code version pinned, at least 10 turns per case. Minimum per skill: three prompts that should trigger it, two that should not, one behavioural case. On Pro, three cases per skill per week, starting with tdd and code-review. addyosmani's TDD case (a test that reproduces a lost cent fails before the source file changes) is a fixture to borrow.
- **wshobson plugin-eval** is a structure lint for genomes and skills, nothing more: its own docs say the LLM layers are not validated against human labels.
- **No SessionStart injection.** addyosmani removed a SessionStart hook that loaded a router skill into every session: about 3.5k tokens per session for no gain.

### Track E: figures

- **What anatomy is.** A Claude Code skill (MIT, `dbf697a`) that takes a one-line idea, writes a small model of the real numbers, invents a physical machine that maps one-to-one onto the idea, and draws it as an isometric SVG figure (optional WebGL effects, a beta 3D mode) whose readouts come from the same model that moves the parts. Its rule: "The object is the explanation." Output is framework-free TypeScript emitting SVG and HTML, React components, or custom elements.
- **Why it fits.** Its checks are mechanical, like ours: `node build.mjs --audit` exits non-zero on any clearance, loose end, fold, stand-in shape or depth-order fault; `scripts/lines.mjs` must print `line ends: 0`; `scripts/capture.mjs` and `drive.mjs` take headless screenshots and contact sheets that catch pops. It also says Claude is better at building figures than judging them, which matches my doing the visual critique. The den is isometric already.
- **designer, figure mode.** Explainer figures of the den's own mechanisms for the README, herald's drafts and my portfolio: the wall, the bridge as kernel, the barrier and its children, grant compilation, the relay. Sized before work starts: Figure (40–80 parts, 30–90 min) by default; Hero (80–150 parts, 2–4 h) only on my approval; Epic and 3D never on Pro. The figure's truth model is written first and cites the ADR or code it models. Done: audit passed, line check at zero, contact sheet taken, my critique.
- **The PR card, not anatomy itself.** Anatomy invents a metaphorical machine and takes 30 minutes or more; a review artifact must be literal and cheap. The PR card is drawn from bridge data only: files touched grouped by station or module, tests added, changed and removed, floor-guard hits, each acceptance criterion with its test, the risk-check and CI results. It borrows anatomy's rule that every number shown comes from one model, and may borrow its iso kit for drawing. Its look waits for a design session.
- **Ceiling.** Figure mode writes only under `docs/figures/` (or the target's equivalent) and runs headless Chrome inside the wall. Anatomy's SKILL.md (31 KB) loads only in this mode.

### Steps

| # | Step | Done when |
|---|---|---|
| 1 | Vendor and read | All six pinned, licences copied, one VENDORED.md table; the not-yet-read files read and their rows filled |
| 2 | Track B fold-ins and skills | developer, qa, Bao, security, architect and designer carry their rules; `scope-check` and `evidence-gate` exist and are loaded; grill-me, code-review and to-spec carry their mechanics; each rule has a check (a handoff field, a verify step, a test) |
| 2b | Archaeologist | Genome, `drift-audit` and registry schema exist; a run on a fixture repo with planted drift (a reversed fallback, two disagreeing validators, a stale doc) finds all three; a write outside the registry is refused |
| 3 | Floor guard | risk-check fails on each planted pattern in a fixture diff (JS and Python) and passes a clean diff; a skip with a reason is listed, not failed |
| 4 | Track C on agent-os tickets | Deny list, forbid-beats-permit test and bypass-form tests are acceptance criteria on agent-os/02; bridge log and approval tokens on step 4; counter on step 5 |
| 5 | block-no-verify hook | The hook refuses each bypass flag in a fixture and logs the hit |
| 6 | Skill evals, Tier 2 | CI runs the trigger and collision check across all skills; failures are fixed in descriptions |
| 7 | Discovery schemas | Signal, trend card, opportunity, hypothesis and gate-0 have schemas and a validator with tests |
| 8 | Verifier | Against a fixture with a planted fabricated excerpt and a dead URL, both are struck and logged |
| 9 | scout-intel | A recorded run on a fixed brief produces valid signals and cards; a write outside its folder is refused by the wall |
| 10 | Assess mode, skills, Gate 0 | One idea goes from brief to a signed gate-0 file |
| 11 | Baseline arm | autonomous-coding runs under my login on a 20–30 feature spec and writes a run record in the benchmark's format |
| 12 | Skill evals, Tier 3 | tdd and code-review have with-and-without results on three cases each |
| 13 | Figure mode | One figure of the wall passes its audits and my critique |
| 14 | First real discovery run | On one target-project idea; verified-quote and struck-claim rates recorded; friction listed as comments |
| 15 | Herald modes, PR card | dx-proof and aeo-audit run once on the first shipped target; the PR card is designed with me, then built |

## Testing Decisions

- The verifier is tested by trying to fool it: a fabricated excerpt, a real URL whose page does not contain the quote, a dead URL, a syndicated copy passed off as an independent source.
- The floor guard is tested with a fixture diff per pattern, in JavaScript and Python, plus a clean diff that must pass.
- The wall and the compiled rules are tested by breaking them: a write outside a cell's folder, a POST to an unlisted host, a shell call from scout-intel, each bypass form, each grant shape against each deny. A test that only checks the settings were passed proves nothing.
- The bridge log is tested by having a sandboxed cell try to write it, and by editing a line and checking the chain breaks.
- Schemas are tested with each required field missing in turn.
- Discovery runs and skill evals use recorded fixtures, so tests do not touch the network; a live run is recorded separately, as den-v1/13 S3 did.
- No test asserts a quality threshold on a live run or a benchmark arm. Rates are recorded, not gated, until there is a baseline.
- Each hook ships with its own shell test (addyosmani runs his in CI).

## Out of Scope

- Importing any upstream persona or team preset as a cell type.
- agency-agents: China-platform, paid media, livestream and short-video agents; growth-hacker and content-creator; MEDDPICC, proposal, outbound and lead-gen sales agents; behavioural nudge; business strategist and pricing analyst.
- wshobson: agent-teams presets, conductor, ship-mate, tdd-workflows, comprehensive-review, startup-business-analyst, protect-mcp, signed-audit-trails, review-agent-governance's mechanism, superself (the bridge log does this), c4-architecture (maybe later for architect).
- addyosmani: spec-driven-development and planning-and-task-breakdown (to-spec and to-tickets cover them), using-agent-skills (a router the CLI already has), interview-me as a separate skill, the sdd-cache and simplify-ignore hooks (open SSRF and data-loss issues upstream), the persona agents, browser-testing and web-performance (maybe later for family-bingo).
- knowledge-work-plugins: marketing, small-business, enterprise-search, bio-research, partner-built.
- claude-quickstarts: computer-use, browser-use, customer-support, financial-data-analyst, managed-agents.
- anatomy: Epic and 3D figures; anatomy figures for PRs.
- Agents holding user interviews or acting as synthetic users; paid data sources, scraping behind logins, social posting, ad accounts; forecasting and market sizing; a sustained AEO programme.
- Den UI for discovery (cards, the Gate 0 sign) and the PR card's look. They wait for a design session.

## Further Notes

Questions for the grill:

- **Sequencing.** The den loop works first, and agent-os/02 is next. Proposed order: Track C items as criteria on agent-os/02 and its successors; the floor guard and hook before the first target-project ticket; Track B and Tier 2 evals as one small ticket after 02; Track A after agent-os/03; Track D's baseline when the benchmark is next; Track E when the README needs it. Agree?
- **Track C ownership.** Does this spec own the floor guard and hook, and only feed the rest into agent-os tickets, or does it own all of Track C?
- **Where discovery lives.** An idea that concerns a target project: its board, `.scratch/discovery/<idea>/`. An idea with no repo yet: this repo's board, or a separate ideas repo?
- **Stations.** scout-intel: Steamers beside scout, or a reserved plot (CONTEXT.md)? Archaeologist: Tea & Pantry beside qa and security, or a reserved plot? Each new cell type needs a genome and a CONTEXT.md entry.
- **Scout or new cell type.** scout-intel as a mode of scout (one ceiling, already haiku) versus its own cell type (the synthesise pass needs a stronger model and a different output).
- **Ceilings.** scout-intel's web hosts: open web read, or a list? ADR 0021 says no host for any agent until a read limit holds.
- **Human signal.** Is a waiver at Gate 0 allowed, and does it show on the card?
- **Herald.** Herald is on demand and writes outside the repo today. Do dx-proof, aeo-audit and figures for posts change that?
- **Archaeologist timing.** Build at step 2b (before agent-os/03, for first contact with `safety-aware-route-planner`), or wait for agent-os step 7? Does its registry live in the audited repo's board or this one?
- **evidence-gate.** One skill for four cells, or different enough in qa and security to stay in each genome? Is the fresh-context reviewer worth its tokens at every pass gate, or only on risk-check hits?
- **Floor guard strictness.** Fail on any new suppression, or allow one with a reason in the commit message, as with skips?
- **Baseline fairness.** Same model for both arms, or each at its own default? Who writes the app spec, and is it frozen before either arm runs?
- **Thresholds.** Accept the starting confidence rules and the 40/60 tool-call lines, or tune them before the first run?
- **Figure mode owner.** Designer (with my critique) or herald? Which mechanism is the first figure?

Evidence notes:

- Checked against the clones at the pinned commits: review-agent-governance's flag file and key path and its `protect-mcp@0.7.4` calls; interview-me's "grill me" trigger; constraint-driven-development's patterns (including `# noqa` and `# type: ignore`); security.py's allowlist and its extra-validation set; addyosmani's eval tiers; session-guard's 40 and 60 lines; no NOTICE in knowledge-work-plugins; anatomy's audit, line-check and capture scripts.
- From the research reports, not re-checked here: the PR #496 bypass forms; addyosmani's 3.5k-token figure and the hook issues; Anthropic's note on JSON feature lists ("Effective harnesses for long-running agents", 2025-11-26); a May 2026 benchmark of deep-research models with link validity above 94% but factual accuracy of 39–77% (arXiv:2605.06635); Teresa Torres on about 30% of quotes in a ChatGPT interview summary being wrong or absent; Nielsen Norman Group on synthetic users being useful for hypotheses, not decisions.
