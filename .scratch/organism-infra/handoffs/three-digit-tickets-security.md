# Handoff: three-digit ticket numbers, security (direct fix, no ticket)

Security pass on `fix/three-digit-tickets` d036934. Traversal, lock-aliasing (leading zeros, prefix collisions) and ReDoS probes clean; no claim/lock logic changed; gitleaks and npm audit clean; no dependency or CI changes.

Low, non-blocking:
- `packages/board-refs/src/compare-refs.mjs:14`: `Number()` overflows to Infinity for 309+ digit runs (inconsistent comparator); runs above 2^53 lose precision (string tiebreak keeps it deterministic). Harden by comparing length after stripping leading zeros, then lexicographically.
- `apps/organism-infra/board-audit.mjs:10`: `REF_IN_TEXT_RE` unbounded `\d{2,}`; measured linear, local input only.
