// den-v1/09: the Demo mode control, badge, strip and polite live region (look signed off by the user 2026-10-08).
// React adapters only; the logic lives in demo-mode.mjs and demo-replay.mjs.
import { forwardRef, useEffect, useState, useSyncExternalStore } from "react";
import { createDemoMode } from "./demo-mode.mjs";
import { createDemoReplay } from "./demo-replay.mjs";

const TICK_MS = 250;

/** Builds the controller once; `onChange(active)` fires on enter and leave (not on load). Returns [state, mode]. */
export function useDemoMode(onChange) {
  const [mode] = useState(() => {
    let hook = () => {};
    const made = createDemoMode({ location: window.location, history: window.history, replay: createDemoReplay(), hooks: { onChange: (active) => hook(active) } });
    made.setHook = (fn) => { hook = fn; };
    return made;
  });
  mode.setHook(onChange);
  const state = useSyncExternalStore(mode.subscribe, mode.getState);
  useEffect(() => {
    if (!state.active) return undefined;
    const timer = setInterval(mode.tick, TICK_MS);
    return () => clearInterval(timer);
  }, [mode, state.active]);
  return [state, mode];
}

function PlayGlyph() {
  return <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" className="demo-glyph"><path d="M2 1l7 4-7 4z" fill="currentColor" /></svg>;
}

/** The badge that stands in for Live inside the logo pill. */
export function DemoBadge() {
  return <span className="live-badge demo-badge"><PlayGlyph /><span>Demo</span></span>;
}

/** Watch the demo / Leave demo, under the logo pill. */
export const DemoButton = forwardRef(function DemoButton({ state, onToggle }, ref) {
  return <button type="button" ref={ref} className="demo-button" aria-pressed={state.active} onClick={onToggle}>{state.label}</button>;
});

/** The strip at the top centre while the recording plays; the loop glyph turns once per restart. */
export function DemoStrip({ loops }) {
  return (
    <p className="demo-strip" data-overlay="demo-strip">
      <svg key={loops} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className={`demo-loop${loops > 0 ? " demo-loop-turn" : ""}`}>
        <path d="M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span>Demo mode · recorded events, looping</span>
    </p>
  );
}

/** The one polite live region for entering and leaving. */
export function DemoAnnouncer({ text }) {
  return <p className="visually-hidden" role="status" aria-live="polite">{text}</p>;
}
