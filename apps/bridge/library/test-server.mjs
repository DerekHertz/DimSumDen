#!/usr/bin/env node
// den-mvp outcome 4: a connection for tests and the live probe, never listed in the catalog. It speaks the Model Context
// Protocol over stdio (one JSON-RPC message per line) and offers one tool that reads and one that claims to change
// something. It touches no file and no network: `note` only answers.
import { createInterface } from "node:readline";

const TOOLS = [
  { name: "echo", description: "Return the text it is given.", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  { name: "note", description: "Pretend to save a note.", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
];
const send = (msg) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...msg })}\n`);
const text = (t) => ({ content: [{ type: "text", text: t }] });

createInterface({ input: process.stdin }).on("line", (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  if (msg === null || typeof msg !== "object" || msg.id === undefined) return; // a notification needs no answer
  const { id, method, params } = msg;
  if (method === "initialize") {
    send({ id, result: { protocolVersion: params?.protocolVersion ?? "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "den-test", version: "1" } } });
  } else if (method === "ping") {
    send({ id, result: {} });
  } else if (method === "tools/list") {
    send({ id, result: { tools: TOOLS } });
  } else if (method === "tools/call") {
    const said = String(params?.arguments?.text ?? "");
    if (params?.name === "echo") send({ id, result: text(`echo: ${said}`) });
    else if (params?.name === "note") send({ id, result: text(`noted: ${said}`) });
    else send({ id, error: { code: -32602, message: "unknown tool" } });
  } else {
    send({ id, error: { code: -32601, message: "unknown method" } });
  }
});
