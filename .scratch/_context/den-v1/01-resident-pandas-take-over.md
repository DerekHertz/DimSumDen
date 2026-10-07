Jevgrep: 9 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
- "apps/ui/src/scene/scene-from-state.mjs" — implementation, helper; source below
- "apps/ui/src/scene/scene-from-state.test.mjs" — test, fixture, helper; source below
- "apps/ui/src/scene/handoff-fixture.test.mjs" — caller, test, fixture, helper; locations only
- "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md" — caller, helper; locations only
- "apps/ui/src/scene/handoff-motion.test.mjs" — test, fixture, helper; locations only
- "apps/ui/src/App.jsx" — caller, helper; locations only
- "apps/ui/src/scene/handoffs.mjs" — caller, helper; locations only
- "apps/ui/src/scene/handoff-fixture.mjs" — caller, fixture, helper; locations only
- "docs/adr/0013-banquet-market-layout.md" — helper; locations only
End file list. Declaration locations follow source.

Source block "apps/ui/src/scene/scene-from-state.mjs" lines 27-50:
```
/**
 * One cell per active ticket. Queued (ready) tickets get no cell: they show only as baskets on the
 * lazy susan until a cell picks them up (showcase-v1/04).
 * @param {{tickets: object[]}} snapshot
 */
export function sceneFromState(snapshot) {
  const tickets = snapshot?.tickets ?? [];
  const active = tickets
    .filter((t) => ACTIVE_STATUSES.has(t.status))
    .sort((a, b) => compareRefs(a.ref, b.ref));
  const slots = {};
  return active.slice(0, MAX_PLUSH).map((t) => {
    const cellType = cellTypeOf(t);
    const station = stationOf(cellType); // ADR 0013: perch is "<station>#<slot>"
    const slot = slots[station] ?? 0;
    slots[station] = slot + 1;
    return { ref: t.ref, cellType, status: t.status, perch: `${station}#${slot}`, pose: poseOf(t) };
  });
}

/**
 * The Pass is the head chef: Bao's crown never stands empty. When no orchestrator cell is active, add
 * an idle stand-in (no ticket, `synthetic: true`) so the scene shows one; chips skip it.
 */
```

Source block "apps/ui/src/scene/scene-from-state.test.mjs" lines 6-12:
```

// Dynamic import so each test fails on its own while the module is missing.
const load = () => import("./scene-from-state.mjs");
const scene = async (snap) => (await load()).sceneFromState(snap);

const ticket = (n, over = {}) => ({
  ref: `f/${String(n).padStart(2, "0")}-t`,
```

Source block "apps/ui/src/scene/scene-from-state.test.mjs" lines 23-29:
```
});
const snap = (tickets, frontier = []) => ({ schema: 1, seq: 1, tickets, frontier, usage: null, requests: [] });
const claimedBy = (cell) => ({ cell, since: "2026-09-29T05:00:00.000Z" });
const brief = (cells) => cells.map(({ ref, cellType, status, perch, pose }) => ({ ref, cellType, status, perch, pose }));

test("exports MAX_PLUSH = 12", async () => {
  assert.equal((await load()).MAX_PLUSH, 12);
```

Source block "apps/ui/src/scene/scene-from-state.test.mjs" lines 61-186:
```
});

// pose rule order table
const poseCases = [
  ["gate merge beats everything", { status: "in-review", gate: "merge", lastCell: "security" }, [], "waiting_on_user"],
  ["gate beats claimed", { status: "claimed", holder: claimedBy("developer"), gate: "merge" }, [], "waiting_on_user"],
  ["ready-for-human", { status: "ready-for-human", lastCell: "orchestrator" }, [], "waiting_on_user"],
  ["claimed", { status: "claimed", holder: claimedBy("developer") }, [], "working"],
  ["in-review with a holder (review running)", { status: "in-review", holder: claimedBy("qa") }, [], "working"],
  ["in-review without a holder", { status: "in-review", lastCell: "qa" }, [], "done"],
  ["blocked", { status: "blocked", lastCell: "developer" }, [], "blocked"],
];
for (const [name, over, frontier, pose] of poseCases) {
  test(`pose: ${name} -> ${pose}`, async () => {
    const [cell] = await scene(snap([ticket(1, over)], frontier));
    assert.equal(cell.pose, pose);
    assert.ok(STATES.includes(cell.pose), "pose must be a director STATE");
  });
}

// cellType rule
const typeCases = [
  ["holder.cell wins over lastCell", { holder: claimedBy("qa"), lastCell: "developer" }, "qa"],
  ["lastCell when no holder", { lastCell: "security" }, "security"],
  ["type design -> architect", { type: "design" }, "architect"],
  ["type design-question -> architect", { type: "design-question" }, "architect"],
  ["type design-direction -> architect", { type: "design-direction" }, "architect"],
  ["type decision -> architect", { type: "decision" }, "architect"],
  ["type prototype -> architect", { type: "prototype" }, "architect"],
  ["type research -> scout", { type: "research" }, "scout"],
  ["type feature -> developer", { type: "feature" }, "developer"],
  ["type bug -> developer", { type: "bug" }, "developer"],
  ["null type -> developer", { type: null }, "developer"],
  ["lastCell beats type default", { type: "research", lastCell: "designer" }, "designer"],
];
for (const [name, over, cellType] of typeCases) {
  test(`cellType: ${name}`, async () => {
    const [cell] = await scene(snap([ticket(1, { status: "blocked", ...over })]));
    assert.equal(cell.cellType, cellType);
  });
}

test("perch: station from cell type (ADR 0013), slot is 0-based index within the station in output order", async () => {
  const cells = [
    ["orchestrator", "orchestrator#0"], ["product", "product#0"], ["architect", "architect#0"],
    ["developer", "steamers#0"], ["scout", "steamers#1"],
    ["qa", "tea#0"], ["security", "pantry#0"],
    ["designer", "front-of-house#0"],
  ];
  const tickets = cells.map(([cell], i) => ticket(i + 1, { status: "claimed", holder: claimedBy(cell) }));
  const out = await scene(snap(tickets));
  assert.deepEqual(out.map((c) => [c.cellType, c.perch]), cells);
});

test("perch: slot counts per region are independent", async () => {
  const out = await scene(snap([
    ticket(1, { holder: claimedBy("developer") }),
    ticket(2, { holder: claimedBy("qa") }),
    ticket(3, { holder: claimedBy("developer") }),
    ticket(4, { holder: claimedBy("qa") }),
  ]));
  assert.deepEqual(out.map((c) => c.perch), ["steamers#0", "tea#0", "steamers#1", "tea#1"]);
});

test("order: active tickets by ref; queued tickets get no cell (showcase-v1/04: baskets only)", async () => {
  const out = await scene(snap([
    ticket(9, { status: "claimed", holder: claimedBy("developer") }),
    ticket(3, { status: "blocked", lastCell: "developer" }),
    ticket(7, { status: "ready-for-agent", ready: true }),
    ticket(2, { status: "ready-for-agent", ready: true }),
    ticket(5, { status: "in-review", lastCell: "qa" }),
  ], ["f/07-t", "f/02-t"]));
  assert.deepEqual(out.map((c) => c.ref), ["f/03-t", "f/05-t", "f/09-t"]);
});

test("order does not depend on input ticket order", async () => {
  const a = [ticket(2, { holder: claimedBy("developer") }), ticket(1, { holder: claimedBy("developer") })];
  const out = await scene(snap(a));
  assert.deepEqual(out.map((c) => [c.ref, c.perch]), [["f/01-t", "steamers#0"], ["f/02-t", "steamers#1"]]);
});

test("cap: queued tickets add no cells, so 10 active plus 5 queued is 10 cells", async () => {
  const active = Array.from({ length: 10 }, (_, i) => ticket(i + 1, { holder: claimedBy("developer") }));
  const ready = Array.from({ length: 5 }, (_, i) => ticket(20 + i, { status: "ready-for-agent", ready: true }));
  const frontier = ready.map((t) => t.ref);
  const out = await scene(snap([...active, ...ready], frontier));
  assert.equal(out.length, 10);
  assert.deepEqual(out.map((c) => c.ref), active.map((t) => t.ref));
});

test("cap: 15 active tickets are cut to the first 12 by ref", async () => {
  const active = Array.from({ length: 15 }, (_, i) => ticket(i + 1, { holder: claimedBy("developer") }));
  const out = await scene(snap(active));
  assert.deepEqual(out.map((c) => c.ref), active.slice(0, 12).map((t) => t.ref));
});

test("purity: does not mutate the snapshot and is repeatable", async () => {
  const s = snap([ticket(1, { holder: claimedBy("qa") })], []);
  const before = JSON.stringify(s);
  const first = await scene(s);
  const second = await scene(s);
  assert.equal(JSON.stringify(s), before);
  assert.deepEqual(first, second);
});

test("worked example from ADR 0011 decision 7", async () => {
  const out = await scene(snap([
    ticket(28, { ref: "organism-infra/28-review-claims-keep-in-review", status: "in-review", gate: "merge", lastCell: "security" }),
    ticket(4, { ref: "dimsumden-ui-v0/04-bridge-state", status: "ready-for-agent", ready: true, gate: "dispatch", lastCell: "orchestrator", type: "feature" }),
    ticket(7, { ref: "dimsumden-ui-v0/07-ui-shell", status: "ready-for-agent", ready: false, blockedBy: [{ ref: "dimsumden-ui-v0/05-bridge-events", status: "ready-for-agent" }] }),
  ], ["dimsumden-ui-v0/04-bridge-state"]));
  assert.deepEqual(brief(out), [
    { ref: "organism-infra/28-review-claims-keep-in-review", cellType: "security", status: "in-review", perch: "pantry#0", pose: "waiting_on_user" },
  ]);
});

test("withPassCell: an idle orchestrator stands on Bao's crown when none is active, and never twice", async () => {
  const { withPassCell } = await load();
  const [pass] = withPassCell([]);
  assert.deepEqual(pass, { ref: "__pass", cellType: "orchestrator", status: "idle", perch: "orchestrator#0", pose: "idle", synthetic: true });
  const real = { ref: "f/01-t", cellType: "orchestrator", status: "claimed", perch: "orchestrator#0", pose: "working" };
  assert.deepEqual(withPassCell([real]), [real]);
  const dev = { ref: "f/02-t", cellType: "developer", status: "claimed", perch: "steamers#0", pose: "working" };
  assert.deepEqual(withPassCell([dev]).map((c) => c.ref), ["f/02-t", "__pass"]);
});

```

Declaration locations:
- "apps/ui/src/scene/scene-from-state.mjs"
  source@2-2
  MAX_PLUSH@5-5
  ACTIVE_STATUSES@7-7
  ARCHITECT_TYPES@8-8
  cellTypeOf@10-16
  poseOf@18-25
  sceneFromState@32-45
  withPassCell@51-54
- "apps/ui/src/scene/scene-from-state.test.mjs"
  source@3-3
  source@4-4
  source@5-5
  load@8-8
  scene@9-9
  ticket@11-23
  snap@24-24
  claimedBy@25-25
  brief@26-26
  source@28-30
  source@32-34
  source@36-39
  source@41-44
  source@46-56
  source@58-61
  poseCases@64-72
  source@73-79
  typeCases@82-95
  source@96-101
  source@103-113
  source@115-123
  source@125-134
  source@136-140
  source@142-149
  source@151-155
  source@157-164
  source@166-175
  source@177-185
- "apps/ui/src/scene/handoff-fixture.test.mjs"
  source@4-4
  source@5-5
  source@6-6
  source@8-11
  source@13-17
  source@19-24
- "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md"
  source@1-30
  source@31-80
  source@81-145
  source@146-158
  source@159-210
  source@211-239
  source@240-251
  source@252-268
  source@269-279
- "apps/ui/src/scene/handoff-motion.test.mjs"
  source@6-6
  snapshot@9-9
  source@10-35
  source@37-45
  source@47-55
- "apps/ui/src/App.jsx"
  source@5-5
  source@6-6
  source@8-8
  source@11-11
  source@14-14
  source@15-15
  source@16-16
  source@18-18
  App@27-86
- "apps/ui/src/scene/handoffs.mjs"
- "apps/ui/src/scene/handoff-fixture.mjs"
  ticket@3-6
  held@7-7
  snap@8-8
  spec@11-11
  DEMO_STEPS@15-26
- "docs/adr/0013-banquet-market-layout.md"
  source@26-31

End context.
