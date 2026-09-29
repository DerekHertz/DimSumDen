// State holder a React component subscribes to. The EventSource and fetch are injected.
import { applyEvent } from "./apply-event.mjs";
import { initialConnection, connectionReducer } from "./connection.mjs";

export function createLiveStore({ connect, fetchState, now }) {
  let state = { snapshot: null, connection: initialConnection(now()), metricsRevision: 0 };
  const listeners = new Set();
  let handle = null;
  let closed = false;

  const set = (patch) => {
    state = { ...state, ...patch };
    for (const fn of [...listeners]) fn();
  };
  const conn = (type) => connectionReducer(state.connection, { type, now: now() });

  async function refetch() {
    try {
      const snapshot = await fetchState();
      if (closed) return;
      set({ snapshot, connection: conn("snapshot") });
    } catch {
      // the stream's error handling owns the connection state
    }
  }

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    start() {
      closed = false;
      handle = connect({
        onOpen: () => {
          const c = conn("open");
          if (c !== state.connection) set({ connection: c });
        },
        onSnapshot: (snapshot) => set({ snapshot, connection: conn("snapshot") }),
        onChange: (event) => {
          if (!state.snapshot) return;
          const next = applyEvent(state.snapshot, event);
          if (!next) {
            refetch();
            return;
          }
          const patch = { snapshot: next };
          if (event.type === "metrics-changed") patch.metricsRevision = state.metricsRevision + 1;
          set(patch);
        },
        onError: () => {
          const c = conn("error");
          if (c !== state.connection) set({ connection: c });
        },
      });
    },
    tick() {
      const c = conn("tick");
      if (c !== state.connection) set({ connection: c });
    },
    close() {
      closed = true;
      handle?.close();
      handle = null;
    },
  };
}
