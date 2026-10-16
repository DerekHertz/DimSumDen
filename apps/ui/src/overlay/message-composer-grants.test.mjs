// agent-os/05: the Start box lists the task's grants (designer spec A, criteria 1 to 4).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createMessageComposer, checkGrant } from "./message-composer.mjs";

const WALL = {
  developer: { takesGrants: true, runs: ["Write in its worktree", "Read the project"], asks: ["Any host", "Any path outside"] },
  scout: { takesGrants: false, runs: ["Read the project", "Read the web"], asks: ["Nothing. It cannot write, push or merge."] },
};
const card = (role) => ({ id: `r-${role}`, agentId: null, name: "Pip", role, start: true, actions: { T: { enabled: true } } });
function make(startTask = async () => ({ agent: { id: "c-1" } })) {
  const calls = [];
  const c = createMessageComposer({ client: { startTask: async (...a) => (calls.push(a), startTask(...a)) } });
  c.sync({ agents: [], wall: WALL });
  return { c, calls };
}
const addRow = (c, kind, value) => { c.openRow(); c.setRow({ kind, value }); return c.addGrant(); };

test("the table renders the bridge's lines; scout has no Add a grant; the card folds", () => {
  const { c } = make();
  c.open(card("developer"));
  let s = c.getState();
  assert.deepEqual(s.table.runs, WALL.developer.runs);
  assert.equal(s.table.canAdd, true);
  assert.equal(s.foldCard, true);
  c.close();
  assert.equal(c.getState().foldCard, false);
  c.open(card("scout"));
  s = c.getState();
  assert.equal(s.table.canAdd, false);
  assert.deepEqual(s.table.asks, WALL.scout.asks);
});

test("add, refuse and remove", () => {
  const { c } = make();
  c.open(card("developer"));
  assert.equal(addRow(c, "host", "registry.npmjs.org"), true);
  assert.deepEqual(c.getState().table.asks, ["Any other host", "Any path outside"]);
  for (const [kind, value] of [["host", "10.0.0.1"], ["host", "localhost"], ["host", "https://a.org"], ["path", "rel/dir"], ["path", "/a/../b"], ["host", "registry.npmjs.org"]]) {
    c.setRow({ kind, value });
    assert.equal(c.addGrant(), false, value);
    assert.ok(c.getState().row.error, value);
  }
  assert.equal(c.getState().row.open, true);
  c.removeGrant("registry.npmjs.org");
  assert.equal(c.getState().table.granted.length, 0);
});

test("a seventh grant is refused; Esc closes the row first, then the box", () => {
  const { c } = make();
  c.open(card("developer"));
  for (let i = 0; i < 6; i += 1) assert.equal(addRow(c, "host", `h${i}.example.org`), true);
  assert.equal(c.getState().table.atMax, true);
  assert.equal(c.getState().table.addDisabledReason, "Six grants at most");
  c.key({ key: "Escape" });
  assert.equal(c.getState().row.open, false);
  assert.equal(c.getState().open, true);
  c.key({ key: "Escape" });
  assert.equal(c.getState().open, false);
});

test("startTask receives the grants in the fixed shape; a 400 keeps text and grants", async () => {
  const { c, calls } = make(async () => { throw Object.assign(new Error("x"), { status: 400, reason: "host not allowed." }); });
  c.open(card("developer"));
  c.setText("do it");
  addRow(c, "host", "Example.org");
  await c.send();
  assert.deepEqual(calls[0], ["developer", { text: "do it", grants: [{ kind: "host", value: "example.org" }] }]);
  const s = c.getState();
  assert.match(s.banner, /Not started\. The bridge refused the grant "example\.org": host not allowed\./);
  assert.equal(s.text, "do it");
  assert.equal(s.table.granted.length, 1);
});

test("checkGrant accepts a ~/ path and a plain host", () => {
  assert.equal(checkGrant({ kind: "path", value: "~/notes" }).ok, true);
  assert.equal(checkGrant({ kind: "host", value: "a.b.org" }).ok, true);
});
