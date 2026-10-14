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
