# Connections come from a den-owned catalog, and the bridge answers each of their tool calls

**Status:** proposed with the build (den-mvp outcome 4, first half; `.scratch/den-mvp/spec.md` section 3 and user stories 14 and 15). The user accepts it by merging the PR. It amends ADR 0016 in one line: "the bridge never allows on its own" now has one exception, a connection's read (decision 3). Meetings, the second half of outcome 4, are a separate PR.

**Context.** The wall starts every agent with `--strict-mcp-config` and no configuration, so no agent had a Model Context Protocol server at all. The spec asks for explicitly configured connections, each with a purpose, health, tools, read/change/publish capabilities, permitted roles and credential ownership, and says "a tool appearing in discovery is not permission to use it". Three facts were measured live on 2026-10-13 before any of this was built:

- With `--strict-mcp-config --mcp-config <json>` the CLI loads exactly the servers named, and its start-up line reports each as `connected` or `failed`.
- A role file's `tools:` line hides every connection tool it does not name. Naming the connection alone (`mcp__name`) lets all of its tools through.
- Every call of a connection's tool reaches the bridge as a permission request (`can_use_tool`), and a deny comes back to the agent as the tool's error.

The CLI's shell sandbox does not cover a connection. A local server is a child of the CLI, so it is inside the run's resource group and dies on Stop, but it runs with the user's file and network access. A remote server is reached by the CLI process itself, outside the wall's network list.

## Decision

### 1. The catalog

`apps/bridge/library/connections.json` is the only source of connections. An entry has a `name`, `title`, `purpose`, either a `url` or a `script`, a `credential` owner, `roles`, and `tools` (each tool's name with `read`, `change` or `publish`). The bridge reads the file beside its own code, never from a worktree, and does not start with a file it cannot check.

- A `url` is `https`, a public host name by the wall's own rule, with no sign-in part, port, query or fragment.
- A `script` is a `.mjs` file under `apps/` in the den, run with the bridge's own node. There is no command line, argument, header or environment field, so the catalog has no place for a secret or an arbitrary program.
- `credential` accepts only `none` for now. A service that needs a credential waits for a decision on where the den may hold one.
- Any unknown field is an error.

The first entry is Context7 (public documentation lookup; `resolve-library-id` and `query-docs`, both `read`) for scout, developer and architect.

### 2. Two keys: the catalog and the role file

A run is started with a connection only when the catalog lists its role and the role file `.claude/agents/<role>.md` names the connection. Both are files the user reviews: the role files are a guardrail path, and the catalog is added to the guardrail list by the patch that comes with this PR. A role with neither key is started exactly as before, with no `--mcp-config`.

### 3. Every tool call is answered by the bridge

For a tool named `mcp__<connection>__<tool>` the host decides before anything is shown to the user:

| The call | Answer |
|---|---|
| The connection is not in the catalog for this role, or the tool is not in its list | Refused with a reason. Never a question. |
| The input looks like it holds a secret (the shared secret patterns) | Refused with a reason, whatever the tool is. |
| A `read` tool with an input of at most 2048 bytes | Allowed by the bridge. |
| A `read` tool with a longer input | Asked, as below. |
| A `change` or `publish` tool | Held for the user with the exact input, like any other request. |

The automatic allow is what lets normal work go on without repeated questions. It is bounded because a read on a remote service still sends its input there: the size limit keeps the automatic answer to inputs the size of a question. This is a bound on one call, not on a run; an agent can still send many short questions to a listed service. Listing a remote connection is the user's decision to trust that service with what the listed roles ask it.

### 4. Status and use

- The start-up line's connection list becomes a `connections` event. The library keeps the last state per connection with the role and the time: connected, failed, needs sign-in, starting or unavailable, each with a sentence the panel shows. A connection no agent has started with reads "not checked yet". The bridge does not probe a connection by itself.
- Each answered call is recorded: time, role, run, connection, tool and decision (allowed, asked, refused). The input and the result are never recorded there. The transcript already shows the call as a tool entry, and a refusal's reason as its result.
- Both go to `library.jsonl` in the bridge's state directory, outside every worktree, and are read back at start with every field checked again.

### 5. The panel

`GET /library` (a read, no token) returns the connections with status, roles and tools, and the skills found under `.claude/skills/` with the roles whose files load skills. The den shows them in a Library card, each entry named by its kind. A role the catalog lists whose file does not name the connection is shown as "cannot use it yet" with that reason. The card is read-only.

## Consequences

- An agent can use a real connection under the wall, and the user can see which roles have which, how each stood and how much it was used.
- A local connection's script is trusted den code: it is not inside the shell sandbox. Only scripts under `apps/` in the den can be listed, and the catalog is a guardrail path once the patch is applied.
- A remote connection is one more host the agent's process reaches, outside the wall's network list, and its answers are untrusted text in the agent's context, like a fetched page.
- The gate on tools depends on the CLI asking the bridge. A project or local settings file that allowed `mcp__...` tools outright would skip it; none does today, and both files are guardrail paths.
- Not built: credentials for a connection, a way to probe a connection without starting an agent, per-role tool lists inside one connection, and connections for a target project (outcome 6).

## Checked

- Unit and bridge tests with the fake runtime: the catalog's checks, the launch arguments, each row of the table in decision 3, status and its reasons, the log and its replay, the route and the card.
- Live, on the production launch path (the wall and the resource group, a real scout, 2026-10-13): a local read was allowed with no question; Context7 answered a lookup; a tool the server offered and the catalog did not list was refused; a change tool asked and ran after the allow; a connection whose script was missing showed as failed with its reason. The run used a test catalog and a test role file in a disposable repository, because the den's own role files do not name the connection until the patch is applied.
- Not checked live: a service that asks for a sign-in (the status wording is covered by a test only), and a den role using Context7 from the den's own catalog, which waits on the patch.
