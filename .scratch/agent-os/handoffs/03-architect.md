# agent-os/03 architect handoff: design note (ADR 0021 Amendment 3, proposed)

```json
{
  "ticket": "agent-os/03-target-project",
  "cell": "architect",
  "current_step": "Design note done: ADR 0021 Amendment 3 (proposed, not accepted) committed on branch architect/agent-os-03-design. No product code, no tests. Waiting for the user to read it (criterion 1).",
  "artifacts": [
    "branch architect/agent-os-03-design: docs/adr/0021-agent-wall-grants-and-the-bridge-as-kernel.md (Amendment 3, decisions 18 to 21)",
    "throwaway probe (not committed): scratchpad/probe/*.mjs, a target repo with hostile .claude content run under 8 flag variants"
  ],
  "decisions": [
    "18: --setting-sources \"\" + --plugin-dir <control>/.claude + --agent den:<role>; target .claude and CLAUDE.md never load; needs a gated patch adding .claude/.claude-plugin/plugin.json",
    "19: board is <target>/.scratch/, bridge root = target, .scratch/ added to <target>/.git/info/exclude, agent board CLI is node <control>/apps/organism-infra/board.mjs",
    "20: two roots (control, root); start refuses non-git, non-plain, linked-worktree targets; same check on control and HOME",
    "21: host list is apps/bridge/cells/projects.json keyed by slug, a guardrail path"
  ],
  "failures": [],
  "pending": [
    { "item": "User reads Amendment 3 and accepts or changes it (criterion 1)", "owner": "user" },
    { "item": "Rule on the split below, and on whether the target CLAUDE.md should stay unloaded", "owner": "user" },
    { "item": "qa specify: failing tests for criteria 2 and 3 once accepted", "owner": "qa" },
    { "item": "Clone safety-aware-route-planner to a plain path; not on this machine", "owner": "user" }
  ]
}
```

## What the evidence shows

A real-CLI probe (2.1.293, Haiku) in a worktree of a throwaway repo with a hostile `.claude/` showed the bridge's current flags load all of it: the SessionStart hook fires, the target's roles and skills load, a same-named target role replaces ours, and the target `CLAUDE.md` is in context. `--setting-sources ""` removes all of that but leaves no role. `--agents` inline works but carries no skills. `--add-dir` does not load skills and would open write access to this repo. `--plugin-dir <control>/.claude` with a `plugin.json` gives role `den:<role>` and skills `den:<name>` with nothing from the target. That is the chosen mechanism.

## Not proven

- The genomes' `skills:` preload does not resolve under the plugin namespace (tried bare and prefixed). The skill is listed, so the prompt names it.
- The real genomes (`Agent(scout)`, `isolation`, `maxTurns`) were not run as plugin roles. The first developer test must.
- Nothing ran against the real target. It is not on this machine.

## Recommendation: split for the code relay (the user rules)

Three tickets, in order. The adapter is a guardrail path, so B takes the full relay with security.

- **A. Two roots and the start checks.** `--target`, `root` vs `control`, refuse non-git, non-plain, linked-worktree; `.scratch/` exclude; board, ledger and sessions under the target. Criterion 2 (second fixture repo). Files: `server.mjs`, `host.mjs`, `workspace.mjs`.
- **B. Control-plane loading.** Adapter and runtime flags, `den:<role>`, the prompt template, the `plugin.json` gated patch, the throw on an undefined `mainGit` for a worktree. Criterion 3 (target `.claude/` not loaded). Files: `claude-adapter.mjs`, `claude-runtime.mjs`, `host.mjs` `promptFor`. Can follow A or run beside it if A leaves `promptFor` alone.
- **C. Host list file, live run and friction comment.** `projects.json` and its lookup, the recorded scout run on `safety-aware-route-planner`, the friction list. Criteria 4 and 5. Needs the repo cloned, and agent-os/02 for any web use.

Criterion 6 (tests, risk-check, gitleaks) applies to each.

## Questions for the user

1. Accept one rule for all targets, so den tasks on this repo stop loading `.claude/settings.json`?
2. Keep the target `CLAUDE.md` unloaded (readable as data only)?
3. Path of the `safety-aware-route-planner` clone.

## Merged-since state accounted for

agent-os/11: a space in the target path would refuse every spawn; the start check turns that into one clear refusal. Security's low finding (undefined `mainGit`): the runtime should throw when `cwd` is a worktree and `mainGit` is missing, in B. qa's note (`root` and `home` dropped silently): unreachable once start checks `root`, `control` and `$HOME` for plainness.
