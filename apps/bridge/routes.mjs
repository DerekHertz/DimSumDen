// organism-infra/139 (ADR 0016 decision 6.1): the one route registry. Every route the bridge answers is a row
// here; the server dispatches from it and the auth tests enumerate it, so a new route is gated by default.
//   auth: "none"   a read; no Origin or token needed (GET only)
//         "origin" Origin and Content-Type checked, no Bearer (POST /session: this is how a token is obtained)
//         "token"  Origin, Content-Type and a valid session token
// A request that matches no row is a 404 (GET and HEAD fall through to the static UI build).
export const ROUTES = [
  { method: "GET", path: "/state", auth: "none", mutating: false },
  { method: "GET", path: "/metrics", auth: "none", mutating: false },
  { method: "GET", path: "/events", auth: "none", mutating: false },
  { method: "POST", path: "/session", auth: "origin", mutating: true },
  { method: "POST", path: "/requests", auth: "token", mutating: true },
  { method: "POST", path: "/agents", auth: "token", mutating: true },
  { method: "POST", path: "/tasks", auth: "token", mutating: true },
  { method: "POST", path: "/agents/:id/stop", auth: "token", mutating: true },
  { method: "POST", path: "/agents/:id/message", auth: "token", mutating: true },
  { method: "GET", path: "/approvals/:id", auth: "token", mutating: false },
  { method: "POST", path: "/approvals/:id", auth: "token", mutating: true },
];

// ":name" segments match any one non-empty segment. Paths are matched exactly (no trailing slash, case-sensitive).
const compile = (path) => new RegExp(`^${path.replace(/:\w+/g, "[^/]+")}$`);
const COMPILED = ROUTES.map((row) => ({ row, re: compile(row.path) }));

export function matchRoute(method, pathname) {
  return COMPILED.find(({ row, re }) => row.method === method && re.test(pathname))?.row ?? null;
}
