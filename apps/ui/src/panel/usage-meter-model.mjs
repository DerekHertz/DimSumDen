// Usage meter view-model (designer spec 07 section 3).
export function usageMeterModel(usage, nowMs) {
  const label = "Plan usage (5 h)";
  if (!usage || typeof usage.fiveHour !== "number") {
    return { label, valueText: "not sampled", level: "none", statusText: null, fillPercent: 0, ariaValueNow: 0, ariaValueText: "not sampled", secondary: null };
  }
  const v = usage.fiveHour;
  const level = v >= 95 ? "at-limit" : v >= 80 ? "wind-down" : "ok";
  const parts = [];
  if (typeof usage.weekly === "number") parts.push(`weekly ${usage.weekly}%`);
  const at = Date.parse(usage.sampledAt ?? "");
  if (Number.isFinite(at)) parts.push(`sampled ${Math.max(0, Math.round((nowMs - at) / 60_000))} min ago`);
  return {
    label,
    valueText: `${v}%`,
    level,
    statusText: level === "at-limit" ? "At limit" : level === "wind-down" ? "Wind down" : null,
    fillPercent: Math.max(0, Math.min(100, v)),
    ariaValueNow: v,
    ariaValueText: `${v} percent of 5-hour window`,
    secondary: parts.length ? parts.join(" · ") : null,
  };
}
