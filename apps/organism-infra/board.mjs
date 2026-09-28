#!/usr/bin/env node
// organism-infra/02: `board` — thin CLI adapter over ./board-service.mjs.
// See docs/adr/0008-board-service.md for the command set and locking design.
import {
  resolveRoot,
  claim,
  release,
  reclaim,
  getStatus,
  comment,
  list,
  BoardError,
} from "./board-service.mjs";

// organism-infra/18: `allowed` declares a subcommand's flag set; any other
// `--flag` is a hard error naming the bad flag, never silently absorbed as
// positional/text content. `boolean` flags (e.g. `--force`) take no value.
function parseFlags(args, { allowed = null, boolean = [] } = {}) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      if (allowed && !allowed.includes(name)) {
        throw new BoardError(`unrecognized flag: --${name}`);
      }
      if (boolean.includes(name)) {
        flags[name] = true;
      } else {
        // organism-infra/18 fix-1 (security low finding): a flag value can
        // never start with "--" -- otherwise `--reason --force` silently
        // swallows `--force` as the literal reason text instead of erroring.
        const value = args[i + 1];
        if (value === undefined || value.startsWith("--")) {
          throw new BoardError(`--${name} requires a value`);
        }
        flags[name] = value;
        i++;
      }
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
      const { positional, flags } = parseFlags(rest, { allowed: ["mode"] });
      const [ref, cellType] = positional;
      const result = await claim(root, ref, cellType, { mode: flags.mode });
      console.log(`claimed ${ref}: ${result.status}`);
      return;
    }
    case "reclaim": {
      const { positional, flags } = parseFlags(rest, { allowed: ["mode", "reason"] });
      const [ref, cellType] = positional;
      const result = await reclaim(root, ref, cellType, { mode: flags.mode, reason: flags.reason });
      console.log(`reclaimed ${ref} for ${cellType}: ${result.status}`);
      return;
    }
    case "release": {
      const { positional, flags } = parseFlags(rest, {
        allowed: ["status", "reason", "force", "keep-status"],
        boolean: ["force", "keep-status"],
      });
      const [ref] = positional;
      const result = await release(root, ref, flags.status, flags.reason, {
        force: !!flags.force,
        keepStatus: !!flags["keep-status"],
      });
      console.log(`released ${ref}: ${result.status}`);
      return;
    }
    case "status": {
      const { positional } = parseFlags(rest, { allowed: [] });
      const [ref] = positional;
      const status = await getStatus(root, ref);
      console.log(status);
      return;
    }
    case "comment": {
      // Only `--as` is a flag on comment; any other "--x" is rejected.
      const { positional, flags } = parseFlags(rest, { allowed: ["as"] });
      const [ref, text] = positional;
      await comment(root, ref, text, { as: flags.as });
      console.log(`commented on ${ref}`);
      return;
    }
    case "list": {
      const { flags } = parseFlags(rest, { allowed: ["feature", "status"] });
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
  // 75 (EX_TEMPFAIL) when the write lock stayed held for the whole bounded
  // wait, so callers can tell "retry later" from a real error (1).
  process.exitCode = err instanceof BoardError && err.exitCode ? err.exitCode : 1;
});
