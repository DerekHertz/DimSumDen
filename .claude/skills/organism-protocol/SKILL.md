---
name: organism-protocol
description: The shared rules every Agent Office cell follows. Covers claiming tickets on the file board, brain gates, handoffs, apoptosis, and token hygiene. Preloaded into every cell type; read it before touching the board.
---

You are a **cell** in the Agent Office organism. Terms are defined in `CONTEXT.md`. Your genome (your `.claude/agents/<cell-type>.md` file) sets your organ, tools, skills, gates, and done criteria. Stay inside it.

Your first message states your cell type and ticket, e.g. `[cell: developer | ticket: ci-cd/02]`, so telemetry can attribute the session.

Run cells on their genome's model: the orchestrator on Opus at low effort (it makes the most sizing and sequencing decisions), the designer and debugger on Opus, everything else on Sonnet or cheaper. Until `05`, a dispatch through a generic agent type passes the genome's model and effort explicitly.

Your final report to the orchestrator stays under about 300 words: the verdict, the branch, the numbers, and a pointer to the handoff for details. Claim only results you actually ran. Send verbose work (full test runs, log reading, merge checks) through `scout`, or after `04` a local model.

## The board

- The board is the local issue tracker described in `docs/agents/issue-tracker.md`: `.scratch/<feature-slug>/` in the **main checkout**.
- If you run in a worktree, the main checkout is at `$ORGANISM_ROOT`. If that is unset, it is the path `git worktree list` prints first. Always read and write the board there, never in your worktree's copy.
- Scope added in a ticket's `## Comments` (for example "Scope added (user, ...)") counts as acceptance criteria, just like the checkboxes. qa maps every scope item to a test, and the developer covers each one.
- A ticket is ready when its `Status:` is `ready-for-agent` and every ticket in `Blocked by:` is `resolved`.

## Claiming a ticket (exactly one cell per ticket)

1. Claim with `npm run board -- claim <feature>/<NN-slug> <cell-type>`. It creates the lock atomically, sets `Status: claimed`, and fails if another cell holds the ticket.
2. If the claim fails, the ticket is taken: pick another or hand off. Never delete another cell's lock.
3. Add comments with `npm run board -- comment <feature>/<NN-slug> "<text>"`, never by editing the ticket. With a lock held, the author is your lock's cell. With no lock, pass `--as <cell-type>`; with a lock, `--as` must match your cell.
   - Take over a dead holder's lock with `board reclaim <ref> <cell-type> --reason "..."`, never as `orchestrator`. Free a lock without changing status with `board release <ref> --keep-status`.
4. On finish, `npm run board -- release <feature>/<NN-slug> --status <resolved|blocked|in-review> [--reason "..."]`. On a code ticket, cells in the review relay (`qa`, `developer`, `security`) never set `resolved`: a developer releases at `in-review`, and `qa` and `security` leave the status as it is and write their verdict with `board comment`.

## Brain gates (stop and ask the user)

Always ask before:
- merging to `main`, pushing, or opening a PR
- deleting files outside your ticket's scope
- adding a dependency
- changing an ADR, `CONTEXT.md` or `CLAUDE.md`
- changing anything under `.claude/` (genomes, skills, settings). Only the orchestrator edits it, and only with the user's permission. Other cells propose the change in their handoff.
- anything your genome lists under `gates`

State the action, why, and what changes. Wait for an explicit yes.

## Environment issues (report, don't work around)

When the environment gets in your way, don't patch or improvise past it. Examples: a missing or failing tool, a dev server that hangs or serves the wrong MIME type, Blender not open, a port in use, or a permission denial. End your report with an `Environment issues` section: what failed, the exact error, and the fix you suggest. The user fixes these in the main session. If one stops your task, say so and stop.

**Log every failed call and blocker, even ones you got past on a retry.** That includes permission or classifier refusals, "no verdict" errors, worktree-guard rejections, commands that exit non-zero or fail to parse, timeouts, and workarounds. Your final report ends with a `Failed calls` list, one line each: the tool, the command (short), the exact error, what you did instead, and your guess whether it's a genuine guardrail or fixable friction. Never write "refusals: none" if anything failed. The orchestrator appends each one to `.scratch/usage.jsonl` as `kind:"incident"`, so they can be analyzed.

One sanctioned exception: `board` doesn't write handoff files yet, so a worktree cell writes its handoff (`.scratch/<feature>/handoffs/*.md`) to the main checkout through shell commands. Write it to the main checkout only; never leave a copy in your worktree. Every other board change goes through `board`. A future `board handoff` command closes this gap.

## Shell and git

- Write prose (handoffs, comments, markdown) with the Write tool or node `fs.writeFileSync`, never a shell heredoc. Copy files with `fs.copyFileSync`.
- Prefer `fs.rmSync` / `fs.copyFileSync` over `rm` / `cp` for files outside your worktree, and `git checkout -- <path>` to revert.
- `npm test` rejects BOMs in `.md`/`.json`; write files with node or the Write tool.
- Read ticket status with `board status <ref>`, never by grepping the markdown. Keep `board comment` text short; put detail in the handoff.
- Never `git commit -a` in the main checkout; stage explicit paths. Give every `git push` a timeout.
- In a worktree, use plain single commands: no `cd <main> && git …`, and no git in pipes. The isolation guard rejects them.
- Run `npm ci` first in a fresh worktree.

## Timeouts (never wait out a hang)

Give every long-running command an explicit timeout: test runs, dev servers, browser automation, installs, and CI waits (`gh run watch`, `gh pr checks --watch`). Pick a bound that fits the work. For example, a few minutes for a test suite, and about 15 minutes for a CI run. When a timeout fires, stop. Don't retry, and don't keep waiting. Report it under `Environment issues` with the command, the timeout you used, and the last output you saw.

## Apoptosis (ending well)

A cell does one ticket or one task, then ends. When your genome's `done` criteria are met, or you are blocked, or your context is getting long:
1. Commit your work to your branch (dev cells only). Stop any dev servers or background processes you started, and leave no lingering locks or `git stash` entries (use a WIP commit instead of stashing). See `docs/agents/process-hygiene.md`.
2. Run /handoff.
3. Release with `board release` (above).
4. End your final report with a worktree receipt: your worktree path and whether it is clean or dirty, naming each dirty file. This fills the Receipt's `worktree: {path, clean}` field (organism-infra/17).
5. Stop. Don't start a second ticket in the same session.

## Token hygiene (Pro plan)

- Read only what the ticket needs. Use Grep/Glob before Read, and read line ranges of large files.
- Delegate verbose work (full test runs, log digging, broad searches, doc fetching) to the `scout` subagent; it returns a summary.
- Don't paste diffs or files into prompts. Pass paths and commands instead.
- Prefer CLI tools (`git`, `gh`, `npm`) over MCP tools.
- Never poll or loop while waiting. End your turn instead.
