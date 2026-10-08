// den-v1/06: the card's pending line, "no live runtime needed", and the wiring checks the pure tests cannot see.
// Contract (qa specify):
//   proximity-card.mjs also exports pendingLine(card) -> "Waiting on you · <tool>" (middle dot U+00B7) while the card
//   has a pending approval, else null. The card follows the snapshot, so the line goes when the approval leaves pending.
//   apps/ui/src/overlay/ApprovalPanel.jsx is the panel; App.jsx mounts <ApprovalPanel and builds the client with
//   createBridgeClient({ fetch: <the session's fetch> }). ProximityCard.jsx renders pendingLine.
// Layout, the transcript/review slot swap, motion, contrast, focus rings and the phone sheet are human-verified.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import * as cardModule from "./proximity-card.mjs";
import { cardFor } from "./proximity-card.mjs";
import { createApprovalReview } from "./approval-review.mjs";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

const agent = { id: "c-1", ref: "den-v1/06-approve-deny", state: "needs-you", capabilities: { approve: true, send: false } };
const panda = { id: "p", name: "dev-02", role: "developer", position: { x: -2, z: 0 }, agent };
const viewer = { x: 0, z: 0, yaw: Math.PI / 2 };
const approval = (state) => ({ id: "a-0123456789abcdef", agentId: "c-1", tool: "Bash", state, inputLength: 12 });

describe("the card's pending line", () => {
  test("shows Waiting on you and the tool while an approval is pending", () => {
    assert.equal(typeof cardModule.pendingLine, "function", "proximity-card.mjs must export pendingLine");
    const card = cardFor([panda], [approval("pending")], viewer);
    assert.equal(cardModule.pendingLine(card), "Waiting on you · Bash");
  });

  test("goes when the approval leaves pending, and with no approval at all", () => {
    assert.equal(typeof cardModule.pendingLine, "function");
    for (const state of ["allowed", "denied", "expired"]) {
      assert.equal(cardModule.pendingLine(cardFor([panda], [approval(state)], viewer)), null, state);
    }
    assert.equal(cardModule.pendingLine(cardFor([panda], [], viewer)), null);
    assert.equal(cardModule.pendingLine(null), null);
  });
});

describe("no live runtime is needed", () => {
  test("a whole open, answer and close runs with global fetch poisoned", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error("network request attempted"); };
    try {
      const input = { command: "ls" };
      const sent = [];
      const review = createApprovalReview({
        client: {
          getApproval: async () => ({ ...approval("pending"), inputLength: JSON.stringify(input).length, input }),
          decide: async (id, body) => { sent.push([id, body]); return { ok: true }; },
        },
        now: () => 0,
        hooks: {},
      });
      const card = cardFor([panda], [{ ...approval("pending"), inputLength: JSON.stringify(input).length, expiresAt: new Date(600000).toISOString() }], viewer);
      assert.equal(review.open(card, { mode: "walk" }).opened, true);
      await new Promise((r) => setImmediate(r));
      await review.press("allow");
      assert.deepEqual(sent, [["a-0123456789abcdef", { decision: "allow" }]]);
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  test("the review controller contains no network primitive", () => {
    assert.doesNotMatch(read("./approval-review.mjs"), /\bfetch\s*\(|XMLHttpRequest|EventSource|WebSocket|sendBeacon|Bearer/);
  });
});

describe("wiring", () => {
  const overlayDir = new URL("../overlay/", import.meta.url);
  const sources = () => readdirSync(overlayDir)
    .filter((f) => /\.(jsx|mjs)$/.test(f) && !/\.test\./.test(f))
    .map((f) => read(`../overlay/${f}`)).join("\n");

  test("App mounts the approval panel and gives it a bridge client over the session's fetch", () => {
    const app = read("../App.jsx");
    assert.match(app, /<ApprovalPanel\b/);
    assert.match(app + read("./ApprovalPanel.jsx"), /createBridgeClient\s*\(/);
  });

  test("the card renders the pending line", () => {
    assert.match(read("./ProximityCard.jsx"), /pendingLine/);
  });

  test("the panel carries the spec's roles, labels and copy", () => {
    const all = sources();
    for (const text of [
      'role="complementary"', 'role="alert"', "Permission request", "Permission request for", "Close permission request",
      "Tool input", "Note to the agent (optional)", "One line, sent with your answer", "Load again", "Sending",
      "Waiting on you", "Not sent.", "Too late.", "Nothing changed. Try again.", "Session ended: restart the bridge and reload.",
      "Could not load the tool input", "Demo mode: actions are off", "characters shown",
    ]) assert.ok(all.includes(text), `missing in overlay sources: ${text}`);
    assert.match(all, /aria-live/);
    assert.match(all, /maxLength=\{?\s*(200|NOTE_MAX)/);
  });

  test("refusal text is inserted as plain text, never as HTML", () => {
    const all = sources();
    assert.doesNotMatch(all, /dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML/);
  });

  test("the stylesheet styles the panel and respects reduced motion", () => {
    const css = read("../scene/procedural/den.css") + read("../styles.css");
    assert.match(css, /\.approval/);
    assert.match(css, /prefers-reduced-motion/);
  });
});
