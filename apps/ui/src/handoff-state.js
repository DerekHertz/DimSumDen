// Thin React adapters for showcase-v1/04 (the logic lives in scene/handoffs.mjs).
import { useEffect, useRef, useState } from "react";
import { deriveHandoffs } from "./scene/handoffs.mjs";
import { DEMO_STEPS, DEMO_STEP_MS } from "./scene/handoff-fixture.mjs";

/** How long a handoff stays "live" (the heart bubble shows) after it is derived. */
export const HANDOFF_LIVE_MS = 2500;

/** Derives handoffs each time the snapshot changes; each carries a fresh `id` and expires. */
export function useHandoffs(snapshot) {
  const prev = useRef(null);
  const nextId = useRef(1);
  const [live, setLive] = useState([]);
  useEffect(() => {
    const found = deriveHandoffs(prev.current, snapshot).map((h) => ({ ...h, id: nextId.current++ }));
    prev.current = snapshot;
    if (!found.length) return undefined;
    setLive((cur) => [...cur, ...found]);
    const ids = new Set(found.map((h) => h.id));
    const timer = setTimeout(() => setLive((cur) => cur.filter((h) => !ids.has(h.id))), HANDOFF_LIVE_MS);
    return () => clearTimeout(timer);
  }, [snapshot]);
  return live;
}

/** ?demo=handoff plays the scripted run (scene/handoff-fixture.mjs) instead of the live snapshot. */
export const demoRequested = () => new URLSearchParams(location.search).get("demo") === "handoff";

export function useDemoSnapshot(enabled) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => setStep((s) => (s + 1) % DEMO_STEPS.length), DEMO_STEP_MS);
    return () => clearInterval(timer);
  }, [enabled]);
  return enabled ? DEMO_STEPS[step] : null;
}
