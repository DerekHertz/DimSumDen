```json
{
  "ticket": "dimsumden-ui-v0/07-ui-shell",
  "cell": "security",
  "current_step": "security review: pass (3 low notes, none blocking)",
  "artifacts": [
    "feature/dimsumden-ui-v0-07-ui-shell @ 14760123eb0bf26352e7634749640b9372de269c (base origin/main)"
  ],
  "decisions": [
    "Security pass: no critical/high/medium findings",
    "Dependencies match the user-approved set exactly; lockfile committed, registry-only, all integrity hashes present"
  ],
  "failures": [],
  "pending": [
    {
      "item": "propose merge (brain gate)",
      "owner": "orchestrator"
    }
  ]
}
```

# 07 security review

Security pass. npm ci clean, `npm audit` (prod and full) 0 vulnerabilities, gitleaks on origin/main..14760123 (3 commits) no leaks.

## Dependencies (user-approved set)

Direct: react 19.3.0, react-dom 19.3.0, three 0.170.0, @react-three/fiber 9.8.1 (prod), vite 8.3.1 (dev), all exact pins matching the approval.
Lockfile tree (56 packages, `package-lock.json` tracked): every entry resolves to registry.npmjs.org with an integrity hash; no git/URL/tarball sources.
- Install scripts: only `fsevents` 2.3.3 (macOS, optional, dev). The rolldown (@rolldown/binding-*, 1.2.11) and lightningcss-* native binaries have no install scripts; they are optional per-platform packages, dev-only, so nothing native ships in the prod dependency set.
- Licenses: all MIT, ISC, BSD-3, Apache-2.0, except lightningcss 1.33.0 (MPL-2.0, dev/build tool, not redistributed in dist; file-level copyleft, no action).
- Prod transitive adds: @babel/runtime, buffer, base64-js, ieee754, its-fine, react-use-measure, scheduler, suspend-react, use-sync-external-store, zustand, @types/*. All well-known, MIT/BSD, names not typosquat-shaped. oxc types, picomatch, postcss, nanoid, tinyglobby, fdir, detect-libc are dev-only.
- Maintenance: all are widely used, actively maintained projects (pmndrs, facebook, vitejs/voidzero, mrdoob).

## Static serving (apps/bridge/server.mjs, serveStatic)

Ran a live probe against a temp uiDir with a secret file outside it and a sibling dir `uiSibling`. Results:
- 403: `/../x`, `/%2e%2e/x`, `/%2e%2e%2fx`, `/..%2fx`, `/..%5cx`, `/.%2e/x`, `/sub/../../x`, `/state/../x`, `/\..\x`, absolute-form `http://host/../x`, sibling-prefix `/../uiSibling/x.txt`, NUL bytes (`/%00`, `/a%00.txt`).
- Double-encoded `/%252e%252e/x`: 404 (decoded once only, stays literal in the file name). `//etc/passwd` and `/%2fetc/passwd` resolve inside uiDir and fall back to index.html. `/%` is 400.
- Two layers: a raw-target `..` segment check, then `path.resolve` + `base + sep` prefix check (handles the `ui` vs `uiSibling` case). Host-header allowlist (127.0.0.1/localhost with the actual port) still runs first on every route, loopback bind is unchanged (HOST = 127.0.0.1), so DNS rebinding is blocked. Only GET/HEAD reach static; other methods 404. /state and /events routes are matched before static.
- SPA fallback returns index.html only for extensionless misses; directories fall back to index. Cache-Control no-store. No directory listing.

## Untrusted text

`apps/ui/src` (excluding the pre-existing dev scene) has no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic `href`/`src`. App.jsx renders only fixed strings, pill labels from a closed model (`pillModel`), and `snapshot.tickets.length`, so no bridge text reaches the DOM yet. SSE payloads are `JSON.parse`d and stored, never interpolated. React escapes text children. Tickets 09 to 11 (which will render ticket and agent text) need this re-checked.

## Findings

- apps/bridge/server.mjs:~78 (`readFile(file)`) - LOW - follows symlinks inside uiDir (probe: a symlink in uiDir to an outside file returns 200). Needs an attacker who can already write into `apps/ui/dist`, and dist is gitignored build output, so not exploitable remotely. Optional: `realpath` the target and re-check the prefix.
- apps/ui/vite.config.mjs:13 - LOW - dev server `fs.allow: [repoRoot]` lets `npm run ui:dev` serve any repo file (including `.env*` and `.scratch/`) to anything that can reach the dev server. Vite binds localhost and keeps its host check by default, so limited to local processes; dev-only. Optional: narrow to `apps/ui` plus `node_modules`.
- apps/ui/index.html - LOW/info - no Content-Security-Policy. Defense in depth for the tickets that will render agent and ticket text; consider a CSP (`script-src 'self'`) on the bridge's static responses in a later ticket.
- apps/bridge/server.mjs:1-4 - info - header comment still says static files arrive in a later ticket. Comment only.

jg vs grep: jg 0 calls, grep 3 calls.
