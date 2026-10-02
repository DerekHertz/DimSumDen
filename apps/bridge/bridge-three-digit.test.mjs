// Three-digit tickets through GET /state: tickets and the frontier order by ticket number
// (99 before 100), and a `Blocked by: 100` entry resolves to the 100 ticket.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startBridge } from "./server.mjs";

const md = (title, blockedBy = "None") =>
  `# ${title}\n\n**Type:** feature\n\n**Blocked by:** ${blockedBy}\n\n**Status:** ready-for-agent\n\n- [ ] x\n\n## Comments\n`;

test("snapshot orders 99 before 100 and resolves a three-digit blocker", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "bridge-3d-"));
  const dir = path.join(root, ".scratch", "fx", "issues");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "100-b.md"), md("100: B"));
  await writeFile(path.join(dir, "99-a.md"), md("99: A"));
  await writeFile(path.join(dir, "101-c.md"), md("101: C", "100"));
  const bridge = await startBridge({ root, port: 0 });
  try {
    const snap = await (await fetch(`${bridge.url}/state`)).json();
    assert.deepEqual(snap.tickets.map((t) => t.ref), ["fx/99-a", "fx/100-b", "fx/101-c"]);
    const c = snap.tickets.find((t) => t.ref === "fx/101-c");
    assert.deepEqual(c.blockedBy, [{ ref: "fx/100-b", status: "ready-for-agent" }]);
    assert.deepEqual(snap.frontier, ["fx/99-a", "fx/100-b"]);
  } finally {
    await bridge.close();
    await rm(root, { recursive: true, force: true }).catch(() => {});
  }
});
