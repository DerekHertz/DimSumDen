# 02: Start the den from terminal claude, with a mod that reads den data

**Type:** feature (needs product grill)

**Priority:** P3

**Blocked by:** den-v1/06, den-v1/07, den-v1/09 (north star first)

**Status:** needs-triage

**Serves:** The user's idea (2026-10-08): launch the den from the `claude` terminal and use mods alongside it. Spec line 61 already defers "the relay band that reads Den data" to its own spec; this is that spec's seed.

## What to build

Not settled. Grill it with `product` before any ticket breakdown. Open choices:
- What "start the den from the terminal" means: a slash command or mod action that runs `npm run ui` and opens the browser, or a pane that shows the den in the terminal.
- What the mod shows: a relay band (in flight, next up, gates) read from the bridge, a link to the den, or both.
- Whether Terminal Browser comes back. The mods grill dropped it (spec line 85) because the browser preview MCP covers it. Check whether a terminal browser can render the 3D den (WebGL) at all before choosing it.
- Trust: our own mod (spec trust rule) unless a reviewed read-only third-party band fits.

Display limit: mods draw only in terminal `claude` in WSL (v2.1.287+), not the WSL desktop Code tab.

## Comments

- orchestrator (2026-10-08): parked at the user's choice until den-v1 06, 07 and 09 resolve.
