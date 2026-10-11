// den-v1/07: the message composer controller (pure, DOM-free). Spec: the ticket's "Design spec" section.
// Contract (qa specify). apps/ui/src/overlay/message-composer.mjs exports:
//   MESSAGE_MAX_BYTES = 2048, ACK_WAIT_MS = 20000
//   createMessageComposer({ client, now = Date.now, hooks = {} }) -> composer
//     client: { sendMessage(agentId, { text }) -> Promise<{ ok, messageId }> }, failures reject { status, reason }
//             (see state/bridge-client-message.test.mjs). Injected: no fetch in this module.
//     hooks.onOpen(): called once each time the composer opens (the app releases pointer lock).
//   composer.getState() -> plain view object (a new object after every change); composer.subscribe(fn) -> unsubscribe.
//   composer.open(card, { mode: "walk"|"free", demo?: boolean }) -> { opened, reason }
//     card is cardFor()'s result. Opens only when card.actions.T is enabled; otherwise opened:false with
//     reason = card.actions.T.reason (or "Demo mode: actions are off"). Sends nothing.
//   composer.key({ key, shiftKey?, isComposing?, repeat?, inBox? }, { card, mode, demo? }) -> { handled, walk }
//     `walk` is false while the composer is open (the walk handler leaves every key alone, Tab/Enter/Space included).
//     T (either case) with the composer closed opens it, from mode "walk" only, and never from inside a text field.
//     With the composer open and the key in the box: Enter sends (handled:true); Shift+Enter and IME composition send
//     nothing and are left to the browser (handled:false); Escape closes without sending (handled:true, walk:false).
//   composer.setText(text); composer.send() -> Promise (the Send button; Enter calls it); composer.close() (Cancel).
//   composer.observe(event) feeds the agent's event stream; the acknowledgement fixture is
//     { type: "message-ack", agentId, messageId }.
//   composer.sync({ agents }) on each new snapshot; composer.tick() is the clock; composer.statusFor(card) -> status|null.
// State fields used here:
//   open, phase ("closed"|"ready"|"sending"|"refused"|"final"), overline, ariaLabel, placeholder, text, counter,
//   overLimit, readOnly, sendEnabled, banner, focus ("box"|"close"|null), focusReturn ("scene"|"card-button"|null),
//   announcement (string|null), status (the latest message's status or null).
// status: { agentId, kind: "sent"|"received"|"stalled", label, preview }.
// Everything visual (layout, motion, contrast, focus ring, phone sheet) is human-verified.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMessageComposer, MESSAGE_MAX_BYTES, ACK_WAIT_MS } from "./message-composer.mjs";
import { cardFor } from "./proximity-card.mjs";

const T0 = Date.parse("2026-10-08T12:00:00Z");
const flush = () => new Promise((r) => setImmediate(r));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const rejectWith = (status, reason) => Object.assign(new Error(reason), { status, reason });
const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === "object" && deepFreeze(v)); return Object.freeze(o); };

const on = { enabled: true, reason: null };
const makeCard = (over = {}) => deepFreeze({
  id: "p-1", name: "dev-02", role: "developer", ref: "den-v1/07-message-t", agentId: "c-1", state: "working",
  tool: null, approval: null, actions: { T: on, R: on, E: { enabled: false, reason: "no pending permission request" }, Q: { enabled: false, reason: "no pending permission request" } },
  ...over,
});
const otherCard = makeCard({ id: "p-2", name: "qa-01", role: "qa", agentId: "c-2" });
const ack = (messageId, agentId = "c-1") => ({ type: "message-ack", agentId, messageId });

function harness({ sendMessage } = {}) {
  const calls = [];
  let time = T0;
  let opened = 0;
  let n = 0;
  const client = {
    sendMessage: (agentId, body) => {
      calls.push([agentId, body]);
      return (sendMessage ?? (async () => ({ ok: true, messageId: `m-${++n}` })))(agentId, body);
    },
  };
  const composer = createMessageComposer({ client, now: () => time, hooks: { onOpen: () => { opened += 1; } } });
  const states = [];
  composer.subscribe((s) => states.push(s));
  return {
    composer, calls, states,
    advance: (ms) => { time += ms; },
    get opened() { return opened; },
    state: () => composer.getState(),
  };
}

function openBox(h, card = makeCard(), mode = "walk") {
  const r = h.composer.open(card, { mode });
  assert.equal(r.opened, true, "composer should open");
  return card;
}
const typeAndEnter = async (h, text) => {
  h.composer.setText(text);
  h.composer.key({ key: "Enter", inBox: true }, { card: makeCard(), mode: "walk" });
  await flush();
};

describe("exports", () => {
  test("the limits", () => {
    assert.equal(MESSAGE_MAX_BYTES, 2048);
    assert.equal(ACK_WAIT_MS, 20000);
  });
});

describe("T opens the composer; nothing is sent", () => {
  test("pressing T in walk mode opens it, focuses the box, fires onOpen once, sends nothing", () => {
    const h = harness();
    const r = h.composer.key({ key: "t" }, { card: makeCard(), mode: "walk" });
    assert.equal(r.handled, true);
    assert.equal(r.walk, false);
    const s = h.state();
    assert.equal(s.open, true);
    assert.equal(s.focus, "box");
    assert.equal(s.phase, "ready");
    assert.equal(s.overline, "Message dev-02");
    assert.equal(s.ariaLabel, "Message dev-02");
    assert.equal(s.placeholder, "Tell dev-02 what to do next");
    assert.equal(s.counter, "0 / 2,048 bytes");
    assert.equal(h.opened, 1);
    assert.equal(h.calls.length, 0);
  });

  test("capital T works; a held key (repeat) and a T typed in another text field do not open it", () => {
    const h = harness();
    assert.equal(h.composer.key({ key: "T", repeat: true }, { card: makeCard(), mode: "walk" }).handled, false);
    assert.equal(h.composer.key({ key: "t", inBox: true }, { card: makeCard(), mode: "walk" }).handled, false);
    assert.equal(h.state().open, false);
    assert.equal(h.composer.key({ key: "T" }, { card: makeCard(), mode: "walk" }).handled, true);
    assert.equal(h.state().open, true);
  });

  test("with no card, or the cursor free, T does nothing and the walk handler keeps the key", () => {
    const h = harness();
    assert.deepEqual(h.composer.key({ key: "t" }, { card: null, mode: "walk" }), { handled: false, walk: true });
    assert.equal(h.composer.key({ key: "t" }, { card: makeCard(), mode: "free" }).handled, false);
    assert.equal(h.state().open, false);
  });

  test("the card button opens it in free mode via open()", () => {
    const h = harness();
    openBox(h, makeCard(), "free");
    assert.equal(h.state().open, true);
  });

  test("with the composer closed, unrelated keys are left to the walk handler", () => {
    const h = harness();
    assert.deepEqual(h.composer.key({ key: "w" }, { card: makeCard(), mode: "walk" }), { handled: false, walk: true });
    assert.deepEqual(h.composer.key({ key: "Escape" }, { card: makeCard(), mode: "walk" }), { handled: false, walk: true });
    assert.deepEqual(h.composer.key({ key: "Enter" }, { card: makeCard(), mode: "walk" }), { handled: false, walk: true });
  });
});

describe("while open, the box owns the keyboard", () => {
  test("letters, Tab and Space are not handled and never walk; T does not reopen or send", () => {
    const h = harness();
    openBox(h);
    for (const key of ["a", "d", "f", "w", "Tab", " ", "t"]) {
      const r = h.composer.key({ key, inBox: true }, { card: makeCard(), mode: "walk" });
      assert.equal(r.walk, false, key);
      assert.equal(h.calls.length, 0, key);
    }
    assert.equal(h.opened, 1);
  });

  test("Esc closes without sending; the first Esc is consumed, a second falls through to the walk handler", () => {
    const h = harness();
    openBox(h);
    h.composer.setText("draft text");
    const first = h.composer.key({ key: "Escape", inBox: true }, { card: makeCard(), mode: "walk" });
    assert.deepEqual(first, { handled: true, walk: false });
    assert.equal(h.state().open, false);
    assert.equal(h.calls.length, 0);
    const second = h.composer.key({ key: "Escape" }, { card: makeCard(), mode: "walk" });
    assert.equal(second.walk, true);
  });

  test("Cancel (close) sends nothing and returns focus: scene in walk mode, the card's T button when the cursor is free", () => {
    for (const [mode, ret] of [["walk", "scene"], ["free", "card-button"]]) {
      const h = harness();
      openBox(h, makeCard(), mode);
      h.composer.close();
      assert.equal(h.state().open, false);
      assert.equal(h.state().focusReturn, ret, mode);
      assert.equal(h.calls.length, 0);
    }
  });
});

describe("Enter sends exactly one request", () => {
  test("Enter in the box calls sendMessage once with the agent id and the trimmed text", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("  run the tests please \n");
    const r = h.composer.key({ key: "Enter", inBox: true }, { card: makeCard(), mode: "walk" });
    assert.equal(r.handled, true);
    await flush();
    assert.deepEqual(h.calls, [["c-1", { text: "run the tests please" }]]);
  });

  test("the Send button (send()) does the same", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("hello");
    await h.composer.send();
    assert.deepEqual(h.calls, [["c-1", { text: "hello" }]]);
  });

  test("Shift+Enter and Enter during IME composition send nothing and are left to the browser", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("line one");
    const shift = h.composer.key({ key: "Enter", shiftKey: true, inBox: true }, { card: makeCard(), mode: "walk" });
    const ime = h.composer.key({ key: "Enter", isComposing: true, inBox: true }, { card: makeCard(), mode: "walk" });
    await flush();
    assert.equal(shift.handled, false);
    assert.equal(shift.walk, false);
    assert.equal(ime.handled, false);
    assert.equal(ime.walk, false);
    assert.equal(h.calls.length, 0);
    assert.equal(h.state().open, true);
  });

  test("a second send while one is in flight is dropped, and so is T; the box is read-only and reads Sending", async () => {
    const d = deferred();
    const h = harness({ sendMessage: () => d.promise });
    openBox(h);
    h.composer.setText("first");
    const p1 = h.composer.send();
    const p2 = h.composer.send();
    h.composer.key({ key: "Enter", inBox: true }, { card: makeCard(), mode: "walk" });
    h.composer.key({ key: "t" }, { card: makeCard(), mode: "walk" });
    assert.equal(h.calls.length, 1);
    const s = h.state();
    assert.equal(s.phase, "sending");
    assert.equal(s.readOnly, true);
    assert.equal(s.sendEnabled, false);
    h.composer.setText("changed while sending");
    assert.equal(h.state().text, "first", "text is read-only while sending");
    d.resolve({ ok: true, messageId: "m-1" });
    await Promise.all([p1, p2]);
    assert.equal(h.calls.length, 1);
    assert.equal(h.opened, 1);
  });
});

describe("size and emptiness are refused in the UI before any request", () => {
  test("empty and whitespace-only text: Enter does nothing, no request, composer stays open", async () => {
    const h = harness();
    openBox(h);
    for (const text of ["", "   ", "\n\t \n"]) {
      await typeAndEnter(h, text);
      assert.equal(h.state().open, true);
      assert.equal(h.state().sendEnabled, false, JSON.stringify(text));
    }
    assert.equal(h.calls.length, 0);
  });

  test("exactly 2,048 UTF-8 bytes sends", async () => {
    const h = harness();
    openBox(h);
    const text = "€".repeat(682) + "ab"; // 2,046 + 2
    h.composer.setText(text);
    assert.equal(h.state().overLimit, false);
    assert.equal(h.state().counter, "2,048 / 2,048 bytes");
    await h.composer.send();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0][1].text, text);
  });

  test("2,049 bytes is refused: no call, alarm counter, Too long banner naming the overage", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("a".repeat(2049));
    const s = h.state();
    assert.equal(s.overLimit, true);
    assert.equal(s.sendEnabled, false);
    assert.equal(s.counter, "2,049 / 2,048 bytes");
    assert.match(s.banner, /^Too long\. 2,049 of 2,048 bytes\. Shorten it by 1 bytes? to send\./);
    await typeAndEnter(h, "a".repeat(2049));
    assert.equal(h.calls.length, 0);
    assert.equal(h.state().open, true);
  });

  test("the limit is bytes, not characters: 1,100 two-byte characters is over; 683 three-byte characters is over", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("é".repeat(1100));
    assert.equal(h.state().overLimit, true);
    assert.match(h.state().banner, /^Too long\. 2,200 of 2,048 bytes\. Shorten it by 152 bytes to send\./);
    await h.composer.send();
    h.composer.setText("€".repeat(683));
    assert.equal(h.state().overLimit, true);
    await h.composer.send();
    h.composer.setText("😀".repeat(513)); // 4-byte emoji, 2,052 bytes
    assert.equal(h.state().overLimit, true);
    await h.composer.send();
    assert.equal(h.calls.length, 0);
  });

  test("the banner clears when the text is shortened under the limit", () => {
    const h = harness();
    openBox(h);
    h.composer.setText("a".repeat(3000));
    assert.ok(h.state().banner);
    h.composer.setText("short");
    assert.equal(h.state().banner, null);
    assert.equal(h.state().overLimit, false);
    assert.equal(h.state().sendEnabled, true);
  });

  test("the counter follows every keystroke in bytes", () => {
    const h = harness();
    openBox(h);
    h.composer.setText("€€");
    assert.equal(h.state().counter, "6 / 2,048 bytes");
  });

  test("surrounding whitespace does not count against the limit when sending", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("  " + "a".repeat(2048) + "  ");
    await h.composer.send();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0][1].text.length, 2048);
  });
});

describe("a successful send: sent, then received", () => {
  test("on 200 the composer closes, the draft clears, focus returns, and the card gains Message sent", async () => {
    const h = harness();
    openBox(h, makeCard(), "walk");
    h.composer.setText("run the tests");
    await h.composer.send();
    const s = h.state();
    assert.equal(s.open, false);
    assert.equal(s.focusReturn, "scene");
    assert.equal(s.text, "");
    assert.equal(s.announcement, "Message sent to dev-02.");
    assert.equal(s.status.kind, "sent");
    assert.equal(s.status.label, "Message sent");
    assert.equal(s.status.agentId, "c-1");
    assert.match(s.status.preview, /^["“]run the tests["”]$/);
    // reopening shows an empty box: the draft was cleared
    openBox(h);
    assert.equal(h.state().text, "");
  });

  test("with the cursor free, focus returns to the card's T button", async () => {
    const h = harness();
    openBox(h, makeCard(), "free");
    h.composer.setText("hi");
    await h.composer.send();
    assert.equal(h.state().focusReturn, "card-button");
  });

  test("the preview is the first 40 characters, with an ellipsis only when longer", async () => {
    const h = harness();
    openBox(h);
    const long = "0123456789".repeat(4) + "TAIL";
    h.composer.setText(long);
    await h.composer.send();
    const p = h.state().status.preview;
    assert.ok(p.includes("0123456789".repeat(4)));
    assert.ok(!p.includes("TAIL"));
    assert.match(p, /…|\.\.\./);
    assert.match(p, /^["“].*["”]$/s);

    const h2 = harness();
    openBox(h2);
    h2.composer.setText("0123456789".repeat(4)); // exactly 40
    await h2.composer.send();
    assert.doesNotMatch(h2.state().status.preview, /…|\.\.\./);
  });

  test("the ack event carrying the returned message id moves the line to received", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    h.composer.observe(ack("m-1"));
    const s = h.state();
    assert.equal(s.status.kind, "received");
    assert.equal(s.status.label, "Message received");
    assert.match(s.status.preview, /go/);
    assert.equal(s.announcement, "Message received by dev-02.");
  });

  // den-v1 loop S5: the bridge reports a taken message on the agent's transcript (the entry's status), and every
  // snapshot and frame reaches the composer through sync().
  test("a transcript entry saying the message was applied moves the line to received", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    const agents = [{ id: "c-1", state: "working" }, { id: "c-2", state: "working" }];
    const entry = (status, messageId = "m-1") => ({ id: 3, kind: "message", role: "user", text: "go", messageId, status });
    const sync = (transcripts) => { h.composer.sync({ agents, transcripts }); return h.state().status.kind; };
    assert.equal(sync({ "c-1": { entries: [entry("queued")], dropped: 0 } }), "sent");
    assert.equal(sync({ "c-2": { entries: [entry("applied")], dropped: 0 } }), "sent", "another agent's transcript");
    assert.equal(sync({ "c-1": { entries: [entry("applied", "m-9")], dropped: 0 } }), "sent", "another message");
    assert.equal(sync({ "c-1": { entries: [{ ...entry("applied"), role: "agent" }], dropped: 0 } }), "sent", "not the user's own entry");
    for (const bad of [undefined, null, {}, { "c-1": null }, { "c-1": { entries: "x" } }, { "c-1": { entries: [null, 7] } }]) assert.equal(sync(bad), "sent");
    assert.equal(sync({ "c-1": { entries: [entry("applied")], dropped: 0 } }), "received");
    assert.equal(h.state().announcement, "Message received by dev-02.");
  });

  test("a line that had stalled still becomes received when the transcript says so", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    h.advance(ACK_WAIT_MS + 1);
    h.composer.tick();
    assert.equal(h.state().status.kind, "stalled");
    h.composer.sync({ agents: [{ id: "c-1", state: "working" }], transcripts: { "c-1": { entries: [{ id: 1, kind: "message", role: "user", messageId: "m-1", status: "applied" }] } } });
    assert.equal(h.state().status.kind, "received");
  });

  test("the live transcripts are handed to the composer", () => {
    const hook = readFileSync(new URL("./MessageComposer.jsx", import.meta.url), "utf8");
    const app = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
    assert.match(hook, /composer\.sync\(\{ agents: snapshot\?\.agents \?\? \[\], transcripts \}\)/);
    assert.match(app, /useMessageComposer\(\{[^}]*transcripts: live\.transcripts/);
  });

  test("an ack for any other message id is ignored", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    h.composer.observe(ack("m-999"));
    h.composer.observe({ type: "message-ack", agentId: "c-1" });
    h.composer.observe({ type: "agent", id: "c-1", state: "working" });
    h.composer.observe(null);
    assert.equal(h.state().status.kind, "sent");
  });

  test("an ack before any send does nothing", () => {
    const h = harness();
    h.composer.observe(ack("m-1"));
    assert.equal(h.state().status, null);
  });

  test("sending another message replaces the line; the old message's ack is then ignored", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("first");
    await h.composer.send();
    openBox(h);
    h.composer.setText("second");
    await h.composer.send();
    assert.match(h.state().status.preview, /second/);
    h.composer.observe(ack("m-1"));
    assert.equal(h.state().status.kind, "sent");
    assert.match(h.state().status.preview, /second/);
    h.composer.observe(ack("m-2"));
    assert.equal(h.state().status.kind, "received");
  });

  test("without an ack for 20 s the line reads Sent, not yet received; a late ack still moves it to received", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    h.advance(ACK_WAIT_MS - 1);
    h.composer.tick();
    assert.equal(h.state().status.kind, "sent");
    h.advance(1);
    h.composer.tick();
    const s = h.state();
    assert.equal(s.status.kind, "stalled");
    assert.equal(s.status.label, "Sent, not yet received");
    assert.equal(s.announcement, "Message sent, not yet received.");
    h.composer.observe(ack("m-1"));
    assert.equal(h.state().status.kind, "received");
    assert.equal(h.state().status.label, "Message received");
  });

  test("an ack before 20 s is not undone by the clock", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    h.composer.observe(ack("m-1"));
    h.advance(ACK_WAIT_MS * 3);
    h.composer.tick();
    assert.equal(h.state().status.kind, "received");
  });

  test("the 20 s are counted from the 200, not from the keypress", async () => {
    const d = deferred();
    const h = harness({ sendMessage: () => d.promise });
    openBox(h);
    h.composer.setText("go");
    const p = h.composer.send();
    h.advance(15000);
    d.resolve({ ok: true, messageId: "m-1" });
    await p;
    h.advance(10000);
    h.composer.tick();
    assert.equal(h.state().status.kind, "sent");
    h.advance(10000);
    h.composer.tick();
    assert.equal(h.state().status.kind, "stalled");
  });

  test("subscribers hear every change, including the ack and the clock", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    const before = h.states.length;
    h.composer.observe(ack("m-1"));
    assert.ok(h.states.length > before);
    assert.notEqual(h.states.at(-1), h.states[before - 1], "a new view object per change");
  });
});

describe("the status line follows the card's agent", () => {
  test("statusFor returns the line for the agent's card and null for another panda's card or no card", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    assert.equal(h.composer.statusFor(makeCard()).label, "Message sent");
    assert.equal(h.composer.statusFor(otherCard), null);
    assert.equal(h.composer.statusFor(null), null);
  });

  test("the line is dropped when the agent ends", async () => {
    for (const state of ["done", "failed", "terminated"]) {
      const h = harness();
      openBox(h);
      h.composer.setText("go");
      await h.composer.send();
      h.composer.sync({ agents: [{ id: "c-1", state }] });
      assert.equal(h.state().status, null, state);
      assert.equal(h.composer.statusFor(makeCard()), null, state);
    }
  });

  test("a live agent in a snapshot keeps the line", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("go");
    await h.composer.send();
    h.composer.sync({ agents: [{ id: "c-1", state: "working" }] });
    assert.equal(h.state().status.kind, "sent");
  });
});

describe("refusals", () => {
  for (const [label, err] of [
    ["400", rejectWith(400, "text must be 1 to 2048 bytes")],
    ["429", rejectWith(429, "Too many messages. Wait a moment.")],
    ["500", rejectWith(500, "internal error")],
    ["503", rejectWith(503, "runtime busy")],
    ["network", rejectWith(0, "Could not reach the bridge.")],
  ]) {
    test(`${label}: the composer stays open with the text kept, a banner with the reason verbatim, and Enter retries`, async () => {
      let attempt = 0;
      const h = harness({ sendMessage: async () => { if (++attempt === 1) throw err; return { ok: true, messageId: "m-ok" }; } });
      openBox(h);
      h.composer.setText("keep me");
      await h.composer.send();
      const s = h.state();
      assert.equal(s.open, true);
      assert.equal(s.phase, "refused");
      assert.equal(s.text, "keep me");
      assert.equal(s.readOnly, false);
      assert.equal(s.sendEnabled, true);
      assert.equal(s.focus, "box");
      assert.equal(s.banner, `Not sent. ${err.reason} Nothing changed. Press Enter to try again.`);
      assert.equal(s.status, null, "a refused send leaves no Message sent line");
      h.composer.key({ key: "Enter", inBox: true }, { card: makeCard(), mode: "walk" });
      await flush();
      assert.equal(h.calls.length, 2);
      assert.equal(h.state().open, false);
      assert.equal(h.state().status.kind, "sent");
    });
  }

  test("401 is final: the session-ended banner, a read-only box, no retry, Esc is the only way out", async () => {
    const h = harness({ sendMessage: async () => { throw rejectWith(401, "unauthorized"); } });
    openBox(h);
    h.composer.setText("keep me");
    await h.composer.send();
    const s = h.state();
    assert.equal(s.open, true);
    assert.equal(s.phase, "final");
    assert.equal(s.banner, "Session ended. Restart the bridge and open the launch link it prints.");
    assert.equal(s.readOnly, true);
    assert.equal(s.sendEnabled, false);
    assert.equal(s.focus, "close");
    await typeAndEnter(h, "again");
    await h.composer.send();
    assert.equal(h.calls.length, 1, "no second request after a final refusal");
    h.composer.key({ key: "Escape", inBox: true }, { card: makeCard(), mode: "walk" });
    assert.equal(h.state().open, false);
  });

  for (const status of [404, 409]) {
    test(`${status} is final: Too late with the bridge's reason`, async () => {
      const h = harness({ sendMessage: async () => { throw rejectWith(status, "agent is not accepting messages"); } });
      openBox(h);
      h.composer.setText("hi");
      await h.composer.send();
      const s = h.state();
      assert.equal(s.phase, "final");
      assert.equal(s.banner, "Too late. agent is not accepting messages");
      assert.equal(s.readOnly, true);
      assert.equal(s.sendEnabled, false);
      await h.composer.send();
      assert.equal(h.calls.length, 1);
    });
  }

  test("the reason is kept as plain text, never reshaped", async () => {
    const reason = "<img src=x onerror=alert(1)> & \"quotes\"";
    const h = harness({ sendMessage: async () => { throw rejectWith(500, reason); } });
    openBox(h);
    h.composer.setText("hi");
    await h.composer.send();
    assert.ok(h.state().banner.includes(reason));
  });

  test("a refusal does not clear the older line from a previous successful message", async () => {
    let attempt = 0;
    const h = harness({ sendMessage: async () => { if (++attempt === 2) throw rejectWith(500, "boom"); return { ok: true, messageId: `m-${attempt}` }; } });
    openBox(h);
    h.composer.setText("first");
    await h.composer.send();
    openBox(h);
    h.composer.setText("second");
    await h.composer.send();
    assert.equal(h.state().phase, "refused");
    assert.match(h.state().status.preview, /first/);
  });
});

describe("agent ended while the composer is open", () => {
  test("becomes final with Agent ended and the state; sending is off", async () => {
    const h = harness();
    openBox(h);
    h.composer.setText("hi");
    h.composer.sync({ agents: [{ id: "c-1", state: "done" }] });
    const s = h.state();
    assert.equal(s.phase, "final");
    assert.match(s.banner, /Agent ended: done/);
    assert.equal(s.readOnly, true);
    assert.equal(s.sendEnabled, false);
    await h.composer.send();
    assert.equal(h.calls.length, 0);
  });

  test("a snapshot for another agent ending changes nothing", () => {
    const h = harness();
    openBox(h);
    h.composer.sync({ agents: [{ id: "c-2", state: "done" }, { id: "c-1", state: "working" }] });
    assert.equal(h.state().phase, "ready");
  });
});

describe("drafts", () => {
  test("Esc keeps the text per agent; reopening restores it; another agent has its own draft", () => {
    const h = harness();
    openBox(h);
    h.composer.setText("half a thought");
    h.composer.key({ key: "Escape", inBox: true }, { card: makeCard(), mode: "walk" });
    openBox(h);
    assert.equal(h.state().text, "half a thought");
    h.composer.close();
    openBox(h, otherCard);
    assert.equal(h.state().text, "");
    assert.equal(h.state().overline, "Message qa-01");
    h.composer.setText("for qa");
    h.composer.close();
    openBox(h);
    assert.equal(h.state().text, "half a thought");
  });

  test("a draft survives a refused send and is not sent twice", async () => {
    const h = harness({ sendMessage: async () => { throw rejectWith(500, "x"); } });
    openBox(h);
    h.composer.setText("again");
    await h.composer.send();
    h.composer.close();
    openBox(h);
    assert.equal(h.state().text, "again");
  });
});

describe("disabled and demo", () => {
  const live = (caps) => ({ id: "c-1", ref: "den-v1/07-message-t", state: "working", capabilities: caps });
  const viewer = { x: 0, z: 0, yaw: Math.PI / 2 };
  const pandaWith = (agent, state) => ({ id: "p", name: "dev-02", role: "developer", state, position: { x: -2, z: 0 }, ...(agent ? { agent } : {}) });

  test("the composer does not open for a panda the bridge cannot start, a board-bound panda or a runtime that cannot send, and gives cardFor's reason", () => {
    const cases = [
      [{ ...pandaWith(null, "resident"), role: "debugger" }, "no agent running"],
      [pandaWith(null, "working"), "agent controls unavailable"],
      [pandaWith(live({ send: false, approve: true }), "working"), "runtime cannot send messages"],
      [pandaWith(live({}), "working"), "runtime cannot send messages"],
    ];
    for (const [panda, reason] of cases) {
      const h = harness();
      const card = cardFor([panda], [], viewer);
      const r = h.composer.open(card, { mode: "walk" });
      assert.deepEqual(r, { opened: false, reason });
      assert.equal(h.state().open, false);
      assert.equal(h.opened, 0);
      const k = h.composer.key({ key: "t" }, { card, mode: "walk" });
      assert.equal(k.handled, false);
      assert.equal(h.state().open, false);
    }
  });

  test("a runtime that can send opens", () => {
    const h = harness();
    const card = cardFor([pandaWith(live({ send: true }), "working")], [], viewer);
    assert.equal(h.composer.open(card, { mode: "walk" }).opened, true);
    assert.equal(h.state().overline, "Message dev-02");
  });

  test("demo mode disables T with its reason and sends nothing", () => {
    const h = harness();
    assert.deepEqual(h.composer.open(makeCard(), { mode: "walk", demo: true }), { opened: false, reason: "Demo mode: actions are off" });
    assert.equal(h.composer.key({ key: "t" }, { card: makeCard(), mode: "walk", demo: true }).handled, false);
    assert.equal(h.state().open, false);
    assert.equal(h.calls.length, 0);
  });

  test("a null card does not open", () => {
    const h = harness();
    assert.equal(h.composer.open(null, { mode: "walk" }).opened, false);
  });
});

describe("no live runtime is needed", () => {
  test("a whole open, send, ack and close runs with global fetch poisoned", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error("network request attempted"); };
    try {
      const h = harness();
      openBox(h);
      h.composer.setText("hello");
      await h.composer.send();
      h.composer.observe(ack("m-1"));
      assert.equal(h.state().status.kind, "received");
      assert.deepEqual(h.calls, [["c-1", { text: "hello" }]]);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
