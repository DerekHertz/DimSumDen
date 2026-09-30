---
name: pipeline-retro
description: Find repeated hiccups in the relay (handoff, board, guard, CI failures) and turn each into one fix, preferring code over wording. Orchestrator only. Use at the end of every orchestrator session, after every 3 resolved tickets, or when the user asks what keeps going wrong.
---

Run this in the main orchestrator session. The goal is fewer repeat failures per ticket, not a complete record. Wording has already failed twice this project: a rule that existed in a skill was still broken by most cells. So prefer a code fix whenever one exists.

## 1. Gather (since the last retro)

The last retro is the newest `{"kind":"retro"}` row in `.scratch/usage.jsonl`. With no such row, start from the beginning of the current session.

- The output of `npm run -s board -- audit` (read-only; exit 1 means findings). Each line is one board inconsistency, `<ref> <kind> <detail>`. Count each as an item, and fix the board state it names only with the user's yes.
- `incident` rows in `.scratch/usage.jsonl` since then. Rows with `"source":"cell-report"` come from `log-cell --failures`.
- `failures` in the State block of each handoff published since then (`.scratch/*/handoffs/`), and any "Failed calls" or "Environment issues" lines. Read only the State block and those lines, not the whole handoff. If there are more than 10 handoffs, send the gathering to `scout` and ask for just the list.
- Your own mistakes this session that you haven't logged yet. Log them now as `incident` rows.

## 2. Group

Map each item to one tool from the fixed list in `scripts/log-cell.mjs`: `bash-guard`, `board-claim`, `board-release`, `board-comment`, `board-handoff`, `handoff-state`, `git`, `npm`, `write`, `ci`, `other`. Older rows use free-text tool names, so map those by meaning. Within a tool, group by cause, not wording. For example, "compound command refused" and "heredoc refused" are both `bash-guard`.

## 3. Decide

A cause is a candidate if it happened 2 or more times since the last retro, or if it has a `rule_change` from an earlier retro and happened again, which means that fix failed.

Pick the first fix that applies:

1. **Code:** the board, a script, or a CLI flag can refuse or automate it. Examples: `board release` writing the resolved row, `--verdict` refusing without a lock. File a ticket.
2. **Dispatch template:** the orchestrator's own prompt caused it. Examples: a paraphrased schema, a missing path. Edit the orchestrator genome.
3. **Genome or skill wording:** only when neither 1 nor 2 fits. Put the fix in the one place the cell will read at the moment it acts, and don't duplicate it elsewhere.
4. **Nothing:** a genuine guardrail that did its job, or a one-off. Say so.

A fix that already failed as wording goes to code, or to the user as an open question. It never gets a second wording.

## 4. Report and apply

Show the user one table: cause, tool, count, tickets affected, proposed fix and its kind. Keep it under 15 rows. Ask with AskUserQuestion which fixes to apply.

- Apply approved genome and skill edits on `main` and commit them (`.claude/` edits are user-gated; the yes covers them).
- File approved code fixes as tickets.
- Append one `{"kind":"retro","ts","window_from","items","fixes":[{"cause","tool","kind","ref"}]}` row, where `ref` is the commit or ticket. Don't rewrite old incident rows. The next retro reads `fixes` to check whether each fix held.
