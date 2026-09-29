// One /metrics fetch shared by the panel Dashboard and Tally (showcase-v1/03). Refetches when
// the live store reports a metrics change (`revision`). Thin adapter: the view logic is in dashboard-model.
import { useCallback, useEffect, useState } from "react";

export function useMetrics(revision = 0) {
  const [metrics, setMetrics] = useState(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/metrics", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /metrics ${res.status}`);
      setMetrics(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load, revision]);
  return { metrics, failed, retry: load };
}
