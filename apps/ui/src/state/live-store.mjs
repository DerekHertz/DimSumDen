// State holder a React component subscribes to. The EventSource and fetch are injected.
import { applyEvent } from "./apply-event.mjs";
import { initialConnection, connectionReducer } from "./connection.mjs";
import { appendTranscript, entryFromFrame, seedTranscripts } from "./transcript-buffer.mjs";

export function createLiveStore({ connect, fetchState, now }) {
  let state = { snapshot: null, connection: initialConnection(now()), metricsRevision: 0, transcripts: {} };
  const listeners = new Set();
  let handle = null;
  let closed = false;

  const set = (patch) => {
    state = { ...state, ...patch };
    for (const fn of [...listeners]) fn();
  };
  const conn = (type) => connectionReducer(state.connection, { type, now: now() });
  // Every snapshot (first load, reconnect, refetch) carries what the bridge kept of each transcript; it replaces
  // those agents' buffers, so nothing is lost or doubled across a gap.
  const withSnapshot = (snapshot) => ({ snapshot, connection: conn("snapshot"), transcripts: seedTranscripts(state.transcripts, snapshot?.transcripts) });

  async function refetch() {
    try {
      const snapshot = await fetchState();
      if (closed) return;
      set(withSnapshot(snapshot));
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
        onSnapshot: (snapshot) => set(withSnapshot(snapshot)),
        onChange: (event) => {
          if (!state.snapshot) return;
          // Transcript entries ride the normal seq sequence; buffer a frame once (a replayed seq is skipped).
          const line = event.seq > state.snapshot.seq ? entryFromFrame(event) : null;
          if (line) state = { ...state, transcripts: appendTranscript(state.transcripts, line.agentId, line.entry) };
          const next = applyEvent(state.snapshot, event);
          if (!next) {
            refetch();
            // refetch() does not notify until the snapshot arrives, so publish a buffered line now.
            if (line) set({});
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
