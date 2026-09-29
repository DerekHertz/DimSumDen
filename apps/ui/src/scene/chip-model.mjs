// Status chip copy and tone per pose (designer spec section 2). Pure.
const CHIPS = {
  working: { label: "Working", tone: "working" },
  waiting_on_user: { label: "Needs you", tone: "lantern" },
  blocked: { label: "Blocked", tone: "blocked" },
  done: { label: "Done", tone: "done" },
  idle: { label: "Queued", tone: "idle" },
};

export function chipModel(cell, title) {
  const chip = CHIPS[cell.pose] ?? CHIPS.idle;
  return { ...chip, ariaLabel: `${title ?? cell.ref}, ${chip.label}` };
}
