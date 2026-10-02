// Orders board refs (`<feature>/<NN-slug>`) with digit runs compared as numbers, so
// 99 sorts before 100. Everything else compares by code unit, so two-digit refs
// order exactly as a plain string compare.
const CHUNK = /(\d+)|(\D+)/g;

export function compareRefs(a, b) {
  const x = String(a).match(CHUNK) ?? [];
  const y = String(b).match(CHUNK) ?? [];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const p = x[i];
    const q = y[i];
    if (p === q) continue;
    if (/^\d/.test(p) && /^\d/.test(q)) {
      // Compare as digit strings, not Number: runs past 2^53 lose precision and
      // past ~309 digits overflow to Infinity. Strip leading zeros, then the
      // longer run is larger, then lexicographic.
      const m = p.replace(/^0+/, "");
      const n = q.replace(/^0+/, "");
      if (m.length !== n.length) return m.length < n.length ? -1 : 1;
      if (m !== n) return m < n ? -1 : 1;
      continue; // same value with different padding: let the rest decide
    }
    return p < q ? -1 : 1;
  }
  if (x.length !== y.length) return x.length < y.length ? -1 : 1;
  const s = String(a);
  const t = String(b);
  return s < t ? -1 : s > t ? 1 : 0;
}
