```json
{"ticket": "dimsumden-ui-v0/14", "cell": "qa", "mode": "specify", "current_step": "fix round: tests 2 and 3b corrected, committed on feature/dimsumden-ui-v0-14-den-backdrop at e57494a; ready for developer to re-run",
 "artifacts": ["apps/ui/src/scene/backdrop.test.mjs"],
 "decisions": ["Test 2: removed the 0.9 * bao.depth < 1.5 precondition (asset-only, false for panda.glb 1.578); now only asserts every backdrop mesh has world max z <= -1.5, plus at least one mesh", "Test 3b: the old vertex filter (|x| <= 1, z in [-5.1,-4.4]) never saw the tea house, because box vertices sit at corners (x +-1.9, z faces -5.55/-3.95 etc.), so a 3.85-high eave passed. Now tests whole triangles inside z [-5.6,-3.9] whose x-extent overlaps [-1,1], y <= 1.1 x Bao max y, and asserts at least one triangle was checked", "Verified red for the right reason by 10 local uncommitted mutations of backdrop.mjs (script in scratchpad, production file restored): z moved, central near stalk, tall eave, fog far, castShadow, raycast enabled, forbidden colour, theme remount, no far band, group name. Each is caught by exactly its intended test(s); no setup/import errors"],
 "failures": [],
 "pending": [{"item": "developer: re-run node --test apps/ui/src/scene/backdrop.test.mjs; no production change should be needed (15/15 pass on 9a92002 code; npm test 677/677, 0 skipped)", "owner": "developer"}, {"item": "human-verified (unchanged): backdrop renders when panda.glb fails; click on empty backdrop deselects a plush; user visual verdict; frame rate within 5%; chip contrast", "owner": "designer/user"}]}
```

**State**: complete for specify fix round.

Criterion to test map is unchanged from 14-qa-specify.md, except:
- Spec test 2 ("2."): behind perches/Bao, world max z <= -1.5, no asset precondition.
- Spec test 3b ("3b."): tea house under 1.1 x Bao height, now triangle-based so it really covers the box geometry.

The developer's block was correct: the precondition was an asset-only failure, independent of the backdrop.

**Suggested skills**: organism-protocol, tdd.
**Gotchas**: vertex-only checks miss box faces; use triangles or a Box3 when a spec bounds a box.
