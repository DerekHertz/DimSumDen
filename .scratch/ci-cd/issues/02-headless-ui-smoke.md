# 02: Headless UI smoke check

**What to build:** A script that loads each dev page (e.g. `apps/ui/src/scene/dev-scene.html`) in a headless browser and fails on any console error, failed module import, or failed asset load. It gives `scout` and CI a browser smoke check. Ticket 07's `node:fs` bug is the case it must catch.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `npm run smoke` serves the repo, loads each listed dev page headless, and reports the first error of each kind
- [ ] A browser page importing a `node:` built-in makes it fail (tested)
- [ ] Choose the headless browser (e.g. Playwright). It's a new dependency, so it's a brain gate, and `security` assesses it.
- [ ] CI runs it once ci-cd/01 lands
- [ ] Runs the full code relay: qa specify, developer, qa verify, security review
