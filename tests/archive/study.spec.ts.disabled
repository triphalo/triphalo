import { expect, test, type Page } from '@playwright/test';

const study = (page: Page) => page.getByTestId('aperture-study');
const frameCount = async (page: Page) => Number(await study(page).getAttribute('data-scene-frames') || 0);

async function openStudy(page: Page) {
  await page.goto('/study');
  await expect(study(page)).toBeVisible();
  await expect(study(page)).toHaveAttribute('data-scene-status', 'ready');
}

async function scrollToProgress(page: Page, progress: number) {
  await page.getByTestId('study-scroll-track').evaluate((track, fraction) => {
    const rect = track.getBoundingClientRect();
    const start = rect.top + scrollY;
    window.scrollTo({ top: start + Math.max(0, rect.height - innerHeight) * fraction, behavior: 'instant' });
  }, progress);
}

async function expectNoOverflow(page: Page) {
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
}

async function expectFramesStill(page: Page) {
  await page.waitForTimeout(180);
  const count = await frameCount(page);
  await page.waitForTimeout(650);
  expect(await frameCount(page)).toBe(count);
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow mobile', width: 320, height: 740 },
]) {
  test(`study ${viewport.name}: artwork and controls fit without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStudy(page);
    await expectNoOverflow(page);
    await expect(page.getByRole('button', { name: /pause.*motion/i })).toBeVisible();
    await scrollToProgress(page, 0.92);
    await expect(study(page)).toHaveAttribute('data-phase', 'world');
    await expectNoOverflow(page);
    await expect(page.getByRole('button', { name: /replay/i })).toBeVisible();
  });
}

test('study native scrolling traverses alignment, passage, and inhabited world', async ({ page }, testInfo) => {
  await openStudy(page);
  await scrollToProgress(page, 0);
  await expect(study(page)).toHaveAttribute('data-phase', 'alignment');
  const screenshots: Buffer[] = [];
  for (const step of [
    { progress: 0.08, phase: 'alignment' },
    { progress: 0.58, phase: 'passage' },
    { progress: 0.94, phase: 'world' },
  ]) {
    await scrollToProgress(page, step.progress);
    await expect(study(page)).toHaveAttribute('data-phase', step.phase);
    await expect.poll(async () => Number(await study(page).getAttribute('data-progress'))).toBeCloseTo(step.progress, 1);
    await page.waitForTimeout(500);
    const screenshot = await page.screenshot();
    screenshots.push(screenshot);
    await testInfo.attach(`study-${step.phase}.png`, { body: screenshot, contentType: 'image/png' });
  }
  expect(screenshots[0].equals(screenshots[1]), 'passage must produce different rendered pixels').toBe(false);
  expect(screenshots[1].equals(screenshots[2]), 'arrival must produce different rendered pixels').toBe(false);
  await page.getByRole('button', { name: /replay/i }).click();
  await expect(study(page)).toHaveAttribute('data-phase', 'alignment');
});

test('study phase navigation and pause control work from the keyboard', async ({ page }) => {
  await openStudy(page);
  const pass = page.getByRole('button', { name: /pass through/i });
  await pass.focus();
  await page.keyboard.press('Enter');
  await expect(study(page)).toHaveAttribute('data-phase', 'passage');
  const pause = page.getByRole('button', { name: /pause.*motion/i });
  await pause.focus();
  await page.keyboard.press('Space');
  await expect(study(page)).toHaveAttribute('data-scene-status', 'paused');
  await scrollToProgress(page, 0.94);
  await page.mouse.move(90, 130);
  await expectFramesStill(page);
  const pausedCount = await frameCount(page);
  await page.getByRole('button', { name: /resume.*motion/i }).focus();
  await page.keyboard.press('Enter');
  await expect(study(page)).toHaveAttribute('data-scene-status', 'ready');
  await expect.poll(() => frameCount(page)).toBeGreaterThan(pausedCount);
  await expect(study(page)).toHaveAttribute('data-phase', 'world');
});

test('study reduced motion shows a static world without a canvas', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/study');
  await expect(study(page)).toHaveAttribute('data-scene-status', 'static');
  await expect(study(page).locator('canvas')).toHaveCount(0);
  await expect(study(page).locator('.study-world-image')).toBeVisible();
  await expect(study(page).locator('.study-final')).toHaveCSS('opacity', '1');
  await expectNoOverflow(page);
  const asset = await request.get('/study/garden-room.webp');
  expect(asset.ok()).toBe(true);
  expect(asset.headers()['content-type']).toMatch(/^image\/webp/);
  expect((await asset.body()).length).toBeGreaterThan(1000);
  await page.mouse.move(100, 100);
  await expectFramesStill(page);
});

test('study changing reduced motion disposes and restores a single scene', async ({ page }) => {
  await openStudy(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(study(page)).toHaveAttribute('data-scene-status', 'static');
  await expect(study(page).locator('canvas')).toHaveCount(0);
  await expectFramesStill(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(study(page)).toHaveAttribute('data-scene-status', 'ready');
  await expect(study(page).locator('canvas')).toHaveCount(1);
});

test('study graphics failure preserves a composed fallback without an unhandled error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (/webgl/i.test(kind)) return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await page.goto('/study');
  await expect(study(page)).toHaveAttribute('data-scene-status', 'unavailable');
  await expect(study(page).locator('canvas')).toHaveCount(0);
  await expect(study(page).locator('.study-world-image')).toBeVisible();
  await expect(study(page).locator('.study-final')).toHaveCSS('opacity', '1');
  await expect(study(page)).toBeVisible();
  await expectNoOverflow(page);
  expect(errors).toEqual([]);
});

test('study journey has no runtime errors or missing local assets', async ({ page }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => failed.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await openStudy(page);
  await scrollToProgress(page, 0.92);
  await expect(study(page)).toHaveAttribute('data-phase', 'world');
  await page.waitForTimeout(500);
  const broken = await page.locator('img').evaluateAll(images => (images as HTMLImageElement[]).filter(image => !image.complete || !image.naturalWidth).map(image => image.src));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
