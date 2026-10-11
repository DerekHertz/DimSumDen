// organism-infra/143 (ADR 0016 decisions 2, 6.5, 6.6, 6.8; amendment 6): the process half of the Claude adapter.
// createClaudeRuntime({ env }) is the default CellRuntime: it spawns the `claude` binary (env.DEN_CLAUDE_BIN, else "claude")
// as a detached process-group leader over real pipes, decodes stdout through the pure half (claude-adapter.mjs), holds
// permission requests until the host decides, and signals the whole group so no grandchild outlives a kill.
import { spawn as spawnChild } from "node:child_process";
import {
  MAX_LINE_BYTES, buildClaudeArgs, buildClaudeEnv, createLineSplitter, decodeControlRequest, encodeControlResponse, encodeUserMessage, isTicketFilePath,
  parseClaudeLine,
} from "./claude-adapter.mjs";
import { UUID_RE } from "./policy.mjs";

// S8 outcome (c): the approval inbox is on. den-v1 loop S5: so is send, a user message line on the child's stdin
// (spike S7: the child takes it into its running turn once the running tool call ends).
const CAPABILITIES = { spawn: true, stop: true, approve: true, send: true, handover: true };

// A queue that is also an async iterable; end() lets queued events drain, then finishes the stream.
function createChannel() {
  const queue = [];
  const waiting = [];
  let ended = false;
  return {
    push(event) {
      if (ended) return;
      const w = waiting.shift();
      if (w) w({ value: event, done: false });
      else queue.push(event);
    },
    end() {
      ended = true;
      if (!queue.length) for (const w of waiting.splice(0)) w({ value: undefined, done: true });
    },
    iterable: {
      [Symbol.asyncIterator]() {
        return {
          next() {
            if (queue.length) return Promise.resolve({ value: queue.shift(), done: false });
            if (ended) return Promise.resolve({ value: undefined, done: true });
            return new Promise((r) => waiting.push(r));
          },
        };
      },
    },
  };
}

export function createClaudeRuntime({ env = process.env } = {}) {
  return {
    id: "claude",
    capabilities: { ...CAPABILITIES },
    resumeCommand: (sessionId) => (typeof sessionId === "string" && UUID_RE.test(sessionId) ? `claude --resume ${sessionId}` : null),
    async spawn({ role, cwd, prompt, sessionId, model, ticketFile } = {}) {
      if (typeof cwd !== "string" || cwd === "") throw new TypeError("claude runtime: cwd must be a path");
      if (typeof prompt !== "string") throw new TypeError("claude runtime: prompt must be a string");
      // A ticket path the adapter cannot write as a rule is left out: that agent's ticket read stays a request.
      const args = buildClaudeArgs({ sessionId, agent: role, ...(model === undefined ? {} : { model }), ...(isTicketFilePath(ticketFile) ? { ticketFile } : {}) });
      const bin = typeof env.DEN_CLAUDE_BIN === "string" && env.DEN_CLAUDE_BIN !== "" ? env.DEN_CLAUDE_BIN : "claude";
      const child = spawnChild(bin, args, { shell: false, detached: true, cwd, env: buildClaudeEnv(env), stdio: ["pipe", "pipe", "pipe"] });
      await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("spawn", resolve);
      });
      child.on("error", () => {});
      child.stdin.on("error", () => {});
      child.stderr.resume(); // drained, never read: a full pipe must not block the child

      const channel = createChannel();
      const splitter = createLineSplitter({ maxLineBytes: MAX_LINE_BYTES });
      const held = new Map(); // requestId -> the held request's input
      const seen = new Set();
      const sent = new Set(); // ids of messages written and not yet replayed by the child
      let exitedFlag = false;
      const write = (line) =>
        new Promise((resolve, reject) => {
          if (!child.stdin.writable) return reject(new Error("the child's stdin is closed"));
          child.stdin.write(line, (err) => (err ? reject(err) : resolve()));
        });
      const signalGroup = (sig) => {
        try {
          process.kill(-child.pid, sig);
        } catch {
          // the group is already gone
        }
      };

      const handleLine = (line) => {
        let obj;
        try {
          obj = JSON.parse(line);
        } catch {
          return;
        }
        if (obj && obj.type === "control_request") {
          const d = decodeControlRequest(obj, seen);
          if (d.kind === "approval") {
            held.set(d.requestId, d.input);
            channel.push({ type: "permission-request", requestId: d.requestId, tool: d.tool, input: d.input });
          } else if (d.kind === "deny") {
            write(encodeControlResponse({ requestId: d.requestId, allow: false })).catch(() => {});
          }
          return;
        }
        for (const event of parseClaudeLine(line)) {
          // Only a message this process wrote, and only once: the prompt's own replay and a repeated id are dropped.
          if (event.type === "message-applied" && !sent.delete(event.id)) continue;
          channel.push(event);
        }
      };
      child.stdout.on("data", (chunk) => {
        for (const line of splitter.push(chunk)) handleLine(line);
      });
      child.stdout.once("close", () => channel.end());

      const exited = new Promise((resolve) => {
        child.once("exit", (code, signal) => {
          exitedFlag = true;
          held.clear();
          signalGroup("SIGKILL"); // the leader is gone: reap any grandchild left in its group
          resolve({ code, signal });
        });
      });

      try {
        await write(encodeUserMessage({ text: prompt }));
      } catch {
        // the child may already be gone; the host sees it through `exited`
      }

      return {
        handle: String(child.pid),
        events: channel.iterable,
        exited,
        closeInput() {
          try {
            child.stdin.end();
          } catch {
            // already closed
          }
        },
        signal(sig) {
          if (exitedFlag || (sig !== "SIGTERM" && sig !== "SIGKILL")) return;
          signalGroup(sig);
        },
        async send(messageId, text) {
          if (typeof messageId !== "string") throw new TypeError("claude runtime: a message needs an id");
          const line = encodeUserMessage({ text, id: messageId });
          sent.add(messageId);
          try {
            await write(line);
          } catch (err) {
            sent.delete(messageId);
            throw err;
          }
        },
        async decide(requestId, { allow, reason } = {}) {
          if (!held.has(requestId)) return;
          const input = held.get(requestId);
          held.delete(requestId);
          await write(encodeControlResponse({ requestId, allow: allow === true, reason, input }));
        },
      };
    },
  };
}
