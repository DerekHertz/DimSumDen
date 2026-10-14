// den-mvp/22: the archive's copy of GET /library. It uses the public read client Cards.jsx uses (the library is a read
// that needs no sign-in, so no credential is attached), loads when the bridge is live and again when snapshot.libraryRev changes.
import { useEffect, useMemo, useState } from "react";
import { createBridgeClient } from "../../state/bridge-client.mjs";

export function useArchiveLibrary({ rev = 0, enabled = true } = {}) {
  const reader = useMemo(() => createBridgeClient({ fetch: (url, init) => fetch(url, init) }), []);
  const [library, setLibrary] = useState(null);
  useEffect(() => {
    if (!enabled) { setLibrary(null); return undefined; }
    let current = true;
    reader.getLibrary().then((data) => { if (current) setLibrary(data); }, () => { if (current) setLibrary(null); });
    return () => { current = false; };
  }, [reader, enabled, rev]);
  return library;
}
