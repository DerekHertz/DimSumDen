// den-v1/09: entering and leaving Demo mode. Contract (qa specify):
//   apps/ui/src/demo/demo-mode.mjs exports createDemoMode({ location, history, replay, hooks = {} }) ->
//     { getState(), subscribe(fn) -> unsubscribe, enter(), leave(), toggle(), tick() }
//   location is { pathname, search, hash }; history only needs replaceState(state, title, url): the module never reloads,
//   pushes, assigns or writes location.href. replay is a createDemoReplay(...) instance the mode starts and stops.
//   Demo is on at creation when the query has demo=den (and only that value: demo=handoff and the dev-only demo=approval stay
//   off), and then nothing is announced and hooks.onChange is not called. enter() and leave() are no-ops when already in that
//   state; otherwise they replaceState the URL (adding or dropping only the demo param), start or stop the replay, set the
//   announcement, and call hooks.onChange(active) once, after getState() already shows the new state. The App uses onChange to
//   exit walk mode, close the composer, review and transcript panels, and clear the nearby card.
//   getState() -> { active, label, announcement, snapshot, transcripts }: label is "Leave demo" while active else
//   "Watch the demo"; snapshot and transcripts come from the replay while active and are null otherwise. It returns the same
//   object until something changes. tick() forwards to the replay while active and notifies subscribers when it changed.
// Criterion: AC 5 (entry and leave from the control and from the URL parameter), spec flow 1-4.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createDemoMode } from "./demo-mode.mjs";
import { createDemoReplay } from "./demo-replay.mjs";
import { DEMO_FIXTURE } from "./demo-fixture.mjs";
import { clock } from "./demo-test-helpers.mjs";

const ON = "Demo mode on. Playing recorded events.";
const OFF = "Demo mode off. Showing the live den.";

function setup(url = "/") {
  const base = new URL(url, "http://den.test");
  const location = {
    pathname: base.pathname, search: base.search, hash: base.hash,
    assign() { throw new Error("location.assign"); },
    reload() { throw new Error("location.reload"); },
  };
  const calls = [];
  const history = {
    replaceState(_state, _title, next) {
      calls.push(String(next));
      const u = new URL(String(next), `http://den.test${location.pathname}${location.search}${location.hash}`);
      location.pathname = u.pathname; location.search = u.search; location.hash = u.hash;
    },
    pushState() { throw new Error("history.pushState"); },
  };
  const c = clock();
  const replay = createDemoReplay({ now: c.now });
  const changes = [];
  const mode = createDemoMode({ location, history, replay, hooks: { onChange: (active) => changes.push({ active, seen: mode.getState().active }) } });
  const params = () => new URLSearchParams(location.search);
  return { mode, location, history, calls, c, replay, changes, params };
}

describe("the URL parameter", () => {
  test("?demo=den starts Demo mode on load, silently, with the replay running", () => {
    const t = setup("/?demo=den");
    const s = t.mode.getState();
    assert.equal(s.active, true);
    assert.equal(s.label, "Leave demo");
    assert.ok(s.snapshot && s.transcripts);
    assert.equal(t.replay.getState().running, true);
    assert.deepEqual(t.calls, []);
    assert.deepEqual(t.changes, []);
    assert.equal(s.announcement ?? null, null);
  });
  test("no param, or another demo (handoff, approval, anything), leaves it off", () => {
    for (const url of ["/", "/?x=1", "/?demo=handoff", "/?demo=approval", "/?demo=nope", "/?demo="]) {
      const s = setup(url).mode.getState();
      assert.equal(s.active, false, url);
      assert.equal(s.label, "Watch the demo", url);
      assert.equal(s.snapshot, null, url);
      assert.equal(s.transcripts, null, url);
    }
  });
});

describe("entering from the control", () => {
  test("adds ?demo=den in place (no reload), keeps the rest of the URL, starts the replay and announces it", () => {
    const t = setup("/den?x=1#frag");
    t.mode.enter();
    assert.equal(t.calls.length, 1);
    assert.equal(t.params().get("demo"), "den");
    assert.equal(t.params().get("x"), "1");
    assert.equal(t.location.pathname, "/den");
    const s = t.mode.getState();
    assert.equal(s.active, true);
    assert.equal(s.label, "Leave demo");
    assert.equal(s.announcement, ON);
    assert.ok(s.snapshot && s.transcripts);
    assert.equal(t.replay.getState().running, true);
  });
  test("tells the App once, after the state shows demo, so it can exit walk mode and close the panels", () => {
    const t = setup("/");
    t.mode.enter();
    assert.deepEqual(t.changes, [{ active: true, seen: true }]);
  });
  test("entering again changes nothing", () => {
    const t = setup("/");
    t.mode.enter();
    const before = t.mode.getState();
    t.mode.enter();
    assert.equal(t.calls.length, 1);
    assert.equal(t.changes.length, 1);
    assert.equal(t.mode.getState(), before);
  });
});

describe("leaving", () => {
  test("drops only the demo param (no reload), stops the replay, clears the scene and announces it", () => {
    const t = setup("/den?x=1&demo=den");
    t.mode.leave();
    assert.equal(t.calls.length, 1);
    assert.equal(t.params().has("demo"), false);
    assert.equal(t.params().get("x"), "1");
    const s = t.mode.getState();
    assert.equal(s.active, false);
    assert.equal(s.label, "Watch the demo");
    assert.equal(s.announcement, OFF);
    assert.equal(s.snapshot, null);
    assert.equal(s.transcripts, null);
    assert.equal(t.replay.getState().running, false);
    assert.deepEqual(t.changes, [{ active: false, seen: false }]);
  });
  test("when ?demo=den was the only param the URL is left clean", () => {
    const t = setup("/?demo=den");
    t.mode.leave();
    assert.equal(t.location.search, "");
    assert.equal(t.location.pathname, "/");
  });
  test("leaving while not in demo does nothing", () => {
    const t = setup("/?x=1");
    t.mode.leave();
    assert.deepEqual(t.calls, []);
    assert.deepEqual(t.changes, []);
    assert.equal(t.mode.getState().announcement ?? null, null);
  });
  test("the live den is back: the mode no longer supplies a snapshot, and ticking does nothing", () => {
    const t = setup("/?demo=den");
    t.mode.leave();
    const frozen = t.replay.getState();
    t.c.advance(DEMO_FIXTURE.loopMs * 2);
    t.mode.tick();
    assert.equal(t.replay.getState(), frozen);
    assert.equal(t.mode.getState().snapshot, null);
  });
});

describe("toggle, re-entry and the loop", () => {
  test("toggle() is the button: enter, then leave, then enter", () => {
    const t = setup("/");
    t.mode.toggle(); assert.equal(t.mode.getState().active, true);
    t.mode.toggle(); assert.equal(t.mode.getState().active, false);
    t.mode.toggle(); assert.equal(t.mode.getState().active, true);
    assert.deepEqual(t.changes.map((x) => x.active), [true, false, true]);
    assert.equal(t.params().get("demo"), "den");
  });
  test("entering again starts the recording over from the beginning", () => {
    const t = setup("/");
    t.mode.enter();
    const first = JSON.stringify(t.mode.getState().transcripts);
    t.c.at(DEMO_FIXTURE.loopMs - 100);
    t.mode.tick();
    assert.notEqual(JSON.stringify(t.mode.getState().transcripts), first, "the replay moved on");
    t.mode.leave();
    t.mode.enter();
    assert.equal(t.replay.getState().loops, 0);
    assert.equal(JSON.stringify(t.mode.getState().transcripts), first);
  });
  test("tick() moves the replay on and tells subscribers; state stays the same object while nothing changes", () => {
    const t = setup("/?demo=den");
    let heard = 0;
    const off = t.mode.subscribe(() => { heard += 1; });
    const a = t.mode.getState();
    assert.equal(t.mode.getState(), a);
    t.c.at(DEMO_FIXTURE.loopMs - 100);
    t.mode.tick();
    assert.ok(heard >= 1);
    assert.notEqual(t.mode.getState(), a);
    const b = t.mode.getState();
    t.mode.tick();
    assert.equal(t.mode.getState(), b);
    off();
    const was = heard;
    t.mode.leave();
    assert.equal(heard, was, "unsubscribed");
  });
  test("a loop restart makes no new announcement", () => {
    const t = setup("/");
    t.mode.enter();
    t.c.at(DEMO_FIXTURE.loopMs + 100);
    t.mode.tick();
    assert.equal(t.replay.getState().loops, 1);
    assert.equal(t.mode.getState().announcement, ON);
    assert.equal(t.mode.getState().active, true);
  });
  test("subscribers hear enter and leave", () => {
    const t = setup("/");
    let heard = 0;
    t.mode.subscribe(() => { heard += 1; });
    t.mode.enter();
    t.mode.leave();
    assert.ok(heard >= 2);
  });
});
