// ci-cd/05: launch options shared by the browser launchers (smoke.mjs, smoke-ui.mjs).
// Cloud sessions ship Chromium 1194 while Playwright wants another build, so PW_CHROMIUM_PATH
// points the launchers at the preinstalled binary. Software GL flags because there is no GPU.
//
// PW_GPU=1 (local WSL with a display): headless Chromium always falls back to SwiftShader, a CPU
// rasteriser, so this launches headed, on the real card through Mesa's D3D12 driver, with the window
// parked off-screen. Measured on the den scene: about 2 fps headless, 34 fps here. No display, no change.
const WSL_LIB = "/usr/lib/wsl/lib";
const GPU_ARGS = ["--use-angle=gl", "--ignore-gpu-blocklist", "--window-position=-32000,-32000"];

export function buildLaunchOptions(channel, env = process.env) {
  const executablePath = env.PW_CHROMIUM_PATH;
  const base = executablePath ? { executablePath } : channel ? { channel } : {};
  if (env.PW_GPU === "1" && (env.DISPLAY || env.WAYLAND_DISPLAY)) {
    const libs = env.LD_LIBRARY_PATH ? `${WSL_LIB}:${env.LD_LIBRARY_PATH}` : WSL_LIB;
    return { ...base, headless: false, args: GPU_ARGS, env: { ...env, GALLIUM_DRIVER: "d3d12", LD_LIBRARY_PATH: libs } };
  }
  if (executablePath) return { ...base, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };
  return base;
}
