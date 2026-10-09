// organism-infra/209: the band text for den v1 progress. Pure and dependency-free: a mod runs with
// no Node. Input is what scripts/north-star.mjs returns: { done, total, remaining, next }.
//   ████████░░░░ v1 8/12 · next: 143
const WIDTH = 12;

export function renderBand(progress) {
  const { done, total, next } = progress ?? {};
  if (!total) return "";
  const fill = done >= total ? WIDTH : Math.min(WIDTH - 1, Math.round((done / total) * WIDTH));
  const bar = "█".repeat(fill) + "░".repeat(WIDTH - fill);
  const num = next ? /(?:^|\/)0*(\d+)/.exec(next)?.[1] : null;
  return `${bar} v1 ${done}/${total}${num ? ` · next: ${num}` : ""}`;
}
