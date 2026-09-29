// Browser adapters for the live store (thin: the logic lives in state/*.mjs) and the React hook.
import { useEffect, useState } from "react";
import { createLiveStore } from "./state/live-store.mjs";

function eventSourceConnect(h) {
  const es = new EventSource("/events");
  es.onopen = () => h.onOpen?.();
  es.onerror = () => h.onError?.();
  es.addEventListener("snapshot", (e) => h.onSnapshot(JSON.parse(e.data)));
  es.addEventListener("change", (e) => h.onChange(JSON.parse(e.data)));
  return { close: () => es.close() };
}

export function useLiveState() {
  const [store] = useState(() =>
    createLiveStore({
      connect: eventSourceConnect,
      fetchState: async () => {
        const res = await fetch("/state", { cache: "no-store" });
        if (!res.ok) throw new Error(`GET /state ${res.status}`);
        return res.json();
      },
      now: () => Date.now(),
    }),
  );
  const [state, setState] = useState(store.getState());
  useEffect(() => {
    const off = store.subscribe(() => setState(store.getState()));
    store.start();
    const timer = setInterval(() => store.tick(), 1000);
    return () => {
      clearInterval(timer);
      off();
      store.close();
    };
  }, [store]);
  return state;
}
