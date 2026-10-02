# Handoff: three-digit ticket numbers, security on fix round (direct fix, no ticket)

Security pass (d036934..ff08f79). `compareRefs` is linear (disjoint or anchored regexes, no ReDoS); 3-5M-digit runs compare in under 230 ms. Digit-string compare fixes the Infinity and 2^53 notes. No claim or lock change; gitleaks clean; no dependency changes. Nit: `LEVELS =[` spacing in `apps/organism-infra/priority.mjs`.
