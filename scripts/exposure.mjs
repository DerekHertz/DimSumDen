// organism-infra/77: the one source for what may leave the machine.
// SECRET_PATTERNS is shared by risk-check.mjs (diff scan) and jev.mjs (input
// block); DENIED_PATHS is the file list no caller may read into a request.
// Every pattern is non-global (stateless `.test`) and anchored so it runs in
// linear time on long input.
import path from "node:path";

export const SECRET_PATTERNS = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "private key block", re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  {
    name: "hardcoded API key/token/secret",
    re: /\b(api[_-]?key|token|secret)\b\s*[:=]\s*["'][A-Za-z0-9_\-/+]{12,}["']/i,
  },
  {
    name: "env-file credential line",
    re: /^[ \t]*(?:export[ \t]+)?[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|PWD|CREDENTIALS?)[ \t]*=[ \t]*["']?[A-Za-z0-9_\-/+=]{12,}["']?[ \t]*$/m,
  },
  { name: "AWS secret access key", re: /\baws_secret_access_key\b[ \t]*[:=][ \t]*["']?[A-Za-z0-9/+=]{20,}/i },
  { name: "Authorization bearer token", re: /\bAuthorization:[ \t]*Bearer[ \t]+[A-Za-z0-9._~+/=-]{16,}/i },
  {
    name: "JWT",
    re: /(?<![A-Za-z0-9_-])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{16,}\.(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{16,}\.(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{16,}/,
  },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "GitHub fine-grained token", re: /github_pat_[A-Za-z0-9_]{22,}/ },
  { name: "sk- style API key", re: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: "Stripe-style live/test key", re: /(?<![A-Za-z0-9])[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { name: "npm token", re: /(?<![A-Za-z0-9])npm_[A-Za-z0-9]{30,}/ },
  { name: "Slack token", re: /(?<![A-Za-z0-9])xox[abprse]-[A-Za-z0-9-]{10,}/ },
  { name: "URL credentials", re: /(?<![a-z0-9+.-])[a-z][a-z0-9+.-]{0,30}:\/\/[^\s:@/]+:[^\s:@/$<>{}]{3,}@[^\s/]+/i },
  { name: "hardcoded password=style credential", re: /\bpassword\s*[:=]\s*["'][^"']{3,}["']/i },
];

export function hasSecret(text) {
  return SECRET_PATTERNS.some((p) => p.re.test(String(text ?? "")));
}

// Matched against the absolute path with forward slashes.
export const DENIED_PATHS = [
  { name: ".env file", re: /(^|\/)\.env[^/]*$/i },
  { name: "credentials file", re: /(^|\/)credentials[^/]*$/i },
  { name: "key or certificate", re: /\.(pem|key)$/i },
  { name: "git directory", re: /(^|\/)\.git(\/|$)/ },
  { name: "hidden path", re: /(^|\/)\.[^/]+/ },
  { name: "board handoffs", re: /(^|\/)\.scratch\/(.+\/)?handoffs(\/|$)/ },
  { name: "handoff inbox", re: /(^|\/)_handoffs(\/|$)/ },
  { name: "gate requests", re: /(^|\/)_requests(\/|$)/ },
  { name: "lock file", re: /\.lock$/i },
  { name: "usage log", re: /(^|\/)usage\.jsonl$/i },
];

export function isDenied(p) {
  const abs = path.resolve(String(p)).split(path.sep).join("/");
  return DENIED_PATHS.some((d) => d.re.test(abs));
}
