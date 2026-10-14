import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Browser acceptance for the current TripHalo homepage. Run against a local
// development or production server: RESONANCE_URL=http://127.0.0.1:4310 node scripts/verify-resonance.mjs
const url = process.env.RESONANCE_URL || 'http://127.0.0.1:4310';
const output = path.resolve('evidence/resonance');
const record = !process.argv.includes('--no-record');
const recordOnly = process.argv.includes('--record-only');
const browserChannel = process.env.PLAYWRIGHT_CHANNEL || 'chrome';
const checks = [];
const pageErrors = [];
const consoleErrors = [];
const failedResponses = [];
const copy = [
  'Independent technology & experience studio',
  'Intelligence in service of human experience.',
  'TripHalo builds intelligent systems and helps deliver human-led experiences.',
  'The future should feel more human.',
  'AI can take on much of the work that keeps a business busy. Its greater promise is what that makes possible.',
  "More attention for guests. The capacity to develop an idea that's been waiting for years. A team able to act on what it knows.",
  'We build towards that future, with people responsible for the decisions that matter.',
  'From ambition to working systems.',
  'We work from the first question through to implementation, developing bespoke software and AI workflows and helping teams put new capabilities to use.',
  'Our work spans technology and travel operations, from the systems behind a business to the experiences it delivers. We have a particular interest in tour operators, attractions and businesses built around time spent together.',
  'Have something in mind?',
  'hello@triphalo.com',
];
const normalise = text => text.replace(/\s+/g, ' ').trim();
const checksum = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: browserChannel,
  headless: true,
  args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function check(name, operation) {
  const start = Date.now();
  try {
    const detail = await operation();
    checks.push({ name, status: 'PASS', durationMs: Date.now() - start, ...(detail ? { detail } : {}) });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, status: 'FAIL', durationMs: Date.now() - start, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

function observe(page, label) {
  page.on('pageerror', error => pageErrors.push({ label, message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push({ label, message: message.text() });
  });
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push({ label, status: response.status(), url: response.url() });
  });
}

async function open(page, label, needsCanvas = true) {
  observe(page, label);
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200, 'Homepage must return HTTP 200');
  await page.evaluate(() => document.fonts.ready);
  if (needsCanvas) await expect(page.locator('canvas[data-ready="true"], [data-ready="true"] canvas').first()).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(400);
}

async function noOverflow(page) {
  const size = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(size.scrollWidth <= size.width + 1, `Horizontal overflow: ${JSON.stringify(size)}`);
  return size;
}

async function exactCopy(page) {
  // innerText reflects CSS text-transform; compare the authored words while
  // retaining the intentional word boundary introduced by a visual line break.
  const authored = await page.locator('body').evaluate(body => {
    const content = body.cloneNode(true);
    content.querySelectorAll('script, style').forEach(node => node.remove());
    content.querySelectorAll('br').forEach(node => node.replaceWith(document.createTextNode(' ')));
    content.querySelectorAll('p, h1, h2, h3, a, section, div, span, button').forEach(node => node.append(document.createTextNode(' ')));
    return content.textContent || '';
  });
  const visible = normalise(authored);
  for (const fragment of copy) assert.ok(visible.includes(normalise(fragment)), `Missing or altered copy: ${fragment}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(copy[1]);
  for (const text of [copy[3], copy[7], copy[10]]) await expect(page.getByRole('heading', { name: text, exact: true })).toHaveCount(1);
  for (const banned of ['tally ho', 'jack harris', 'jackharris.ai']) assert.ok(!visible.toLowerCase().includes(banned), `Forbidden copy: ${banned}`);
  const contact = page.locator('a[href^="mailto:"]');
  assert.ok(await contact.count() >= 1, 'Email link missing');
  for (const link of await contact.all()) await expect(link).toHaveAttribute('href', 'mailto:hello@triphalo.com');
  await expect(page.locator('form, input:not([type="range"]), textarea, iframe, a[href^="tel:"]')).toHaveCount(0);
  return { lockedCopyFragments: copy.length, emailLinks: await contact.count() };
}

async function visitAnchor(page, id) {
  const link = page.locator(`a[href="#${id}"]`).filter({ visible: true }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  const section = page.locator(`#${id}`);
  await expect(section).toBeInViewport();
  await page.waitForTimeout(1000);
  const bounds = await section.boundingBox();
  assert.ok(bounds && bounds.y < page.viewportSize().height && bounds.y + bounds.height > 0, `${id} did not scroll into view`);
  await noOverflow(page);
}

async function canvasShot(page) {
  return checksum(await page.locator('canvas').first().screenshot({ animations: 'allow' }));
}

async function scrollJourney(page, id, durationMs) {
  // Drive the real page's scroll position. No component state, animation clock,
  // uniforms or debug hooks are altered for the recording.
  await page.evaluate(({ id, durationMs }) => new Promise(resolve => {
    const target = document.getElementById(id);
    if (!target) throw new Error(`Missing scroll target ${id}`);
    const start = window.scrollY;
    const end = Math.min(target.offsetTop, document.documentElement.scrollHeight - innerHeight);
    let started;
    function frame(now) {
      started ??= now;
      const progress = Math.min(1, (now - started) / durationMs);
      const eased = (1 - Math.cos(progress * Math.PI)) / 2;
      window.scrollTo({ top: start + (end - start) * eased, behavior: 'instant' });
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  }), { id, durationMs });
}

try {
  if (!recordOnly) {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await desktop.newPage();
  await check('Desktop homepage and engine render', () => open(page, 'desktop'));
  await check('All locked copy, headings and sole email contact', () => exactCopy(page));
  await check('Desktop has no horizontal overflow', () => noOverflow(page));
  await page.screenshot({ path: path.join(output, 'desktop-opening.png') });
  await check('Motion is visible before scrolling and pause freezes the artwork', async () => {
    await page.mouse.move(6, 500);
    const moving1 = await canvasShot(page);
    await page.waitForTimeout(800);
    const moving2 = await canvasShot(page);
    assert.notEqual(moving1, moving2, 'Artwork did not change while motion was active');
    await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Resume motion', exact: true })).toBeVisible();
    await page.mouse.move(6, 500);
    await page.waitForTimeout(1400);
    const paused1 = await canvasShot(page);
    await page.waitForTimeout(800);
    const paused2 = await canvasShot(page);
    assert.equal(paused1, paused2, 'Artwork continues changing after pause');
    await page.screenshot({ path: path.join(output, 'desktop-paused.png') });
    await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
    await page.waitForTimeout(700);
    assert.notEqual(await canvasShot(page), paused2, 'Resume did not restart the artwork');
    return { moving1, moving2, paused1, paused2 };
  });
  await check('Keyboard tuning and Resonate interaction', async () => {
    const slider = page.getByRole('slider', { name: 'Tune the halo', exact: true });
    await expect(slider).toBeVisible();
    await slider.focus();
    const before = Number(await slider.inputValue());
    const max = Number(await slider.getAttribute('max') || '100');
    await page.keyboard.press(before < max ? 'ArrowRight' : 'ArrowLeft');
    assert.notEqual(Number(await slider.inputValue()), before, 'Keyboard arrow did not change tuning');
    const resonate = page.getByRole('button', { name: 'Resonate', exact: true });
    await resonate.focus();
    await page.keyboard.press('Enter');
    await expect(resonate).toBeVisible();
  });
  for (const id of ['belief', 'work', 'contact', 'opening']) {
    await check(`Desktop #${id} navigation`, async () => {
      await visitAnchor(page, id);
      await page.screenshot({ path: path.join(output, `desktop-${id}.png`) });
    });
  }
  await check('Continuous scrolling changes the rendered story across chapters', async () => {
    const scenes = [];
    for (const id of ['opening', 'belief', 'work', 'contact']) {
      await scrollJourney(page, id, 1200);
      await page.waitForTimeout(400);
      const state = await page.locator('canvas').first().evaluate(canvas => ({ ...canvas.dataset }));
      const pixels = await canvasShot(page);
      await page.screenshot({ path: path.join(output, `story-${id}.png`) });
      scenes.push({ target: id, state, pixels });
    }
    assert.ok(new Set(scenes.map(scene => scene.pixels)).size >= 3, 'Scrolling did not produce distinct rendered scenes');
    assert.ok(scenes.every(scene => scene.state.scenePhase), 'Rendered scene phase is missing from the canvas');
    assert.ok(new Set(scenes.map(scene => scene.state.scenePhase)).size >= 3, 'Rendered phase did not advance through the journey');
    return scenes;
  });
  await check('Keyboard skip link reaches page content', async () => {
    await page.goto(url);
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({ text: document.activeElement?.textContent, href: document.activeElement?.getAttribute('href') }));
    assert.match(focus.text || '', /skip/i, 'First keyboard focus should be a skip link');
    assert.ok(focus.href?.startsWith('#'), 'Skip link should target page content');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const focusState = await page.evaluate(href => ({ hash: location.hash, targetExists: !!document.querySelector(href), activeId: document.activeElement?.id }), focus.href);
    assert.ok(focusState.targetExists);
    assert.ok(focusState.hash === focus.href || `#${focusState.activeId}` === focus.href, 'Skip link did not move to its target');
    return focusState;
  });
  await desktop.close();

  for (const [label, width, height] of [['mobile', 390, 844], ['narrow', 320, 740]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const mobile = await context.newPage();
    await check(`${label} ${width}×${height} opening, copy and layout`, async () => {
      await open(mobile, label);
      await exactCopy(mobile);
      await noOverflow(mobile);
      await expect(mobile.getByRole('heading', { level: 1 })).toBeInViewport();
      await mobile.screenshot({ path: path.join(output, `${label}-opening.png`) });
    });
    await check(`${label} motion and tuning touch controls`, async () => {
      const pause = mobile.getByRole('button', { name: 'Pause motion', exact: true });
      await expect(pause).toBeInViewport();
      await pause.tap();
      await expect(mobile.getByRole('button', { name: 'Resume motion', exact: true })).toBeVisible();
      const slider = mobile.getByRole('slider', { name: 'Tune the halo', exact: true });
      await slider.scrollIntoViewIfNeeded();
      const bounds = await slider.boundingBox();
      assert.ok(bounds && bounds.width > 60);
      const previousValue = Number(await slider.inputValue());
      const minimum = Number(await slider.getAttribute('min') || '0');
      const maximum = Number(await slider.getAttribute('max') || '100');
      const relative = (previousValue - minimum) / (maximum - minimum);
      await mobile.touchscreen.tap(bounds.x + bounds.width * (relative > .7 ? .2 : .8), bounds.y + bounds.height / 2);
      assert.notEqual(Number(await slider.inputValue()), previousValue, 'Touch did not change tuning');
      await mobile.getByRole('button', { name: 'Resonate', exact: true }).tap();
    });
    for (const id of ['belief', 'work', 'contact', 'opening']) {
      await check(`${label} #${id} navigation`, async () => {
        await visitAnchor(mobile, id);
        await mobile.screenshot({ path: path.join(output, `${label}-${id}.png`) });
      });
    }
    await mobile.screenshot({ path: path.join(output, `${label}-full.png`), fullPage: true });
    await context.close();
  }

  const reduced = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const reducedPage = await reduced.newPage();
  await check('Reduced motion starts paused and remains visually stable', async () => {
    await open(reducedPage, 'reduced-motion');
    await expect(reducedPage.getByRole('button', { name: 'Resume motion', exact: true })).toBeVisible();
    await expect(reducedPage.getByRole('button', { name: 'Pause motion', exact: true })).toHaveCount(0);
    await reducedPage.mouse.move(6, 500);
    await reducedPage.waitForTimeout(1000);
    const first = await canvasShot(reducedPage);
    await reducedPage.waitForTimeout(800);
    assert.equal(await canvasShot(reducedPage), first, 'Reduced-motion artwork animates on load');
    await reducedPage.screenshot({ path: path.join(output, 'reduced-motion.png') });
  });
  await reduced.close();

  const noJS = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const staticPage = await noJS.newPage();
  await check('Core content and contact survive without JavaScript', async () => {
    await open(staticPage, 'no-javascript', false);
    await exactCopy(staticPage);
    await noOverflow(staticPage);
    await staticPage.locator('#contact').scrollIntoViewIfNeeded();
    await expect(staticPage.locator('a[href="mailto:hello@triphalo.com"]').first()).toBeVisible();
    await staticPage.screenshot({ path: path.join(output, 'no-javascript.png'), fullPage: true });
  });
  await noJS.close();
  }

  if (record) await check('Real browser interaction recording', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, recordVideo: { dir: output, size: { width: 1440, height: 1000 } } });
    const demo = await context.newPage();
    const video = demo.video();
    await open(demo, 'recording');
    await demo.waitForTimeout(3000);
    for (let i = 0; i < 30; i++) {
      const angle = i / 29 * Math.PI * 1.8;
      await demo.mouse.move(1040 + Math.cos(angle) * 210, 460 + Math.sin(angle) * 260);
      await demo.waitForTimeout(45);
    }
    const slider = demo.getByRole('slider', { name: 'Tune the halo', exact: true });
    const bounds = await slider.boundingBox();
    assert.ok(bounds, 'Recording tuning slider missing');
    await demo.mouse.move(bounds.x + bounds.width * .45, bounds.y + bounds.height / 2);
    await demo.mouse.down();
    for (const proportion of [.5, .6, .7, .8, .9, .75, .6, .45]) {
      await demo.mouse.move(bounds.x + bounds.width * proportion, bounds.y + bounds.height / 2, { steps: 3 });
      await demo.waitForTimeout(100);
    }
    await demo.mouse.up();
    const resonate = demo.getByRole('button', { name: 'Resonate', exact: true });
    await resonate.hover();
    await demo.mouse.down();
    await demo.waitForTimeout(800);
    await demo.mouse.up();
    await demo.waitForTimeout(800);
    await demo.mouse.move(1380, 450, { steps: 12 });
    await scrollJourney(demo, 'belief', 6000);
    await demo.waitForTimeout(1600);
    await scrollJourney(demo, 'work', 6000);
    await demo.waitForTimeout(1600);
    await scrollJourney(demo, 'contact', 4000);
    await demo.waitForTimeout(1800);
    await demo.getByRole('button', { name: 'Pause motion', exact: true }).click();
    await demo.waitForTimeout(900);
    await demo.getByRole('button', { name: 'Resume motion', exact: true }).click();
    await demo.waitForTimeout(900);
    await context.close();
    const webm = path.join(output, 'triphalo-interactions.webm');
    await rename(await video.path(), webm);
    const mp4 = path.join(output, 'triphalo-interactions.mp4');
    const conversion = spawnSync('ffmpeg', ['-y', '-i', webm, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4], { encoding: 'utf8' });
    assert.equal(conversion.status, 0, conversion.stderr?.slice(-2000));
    return { webm, mp4 };
  });

  await check('No browser exceptions, console errors or failed network responses', async () => {
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedResponses, []);
  });
} finally {
  await browser.close();
  const report = { url, generatedAt: new Date().toISOString(), browser: `Chromium (${browserChannel})`, checks, passed: checks.filter(x => x.status === 'PASS').length, failed: checks.filter(x => x.status === 'FAIL').length, pageErrors, consoleErrors, failedResponses };
  const reportName = recordOnly ? 'report-recording' : 'report';
  await writeFile(path.join(output, `${reportName}.json`), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(output, `${reportName}.md`), `# TripHalo browser verification\n\nLocal URL: ${url}\n\n${report.passed} checks passed; ${report.failed} failed.\n\n${checks.map(item => `- **${item.status}** ${item.name}${item.error ? ` — ${item.error.replace(/\n/g, ' ')}` : ''}`).join('\n')}\n`);
  console.log(`${report.passed} passed; ${report.failed} failed. Evidence: ${output}`);
  if (report.failed) process.exitCode = 1;
}
