# Handoff: organism-infra/01 — security review of ADR 0008 decision 6

**Cell:** security
**Ticket:** organism-infra/01 (`.scratch/organism-infra/issues/01-board-service-design.md`)
**Reviewed:** `docs/adr/0008-board-service.md` at commit `0791eaf`, decision 6 (auth and exposure), on branch `claude/organism-infra-01-board-service-adr`
**Verdict:** Security bounce (one high finding requires an ADR text fix; four medium/low notes for tickets 02/03, non-blocking)

## High: Windows named-pipe default DACL claim is wrong

Decision 6 states: "a Windows named pipe defaults to an ACL on the creating user's SID." This is not correct for the mechanism the ADR itself specifies (Node's `net.createServer().listen(path)`, i.e. `CreateNamedPipe` with no explicit security descriptor).

- Per Win32 docs, if `lpSecurityAttributes` is `NULL`, the pipe gets a default security descriptor whose DACL grants full control to the pipe creator, `LocalSystem`, and `Administrators`, **and read access to `Everyone` and the anonymous account.**
- Node's public `net` module does not expose a way to pass a custom security descriptor for a named pipe server; libuv creates it with the OS default.
- This has been raised upstream as a real gap: nodejs/node#43070, "named pipes are not secured by default on Windows" — any local user/process, including a low-integrity one (e.g., a sandboxed renderer), can open the pipe for read and observe traffic. Whether write is also reachable depends on the exact default (generic read is documented; some references report broader access), so treat it as at least an information-disclosure risk, potentially worse.

**Required ADR change:** Decision 6 must specify that the daemon supplies its own security descriptor at pipe-creation time — an explicit DACL that grants access only to the creating user's SID (and denies `Everyone`/`ANONYMOUS`). Since Node's public API doesn't do this, ticket 03 will need either a native/FFI call to `CreateNamedPipe` with a custom `SECURITY_ATTRIBUTES`, or a well-vetted userland package that does this correctly — call this out explicitly so ticket 03 doesn't assume the default is safe. This changes the "no bearer token needed because the transport is the access control" argument in decision 6: it's only true once the DACL is actually locked down.

## Medium/low — non-blocking, but should land in tickets 02/03

1. **Pipe-name squatting/impersonation.** The ADR doesn't address `FILE_FLAG_FIRST_PIPE_INSTANCE` (or equivalent). A rogue process that creates `\.\pipe\<name>` before the daemon starts could accept connections meant for the board service, capturing CLI traffic and returning forged responses. Ticket 03 should create the pipe as the first instance and fail loudly (not silently fall back or coexist) if that fails.

2. **POSIX socket permissions.** Decision 6 says the daemon creates the Unix socket file mode `0600` in a directory it owns. That's necessary but not sufficient: on Linux, `connect()` to a Unix domain socket is not gated by the socket file's own permission bits — only by directory-traversal (`x`) permission on the containing directory. The ADR should also require the containing directory be mode `0700`, owned by the daemon's user, so other local users can't even reach the socket path.

3. **NDJSON input validation.** Nothing in the ADR specifies validating `feature`/ticket-id strings before they reach filesystem paths. Ticket 02/03 must: (a) validate against a strict allowlist (e.g. `^[a-z0-9-]+$` for feature slugs and `^\d{2}-[a-z0-9-]+$` for ticket ids) before any path join, and (b) resolve the joined path and verify it stays under the board root (reject `..`, absolute paths, symlink escapes) before any fs read/write. Also cap accepted line length (e.g. reject/close on a line over some KB threshold) before `JSON.parse`, to bound memory from a malformed or hostile client.

4. **`subscribe` stream DoS.** No stated limit on concurrent subscribers or backpressure behavior when a subscriber reads slowly. Recommend: cap concurrent subscriber connections, and either apply backpressure (pause tailing until the socket drains) or drop/disconnect slow subscribers past a buffered-event threshold, rather than buffering unboundedly in the daemon.

5. **Fallback atomicity gap.** Decision 5 describes the no-daemon fallback doing "the identical atomic sequence (`O_EXCL` lock create, markdown edit, `events.jsonl` append)." `O_EXCL` protects the *claim* operation between concurrent CLI processes, but `release` and `comment` (markdown edit + log append) aren't described as taking any lock at all in fallback mode — two concurrent fallback CLI invocations against the same ticket could interleave a markdown edit and an `events.jsonl` append. The ADR should state whether these operations also acquire a file lock (e.g., an OS-level advisory lock or a lock file) for their full read-modify-write, not just claim.

## Dependencies / secrets
No new dependency or secret was introduced in this diff (ADR text only). Nothing to check for `npm audit`/lockfile here; will apply when tickets 02/03 land actual code.

## Recommendation
Bounce back to architect for a decision-6 text fix (the DACL claim) before tickets 02/03 start implementing against it — implementers would otherwise reasonably assume Windows gives them a safe default for free, which it does not. Items 1-5 above can ride along in the same edit or as explicit ticket notes for 02/03; they don't need another full ADR review cycle if captured as concrete requirements.
