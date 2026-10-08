// organism-infra/140 (ADR 0016 decision 2): the CellRuntime interface and the fake runtime the tests drive.
// Nothing else in the bridge names a Claude flag; the real adapter (claude-adapter.mjs, ticket D2) implements this.
//
//   CellRuntime = {
//     id, capabilities: { spawn, stop, approve, send, handover },
//     spawn({ role, mode?, ref, cwd, prompt, model?, sessionId, resume? }) -> Promise<CellProcess>,
//     resumeCommand(sessionId) -> string          // shown to the user once an agent has ended; never run
//   }
//   CellProcess = {
//     handle: string, events: AsyncIterable<CellEvent>,
//     closeInput(), signal("SIGTERM" | "SIGKILL")  // synchronous
//     exited: Promise<{ code, signal }>            // resolves once, never rejects
//   }
//   CellEvent = { type: "tool-start", name, summary } | { type: "tool-end" } | { type: "usage", input, output }
//             | { type: "state", state } | { type: "done", ok }
//             | { type: "permission-request", requestId, tool, input }   (organism-infra/141; requestId is the child's opaque key)
//   CellProcess also has decide(requestId, { allow, reason? }) -> Promise   (answers a held permission request)

const CAPABILITIES = { spawn: true, stop: true, approve: true, send: false, handover: true };

// A fake runtime with test controls: see the contract at the top of host-core.test.mjs.
//   config: spawnDelayMs, stdinCloseEnds, sigtermEnds, sigkillEnds, failSpawn (all mutable at runtime.config)
//   spawns: one record per spawn() call { args, handle, calls, exited, emit(event), exit({ code, signal }) }
//   peakLive: the most spawned-and-not-yet-exited processes at once
export function createFakeRuntime(options = {}) {
  const config = { spawnDelayMs: 0, stdinCloseEnds: true, sigtermEnds: true, sigkillEnds: true, failSpawn: false, ...options };
  const spawns = [];
  let live = 0;
  let counter = 0;
  const runtime = {
    id: "fake",
    capabilities: { ...CAPABILITIES },
    config,
    spawns,
    peakLive: 0,
    resumeCommand: (sessionId) => `fake-claude --resume ${sessionId}`,
    async spawn(args) {
      if (config.failSpawn) throw new Error("fake runtime: spawn failed");
      const record = makeRecord(args, `fake-${(counter += 1)}`, config, () => (live -= 1));
      spawns.push(record);
      live += 1;
      runtime.peakLive = Math.max(runtime.peakLive, live);
      if (config.spawnDelayMs > 0) await new Promise((r) => setTimeout(r, config.spawnDelayMs));
      return record.process;
    },
  };
  return runtime;
}

function makeRecord(args, handle, config, onExit) {
  const queue = [];
  const waiting = [];
  let exitInfo;
  let resolveExited;
  const exited = new Promise((r) => (resolveExited = r));
  const t0 = Date.now();
  const record = {
    args,
    handle,
    calls: [],
    exited: false,
    decisions: [], // every decide() call, in order (organism-infra/141)
    emit(event) {
      if (record.exited) return;
      const w = waiting.shift();
      if (w) w({ value: event, done: false });
      else queue.push(event);
    },
    exit({ code = 0, signal = null } = {}) {
      if (record.exited) return;
      record.exited = true;
      exitInfo = { code, signal };
      onExit();
      resolveExited(exitInfo);
      // Queued events still drain to the consumer, then the stream ends.
      if (!queue.length) for (const w of waiting.splice(0)) w({ value: undefined, done: true });
    },
  };
  const call = (name, ends, signal) => {
    record.calls.push({ call: name, at: Date.now() - t0 });
    if (ends) record.exit({ code: signal ? null : 0, signal: signal ?? null });
  };
  record.process = {
    handle,
    events: {
      [Symbol.asyncIterator]() {
        return {
          next() {
            if (queue.length) return Promise.resolve({ value: queue.shift(), done: false });
            if (record.exited) return Promise.resolve({ value: undefined, done: true });
            return new Promise((r) => waiting.push(r));
          },
        };
      },
    },
    closeInput: () => call("closeInput", config.stdinCloseEnds),
    decide: (requestId, { allow, reason } = {}) => {
      record.decisions.push({ requestId, allow, reason });
      return Promise.resolve();
    },
    signal: (sig) => call(sig, sig === "SIGTERM" ? config.sigtermEnds : config.sigkillEnds, sig),
    exited,
  };
  return record;
}
