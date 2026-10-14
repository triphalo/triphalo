import { chromium } from "@playwright/test";
import { mkdir, rename } from "node:fs/promises";

const url = process.env.STUDY_URL || "http://127.0.0.1:3001/study";
await mkdir("evidence/study-captures", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function scrollTo(page, progress) {
  await page.evaluate((p) => {
    const track = document.querySelector('[data-testid="study-scroll-track"]');
    const rect = track.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top + (rect.height - innerHeight) * p, behavior: "instant" });
  }, progress);
}
async function settle(page, progress) {
  await page.waitForFunction((p) => Math.abs(Number(document.querySelector('[data-testid="aperture-study"]').getAttribute("data-progress")) - p) < 0.002, progress);
}
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  recordVideo: { dir: "evidence/recordings", size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
await page.goto(url);
await page.locator('[data-scene-status="ready"]').waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "evidence/study-captures/01-invitation.png" });
for (let i = 0; i <= 240; i++) {
  await scrollTo(page, i / 240);
  await page.waitForTimeout(48);
  if ([74, 134, 166, 224].includes(i)) {
    const names = { 74: "02-alignment", 134: "03-passage", 166: "04-threshold", 224: "05-arrival" };
    await page.screenshot({ path: `evidence/study-captures/${names[i]}.png` });
  }
}
await settle(page, 1);
await page.waitForTimeout(1300);
const video = page.video();
await context.close();
await rename(await video.path(), "evidence/aperture-study.webm");

for (const [name, width, height] of [["mobile", 390, 844], ["narrow", 320, 568]]) {
  const c = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await c.newPage();
  await p.goto(url);
  await p.locator('[data-scene-status="ready"]').waitFor();
  await p.evaluate(() => document.fonts.ready);
  for (const [phase, progress] of [["invitation", 0], ["passage", 0.56], ["arrival", 1]]) {
    await scrollTo(p, progress);
    await settle(p, progress);
    await p.screenshot({ path: `evidence/study-captures/${name}-${phase}.png` });
  }
  await c.close();
}
const c = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const p = await c.newPage();
await p.goto(url);
await p.locator('[data-scene-status="static"]').waitFor();
await p.screenshot({ path: "evidence/study-captures/reduced-motion.png", fullPage: true });
await c.close();
await browser.close();
console.log("Study phase captures, mobile views and continuous motion recording saved.");
