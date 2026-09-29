// ci-cd/02: the headless UI smoke check. `npm run smoke -- <page-path> [<page-path> ...]`
// serves the repo (its own ephemeral instance of the committed dev server), loads each given
// dev page in a headless browser, and fails on any console error, failed module import, or
// failed asset load. Ticket 07's node:fs bug (a browser page importing a node: built-in) is
// the case this must catch: browsers refuse "node:" specifiers, so the import fails at
// resolution time and is reported here as an error.
//
// Uses Playwright (ci-cd/02 dependency decision). Prefers the browser already installed on the
// machine (Chrome, then Edge) so this doesn't need its own Chromium download locally; CI installs
// Chromium separately and this falls back to the Playwright-managed browser there.
import { createDevServer, REPO_ROOT, FAVICON_PATH } from "./dev-server.mjs";

const LAUNCH_CHANNELS = ["chrome", "msedge", undefined];

// ci-cd/04: a fresh agent worktree never has node_modules, so the bare `import "playwright"`
// below fails to resolve. That's not a bug in this script or a "pre-existing/unrelated"
// failure -- it's a missing dependency, and it must say so in one line instead of dumping the
// raw ERR_MODULE_NOT_FOUND stack. DependencyError carries that one line; the top-level handler
// in main() prints only its message, never a stack, and still exits non-zero (never a skip).
class DependencyError extends Error {}

const MISSING_DEPENDENCY_MESSAGE =
  "smoke: playwright not installed, run npm install && npx playwright install chromium";

async function loadChromium() {
  try {
    const playwright = await import("playwright");
    return playwright.chromium;
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND") {
      throw new DependencyError(MISSING_DEPENDENCY_MESSAGE);
    }
    throw err;
  }
}

async function launchBrowser(chromium) {
  let lastError;
  for (const channel of LAUNCH_CHANNELS) {
    try {
      return await chromium.launch(channel ? { channel } : {});
    } catch (err) {
      lastError = err;
    }
  }
  // Playwright's own message for a missing Chromium binary ("Executable doesn't exist at
  // .../chromium-.../chrome-*") is the other half of "not installed": the package resolved
  // but `npx playwright install chromium` was never run. Same one-line fix applies.
  if (/executable doesn't exist/i.test(lastError?.message ?? "")) {
    throw new DependencyError(MISSING_DEPENDENCY_MESSAGE);
  }
  throw new Error(
    `could not launch a browser (tried channels: ${LAUNCH_CHANNELS.filter(Boolean).join(", ")}, and the bundled Chromium). Last error: ${lastError?.message}`
  );
}

function startEphemeralServer() {
  const server = createDevServer(REPO_ROOT);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

// FAVICON_PATH is browser housekeeping (see dev-server.mjs), not a real asset the page asked
// for -- ignore it here too so a fixture with no favicon does not false-fail.
function isBrowserHousekeeping(url) {
  return new URL(url).pathname === FAVICON_PATH;
}

/**
 * Loads one page and collects the first error observed for each kind: a console error, an
 * uncaught page exception (this is how a browser reports a module that failed to resolve or
 * evaluate, e.g. `import fs from "node:fs"`), a failed network request, and a non-2xx/3xx
 * response (a failed asset load).
 */
async function checkPage(browser, baseUrl, pagePath, { absolute = false } = {}) {
  const firstByKind = new Map();
  const record = (kind, message) => {
    if (!firstByKind.has(kind)) firstByKind.set(kind, message);
  };

  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") record("console error", msg.text());
  });
  page.on("pageerror", (err) => {
    record("failed module import / uncaught exception", err.message);
  });
  page.on("requestfailed", (request) => {
    if (isBrowserHousekeeping(request.url())) return;
    record("failed request", `${request.url()} (${request.failure()?.errorText ?? "failed"})`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !isBrowserHousekeeping(response.url())) {
      record("failed asset load", `${response.url()} responded ${response.status()}`);
    }
  });

  const url = absolute ? pagePath : `${baseUrl}/${String(pagePath).replace(/^\/+/, "")}`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 15000 });
    // give async module errors / late console output a moment to surface
    await page.waitForTimeout(300);
  } catch (err) {
    record("navigation error", err.message);
  } finally {
    await context.close();
  }

  return firstByKind;
}

async function main() {
  // dimsumden-ui-v0/13: `--url <absolute-url>` (repeatable) loads the URL as given and starts no
  // repo dev server, for pages served elsewhere (the bridge's built UI).
  const args = process.argv.slice(2);
  const pages = [];
  let absolute = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url") {
      if (args[i + 1] === undefined) {
        console.error("smoke: --url needs a value");
        process.exit(1);
      }
      absolute = true;
      pages.push(args[++i]);
    } else {
      pages.push(args[i]);
    }
  }
  if (pages.length === 0 || (absolute && pages.length !== args.filter((a) => a === "--url").length)) {
    console.error("usage: npm run smoke -- <page-path> [<page-path> ...] | --url <absolute-url> [--url <absolute-url> ...]");
    process.exit(1);
  }

  const chromium = await loadChromium();

  const server = absolute ? null : await startEphemeralServer();
  const baseUrl = server ? `http://127.0.0.1:${server.address().port}` : "";

  let browser;
  let anyFailed = false;
  try {
    browser = await launchBrowser(chromium);
    for (const pagePath of pages) {
      const errorsByKind = await checkPage(browser, baseUrl, pagePath, { absolute });
      if (errorsByKind.size === 0) {
        console.log(`PASS ${pagePath}`);
        continue;
      }
      anyFailed = true;
      console.error(`FAIL ${pagePath}`);
      for (const [kind, message] of errorsByKind) {
        console.error(`  ${kind}: ${message}`);
      }
    }
  } finally {
    await browser?.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }

  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  if (err instanceof DependencyError) {
    console.error(err.message);
  } else {
    console.error(err.stack ?? String(err));
  }
  process.exit(1);
});
