// Renders a reset instant in the system time zone, e.g. "2026-10-06 00:00 PDT".
// Returns null when the instant is unknown or unparseable. Ticket organism-infra/157.
export function toLocalReset(resetsAt) {
  if (resetsAt === null || resetsAt === undefined || resetsAt === "") return null;
  const date = new Date(resetsAt);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short",
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${parts.timeZoneName}`;
}
