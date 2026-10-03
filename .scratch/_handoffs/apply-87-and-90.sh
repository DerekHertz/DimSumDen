#!/usr/bin/env bash
# Run from anywhere. Moves your uncommitted 90% edits (saved as local-90-edits.patch) onto new main,
# adds the 87 "Context step" diff, and commits both on a branch in a separate worktree.
set -euo pipefail
MAIN=/home/dhertzell/dimsumden
H=$MAIN/.scratch/_handoffs
WT=/home/dhertzell/dsd-claude-pr
cd "$MAIN"
git diff -- CLAUDE.md .claude/agents/orchestrator.md .claude/skills/organism-protocol/SKILL.md .claude/skills/usage-watch/SKILL.md > "$H/local-90-edits.patch"
git checkout -- CLAUDE.md .claude/agents/orchestrator.md .claude/skills/organism-protocol/SKILL.md .claude/skills/usage-watch/SKILL.md
git pull --ff-only origin main
git worktree add "$WT" -b genome/context-step-and-90pct origin/main
cd "$WT"
git apply --exclude=.claude/agents/orchestrator.md "$H/local-90-edits.patch"
sed -i 's/At 80% or more, wrap up instead of dispatching\./At 90% or more of the 5-hour window, wrap up instead of dispatching./' .claude/agents/orchestrator.md
git apply "$H/87-context-step.patch"
git add CLAUDE.md .claude
git commit -q -m "genomes: wrap up at 90% of the 5-hour window; orchestrator runs dispatch-context before architect, qa specify and developer

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -u origin genome/context-step-and-90pct
git -C "$MAIN" log --oneline -1
echo "done: branch genome/context-step-and-90pct pushed; tell the orchestrator"
