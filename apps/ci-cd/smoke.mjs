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
import { chromium } from "playwright";
import { createDevServer, REPO_ROOT } from "./dev-server.mjs";

const LAUNCH_CHANNELS = ["chrome", "msedge", undefined];

async function launchBrowser() {
  let lastError;
  for (const channel of LAUNCH_CHANNELS) {
    try {
      return await chromium.launch(channel ? { channel } : {});
    } catch (err) {
      lastError = err;
    }
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

// The browser requests /favicon.ico on its own for any page load, whether or not the page
// references one. A dev fixture with no <link rel="icon"> has no favicon to serve, so that 404
// is the browser's own housekeeping, not a failed asset the page asked for -- ignore it.
function isBrowserHousekeeping(url) {
  return new URL(url).pathname === "/favicon.ico";
}

/**
 * Loads one page and collects the first error observed for each kind: a console error, an
 * uncaught page exception (this is how a browser reports a module that failed to resolve or
 * evaluate, e.g. `import fs from "node:fs"`), a failed network request, and a non-2xx/3xx
 * response (a failed asset load).
 */
async function checkPage(browser, baseUrl, pagePath) {
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

  const url = `${baseUrl}/${String(pagePath).replace(/^\/+/, "")}`;
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
  const pages = process.argv.slice(2);
  if (pages.length === 0) {
    console.error("usage: npm run smoke -- <page-path> [<page-path> ...]");
    process.exit(1);
  }

  const server = await startEphemeralServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  let browser;
  let anyFailed = false;
  try {
    browser = await launchBrowser();
    for (const pagePath of pages) {
      const errorsByKind = await checkPage(browser, baseUrl, pagePath);
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
    await new Promise((resolve) => server.close(resolve));
  }

  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error(err.stack ?? String(err));
  process.exit(1);
});
