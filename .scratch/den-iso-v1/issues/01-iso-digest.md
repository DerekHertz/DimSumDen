# 01: Digest the isometric Den frame into a numeric spec

**Type:** design

**Priority:** P1

**Blocked by:** None

**Status:** resolved

**Design refs:** `.scratch/den-iso-v1/spec.md`; `docs/design/den-map.md`; `docs/design/2026-09-29-scene-decisions.md`. Source frame: artboard `project/Level1-Den-Iso.dc.html` in the zoom frames canvas https://claude.ai/artifact/AFEGyVKV5s6GbTFraA5U3G (not the `JsxZ5Vj7DxJQbekA2Ehoot` copy the designer genome links). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j.

## What to build

`designer` in `spec` mode reads the frame once (and the Level1-Den frame beside it) and writes one short page, `docs/design/2026-10-01-iso-den.md`, that every later den-iso-v1 cell reads instead of the canvas. The frame is hand-drawn SVG, so the page translates screen coordinates into world numbers; it does not copy the SVG.

The page holds:
- The isometric projection: camera yaw and pitch, orthographic zoom range and default, default framing at 1440x900 and 375x667, pan limits.
- A placement table in den-map's format (world x, z, yaw) for kiosks, Bao, susan, tally, hamper, plus the new pieces (stepping-stone ring, Library and Drum pads, bamboo). Say where the frame differs from `den-map.md`, and keep moves within ±0.3 unless the frame needs more.
- The floating cards: edge anchors, widths, collapse behaviour, states (empty, failed, waiting, reduced motion, light and dark), and the selected-panda card's fields.
- The selection treatment on a kiosk: ring, failure badge, activity badge.
- A hex-to-token map for every colour in the frame, and a list of gaps where no design system token exists.
- Accessibility requirements and den-word labels (no biology words).

**Files:** `docs/design/2026-10-01-iso-den.md` only. No app code.

## Acceptance criteria

- [ ] The page exists and is under about 250 lines; no pasted SVG or HTML
- [ ] Every placement has world coordinates and a yaw, in den-map's table format
- [ ] Every frame colour maps to a design system token, or is listed as a gap with a proposed token
- [ ] The projection numbers let a developer write the camera with no look at the canvas (angles, zoom range, default frame)
- [ ] Token gaps and any token that ships in code are listed for the user's sign-off (gate)
- [ ] Differences from `den-map.md` are listed in one table

## Comments
- **designer, 2026-10-01:** Digest written: docs/design/2026-10-01-iso-den.md (208 lines, branch design/iso-den-digest01). Gate: user sign-off on token gaps G1-G6 and decisions D1-D3 (page section 8). Handoff: handoffs/01-designer.md
- **designer, 2026-10-01:** Digest done; waiting on user sign-off on token gaps and D1-D3
- **designer, 2026-10-01:** Gate signed off. Tokens G1-G6 added to docs/design/tokens.json (commit e62086c); section 8 records decisions and dark values. Handoff: handoffs/01-designer-tokens.md. User to sync the design system artifact.
- **designer, 2026-10-01:** Gate signed off; tokens added; orchestrator to resolve
