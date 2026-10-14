import { expect, test, type Page, type Route } from '@playwright/test';

const email = 'mailto:hello@triphalo.com';
const forbidden = /tally\s*ho|jack\s*harris/i;

async function expectUsefulPage(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Intelligence\s*in service of\s*human\s*experience\./);
  await expect(page.getByRole('heading', { name: 'Intelligent systems', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Human-led experiences', exact: true })).toBeVisible();
  await expect(page.locator(`a[href="${email}"]`).first()).toBeVisible();
  await expect(page.locator('form, input, textarea, iframe')).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toMatch(forbidden);
}

async function frameCount(page: Page) {
  return Number(await page.locator('.halo-scene').getAttribute('data-scene-frames') || 0);
}

async function expectFramesStill(page: Page) {
  // Allow the observer to finish any event already in flight, then verify quiescence.
  await page.waitForTimeout(180);
  const count = await frameCount(page);
  await page.waitForTimeout(650);
  expect(await frameCount(page)).toBe(count);
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow mobile', width: 320, height: 740 },
]) {
  test(`${viewport.name}: readable page, reachable contact, no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expectUsefulPage(page);
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const contact = page.getByRole('link', { name: 'hello@triphalo.com' });
    await expect(contact).toBeInViewport();
    await expect(contact).toHaveAttribute('href', email);
    await page.getByRole('link', { name: 'Back to top' }).click();
    await expect(page.locator('#opening')).toBeInViewport();
  });
}

test('public metadata, contact boundaries, and local image assets are correct', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('TripHalo | Technology & Experience Studio');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /software.*AI.*human-led travel experiences/i);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(new URL(canonical!).href).toBe('https://www.triphalo.com/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://www.triphalo.com/og-triphalo.jpg');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const allLinks = await page.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(allLinks.filter(href => href?.startsWith('mailto:'))).not.toHaveLength(0);
  expect(allLinks.every(href => href === email || href?.startsWith('#'))).toBe(true);
  expect(await page.locator('head').innerHTML()).not.toMatch(forbidden);
  for (const path of ['/favicon.svg', '/apple-touch-icon.png', '/og-triphalo.jpg', '/halo-poster.webp']) {
    const response = await request.get(path);
    expect(response.ok(), `${path} resolves`).toBe(true);
    expect(response.headers()['content-type'], `${path} has image MIME type`).toMatch(/^image\//);
    expect((await response.body()).length, `${path} is not empty`).toBeGreaterThan(100);
    if (path.endsWith('.svg')) expect(await response.text()).not.toMatch(forbidden);
  }
});

test('normal page has no runtime errors, failed requests, or missing local assets', async ({ page }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => failed.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready');
  await page.mouse.move(100, 200);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect.poll(() => errors).toEqual([]);
  expect(failed).toEqual([]);
  const brokenImages = await page.locator('img').evaluateAll(images => (images as HTMLImageElement[]).filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src));
  expect(brokenImages).toEqual([]);
});

test('keyboard skip link, focus treatment, mail contact, and motion control work', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  const focus = await skip.evaluate(element => {
    const style = getComputedStyle(element);
    return { outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(focus.outline).not.toBe('none');
  expect(focus.width).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  const pause = page.getByRole('button', { name: 'Pause artwork motion' });
  await expect(pause).toBeVisible();
  await pause.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Resume artwork motion' })).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(900, 50);
  await expectFramesStill(page);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Pause artwork motion' })).toHaveAttribute('aria-pressed', 'false');
  const contact = page.getByRole('link', { name: 'hello@triphalo.com' });
  await contact.focus();
  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute('href', email);
});

test('reduced-motion preference renders a composed poster without a canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expectUsefulPage(page);
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'static');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(0);
  await expect(page.locator('.halo-scene__poster')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('button', { name: /artwork motion/ })).toHaveCount(0);
});

test('changing reduced-motion preference disposes and restores the live scene', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'static');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(0);
  await page.mouse.move(10, 20);
  await expectFramesStill(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(1);
});

test('WebGL initialisation failure keeps readable content, contact, and poster', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (/webgl/i.test(kind)) return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await page.goto('/');
  await expectUsefulPage(page);
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'unavailable');
  await expect(page.locator('.halo-scene__poster')).toHaveCSS('opacity', '1');
  await page.getByRole('link', { name: 'hello@triphalo.com' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'hello@triphalo.com' })).toBeInViewport();
});

test('WebGL context loss returns to the poster', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready');
  await page.locator('.halo-scene canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'unavailable');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(0);
  await expect(page.locator('.halo-scene__poster')).toHaveCSS('opacity', '1');
});

test('failed local lighting asset leaves the poster and contact usable', async ({ page }) => {
  const unhandled: string[] = [];
  page.on('pageerror', error => unhandled.push(error.message));
  await page.route('**/studio-environment.bin.gz', route => route.abort('failed'));
  await page.goto('/');
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'unavailable');
  await expect(page.locator('.halo-scene__poster')).toHaveCSS('opacity', '1');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(0);
  await expectUsefulPage(page);
  expect(unhandled).toEqual([]);
});

test('reduced-motion change safely cancels an in-flight lighting asset', async ({ page }) => {
  const unhandled: string[] = [];
  let pendingRoute: Route | undefined;
  page.on('pageerror', error => unhandled.push(error.message));
  await page.route('**/studio-environment.bin.gz', route => { pendingRoute = route; });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => Boolean(pendingRoute)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'static');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(0);
  // Complete the old response after disposal: it must not overwrite the static state.
  await pendingRoute!.fulfill({ status: 503, body: 'Test lighting asset unavailable' });
  await page.waitForTimeout(250);
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'static');
  await page.unroute('**/studio-environment.bin.gz');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(1);
  expect(unhandled).toEqual([]);
});

test('scene responds to input, settles at rest, and stops offscreen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready');
  await page.mouse.move(40, 30);
  const before = await frameCount(page);
  await page.mouse.move(1300, 700, { steps: 5 });
  await expect.poll(() => frameCount(page)).toBeGreaterThan(before);
  await page.waitForTimeout(2000);
  await expectFramesStill(page);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.mouse.move(100, 100);
  await expectFramesStill(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const offscreenCount = await frameCount(page);
  await page.mouse.move(1000, 500);
  await expect.poll(() => frameCount(page)).toBeGreaterThan(offscreenCount);
});

test('simulated document visibility change stops and resumes scene rendering', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1100, clientY: 750 }));
  });
  await expectFramesStill(page);
  const hiddenCount = await frameCount(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => frameCount(page)).toBeGreaterThan(hiddenCount);
});

test('without JavaScript the server-rendered page and contact remain usable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expectUsefulPage(page);
  await expect(page.locator('.halo-scene__poster')).toHaveCSS('opacity', '1');
  await expect(page.locator('.halo-scene canvas')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'hello@triphalo.com' })).toHaveAttribute('href', email);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('throttled touch mobile reaches content and contact', async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8,
  });
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(baseURL!);
  await expectUsefulPage(page);
  await expect(page.locator('.halo-scene')).toHaveAttribute('data-scene-status', 'ready', { timeout: 30_000 });
  await session.send('Input.synthesizeScrollGesture', {
    x: 190, y: 600, yDistance: -600, speed: 550, gestureSourceType: 'touch',
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'hello@triphalo.com' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const timings = await page.evaluate(() => ({
    paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, startTime: entry.startTime })),
    navigation: performance.getEntriesByType('navigation').map(entry => entry.toJSON()),
  }));
  await testInfo.attach('mobile-throttle-timings.json', {
    body: JSON.stringify({ conditions: 'Chrome emulation; 390 × 844 at DPR 3; 4× CPU slowdown; 1.6 Mbps down / 0.75 Mbps up; 150 ms latency; local production server', ...timings }, null, 2),
    contentType: 'application/json',
  });
  await context.close();
});
