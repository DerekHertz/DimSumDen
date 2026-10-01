# Handoff: 09 qa verify

```json
{
  "ticket": "den-scene-v1/09-role-headgear-assets",
  "cell": "qa",
  "mode": "verify",
  "verdict": "QA pass",
  "current_step": "Light verify complete: 105 tests pass, 0 fail, 0 skipped. Test file unchanged from specify commit. All acceptance criteria have passing tests or are marked human-verified. No files outside ticket scope.",
  "artifacts": ["apps/ui/src/scene/headgear.test.mjs"],
  "decisions": [
    "Light verify: test suite fully passes with all 105 tests green",
    "Test file unchanged from specify commit b8895bd",
    "All criteria mapped to passing tests or human-verified per design spec"
  ],
  "failures": [],
  "pending": [
    {"item": "Designer critique at the default camera and user's final verdict", "owner": "designer"}
  ]
}
```

## Test results

- `npm test` (full suite): 1502 pass, 0 fail, 0 skipped
- `node --test apps/ui/src/scene/headgear.test.mjs`: 105 pass, 0 fail, 0 skipped
- Test file unchanged between specify (b8895bd) and current (030c706)

## Criterion-to-test map (apps/ui/src/scene/headgear.test.mjs)

| Acceptance criterion | Test(s) covering it |
|---|---|
| Each of 9 roles has headgear, prop and placement entry | "the module names exactly the nine roles"; per role: "headgear and prop specs are non-empty lists of well-formed parts", "the headgear is a X and the prop is a Y, by part name", "ROLE_PLACEMENT puts the headgear on the hat socket and the prop on <paw>"; "ROLE_PLACEMENT has an entry for the nine roles and no others" |
| Scarf colour from station hue, live on theme swap | per role and theme: "every scarf part is station-tinted with the <station> hue", "every station-tinted part ... wears the hue; neutrals never do"; toque band, cap and beret: "has a station-tinted part"; "a theme swap changes the scarf hue and leaves every neutral part's colour alone" |
| Scout no lantern | "scout: the prop is a magnifier (ring and handle) and nothing lantern-like" |
| Headgear + prop + scarf ≤ 400 tris at crowd LOD | per role: "at most 400 triangles at crowd LOD", "crowd LOD stays within the segment caps" |
| Panda fur never tinted; soft-matte; unknown role safe | "every part uses a station or neutral token, never a fur material"; "materials are soft-matte: roughness >= 0.8, metalness 0; glass is see-through"; "an unknown role gets no headgear and no prop, a neutral scarf, and never throws" |
| Headgear reads at Level 1; silhouette | per role: "headgear stays within 1.6 x the head width and rides on the head"; "the douli is wider than the other hats and the toque is the tallest" |
| Developer prop is npm test tablet | "developer: the prop is the npm test tablet, a slab with a screen plane" |
| Attach by socket name, shared cache, stationHue only | "Den attaches headgear and prop from the specs by socket name, with the shared scarf, and uses ROLE_PLACEMENT"; "the scene builds gear through the shared asset cache and tints from stationHue on the live theme" |
| Designer critique with no high findings; user verdict | human-verified |
| Silhouette alone separates all roles; contrast ≥ 3:1 | human-verified |
| Reduced motion: rigid on hat, no extra wobble | human-verified |

## Files modified by developer

All within ticket scope:
- apps/ui/src/assets/panda-contract.mjs (added ROLE_PLACEMENT)
- apps/ui/src/scene/Den.jsx (wiring)
- apps/ui/src/scene/Market.jsx (theme hook)
- apps/ui/src/scene/gear-object.mjs (new module)
- apps/ui/src/scene/gear-object.test.mjs (new tests)
- apps/ui/src/scene/headgear.mjs (implementation)

## Verdict

QA pass. All 105 tests pass. Test file unchanged from specify. Every criterion has a passing test or is human-verified. Ready for designer critique.
