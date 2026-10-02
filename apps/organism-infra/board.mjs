#!/usr/bin/env node
// organism-infra/02: `board` — thin CLI adapter over ./board-service.mjs.
// See docs/adr/0008-board-service.md for the command set and locking design.
import {
  resolveRoot,
  claim,
  release,
  resolve,
  reclaim,
  getStatus,
  comment,
  publishHandoff,
  handoffTemplate,
  list,
  BoardError,
} from "./board-service.mjs";
import { audit } from "./board-audit.mjs";

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
      if (rest.some((a) => a === "--verdict" || a.startsWith("--verdict="))) {
        throw new BoardError(
          'release takes no --verdict; record the verdict first with `board comment <ref> --verdict pass|bounce "<text>"`, then release'
        );
      }
      const { positional, flags } = parseFlags(rest, {
        allowed: ["status", "reason", "force", "keep-status", "pr"],
        boolean: ["force", "keep-status"],
      });
      const [ref] = positional;
      const result = await release(root, ref, flags.status, flags.reason, {
        force: !!flags.force,
        keepStatus: !!flags["keep-status"],
        pr: flags.pr,
      });
      console.log(`released ${ref}: ${result.status}`);
      return;
    }
    case "resolve": {
      // organism-infra/98: claim, orchestrator handoff and resolved release in one step.
      const { positional, flags } = parseFlags(rest, { allowed: ["pr", "note"] });
      const result = await resolve(root, positional, { pr: flags.pr, note: flags.note });
      for (const ref of result.resolved) console.log(`resolved ${ref}`);
      return;
    }
    case "handoff": {
      const { positional, flags } = parseFlags(rest, {
        allowed: ["from", "name", "template", "cell", "mode"],
        boolean: ["template"],
      });
      const [ref] = positional;
      if (flags.template) {
        if (flags.from !== undefined || flags.name !== undefined) {
          throw new BoardError("--template prints a State block; it takes no --from or --name");
        }
        console.log(`State block for ${ref} (fill in the placeholders, then draft the handoff under /tmp):`);
        console.log(await handoffTemplate(root, ref, { cell: flags.cell, mode: flags.mode }));
        return;
      }
      if (flags.cell !== undefined || flags.mode !== undefined) {
        throw new BoardError("--cell and --mode only apply with --template");
      }
      const result = await publishHandoff(root, ref, flags.from, { name: flags.name });
      console.log(`published ${result.path}`);
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
      const { positional, flags } = parseFlags(rest, { allowed: ["as", "verdict"] });
      const [ref, text] = positional;
      await comment(root, ref, text, { as: flags.as, verdict: flags.verdict });
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
    case "audit": {
      // organism-infra/81: exit 0 clean, 1 findings, 2 bad arguments.
      const usage = (msg) => Object.assign(new BoardError(msg), { exitCode: 2 });
      let parsed;
      try {
        parsed = parseFlags(rest, { allowed: ["json", "stale-days", "feature"], boolean: ["json"] });
      } catch (err) {
        throw usage(err.message);
      }
      const { positional, flags } = parsed;
      if (positional.length) throw usage(`audit takes no arguments: ${positional.join(" ")}`);
      const staleDays = flags["stale-days"] ?? "7";
      if (!/^\d+$/.test(staleDays)) throw usage(`--stale-days must be a whole number of days: ${staleDays}`);
      if (flags.feature !== undefined && !/^[a-z0-9-]+$/.test(flags.feature)) {
        throw usage(`invalid feature: ${flags.feature}`);
      }
      const findings = await audit(root, { staleDays: Number(staleDays), feature: flags.feature });
      if (flags.json) console.log(JSON.stringify(findings, null, 2));
      else for (const f of findings) console.log(`${f.ref} ${f.kind} ${f.detail}`);
      process.exitCode = findings.length ? 1 : 0;
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
