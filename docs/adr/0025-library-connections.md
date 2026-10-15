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
- A `script` is a `.mjs` file in `apps/bridge/library/servers/` in the den, run with the bridge's own node. No other directory can hold one, so the bridge's own code cannot be listed as a server. The den's path must be plain characters, or an entry with a script fails the catalog's check. There is no command line, argument, header or environment field, so the catalog has no place for a secret or an arbitrary program.
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
| A `read` tool with an input of at most 2048 bytes, within the run's bound | Allowed by the bridge. |
| A `read` tool with a longer input, or past the run's bound | Asked, as below. |
| Any call the bridge would allow, once Stop was asked for or the bridge is shutting down | Refused. |
| A `change` or `publish` tool | Held for the user with the exact input, like any other request. |

The automatic allow is what lets normal work go on without repeated questions. It is bounded because a read on a remote service still sends its input there, and for scout, developer and architect, whose shell has no network at all, a listed remote connection is the one way out that asks no question.

- One call: an input of at most 2048 bytes.
- One run: 30 automatic allows and 16 KiB of input added up (`CONNECTION_AUTO_CALLS`, `CONNECTION_AUTO_BYTES`). Past either, a read is asked like any other request. A follow-up run starts a new count.
- The secret check matches the shared patterns. It does not catch a secret that is split across fields or encoded.

So a run can send up to 16 KiB to a listed service before the user is asked anything. Listing a remote connection is the user's decision to trust that service with that much of what the listed roles can read.

### 4. Status and use

- The start-up line's connection list becomes a `connections` event. The library keeps the last state per connection with the role and the time: connected, failed, needs sign-in, starting or unavailable, each with a sentence the panel shows. A connection no agent has started with reads "not checked yet". The bridge does not probe a connection by itself.
- Each answered call is recorded: time, role, run, connection, tool and decision (allowed, asked, refused). The input and the result are never recorded there. The transcript already shows the call as a tool entry, and a refusal's reason as its result.
- Both go to `library.jsonl` in the bridge's state directory, outside every worktree, and are read back at start with every field checked again. Past 1 MiB the file is rewritten as what it adds up to (the last state and the totals per connection), so a run that calls a connection in a loop cannot grow it without end.

### 5. The panel

`GET /library` (a read, no token) returns the connections with status, roles and tools, and the skills found under `.claude/skills/` with the roles whose files load skills. The den shows them in a Library card, each entry named by its kind. A role the catalog lists whose file does not name the connection is shown as "cannot use it yet" with that reason. The card is read-only.

## Consequences

- An agent can use a real connection under the wall, and the user can see which roles have which, how each stood and how much it was used.
- A local connection's script is trusted den code: it is not inside the shell sandbox. It inherits the agent process's environment (`PATH`, `HOME`, the locale) and can read what the user can read, credential files under the home directory included. The catalog is a guardrail path, and the den's own catalog lists no script.
- A remote connection is one more host the agent's process reaches, outside the wall's network list. Its answers are untrusted text in the agent's context, like a fetched page; for developer and architect, which can write files and run commands in their worktree, that is one more way hostile text can arrive.
- The gate on tools depends on the CLI asking the bridge. Two things could answer first:
  - an allow rule for `mcp__...` tools in the project or local settings file. None exists today, and both files are guardrail paths.
  - a hook. The CLI runs the hook commands of the worktree's `.claude/settings.json`, from scripts under `scripts/` in that worktree, outside the sandbox. A live probe on 2026-10-13 showed a bridge agent rewriting such a script and the CLI running the agent's version. Bridge agents are now started with `disableAllHooks: true` in their inline settings (den-mvp/03, the PR after this one); the same probe then ran no hook. That closes hooks only. A security probe the same day showed that two other keys of a project's settings still act with hooks off: `apiKeyHelper` ran its command outside the sandbox, and an `env` entry redirected the CLI's API requests. An agent cannot write the den's settings files (the write is denied to the file tools and to the shell), so this is not reachable in the den's own repository; it is reachable from a repository whose own `.claude/settings.json` is hostile. ADR 0021 decision 18 (start every child with no project settings) is the closure, and it has to be built before any target project runs.
- The role files name the whole connection (`mcp__context7`), so a tool the service adds later reaches the bridge and is refused there, not hidden by the CLI.
- Not built: credentials for a connection, a way to probe a connection without starting an agent, per-role tool lists inside one connection, and connections for a target project (outcome 6).

## Checked

- Unit and bridge tests with the fake runtime: the catalog's checks, the launch arguments, each row of the table in decision 3, status and its reasons, the log and its replay, the route and the card.
- Live, on the production launch path (the wall and the resource group, a real scout, 2026-10-13), with a test catalog and a test role file in a disposable repository: a local read was allowed with no question; Context7 answered a lookup; a tool the server offered and the catalog did not list was refused; a change tool asked and ran after the allow; a connection whose script was missing showed as failed with its reason.
- Live, after the protected-file patch: the den's own scout, with the den's own role file and catalog, looked up a library on Context7 from a throwaway clone; the bridge allowed it with no question and the library showed one use.
- Security review of `2e3720e` (2026-10-13): pass. Fixed after it: the run's bound on automatic allows, no allow after Stop, the log's bound, one directory for scripts, and a refusal for an input that is not an object. The fixes were not reviewed again.
- Not checked: a service that asks for a sign-in (the status wording is covered by a test only); what the CLI itself sends a remote service beyond the tool call (headers, a stored sign-in, redirects).

## Amendment 1 (2026-10-14): where the den holds a connection credential

- `credential` accepts `den` as well as `none`: the bridge holds the token. Only a remote (`url`) connection may use it, and the catalog holds no secret, only the owner. An optional `headers` field carries plain `X-MCP-*` values (the GitHub toolsets); `Authorization` has no place in it.
- The user saves a fine-grained, read-only token once, in `~/.local/state/den/credentials/<connection>.token` (0600), outside every worktree. The folder is a governance credential path, so no agent's shell can read it and no path grant may reach it. The token is never in env, argv, a ticket, a log or the catalog.
- At spawn the runtime writes that run's MCP config, token included, to a 0600 file in `credentials/run/` and passes `--mcp-config <file>`; it removes the file when the run ends. A connection with no credential stays inline.
- With no token saved the connection is left out, the run starts, and the Library card shows it unavailable with "No <title> token saved".
- The first use is GitHub's official server at `/mcp/readonly` with `X-MCP-Toolsets: pull_requests,actions,issues,repos`, every listed tool `read`. Reason for a file over inline: argv is visible to other processes of the user and to `ps`.
- The two guardrail files (`governance.json`, `connections.json`) are a patch at `docs/agents/gated/33-github-connection.patch`, applied by the user.
