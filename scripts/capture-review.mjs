import { chromium } from "@playwright/test";
import { mkdir, rename } from "node:fs/promises";
await mkdir("evidence/captures", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: "evidence/recordings",
    size: { width: 1440, height: 900 },
  },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:3000");
await page.locator('[data-scene-status="ready"]').waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "evidence/captures/desktop.png" });
await page.screenshot({
  path: "evidence/captures/desktop-full.png",
  fullPage: true,
});
await page.mouse.move(960, 330, { steps: 35 });
await page.waitForTimeout(500);
await page.mouse.move(1220, 520, { steps: 50 });
await page.waitForTimeout(500);
for (let y = 0; y <= 480; y += 8) {
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    y,
  );
  await page.waitForTimeout(45);
}
await page.waitForTimeout(500);
for (let y = 480; y >= 0; y -= 8) {
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    y,
  );
  await page.waitForTimeout(35);
}
await page.waitForTimeout(500);
const video = page.video();
await context.close();
await rename(await video.path(), "evidence/triphalo-interaction.webm");
for (const [name, width, height] of [
  ["mobile", 390, 844],
  ["narrow-mobile", 320, 568],
  ["tablet", 768, 1024],
]) {
  const c = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:3000");
  await p.locator('[data-scene-status="ready"]').waitFor();
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `evidence/captures/${name}.png` });
  await p.screenshot({
    path: `evidence/captures/${name}-full.png`,
    fullPage: true,
  });
  await c.close();
}
const reduced = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const r = await reduced.newPage();
await r.goto("http://127.0.0.1:3000");
await r.locator('[data-scene-status="static"]').waitFor();
await r.locator(".halo-scene__poster").evaluate((img) => img.decode());
await r.screenshot({ path: "evidence/captures/reduced-motion.png" });
await reduced.close();
await browser.close();
console.log(
  "Desktop, tablet, 390px, 320px, reduced-motion captures and interaction recording saved.",
);
