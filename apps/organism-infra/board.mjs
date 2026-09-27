#!/usr/bin/env node
// organism-infra/02: `board` — thin CLI adapter over ./board-service.mjs.
// See docs/adr/0008-board-service.md for the command set and locking design.
import {
  resolveRoot,
  claim,
  release,
  getStatus,
  comment,
  list,
  BoardError,
} from "./board-service.mjs";

function parseFlags(args) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      const value = args[i + 1];
      flags[name] = value;
      i++;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const root = resolveRoot(process.cwd(), process.env);

  switch (command) {
    case "claim": {
      const [ref, cellType] = rest;
      const result = await claim(root, ref, cellType);
      console.log(`claimed ${ref}: ${result.status}`);
      return;
    }
    case "release": {
      const { positional, flags } = parseFlags(rest);
      const [ref] = positional;
      const result = await release(root, ref, flags.status, flags.reason);
      console.log(`released ${ref}: ${result.status}`);
      return;
    }
    case "status": {
      const [ref] = rest;
      const status = await getStatus(root, ref);
      console.log(status);
      return;
    }
    case "comment": {
      const [ref, text] = rest;
      await comment(root, ref, text);
      console.log(`commented on ${ref}`);
      return;
    }
    case "list": {
      const { flags } = parseFlags(rest);
      const results = await list(root, { feature: flags.feature, status: flags.status });
      for (const r of results) {
        console.log(`${r.feature}/${r.ticket}\t${r.status ?? ""}`);
      }
      return;
    }
    default:
      throw new BoardError(`unknown command: ${command}`);
  }
}

main().catch((err) => {
  if (err instanceof BoardError) {
    console.error(`board: ${err.message}`);
  } else {
    console.error(`board: unexpected error: ${err.stack || err}`);
  }
  process.exitCode = 1;
});
