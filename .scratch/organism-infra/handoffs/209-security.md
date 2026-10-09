# 209 security handoff

Verdict: Security pass at e409539. No critical or high findings. Two low notes.

```json
{
  "ticket": "organism-infra/209-v1-progress-bar",
  "cell": "security",
  "current_step": "Security review complete at e409539; verdict pass, comment posted.",
  "artifacts": ["mods/north-star/hooks/register.tsx", "scripts/north-star.mjs", "scripts/statusline.mjs"],
  "decisions": ["Pass: argv-array spawn with no shell, read-only board access, no network, gitleaks clean"],
  "failures": [],
  "pending": []
}
```

## Review

- gitleaks over origin/main..e409539: 4 commits, no leaks. No new dependencies; `npm ci` audit found 0 vulnerabilities.
- `.claude/settings.json`: one `enabledPlugins` line (user's commit 3eab301). `.claude-plugin/marketplace.json` adds a local `./mods/north-star` source. No external source.
- `mods/north-star/hooks/register.tsx`:
  - Command is a fixed argv `['node','scripts/north-star.mjs','--json']`. The mod API runs argv with no shell (claude-code.d.ts, `$.process.run`), so nothing is interpolated.
  - Only `ORGANISM_ROOT` is read via `$.env.get` and passed as `env`, which the API merges over the host env. It is a path, never executed, and only used to locate `.scratch/`.
  - Default 30 s timeout applies. A rejection, non-zero exit or truncated stdout falls into the catch, so the last reading is kept.
  - The script path is relative to the session cwd, so it runs the repo's own script (same trust as the repo). In a subdirectory it fails and the band is blank (functional, not security).
  - Rendering: `renderBand` interpolates `done`/`total` and only the digits of `next` (regex capture), so board text cannot inject escape sequences into the UI.
- `scripts/north-star.mjs`: only `readdirSync`/`readFileSync`, no writes, no network, no child process, no eval. Directory names come from `readdir` (no traversal). Regexes are linear. The cycle guard sets depth before recursion. A missing `.scratch` returns empty. Header content is used only for status, priority and Blocked-by lookups into a Map, never for paths.
- `scripts/statusline.mjs`: `v1Segment` calls `readNorthStar` in try/catch and prints numbers only; no network call added.
- Tests: spawn with argv arrays (no shell) in `mkdtemp` temp boards. Nothing touches the real board.

## Low notes (non-blocking)

- `scripts/north-star.mjs:99`: the walk is recursive, so a very deep `Blocked by` chain (thousands) could overflow the stack. The statusline and mod both catch it; the CLI would exit non-zero. Not realistic.
- `mods/north-star/hooks/register.tsx:14`: a `turn.complete` hook awaits the child, up to the 30 s default timeout. Consider `timeoutMs: 5000` so a hung node can't stall the turn.
