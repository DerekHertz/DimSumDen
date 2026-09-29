# Cloud sessions

## Browser tests (Chromium 1194)

Cloud sessions ship Chromium 1194 at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, but the installed Playwright wants a different build, so browser launches fail with "Executable doesn't exist". Point the launchers at the preinstalled binary:

```
export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
```

`npm run smoke` and `npm run smoke:ui` (via `apps/ci-cd/launch-options.mjs`) then launch that executable with the software-GL flags `--use-angle=swiftshader --enable-unsafe-swiftshader`, ignoring the Chrome/Edge channel lookup. Unset or empty means today's behaviour.
