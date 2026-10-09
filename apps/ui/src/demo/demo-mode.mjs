// den-v1/09: entering and leaving Demo mode. A small controller the App subscribes to; the URL, the replay and the
// announcement are injected or owned here, so it is testable without a browser. It never reloads, pushes or assigns:
// the URL changes in place with history.replaceState. It makes no request.
export const DEMO_PARAM = "demo";
export const DEMO_VALUE = "den";
export const ANNOUNCE_ON = "Demo mode on. Playing recorded events.";
export const ANNOUNCE_OFF = "Demo mode off. Showing the live den.";

// The current URL with the demo param set (value) or dropped (null); path, other params and hash are kept.
function withDemo(location, value) {
  const params = new URLSearchParams(location.search);
  if (value) params.set(DEMO_PARAM, value); else params.delete(DEMO_PARAM);
  const query = params.toString();
  return `${location.pathname}${query ? `?${query}` : ""}${location.hash ?? ""}`;
}

export function createDemoMode({ location, history, replay, hooks = {} }) {
  const listeners = new Set();
  let active = new URLSearchParams(location.search).get(DEMO_PARAM) === DEMO_VALUE;
  let announcement = null;
  let view = null;
  if (active) replay.start();

  const notify = () => { for (const fn of [...listeners]) fn(); };

  function getState() {
    const run = active ? replay.getState() : null;
    if (view && view.active === active && view.announcement === announcement && view.run === run) return view;
    view = {
      active, announcement, run, label: active ? "Leave demo" : "Watch the demo",
      loops: run?.loops ?? 0, snapshot: run?.snapshot ?? null, transcripts: run?.transcripts ?? null,
    };
    return view;
  }

  function change(next, url, say) {
    history.replaceState(null, "", url);
    active = next;
    announcement = say;
    if (next) replay.start(); else replay.stop();
    notify();
    hooks.onChange?.(next);
  }

  const enter = () => { if (!active) change(true, withDemo(location, DEMO_VALUE), ANNOUNCE_ON); };
  const leave = () => { if (active) change(false, withDemo(location, null), ANNOUNCE_OFF); };

  return {
    getState,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    enter, leave,
    toggle: () => (active ? leave() : enter()),
    statusFor: (card) => (active ? replay.statusFor(card) : null),
    tick() {
      if (!active) return;
      const before = replay.getState();
      replay.tick();
      if (replay.getState() !== before) notify();
    },
  };
}
