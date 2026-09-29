// Connection state behind the header pill (designer spec section 1). Pure; time is passed in.
export const OFFLINE_AFTER_MS = 10000;

export function initialConnection(now) {
  return { phase: "connecting", hasSnapshot: false, downSince: now };
}

export function connectionReducer(conn, { type, now }) {
  if (type === "snapshot") return { phase: "live", hasSnapshot: true, downSince: null };
  if (type === "open") return conn;
  if (type === "error" && conn.phase === "live") return { ...conn, phase: "reconnecting", downSince: now };
  if (type === "error" || type === "tick") {
    if (conn.phase !== "live" && conn.phase !== "offline" && conn.downSince !== null && now - conn.downSince > OFFLINE_AFTER_MS) {
      return { ...conn, phase: "offline" };
    }
    return conn;
  }
  return conn;
}

export function pillModel(conn) {
  if (conn.phase === "live") return { label: "Live", tone: "live", ariaLive: null };
  if (conn.phase === "offline") return { label: "Bridge offline: run npm run ui", tone: "alarm", ariaLive: null };
  return { label: "Reconnecting...", tone: "muted", ariaLive: "polite" };
}

export function panelPlaceholder(conn) {
  return conn.hasSnapshot ? null : "Connecting to the den...";
}
