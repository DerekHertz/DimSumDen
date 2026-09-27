#!/usr/bin/env node
// organism-infra/08: the scripted risk check that sizes the review relay to
// the diff. Run by `scout` (or CI) on every code ticket instead of the full
// `security` cell. Exit 0 = clean, the scripted check suffices. Exit non-zero
// = escalate to full security review; each hit is printed as
// "file: reason" (or "reason" for range-wide hits).
//
// Usage: node scripts/risk-check.mjs [gitRange]   (default: main...HEAD)
//
// See .scratch/organism-infra/issues/08-risk-sized-review.md for the rule
// this implements.
import { execFileSync } from "node:child_process";

const CODE_PATH_RE = /^(apps|packages|scripts)\//;

const SECRET_PATTERNS = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "private key block", re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  {
    name: "hardcoded API key/token/secret",
    re: /\b(api[_-]?key|token|secret)\b\s*[:=]\s*["'][A-Za-z0-9_\-/+]{12,}["']/i,
  },
  { name: "hardcoded password= style credential", re: /\bpassword\s*[:=]\s*["'][^"']{3,}["']/i },
];

const CODE_RISK_PATTERNS = [
  {
    name: "network/server code",
    re: /\b(https?|net)\.(createServer|request|connect)\s*\(|\.listen\s*\(|\bWebSocket\b/,
  },
  {
    name: "shelling out to another program",
    re: /\bchild_process\b|\b(spawn|execFile|execSync)\s*\(|(?<!\.)\bexec\s*\(/,
  },
  { name: "board, lock, or daemon code", re: /\bdaemon\b|\.lock\b|\bboard\b/i },
  { name: "secrets handling", re: /\b(secret|credential|apiKey|api_key)\b/i },
];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function parseDiff(range) {
  const raw = git(["diff", "--unified=0", range]);
  const files = [];
  let current = null;
  for (const line of raw.split("\n")) {
    const header = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (header) {
      current = { path: header[2], addedLines: [] };
      files.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) current.addedLines.push(line.slice(1));
  }
  return files;
}

function checkFile(file) {
  const hits = [];
  const { path: filePath, addedLines } = file;
  const addedText = addedLines.join("\n");

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.re.test(addedText)) {
      hits.push({ file: filePath, reason: `possible secret: ${pattern.name}` });
    }
  }

  if (filePath === "package-lock.json") {
    hits.push({ file: filePath, reason: "lockfile changed" });
  } else if (/(^|\/)package\.json$/.test(filePath)) {
    if (/"(dependencies|devDependencies|peerDependencies|optionalDependencies)"/.test(addedText)) {
      hits.push({ file: filePath, reason: "dependency field changed" });
    }
  }

  if (/^\.github\//.test(filePath)) {
    hits.push({ file: filePath, reason: "CI workflow / branch protection config changed" });
  }

  if (CODE_PATH_RE.test(filePath)) {
    for (const pattern of CODE_RISK_PATTERNS) {
      if (pattern.re.test(addedText)) {
        hits.push({ file: filePath, reason: pattern.name });
      }
    }
  }

  return hits;
}

function main() {
  const range = process.argv[2] || "main...HEAD";
  const files = parseDiff(range);
  const hits = files.flatMap(checkFile);

  if (hits.length === 0) {
    console.log(`risk-check: clean (${range})`);
    return 0;
  }

  console.log(`risk-check: ${hits.length} hit(s) on ${range} — escalate to full security review`);
  for (const hit of hits) {
    console.log(`${hit.file}: ${hit.reason}`);
  }
  return 1;
}

process.exit(main());
