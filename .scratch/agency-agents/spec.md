# agency-agents: discovery roles and rule fold-ins from msitarzewski/agency-agents

Status: draft for a grill (not approved). Source: a review of github.com/msitarzewski/agency-agents (MIT, commit `f99f6aa`, 2026-10-08) on 2026-10-11, and a research report on which of its business, product and marketing agents fit. Depends on: ADR 0021 (role ceilings, the wall) and agent-os/02 (grants). ADR 0021 is on `docs/agent-os` and not yet on `main`.

## Problem Statement

The den can build what I specify, but nothing in it helps me decide what to build. Product grills me on an idea I already have. Nobody looks for ideas, checks whether a trend is real, or tests an idea before the developers spend a day on it. When I ask a model for market research it hands me confident claims with links that often do not say what it claims, and it tends to agree with my idea. agency-agents has ~300 agent files, a few of them about discovery and trends, but they are persona prompts: no tools ceiling, no gates, no done condition, and success metrics nobody measures. I want what is good in them, rebuilt to work the way the den works: every claim sourced and checkable, every idea a hypothesis with a cheap test, and me at the gate.

## Solution

Two tracks, both vendored with attribution and rewritten in house style. No upstream persona is imported as-is.

- **Track A, discovery.** A pipeline from signal to spec that runs before product's grill: a new read-only role, scout-intel, gathers and grades trend evidence; a separate verifier re-fetches every quote; product gains an assess mode that frames an opportunity and a falsifiable hypothesis with a cheap test; Bao assembles a Gate 0 file that I sign. Only a signed GO reaches grill-me and to-spec.
- **Track B, fold-ins.** Rules from engineering, testing and specialist agents go into the cell types we already have, as three shared skills (`scope-check`, `evidence-gate`, `drift-audit`) or short rule lists, plus one new read-only cell type, the archaeologist.

## User Stories

1. As the user, I give the den a seed question or idea in neutral words, and scout-intel returns signals, each with a URL, a verbatim excerpt, publisher, publication date and retrieval date.
2. As the user, I read trend cards, each with at least two independent sources, a signal strength, a confidence level with its reason, a conflicts section, and the strongest evidence against it.
3. As the user, a claim whose quote the verifier cannot find on the page is struck, and I can see the strike.
4. As the user, I see an opportunity written as a job ("When [circumstance], [who] wants to [progress], but [obstacle]"), linked to the trend cards it rests on, with the dominant of Cagan's four risks named.
5. As the user, I see a hypothesis ("At least X% of Y will Z"), a cheap test, and a pass or fail line set before the test runs.
6. As the user, I get interview questions that follow the Mom Test for the real conversations I hold myself; agents prepare and synthesise them, never hold them.
7. As the user, I sign GO, NO-GO or PIVOT on a Gate 0 file. A NO-GO is archived with what was learned. Nothing reaches grill-me without my signature.
8. As the user, the signed hypothesis becomes the spec's success criterion, so qa can test or measure it.
9. As the user, I see each discovery run's verified-quote rate and struck-claim rate in its run record.
10. As the user, scout-intel cannot write outside its discovery folder, post, log in, or hold a credential, and the bridge enforces that, not its prompt.
11. As the user, a developer's handoff lists the follow-ups it noticed and did not do.
12. As the user, qa's full verify treats a perfect report from an earlier cell as a reason to look harder, and checks each claim in a handoff against the diff and the test output.
13. As the user, Bao sorts what reaches me into three tiers: ask now, handle and brief me later, park.
14. As the user, before agents start on a target repo, an archaeologist maps where its code disagrees with itself and with its docs, ranked by risk, and changes nothing.
15. As the user, while I am away, the archaeologist audits the commits since its last run and files findings as tickets for triage, never as ready work.
16. As the user, after a target project runs, herald can audit time from a clean clone to a running app, and whether Claude, ChatGPT and Perplexity describe the project correctly.

## Implementation Decisions

### Vendoring

- Clone upstream at `f99f6aa` into `vendor/agency-agents/` (git-ignored), as with mattpocock's skills. Copy upstream `LICENSE` to `.claude/skills/AGENCY-AGENTS-LICENSE`. Add an agency-agents table to `.claude/skills/VENDORED.md`: file, status (adapted / rules-only / new), local changes.
- Every derived role or skill names its upstream files and commit in a source line.
- Rewrite rules: drop identity, memory, emoji, "vibe" and success metrics. Keep only rules an artifact can show were followed. Templates become output schemas with required fields. Delete any ability the wall cannot grant (paid data tools, real-time monitoring, "machine learning").
- Five upstream files were judged from their README line only: research-synthesist, sales-discovery-coach, project-management-experiment-tracker, marketing-x-twitter-intelligence-analyst, marketing-agentic-search-optimizer. Read each in full before it is vendored.

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

- **scout-intel.** New role. Sources: product/product-trend-researcher (signal strength weak/moderate/strong, the triangulation step, "why now") and research/research-synthesist (source evaluation, citation tracing). Ceiling: web read, read the project, write only under its discovery folder, no shell, no Edit outside the folder, no forms, logins or posting. Dropped: the upstream forecasting claims ("80%+ accuracy for 6-month forecasts", ±20% sizing), paid tools, "15+ sources" (count is not the goal; independence is).
- **Signal schema.** claim, url, excerpt (verbatim, at most 50 words), publisher, published, retrieved, source type (primary data / peer-reviewed / vendor or SEO / community post). No interpretation.
- **Confidence.** High: two or more independent primary sources under 12 months old that agree. Medium: one primary, or several agreeing secondaries. Low: one secondary, vendor marketing, or sources in conflict. Unknown is allowed. Conflicts are stated, never averaged. These thresholds are a starting proposal, tuned from run records.
- **Verifier.** A separate session with no part in writing the card. Re-fetches each URL and checks the excerpt is on the page. A miss strikes the claim and logs it. A card whose remaining sources fall below its confidence level is downgraded.
- **Anti-sycophancy rules** in scout-intel and assess mode: the brief is phrased neutrally; the disconfirming section is written before the supporting one; my wording of the idea never counts as evidence; "users would love this" from any model is zero-weight; desk research yields hypotheses, never validation.
- **product, assess mode.** Source: product/product-manager (Opportunity Assessment; "lead with the problem"; "write the press release before the PRD"; "all feature ideas are hypotheses"). Slimmed to: why now, evidence (each item linked to a trend card or a conversation), the four risks with the dominant one named, options, decision (build / explore / defer / kill) and what would change it. Viability is read for this den as: does the project show governed autonomy and an applied-AI skill a hiring manager would value. A one-paragraph press release comes before the grill.
- **Skills.** `pretotype-plan` (Savoia's XYZ hypothesis, a narrowed xyz, test method, pass line set before the test, skin-in-the-game type), from experiment-tracker. `question-design` (Mom Test rules: their life not my idea, past specifics not future opinions, compliments count for nothing), from sales-discovery-coach.
- **Gate 0.** From strategy/playbooks/phase-0-discovery: the GO / NO-GO / PIVOT decision and a checklist. Removed: the TAM gate, stakeholder sponsor, budget approval, and the agent gatekeeper. Checklist: the job statement; trend cards at Medium or better, verified; a disconfirming section; at least one human or market signal (a conversation or a pretotype result), or my written waiver; risks tagged; the press release; my signature and date.

### Track B: fold-ins to existing roles

| Upstream | Into | Rule |
|---|---|---|
| engineering-minimal-change-engineer | developer | Scope self-check before commit. Handoff gains a required "Follow-ups noticed, not done" field. |
| testing-reality-checker | qa, full verify | A perfect or zero-issue claim from an earlier cell is a red flag. Each claim in a handoff is checked against the diff and test output. Laravel and screenshot script dropped. |
| specialized-chief-of-staff | orchestrator (Bao) | Three tiers: ask now / handle and brief later / park, mapped to Needs you / janitorial / parked. "Act without being asked" is cut: it conflicts with gates. |
| security-ai-generated-code-auditor | security | Untrusted input in a system prompt, combined with tool access, is high severity (a target repo's `.claude/` is that input). Never echo a secret. A fix is proved by a rescan. Findings carry a stable fingerprint. Supabase and Next.js parts dropped unless a target uses them. |
| engineering-multi-agent-systems-architect | architect | Checklist for agent-system ADRs: least privilege, fallback ladder ending at the user, a shared trace id, no silent context truncation, evals with a recorded baseline. |
| agentic-identity-trust | security, for agent-os step 4 | Principles only: an agent's claim of authority is not authority; fail closed; an agent cannot edit the log that audits it. No crypto identity. |
| design-ui-finish-gate-reviewer | designer, spec mode | A design contract naming the generic defaults this product forbids; each finding paired with a verification condition. |
| specialized-developer-advocate | herald, dx-proof mode | Time from a clean clone to a running app, graded; every code sample runs unmodified; every error has a message, a cause and a fix; never astroturf. Invented NPS targets dropped. |
| marketing-ai-citation-strategist | herald, aeo-audit mode | A fixed prompt set asked of Claude, ChatGPT and Perplexity about the project; "never guarantee citation outcomes". Impact percentages dropped. One-off, after a target ships. |

### Track B: shared skills

Rules that more than one cell uses are written once as a skill and listed in each genome's `skills:`, so the genomes stay short.

| Skill | Source | Loaded by | What it holds |
|---|---|---|---|
| `scope-check` | engineering-minimal-change-engineer | developer; qa light verify reads its output | The self-check before commit: each touched file with the reason the ticket needs it; lines tempted but not written; abstractions rejected; diff size. Writes the "Follow-ups noticed, not done" handoff field. |
| `evidence-gate` | testing-reality-checker (testing-evidence-collector read from its README line only) | qa full verify, security, designer review mode, Bao before merge | Default verdict is "needs work" until evidence shows otherwise. Each claim in a handoff is matched to a diff hunk, a test name or a recorded output, or marked unverified. A perfect score or "no issues" from an earlier cell means look harder. |
| `drift-audit` | specialized-codebase-archaeologist | archaeologist | Group history into eras; compare the same kind of file across eras; find one concept implemented two ways; trace state each event handler reads but did not create; trace what a value represents (units) across call sites; confirm two look-alikes share a purpose before calling them duplicates. Findings go to a drift registry with four views (by finding, era, responsibility, risk); none is deleted, "won't fix" needs a reason. |

### Track B: new cell type, archaeologist

- **Purpose.** Find drift that no single session would notice: half-migrated patterns, two implementations of one responsibility that disagree, docs that no longer match the code, handlers that assume an order nobody guarantees. It never fixes; it files findings.
- **Genome.** Source: specialized/specialized-codebase-archaeologist. Skills: `organism-protocol`, `drift-audit`. Model: sonnet (finding drift needs judgment; scout can run the greps). Isolation: worktree.
- **Ceiling.** Read the project and its git history; write only its drift registry (`.scratch/drift/registry.md` in the repo it audits) and its handoff. No web, no shell writes, no Edit outside the registry. The simplest ceiling of any cell, so it can run before the four undecided ceilings are settled.
- **Inputs and outputs.** In: a repo path and a scope (whole repo, a directory, or the commits since its last audit). Out: registry updates, one ticket per Critical or Moderate finding (status `needs-triage`, never `ready-for-agent`), handoff.
- **Gates.** Filing a ticket is a proposal; the user or Bao triages it. It never marks a finding Fixed without re-reading both sides of the mismatch.
- **Done.** Every finding in scope has a severity (or "can't tell, and why"), an era and a responsibility; the risk view is current; a handoff is written.
- **Where it runs.** (a) First contact with a target repo, before scout-intel or a developer starts there (agent-os/03). (b) The janitorial queue while the user is away (agent-os step 7), on the commits since the last audit. (c) This repo, which many Claude and Codex sessions have built.
- **Den.** It needs a station and a resident panda; see Further Notes.

### Steps

| # | Step | Done when |
|---|---|---|
| 1 | Vendor and read | Upstream pinned, licence copied, VENDORED.md table written; the five unread files read and their rows filled |
| 2 | Track B rule fold-ins and skills | developer, qa, Bao, security, architect and designer carry their rules; `scope-check` and `evidence-gate` exist and are loaded; each rule has a check (a handoff field, a verify step, a test) |
| 2b | Archaeologist | Genome, `drift-audit` and registry schema exist; a run on a fixture repo with planted drift (a reversed fallback, two disagreeing validators, a stale doc) finds all three; a write outside the registry is refused |
| 3 | Discovery schemas | Signal, trend card, opportunity, hypothesis and gate-0 have schemas and a validator with tests |
| 4 | Verifier | Against a fixture with a planted fabricated excerpt and a dead URL, both are struck and logged |
| 5 | scout-intel | A recorded run on a fixed brief produces valid signals and cards; a write outside its folder is refused by the wall |
| 6 | Assess mode, skills, Gate 0 | One idea goes from brief to a signed gate-0 file |
| 7 | First real run | Discovery on one target-project idea; verified-quote and struck-claim rates recorded; friction listed as comments |
| 8 | Herald modes | dx-proof and aeo-audit run once on the first shipped target |

## Testing Decisions

- The verifier is tested by trying to fool it: a fabricated excerpt, a real URL whose page does not contain the quote, a dead URL, a syndicated copy passed off as an independent source.
- Schemas are tested with each required field missing in turn.
- scout-intel's ceiling is tested by breaking it (a write outside its folder, a POST, a shell call), against the wall from agent-os/02. A test that only checks the settings were passed proves nothing.
- Discovery runs use recorded fixtures of fetched pages, so tests do not touch the network; a live run is recorded separately, as den-v1/13 S3 did.
- No test asserts a quality threshold on a live run. Rates are recorded, not gated, until there is a baseline.

## Out of Scope

- Importing any upstream persona as an agent.
- China-platform, paid media, livestream and short-video agents; growth-hacker and content-creator; MEDDPICC, proposal, outbound and lead-gen sales agents; behavioural nudge; business strategist and pricing analyst.
- Agents holding user interviews or acting as synthetic users.
- Paid data sources, scraping behind logins, social posting, ad accounts.
- Forecasting and market sizing.
- A sustained AEO programme.
- Den UI for discovery (cards, the Gate 0 sign). It waits for a design session.

## Further Notes

Questions for the grill:

- **Sequencing.** I decided the den loop works first, and agent-os/02 is next. Does Track B go in one small ticket after 02, and Track A after agent-os/03 (target project)? scout-intel needs a ceiling and the wall to mean anything.
- **Where discovery lives.** An idea that concerns a target project: its board, `.scratch/discovery/<idea>/`. An idea with no repo yet: this repo's board? Or a separate ideas repo?
- **Station.** scout-intel's station: Steamers beside scout, or a new station on a reserved plot (CONTEXT.md). Each new cell type also needs a genome and a CONTEXT.md entry.
- **Scout or new role.** scout-intel as a mode of scout (one ceiling, already haiku) versus its own role (the synthesise pass needs a stronger model and a different output).
- **Ceilings.** scout-intel's web hosts: open web read, or a list? ADR 0021 says no host for any agent until a read limit holds.
- **Human signal.** Is a waiver at Gate 0 allowed, and does it show on the card?
- **Herald.** Herald is on demand and writes outside the repo today. Do dx-proof and aeo-audit change that?
- **Archaeologist.** Build at step 2b (before agent-os/03, for first contact with `safety-aware-route-planner`), or wait for agent-os step 7? Its station: Tea & Pantry beside qa and security, or a reserved plot. Does its registry live in the audited repo's board or this one?
- **Skills versus genome rules.** Is `evidence-gate` one skill for four cells, or is it different enough in qa and security to stay in each genome?
- **Thresholds.** Accept the starting confidence rules, or tune them before the first run?

Evidence behind the guards (from the research report of 2026-10-11, not re-checked here): a May 2026 benchmark of deep-research models found link validity above 94% and relevance above 80% but factual accuracy of 39–77% ("Cited but Not Verified", arXiv:2605.06635), with accuracy falling as tool calls grew; Teresa Torres reports about 30% of quotes in a ChatGPT interview summary were wrong or absent from the source; Nielsen Norman Group found synthetic users useful for hypotheses, not decisions.
