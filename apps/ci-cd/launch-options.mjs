// ci-cd/05: launch options shared by the browser launchers (smoke.mjs, smoke-ui.mjs).
// Cloud sessions ship Chromium 1194 while Playwright wants another build, so PW_CHROMIUM_PATH
// points the launchers at the preinstalled binary. Software GL flags because there is no GPU.
export function buildLaunchOptions(channel, env = process.env) {
  const executablePath = env.PW_CHROMIUM_PATH;
  if (executablePath) {
    return { executablePath, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };
  }
  return channel ? { channel } : {};
}
