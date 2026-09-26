# Claude-specific features live behind a runtime adapter

The office must be OS- and model-agnostic. The daemon talks to every runtime through one adapter interface (spawn, stream events, send message, approve/deny, stop). Claude Code hooks, agent view, and subagents are optimizations inside the Claude adapter, never core dependencies. Other runtimes get a lowest-common-denominator event stream.
