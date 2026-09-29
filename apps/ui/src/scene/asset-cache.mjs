// dimsumden-ui-v0/15: load each asset url once and share the result; a failed load is dropped so a
// later request retries. Pure: the loader is injected.
export function createAssetCache(load) {
  const pending = new Map();
  return {
    get(url) {
      let p = pending.get(url);
      if (!p) {
        p = Promise.resolve().then(() => load(url));
        p.catch(() => pending.delete(url));
        pending.set(url, p);
      }
      return p;
    },
  };
}
