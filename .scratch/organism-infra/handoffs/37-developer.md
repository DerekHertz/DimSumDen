# Handoff: 37 trim genome tools (developer)

```json
{
  "ticket": "organism-infra/37-trim-genome-tools",
  "cell": "developer",
  "current_step": "proposals written and pushed on organism-infra/37-trim-genomes (14a9074); in-review",
  "artifacts": [
    "docs/agents/proposed/.claude/agents/{architect,designer,developer,orchestrator,product,qa,security}.md",
    "docs/agents/proposed/.claude/skills/organism-protocol/SKILL.md",
    "docs/agents/proposed/.claude/skills/diagnosing-bugs/SKILL.md",
    "docs/agents/proposed/CLAUDE.md",
    "docs/agents/proposed/DELETE.txt",
    "scripts/genome-trim.test.mjs",
    "CONTEXT.md and design-brief.md (edited directly)"
  ],
  "decisions": [
    "Agent narrowed: architect, developer, product, qa -> Agent(scout); orchestrator -> Agent(architect, product, designer, developer, qa, security, scout); designer and security drop Agent (prose dispatches nothing).",
    "product drops WebFetch/WebSearch (prose sends lookups to scout); architect drops AskUserQuestion (never asked in prose).",
    "Kept: developer Blender tools (step 0 and asset tickets, incl. execute_blender_code/search_api_docs for export work); designer Blender read/screenshot tools and Browser tools (critique, review); designer Bash/Edit; security Edit/Bash (CI, npm audit, gitleaks); scout WebFetch/WebSearch (doc lookups).",
    "debugger retired: genome in DELETE.txt; developer routing replaced by 'diagnose with diagnosing-bugs skill'; refs removed in CLAUDE.md, CONTEXT.md, design-brief.md, organism-protocol, diagnosing-bugs wording. ADRs untouched.",
    "code-review skill NOT proposed for deletion: /implement and tdd invoke it. grill-me, grill-with-docs, wayfinder, writing-for-agents listed in DELETE.txt as pending user confirmation they are not used as /commands.",
    "scout/debugger intro dedupe is moot once debugger is gone."
  ],
  "failures": [
    "First-turn context before/after was not measured (ticket criterion 2 open).",
    "README.md does not exist, so no roles list to edit."
  ],
  "pending": [
    {"item": "Apply docs/agents/proposed/ into .claude/ and CLAUDE.md, delete debugger.md; scripts/genome-trim.test.mjs is red until then", "owner": "orchestrator"},
    {"item": "Confirm with user that grill-me, grill-with-docs, wayfinder, writing-for-agents are not used as /commands, then delete and update .claude/skills/VENDORED.md", "owner": "orchestrator"},
    {"item": "Measure first-turn context before/after and log in ticket", "owner": "orchestrator"},
    {"item": "Follow-up ticket: debugger still appears as a cell type in code: apps/organism-infra/board-service.mjs:689, scripts/log-cell.mjs:9, apps/ui/src/scene/{roam,banquet-layout}.mjs and their tests, scripts/organ-to-station.test.mjs, docs/agents mentions; ADRs 0010-0013 mention it (left untouched)", "owner": "orchestrator"}
  ]
}
```
