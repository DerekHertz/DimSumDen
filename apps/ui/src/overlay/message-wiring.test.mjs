// den-v1/07: wiring checks the pure controller tests cannot see. Contract (qa specify):
//   apps/ui/src/overlay/MessageComposer.jsx is the composer; App.jsx mounts <MessageComposer and the bridge client it
//   uses comes from createBridgeClient({ fetch: <the session's fetch> }) (already built for the approval panel).
//   ProximityCard.jsx renders the card's status line from the composer and no longer says "Messaging coming next";
//   T on the card calls an onMessage handler.
// Layout, motion, contrast, focus rings, the phone bottom sheet and the dot cross-fade are human-verified (the ticket
// says: no browser-measurement tests; the layout comes from the mockup).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const overlayDir = new URL("../overlay/", import.meta.url);
const sources = () => readdirSync(overlayDir)
  .filter((f) => /\.(jsx|mjs)$/.test(f) && !/\.test\./.test(f))
  .map((f) => read(`../overlay/${f}`)).join("\n");

describe("wiring", () => {
  test("App mounts the message composer", () => {
    assert.match(read("../App.jsx"), /<MessageComposer\b/);
  });

  test("the composer controller contains no network primitive and is not built from the token", () => {
    assert.doesNotMatch(read("./message-composer.mjs"), /\bfetch\s*\(|XMLHttpRequest|EventSource|WebSocket|sendBeacon|Bearer|localStorage|sessionStorage/);
  });

  test("the card's T opens the composer and the card renders the status line", () => {
    const card = read("./ProximityCard.jsx");
    assert.match(card, /onMessage/);
    assert.doesNotMatch(card, /Messaging coming next/);
    assert.doesNotMatch(card, /T stays read-only/);
    assert.match(card, /Message sent|status/);
    assert.match(card, /Demo mode: actions are off/);
  });

  test("the composer carries the spec's roles, labels and copy", () => {
    const all = sources();
    for (const text of [
      'role="group"', 'role="alert"', "Message ", "Tell ", "what to do next", "Enter send", "Shift+Enter new line", "Esc cancel",
      "One message, sent to this agent only", "2,048", "Too long.", "Sending", "Not sent.", "Too late.",
      "Nothing changed. Press Enter to try again.", "Session ended. Restart the bridge and open the launch link it prints.",
      "Message sent", "Message received", "Sent, not yet received", "Cancel", "Send",
    ]) assert.ok(all.includes(text), `missing in overlay sources: ${text}`);
    assert.match(all, /aria-live/);
    assert.match(all, /aria-describedby/);
    assert.match(all, /isComposing/);
    assert.match(all, /<textarea\b/);
    assert.match(all, /<kbd\b/);
  });

  test("text and refusal reasons are inserted as plain text, never as HTML", () => {
    const all = sources();
    assert.doesNotMatch(all, /dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML/);
  });

  test("the stylesheet styles the composer and respects reduced motion", () => {
    const css = read("../scene/procedural/den.css") + read("../styles.css");
    assert.match(css, /\.message-composer/);
    assert.match(css, /prefers-reduced-motion/);
  });
});
