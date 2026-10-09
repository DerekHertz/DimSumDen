# 212 security handoff

Verdict: Security pass (72ff959, diff vs origin/main: 13 files, +706/-1).

```json
{
  "ticket": "organism-infra/212-queue-mod",
  "cell": "security",
  "current_step": "Security review done: pass. No critical/high findings. Two low notes.",
  "artifacts": ["scripts/queue.mjs", "mods/queue/hooks/register.tsx", "mods/queue/hooks/render.mjs"],
  "decisions": [
    "gitleaks on origin/main..72ff959: 3 commits, no leaks",
    "npm audit --omit=dev: 0 vulnerabilities; no dependency added, package.json only gains an npm script",
    "Gated patch (.claude/commands/queue.md, settings.json enabledPlugins, marketplace.json) is data only, matches north-star pattern"
  ],
  "failures": [],
  "pending": []
}
```

## Findings

- scripts/queue.mjs:57,124 low: ticket title (heading) and lock cell text pass unfiltered into the terminal output and the band, so a control or ANSI escape character in a ticket file could inject terminal sequences. Board files are local and agent-written; no network input. Optional hardening: strip C0/C1 control characters in `shorten` and the lock parse.
- mods/queue/hooks/register.tsx:15 low: runs `node scripts/queue.mjs` relative to the session cwd, so a session opened in a foreign repo would run that repo's script of the same name. Identical to the accepted north-star mod pattern; fails quiet.

## Checked, clean

- Local file reads only: no shell-out from queue.mjs, no network, no daemon. Paths are built from readdir names under `.scratch`, with no user-supplied path segment, so no traversal.
- ORGANISM_ROOT is a trusted env var; the mod passes argv as an array (no shell string).
- Regexes are linear (no ReDoS). Malformed usage.jsonl rows are skipped.
- No lock writes, so no lock race surface.
