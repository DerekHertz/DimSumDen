// den-v1/04: pure proximity selection. Positions and yaw use the walk core's world coordinates.
// The scene supplies {id, name, role, station, position:{x,z}, ref?, state?, tool?, agent?} per panda.
export function cardFor(scenePandas, approvals, viewer) {
  if (!viewer || ![viewer.x, viewer.z, viewer.yaw].every(Number.isFinite)) return null;
  let nearest = null, distance = Infinity;
  for (const panda of scenePandas) {
    const dx = panda.position?.x - viewer.x, dz = panda.position?.z - viewer.z;
    const d = Math.hypot(dx, dz);
    if (!Number.isFinite(d) || d > 3.25 || d >= distance) continue;
    const facing = d === 0 ? 1 : (-Math.sin(viewer.yaw) * dx - Math.cos(viewer.yaw) * dz) / d;
    if (facing < Math.cos(Math.PI / 4)) continue;
    nearest = panda; distance = d;
  }
  if (!nearest) return null;
  const agent = nearest.agent?.id && !['done', 'failed', 'terminated'].includes(nearest.agent.state) ? nearest.agent : null;
  const approval = agent ? approvals.find(a => a.agentId === agent.id && (a.status ?? a.state ?? 'pending') === 'pending' && !a.decision) ?? null : null;
  const action = reason => ({ enabled: !reason, reason });
  const state = agent?.state ?? (nearest.agent ? 'resident' : nearest.state ?? 'resident');
  const inactive = agent ? null : state === 'resident' ? 'no agent running' : 'agent controls unavailable';
  const permissionReason = inactive || (agent.capabilities?.approve !== true ? 'runtime cannot answer permissions' : !approval ? 'no pending permission request' : null);
  const actions = {
    T: action(inactive || (agent.capabilities?.send !== true ? 'runtime cannot send messages' : null)),
    F: action(inactive),
    A: action(permissionReason), D: action(permissionReason),
  };
  return {
    id: nearest.id, name: nearest.name, role: nearest.role, station: nearest.station, distance,
    agentId: agent?.id ?? null, ref: agent?.ref ?? nearest.ref ?? null,
    state, tool: agent ? agent.tool ?? null : nearest.agent ? null : nearest.tool ?? null, approval, actions,
  };
}

// den-v1/06: the card's pending line. The card follows the snapshot, so the line goes when the approval leaves pending.
export function pendingLine(card) {
  return card?.approval ? `Waiting on you · ${card.approval.tool ?? 'a tool'}` : null;
}
