import { chromium, expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { LOCKED_COPY as copy } from '../lib/locked-copy';

const email = 'mailto:hello@triphalo.com';
const ready = async (page: Page) => {
  await page.goto('/');
  await expect(page.locator('canvas[data-ready="true"]')).toBeVisible();
};
const artwork = async (page: Page) => createHash('sha256')
  .update(await page.locator('canvas').first().screenshot({ animations: 'allow' })).digest('hex');

async function expectCopy(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(copy.mission);
  for (const heading of [copy.belief.heading, copy.work.heading, copy.contact.heading]) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toHaveCount(1);
  }
  for (const paragraph of [copy.descriptor, copy.introduction, ...copy.belief.paragraphs, ...copy.work.paragraphs]) {
    // Authored text preserves the words when CSS changes their case or layout.
    await expect(page.locator('p').filter({ hasText: paragraph }).first()).toHaveText(paragraph);
  }
  await expect(page.getByRole('link', { name: copy.contact.address, exact: true })).toHaveAttribute('href', email);
}

test('approved copy, semantic headings and sole email contact remain intact', async ({ page }) => {
  await page.goto('/');
  await expectCopy(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
  await expect(page.locator('form, input, textarea, iframe')).toHaveCount(0);
  expect(await page.locator('body').textContent()).not.toMatch(/tally\s*ho|jack\s*harris|jackharris\.ai/i);
  const links = await page.locator('a').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')));
  expect(links.every(href => href === email || href?.startsWith('#'))).toBe(true);
});

test('keyboard skip link and native section anchors reach readable content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content', exact: true });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  for (const id of ['belief', 'work', 'contact', 'opening']) {
    const link = page.locator(`a[href="#${id}"]`).filter({ visible: true }).first();
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test('artwork is alive on arrival, pauses, resumes and accepts keyboard tuning', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await page.mouse.move(4, 450);
  const first = await artwork(page);
  await page.waitForTimeout(450);
  expect(await artwork(page)).not.toBe(first);
  await expect(page.getByRole('button', { name: 'Motion on — pause animation', exact: true })).toHaveText('Motion on');
  await page.getByRole('button', { name: 'Motion on — pause animation', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Motion off — resume animation', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Motion off — resume animation', exact: true })).toHaveText('Motion off');
  await page.waitForTimeout(700);
  const paused = await artwork(page);
  await page.waitForTimeout(450);
  expect(await artwork(page)).toBe(paused);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Motion on — pause animation', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(450);
  expect(await artwork(page)).not.toBe(paused);
  const resonate = page.getByRole('button', { name: 'Resonate', exact: true });
  const canvas = page.locator('canvas').first();
  const before = Number(await canvas.getAttribute('data-tuning'));
  await resonate.focus();
  await page.keyboard.press(before < 1 ? 'ArrowRight' : 'ArrowLeft');
  await expect.poll(async () => Number(await canvas.getAttribute('data-tuning'))).not.toBe(before);
  expect(errors).toEqual([]);
});

test('reduced-motion preference starts still and can be explicitly resumed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const resume = page.getByRole('button', { name: 'Motion off — resume animation', exact: true });
  await expect(resume).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(4, 450);
  await page.waitForTimeout(300);
  const still = await artwork(page);
  await page.waitForTimeout(450);
  expect(await artwork(page)).toBe(still);
  await resume.click();
  await expect(page.getByRole('button', { name: 'Motion on — pause animation', exact: true })).toBeVisible();
  await page.mouse.move(4, 450);
  await page.waitForTimeout(450);
  expect(await artwork(page)).not.toBe(still);
});

test('a browser without WebGL retains the halo fallback, copy and contact', async ({ baseURL }) => {
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(baseURL!);
    await expect(page.locator('canvas')).toHaveAttribute('data-fallback', 'true');
    await expect(page.locator('.r-fallback')).toBeVisible();
    await expectCopy(page);
    await page.locator('a[href="#contact"]').filter({ visible: true }).first().click();
    await expect(page.getByRole('link', { name: copy.contact.address, exact: true })).toBeInViewport();
  } finally {
    await browser.close();
  }
});

test('mobile and narrow layouts keep the headline visible and email reachable without overflow', async ({ browser, baseURL }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    try {
      const page = await context.newPage();
      await page.goto(baseURL!);
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('a[href="#contact"]').filter({ visible: true }).first().tap();
      await expect(page.getByRole('link', { name: copy.contact.address, exact: true })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally {
      await context.close();
    }
  }
});

test('desktop and mobile headers expose only three section links and a working motion control', async ({ browser, baseURL }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const mobile = viewport.width < 760;
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
    try {
      const page = await context.newPage();
      await page.goto(baseURL!);
      const canvas = page.locator('canvas[data-ready="true"]');
      await expect(canvas).toBeVisible();
      const header = page.locator('header');
      const links = header.getByRole('navigation', { name: 'Main navigation' }).getByRole('link');
      await expect(links).toHaveCount(3);
      expect(await links.evaluateAll(items => items.map(item => item.getAttribute('href')))).toEqual(['#belief', '#work', '#contact']);
      await expect(header.getByRole('button')).toHaveCount(1);
      await expect(page.locator('.r-controls, .r-chapter-nav, .r-chapter-count, .r-chapter-dots, .r-progress')).toHaveCount(0);
      const targets = await header.locator('a, button').evaluateAll(items => items.map(item => {
        const { x, y, width, height } = item.getBoundingClientRect();
        return { x, y, width, height };
      }));
      for (const target of targets) {
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x + target.width).toBeLessThanOrEqual(viewport.width);
      }
      if (mobile) {
        expect(Math.abs(targets[0].y - targets[4].y)).toBeLessThan(1);
        expect(targets[1].y).toBeGreaterThanOrEqual(targets[0].y + targets[0].height);
      }
      const pause = header.getByRole('button', { name: 'Motion on — pause animation', exact: true });
      if (mobile) await pause.tap(); else await pause.click();
      await expect(canvas).toHaveAttribute('data-paused', 'true');
      const frozenFrames = await canvas.getAttribute('data-frames');
      await page.waitForTimeout(200);
      await expect(canvas).toHaveAttribute('data-frames', frozenFrames!);
      const resume = header.getByRole('button', { name: 'Motion off — resume animation', exact: true });
      if (mobile) await resume.tap(); else await resume.click();
      await expect.poll(async () => Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(Number(frozenFrames));
    } finally {
      await context.close();
    }
  }
});

test('mobile resize notifications preserve the drawing buffer until its size changes', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const canvas = page.locator('canvas[data-ready="true"]');
    await expect(canvas).toBeVisible();
    await page.getByRole('button', { name: 'Motion on — pause animation', exact: true }).tap();
    await expect(canvas).toHaveAttribute('data-paused', 'true');
    const writes = await canvas.evaluate(async element => {
      await document.fonts.ready;
      const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      await nextFrame(); await nextFrame();
      let writes = 0;
      const observer = new MutationObserver(records => { writes += records.length; });
      observer.observe(element, { attributes: true, attributeFilter: ['width', 'height'] });
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(new Event('resize'));
        await nextFrame();
      }
      await nextFrame(); await nextFrame();
      writes += observer.takeRecords().length;
      observer.disconnect();
      return writes;
    });
    expect(writes).toBe(0);
    const before = await canvas.evaluate(element => {
      const drawingCanvas = element as HTMLCanvasElement;
      return { width: drawingCanvas.width, height: drawingCanvas.height, frames: Number(drawingCanvas.dataset.frames) };
    });
    await page.setViewportSize({ width: 430, height: 900 });
    await expect.poll(async () => canvas.evaluate(element => (element as HTMLCanvasElement).width)).not.toBe(before.width);
    await expect.poll(async () => canvas.evaluate(element => (element as HTMLCanvasElement).height)).not.toBe(before.height);
    await expect.poll(async () => Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(before.frames);
    await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
    await expect(canvas).toHaveAttribute('data-rendered', 'true');
    await expect(canvas).toBeVisible();
  } finally {
    await context.close();
  }
});
