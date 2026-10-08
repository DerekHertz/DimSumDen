# 209 developer handoff

Branch `feat/209-v1-progress-bar`, commit 358d5a1, on top of qa's tests (c219bcb). Not pushed beyond the release push.

## Done

- `scripts/north-star.mjs`: `readNorthStar(root)` returns `{ done, total, remaining, next }`; CLI `--json`. Board files only, no network. Ticket set, done/parked rules and next-ticket ranking (longest path of open dependents, then priority, then lower number) follow qa's pinned interface.
- `scripts/statusline.mjs`: `v1 ██░░░░ 1/4 · 3 to go` segment before the relay/gates segments, omitted when the set is empty, never partial-full unless done.
- `mods/north-star/`: `plugin.json`, `hooks/hooks.json`, `hooks/render.mjs` (pure `renderBand`), `hooks/register.tsx` (shells out to `node scripts/north-star.mjs --json` on session.start and turn.complete, draws an `AbovePrompt` band), `types/index.d.ts`.
- `.claude-plugin/marketplace.json` lists `north-star` beside `sleep-guard`.

## Tests run

All 19 in `north-star.test.mjs`, plus `statusline-north-star.test.mjs`, `mods-north-star.test.mjs` and `statusline.test.mjs` pass. When all of those run in one parallel `node --test` call, statusline.test.mjs AC1 failed once (`5h ?` instead of the usage numbers, 8.7 s run, looks like a cold-spawn timeout of the fake usage script); it passes alone. Not re-run in parallel. I did NOT run the full `npm test`, `claude plugin validate mods/north-star` or `tsc` (context budget, and a Bash call that ran several test files at once was refused by the auto-mode classifier as "Self-Modification").

## Gated edit for the user (`.claude/settings.json`)

In `enabledPlugins`, add the second entry:

```text
  "enabledPlugins": {
    "sleep-guard@dimsumden-mods": true,
    "north-star@dimsumden-mods": true
  }
```

Mods draw only in terminal `claude` in WSL.

## Notes

- `register.tsx` has no automated test and has not been loaded; it uses `$.env.get('ORGANISM_ROOT')` and `$.process.run`. It runs the script relative to the session cwd, so it works in the main checkout or a worktree; a session elsewhere shows no band. verify should run `claude plugin validate mods/north-star`.
- A parked blocker still blocks `next` (only done blockers unblock); parked tickets and their blockers do not join the set. Qa did not pin this.

```json
{
  "ticket": "organism-infra/209-v1-progress-bar",
  "cell": "developer",
  "current_step": "Implemented module, statusline segment, band mod and marketplace entry; targeted tests green; full npm test and plugin validate not run",
  "artifacts": [
    "scripts/north-star.mjs",
    "scripts/statusline.mjs",
    "mods/north-star/",
    ".claude-plugin/marketplace.json"
  ],
  "decisions": [
    "next ranks by longest path of open dependents, then priority, then lower number",
    "A parked blocker still blocks next",
    "Band shells out to the CLI JSON from register.tsx"
  ],
  "failures": [
    "statusline.test.mjs AC1 failed once when run in parallel with other files (5h ?), passes alone"
  ],
  "pending": [
    { "item": "Run npm test and claude plugin validate mods/north-star; user applies the enabledPlugins edit in the handoff and checks the band in terminal claude", "owner": "qa" }
  ]
}
```
