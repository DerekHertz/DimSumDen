// Local marketing capture. Requires the existing Playwright Chromium and ffmpeg.
// PW_GPU=1 DISPLAY=:0 node scripts/capture-readme.mjs
// Uses only the demo fixture; never connects to a running bridge or launches agents.
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildLaunchOptions } from '../apps/ci-cd/launch-options.mjs';

const root = resolve(import.meta.dirname, '..');
const images = resolve(root, 'docs/images');
const scratch = resolve(tmpdir(), 'dimsumdev-capture');
await mkdir(images, { recursive: true });
await mkdir(scratch, { recursive: true });
let browser, server;
const errors = [], writes = [];
try {
  // This hook exists only in this isolated Vite server, never in the shipped app.
  server = await createServer({
    configFile: resolve(root, 'apps/ui/vite.config.mjs'), configLoader: 'native',
    plugins: [{ name: 'local-capture', enforce: 'pre', transform(source, id) {
      // Feed the explorer's normal look input directly so projected panda labels
      // cannot intercept a scripted mouse drag. Movement still uses real keys.
      if (id.endsWith('/scene/procedural/explorer.mjs')) {
        const marker = 'return {camera,enter,exit';
        if (!source.includes(marker)) throw Error('Capture hook needs updating for explorer.mjs');
        return source.replace(marker, 'return {turn,camera,enter,exit');
      }
      if (!id.endsWith('/src/App.jsx')) return;
      const marker = '  const overflow = snapshot ?';
      if (!source.includes(marker)) throw Error('Capture hook needs updating for App.jsx');
      return source.replace(marker, '  globalThis.__denCapture = { stage, camera, den, pickPanda };\n' + marker);
    } }],
    server: { host: '127.0.0.1', port: 0 }, logLevel: 'error',
  });
  await server.listen();
  const options = buildLaunchOptions();
  browser = await chromium.launch({ ...options, args: [...(options.args ?? []), '--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1,
    recordVideo: { dir: scratch, size: { width: 1600, height: 1000 } } });
  const videoStarted = Date.now();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.method() !== 'GET') writes.push(r.url()); });
  const empty = { schema: 1, seq: 1, tickets: [], frontier: [], usage: null, requests: [], agents: [] };
  // Fulfil every bridge read locally, including the conversation history endpoint.
  await page.route(/\/(state|metrics|session|events|agents\/[^/]+\/transcript)(\?.*)?$/, route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/events') return route.fulfill({ contentType: 'text/event-stream', body: `event: snapshot\ndata: ${JSON.stringify(empty)}\n\n` });
    if (path === '/session') return route.fulfill({ status: 404, json: {} });
    return route.fulfill({ json: path === '/state' ? empty : path === '/metrics' ? {} : { entries: [], more: false } });
  });
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = undefined;
    const realNow = Date.now.bind(Date);
    window.__demoOffset = 0;
    Date.now = () => realNow() + window.__demoOffset;
  });
  await page.goto(`${server.resolvedUrls.local[0]}?demo=den`);
  await page.waitForFunction(() => !!window.__denCapture?.den, null, { timeout: 60000 });
  await page.waitForTimeout(1800);
  console.log('Garden ready');
  // Let shader compilation finish before the edit starts, then restart the replay.
  await page.getByRole('button', { name: 'Leave demo', exact: true }).click();
  await page.getByRole('button', { name: 'Watch the demo', exact: true }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve(images, 'dimsumdev-overview.png') });

  const origin = Date.now();
  const cue = async (ms, action) => {
    await page.waitForTimeout(Math.max(0, origin + ms - Date.now()));
    await action?.();
  };
  const marks = { started: origin, trimStartMs: origin - videoStarted, chapters: [], walkShots: [] };
  const mark = label => { const at = Date.now() - origin; marks.chapters.push({ label, at }); console.log(`${at}ms ${label}`); };
  mark('global');
  await cue(600, () => page.evaluate(() => window.__denCapture.camera.setZoom(.76)));
  await cue(3300, () => page.evaluate(() => window.__denCapture.camera.goToStation('steamers')));
  await cue(4500, async () => {
    // Raycast a real panda click using its projected world position.
    const point = await page.evaluate(() => {
      const { den, stage } = window.__denCapture;
      const record = den.roleWorkspaces.records.find(r => r.id === 'developer');
      const panda = den.roleWorkspaces.workspaces.get('developer').person;
      const v = panda.position.clone().set(record.person[0], record.person[1] + 1.1, record.person[2]).project(stage.camera);
      const box = document.querySelector('.forest-canvas canvas').getBoundingClientRect();
      return { x: box.x + (v.x + 1) * box.width / 2, y: box.y + (1 - v.y) * box.height / 2 };
    });
    mark('agent');
    await page.mouse.click(point.x, point.y);
    await page.getByRole('region', { name: 'Selected panda' }).waitFor();
  });
  await cue(5700, async () => {
    await page.evaluate(() => { window.__demoOffset = 20000; });
    await page.locator('.proximity-card button[data-key="R"]').click();
    await page.getByRole('complementary', { name: /Conversation with/ }).waitFor();
  });
  await cue(7600, () => page.screenshot({ path: resolve(images, 'dimsumdev-agents.png') }));
  await cue(9500, async () => {
    await page.getByRole('button', { name: 'Close conversation' }).click();
    await page.getByRole('button', { name: 'Close panda card' }).click();
    mark('walk');
    await page.getByRole('button', { name: 'Enter the den', exact: true }).click();
    await page.getByRole('button', { name: 'Leave the den', exact: true }).waitFor();
  });

  // Walk a real route using the app's mouse look, keys, ground and collision
  // checks. The edit keeps three short windows from this continuous tour.
  const pose = () => page.evaluate(() => {
    const c = window.__denCapture.stage.explorer.camera;
    return { x: c.position.x, z: c.position.z, yaw: c.rotation.y };
  });
  async function lookAt(x, z) {
    for (let attempt = 0; attempt < 16; attempt++) {
      const p = await pose();
      const goal = Math.atan2(p.x - x, p.z - z);
      const angle = Math.atan2(Math.sin(goal - p.yaw), Math.cos(goal - p.yaw));
      if (Math.abs(angle) < .015) return;
      const part = Math.max(-.8, Math.min(.8, angle));
      // Apply small normal look deltas over several frames for an eased turn.
      for (let step = 0; step < 8; step++) {
        await page.evaluate(dx => window.__denCapture.stage.explorer.turn(dx, 0), -part / .0025 / 8);
        await page.waitForTimeout(35);
      }
    }
    throw Error('Garden tour could not face its next waypoint');
  }
  const tourDeadline = Date.now() + 65000;
  async function walkTo(x, z) {
    await lookAt(x, z);
    await page.locator('main[aria-label="Den scene"]').focus();
    await page.keyboard.down('ShiftLeft');
    await page.keyboard.down('KeyW');
    let previous = await pose(), stagnant = 0;
    try {
      while (true) {
        const p = await pose();
        if (Math.hypot(p.x - x, p.z - z) < .65) break;
        const distance = Math.hypot(p.x - x, p.z - z);
        const before = Math.hypot(previous.x - x, previous.z - z);
        if (distance > before + .1) throw Error(`Garden tour diverged from ${x},${z}`);
        if (Date.now() > tourDeadline) throw Error('Garden tour exceeded 65 seconds');
        stagnant = Math.hypot(p.x - previous.x, p.z - previous.z) < .015 ? stagnant + 1 : 0;
        if (stagnant > 16) throw Error(`Garden tour blocked near ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
        previous = p;
        await page.waitForTimeout(180);
      }
    } finally {
      await page.keyboard.up('KeyW');
      await page.keyboard.up('ShiftLeft');
    }
  }
  async function shot(label, action) {
    const startMs = Date.now() - origin;
    await action();
    await page.waitForTimeout(850);
    const endMs = Date.now() - origin;
    const p = await pose();
    marks.walkShots.push({ label, startMs, endMs, position: p });
    console.log(`Tour: ${label} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
  }
  await walkTo(4, 29);
  await shot('tea-garden', async () => { await walkTo(4, 20); await lookAt(10.5, 20.5); });
  await walkTo(5, 15);
  await shot('bao-courtyard', async () => { await walkTo(5, 8); await lookAt(0, -.6); });
  await walkTo(-9, 8);
  await walkTo(-13, -4);
  await shot('steamers', async () => {
    await walkTo(-17, -5.8);
    await lookAt(-20.2, -11.9);
    await page.locator('main[aria-label="Den scene"]').focus();
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(650);
    await page.keyboard.up('KeyW');
    await page.screenshot({ path: resolve(images, 'dimsumdev-walk.png') });
  });
  mark('end');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Reset view ↗' }).click();
  await page.waitForTimeout(2300);
  marks.durationMs = Date.now() - origin;
  marks.errors = errors; marks.writes = writes;
  const video = page.video();
  await context.close();
  await copyFile(await video.path(), resolve(scratch, 'source.webm'));
  await writeFile(resolve(scratch, 'capture.json'), JSON.stringify(marks, null, 2) + '\n');
  if (errors.length || writes.length) throw Error(`Capture validation failed: ${JSON.stringify({ errors, writes })}`);
  console.log(`Captured ${marks.durationMs}ms; source and timings: ${scratch}`);
} finally {
  await browser?.close();
  await server?.close();
}
