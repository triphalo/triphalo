/**
 * Rebuild the local studio lighting. Run from the repository: node scripts/bake-environment.mjs
 * Requires installed Chrome and the project's dev dependencies; no external assets or services.
 * Source: Three.js RoomEnvironment (MIT, dependency license), sigma 0.045, 64px faces.
 * Output: 336 x 256 RGBA half-float, linear-sRGB CubeUV, gzip. Keep the loader dimensions aligned.
 */
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const routes = new Map([
  ["/three.module.js", `${root}node_modules/three/build/three.module.js`],
  ["/three.core.js", `${root}node_modules/three/build/three.core.js`],
  ["/RoomEnvironment.js", `${root}node_modules/three/examples/jsm/environments/RoomEnvironment.js`],
]);
const html = `<!doctype html><script type="importmap">{"imports":{"three":"/three.module.js"}}</script><script type="module">
import * as THREE from "three";
import { RoomEnvironment } from "/RoomEnvironment.js";
const renderer = new THREE.WebGLRenderer({ antialias: false });
const environment = new RoomEnvironment();
const generator = new THREE.PMREMGenerator(renderer);
const target = generator.fromScene(environment, 0.045, 0.1, 100, { size: 64 });
const pixels = new Uint16Array(target.width * target.height * 4);
renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, pixels);
window.result = { width: target.width, height: target.height, data: Array.from(pixels) };
target.dispose(); environment.dispose(); generator.dispose(); renderer.dispose();
</script>`;

const server = createServer(async (request, response) => {
  try {
    const source = routes.get(request.url);
    if (source) {
      response.setHeader("Content-Type", "text/javascript");
      response.end(await readFile(source));
    } else if (request.url === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end(html);
    } else {
      response.writeHead(404).end();
    }
  } catch {
    response.writeHead(500).end();
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.result, null, { timeout: 30_000 });
  const result = await page.evaluate(() => window.result);
  if (result.width !== 336 || result.height !== 256 || !result.data.some((value) => value > 0)) {
    throw new Error("Unexpected or empty lighting bake");
  }
  const raw = Buffer.from(new Uint16Array(result.data).buffer);
  const compressed = gzipSync(raw, { level: 9 });
  await writeFile(`${root}public/studio-environment.bin.gz`, compressed);
  console.log(`Baked ${result.width} × ${result.height} HDR studio lighting: ${compressed.byteLength} bytes.`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
