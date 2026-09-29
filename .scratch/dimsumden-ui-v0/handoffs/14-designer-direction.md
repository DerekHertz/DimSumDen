```json
{"ticket": "dimsumden-ui-v0/14", "cell": "designer", "mode": "direction", "current_step": "Three backdrop directions proposed; awaiting user pick",
 "artifacts": [".scratch/dimsumden-ui-v0/handoffs/14-designer-direction.md"],
 "decisions": ["Recommend direction A (Paper-cut grove) as default", "All directions: static, flat-shaded low-poly, no state hues (no lantern-amber glow, no alarm red), vermilion only as decoration"],
 "failures": ["AskUserQuestion not available in this dispatch; choice deferred to the user via orchestrator"],
 "pending": [{"item": "User picks A, B or C; record it in ticket 14 Comments", "owner": "orchestrator"}, {"item": "Write UI spec for the chosen direction before qa specify", "owner": "designer"}]}
```

**State**: partial. Directions written; user choice pending. No build started.

## Shared constraints (all directions)
- Static meshes, merged into one or two draw calls, flat-shaded, unlit or MeshLambert; under ~3k tris total; no shadows cast from backdrop.
- Depth layering: everything sits behind Bao's grass line; nothing enters the plush/chip band. Lower value contrast and saturation than plushes so chips stay legible (chips keep >= 4.5:1 against whatever lies behind them).
- Palette from the grove tokens only (bamboo greens, cream, charcoal, jade, gold; vermilion decorative only). Never the reserved state hues, especially the lantern waiting hue: backdrop lanterns stay unlit paper-cream in both themes.
- Dark theme (lantern dusk): same geometry, colours shifted to dusk values, no emissive.
- Reduced motion: nothing to change (already static).

## Direction A: Paper-cut grove (recommended)
Layered flat planes like a papercraft diorama: 3 depth bands of bamboo stalks (thin extruded hex prisms, leaf wedges), a tea house silhouette with a curved-eave roof as stepped slabs, steamer stacks and a counter as simple cylinders/boxes at the sides. Fades to cream toward the far band (fog colour = background token). Why it fits: calmest behind chips, cheapest, reads donghua-storybook; the value fade guarantees legibility.

## Direction B: Low-poly teahouse courtyard
Bao sits in a courtyard: tea house facade (pillars, lattice window, tiled roof as faceted wedges) directly behind, a serving counter with steamer stacks left, a hanging row of unlit lanterns right, bamboo clusters framing the edges. Why it fits: strongest "dim sum restaurant" story. Risk: busiest silhouette behind the crown/shoulder perches; needs the roof kept below the crown chip band.

## Direction C: Bamboo ring vista
A ring of faceted bamboo stalks around the stage, open to a distant tea house on a low hill (single silhouette), with a few steamer stacks and a counter as foreground set-dressing at the grass edge. Why it fits: most "grove" and spacious, suits Level 1-2 whitespace. Risk: restaurant elements are small; the ring needs care at wide camera angles.

**Next step**: user picks A/B/C (orchestrator relays and records it); then designer writes the spec.
**Suggested skills**: organism-protocol, artifact-design (if a mock is wanted).
**Gotchas**: none.
