import { chromium } from "@playwright/test";
import sharp from "sharp";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1400, height: 1400 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:3000");
await page.locator('[data-scene-status="ready"]').waitFor();
await page.addStyleTag({
  content: `body {background:#f2f0e9!important} .site-header,.opening-copy,.opening-base,.opening-index,.motion-toggle,#possibility,#practice,#contact{visibility:hidden!important} .opening{height:1400px!important;max-height:none!important;background:transparent!important} .visual-stage{position:absolute!important;left:0!important;top:0!important;bottom:auto!important;margin:0!important;width:1400px!important;height:1400px!important} .halo-scene__poster{display:none!important}`,
});
await page.waitForTimeout(700);
const art = await page.locator(".halo-scene__canvas").screenshot();
await sharp(art).webp({ quality: 90 }).toFile("public/halo-poster.webp");
await sharp(art).resize(700, 700).webp({ quality: 85 }).toFile("public/halo-poster-mobile.webp");
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><html><head><style>
@font-face{font-family:Manrope;src:url('http://127.0.0.1:3000/fonts/manrope-latin-variable.woff2')}@font-face{font-family:Instrument;src:url('http://127.0.0.1:3000/fonts/instrument-serif-latin-italic.woff2');font-style:italic}*{box-sizing:border-box}body{margin:0;background:#f2f0e9;color:#30372e;font-family:Manrope,sans-serif;width:1200px;height:630px;position:relative;overflow:hidden}.brand{position:absolute;top:42px;left:56px;font-size:29px;letter-spacing:-1.4px;font-weight:600;display:flex;align-items:center;gap:10px}.brand img{width:37px}h1{position:absolute;left:56px;top:143px;margin:0;font-size:71px;line-height:1.02;letter-spacing:-4px;font-weight:400;z-index:2}em{font:italic 82px/.94 Instrument,serif;letter-spacing:-2px}.art{position:absolute;left:590px;top:25px;width:660px;height:660px}.descriptor{position:absolute;left:56px;bottom:43px;font-size:13px;letter-spacing:-.2px}.site{position:absolute;right:56px;bottom:43px;font-size:13px}</style></head><body><img class="art" src="http://127.0.0.1:3000/halo-poster.webp?v=${Date.now()}"><div class="brand"><img src="http://127.0.0.1:3000/favicon.svg">TripHalo</div><h1>Intelligence<br>in service of<br><em>human experience.</em></h1><div class="descriptor">Independent technology &amp; experience studio.</div><div class="site">triphalo.com</div></body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.locator(".art").evaluate((img) => img.decode());
await page.screenshot({
  path: "public/og-triphalo.jpg",
  type: "jpeg",
  quality: 92,
});
await browser.close();
console.log("Rendered local Three.js poster and 1200 × 630 social image.");
