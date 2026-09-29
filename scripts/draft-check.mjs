// herald draft-shape check. checkDraft(text) returns an array of violation
// strings (empty = ok). A draft is a `---` fenced header (title, channel,
// image, sources list) followed by 1-3 blank-line-separated paragraphs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const SECRETS = [
  /ghp_[A-Za-z0-9]{20,}/,
  /sk-ant-[A-Za-z0-9_-]{10,}/,
  /AKIA[0-9A-Z]{12,}/,
  /api[_-]?key\s*[=:]\s*\S{8,}/i,
];

export function checkDraft(text) {
  const violations = [];
  const norm = String(text).replace(/\r\n/g, "\n");
  const m = norm.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  let body = norm;
  if (!m) {
    violations.push("header missing: expected a --- fenced header at the top");
  } else {
    body = norm.slice(m[0].length);
    const lines = m[1].split("\n");
    const i = lines.findIndex((l) => /^sources:\s*$/.test(l));
    const items = [];
    if (i >= 0) {
      for (const l of lines.slice(i + 1)) {
        const it = l.match(/^\s+-\s+(\S.*)$/);
        if (it) items.push(it[1]);
        else if (/^\S/.test(l)) break;
      }
    }
    if (items.length === 0) violations.push("sources missing: header needs a non-empty sources list");
  }
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 3) {
    violations.push(`too many paragraphs: ${paragraphs.length} (max 3)`);
  }
  if (EMAIL.test(norm)) violations.push("email address found");
  if (SECRETS.some((re) => re.test(norm))) violations.push("secret: credential or token-looking string found");
  return violations;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node scripts/draft-check.mjs <draft-file>");
    process.exit(2);
  }
  const v = checkDraft(readFileSync(file, "utf8"));
  for (const msg of v) console.error(`draft-check: ${msg}`);
  process.exit(v.length ? 1 : 0);
}
