# 09: Panel: priority queue, latest handoff, usage meter

**Type:** feature

**Priority:** P0

**What to build:** Panel per `.scratch/dimsumden-ui-v0/spec.md`: the queue in frontier order with priority and bump markers, the selected ticket's latest handoff, and a usage meter. Designer reviews after qa.

**Blocked by:** 07

**Status:** resolved

- [ ] Queue renders in priority order on a fixture (test)
- [ ] Selecting a ticket shows its latest handoff (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **orchestrator, 2026-09-29:** Forward from 07 security (low): add a CSP (script-src 'self') on the bridge's static responses before rendering agent text; re-check text-only rendering.
- **qa, 2026-09-29:** QA pass: npm test 613/613, 0 skipped, no test files changed; criteria mapped; look/CSP-console human-verified (designer). See handoffs/09-qa-verify.md
- **security, 2026-09-29:** Security pass at 43d4077. MEDIUM render-markdown.mjs:37 link regex super-linear on 8KB agent text (3.9-12s UI freeze, repeats each 30s render); LOW server.mjs:18 style-src unsafe-inline acceptable; LOW agent https links open noopener. gitleaks clean, no deps. See handoffs/09-security.md
- **orchestrator, 2026-09-29:** Fix before merge (orchestrator, 2026-09-29): security medium #1. The inline link regex in render-markdown.mjs:37 is super-linear, and an 8 KB handoff freezes the UI for 4-12 s. Replace it with a linear scan (or cap inline length), add a timing regression test on the security repro strings, and memoize the parse in Detail (useMemo). Optional: narrow the CSP to style-src 'self'; style-src-attr 'unsafe-inline' (security low #2).
- **orchestrator, 2026-09-29:** User browser verdict (2026-09-29): the queue panel is fine, but it's a bounce. The CSP blocks 'blob:' under connect-src (index-*.js:3832). GLTFLoader loads embedded glb textures through blob: URLs, so the plush face textures fail and render as white boxes. Fix: add blob: to connect-src and allow blob: and data: in img-src, with a CSP test pinning this. Keep script-src 'self'.
