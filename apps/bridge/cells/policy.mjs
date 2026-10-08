// organism-infra/140 (ADR 0016 decision 3): the steering host's policy values and role table, in one place.
// Mechanism lives in host.mjs; every number and allowlist a reviewer may want to change lives here.

export const MAX_CONCURRENT_AGENTS = 2; // max_concurrent_cells (CLAUDE.md, ADR 0002)
export const SESSION_CAP = 8; // hard ceiling on live daemon-spawned sessions; a policy override can only lower it
export const KILL_GRACE_MS = 5000; // between stdin close, SIGTERM and SIGKILL
export const USAGE_REFUSE_AT = 90; // five-hour usage percent at which dispatch is refused (ADR 0002 auto-pause)

// The nine known cells (CLAUDE.md).
export const ROLES = ["product", "architect", "orchestrator", "developer", "scout", "qa", "security", "designer", "herald"];
// Refused on the HTTP route ("dispatch the orchestrator"); only the internal start() entry may start them.
export const RELAY_HOP_ROLES = ["developer", "qa", "security"];
// mode reaches the prompt template, so it is an allowlist, never free text.
export const MODES = ["specify", "verify", "review", "spec", "critique", "direction"];

// The director's states (ADR 0007). A runtime may report the live ones; the host alone decides the end states.
export const LIVE_STATES = ["working", "waiting_on_user", "blocked", "throttled", "idle"];

// ref: no segment starts with "-" (it must never look like a flag). Ticket numbers are two or more digits
// (ADR 0016 says \d{2}; the board has three-digit tickets such as 140).
export const REF_RE = /^[a-z0-9][a-z0-9-]*\/\d{2,}-[a-z0-9][a-z0-9-]*$/;
export const AGENT_ID_RE = /^c-[0-9a-f]{16}$/; // approval ids are a-
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// organism-infra/141 (ADR 0016 decision 4 and 6.5, 6.7): held permission requests.
export const APPROVAL_TTL_MS = 10 * 60 * 1000; // an undecided approval expires, and the child is answered deny
export const APPROVAL_CAP_PER_AGENT = 20; // pending approvals per agent; the 21st expires the oldest
export const APPROVAL_ID_RE = /^a-[0-9a-f]{16}$/;
export const APPROVAL_NOTE_MAX = 500; // characters in a decision note
export const APPROVAL_INPUT_MAX = 256 * 1024; // serialised tool input; a bigger request is answered deny, never held
export const APPROVAL_HISTORY_CAP = 200; // settled approvals kept for the snapshot, oldest dropped first
export const REQUEST_ID_MAX = 128; // the child's opaque request id (ADR 0016 6.5)
export const REQUEST_IDS_PER_AGENT = 1000; // request ids remembered per agent; past it every request is answered deny
