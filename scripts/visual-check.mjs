import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.VISUAL_CHECK_URL ?? "http://127.0.0.1:4173/granular-physics-lab/";
const browser = await chromium.launch({ headless: true });

await mkdir(path.join(root, "docs"), { recursive: true });

try {
  await verifyViewport("desktop", { width: 1440, height: 920 }, "docs/demo.png");
  await verifyViewport("mobile", { width: 390, height: 844 }, "docs/demo-mobile.png");
} finally {
  await browser.close();
}

async function verifyViewport(name, viewport, outputPath) {
  const page = await browser.newPage({ viewport });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Pile/i }).click();
  await page.waitForTimeout(1200);

  const canvas = page.locator("canvas").first();
  await canvas.waitFor({ state: "visible" });

  const canvasPng = PNG.sync.read(await canvas.screenshot());
  const uniqueColors = new Set();
  let opaquePixels = 0;

  for (let y = 0; y < canvasPng.height; y += 12) {
    for (let x = 0; x < canvasPng.width; x += 12) {
      const offset = (canvasPng.width * y + x) * 4;
      const alpha = canvasPng.data[offset + 3] ?? 0;
      if (alpha < 16) {
        continue;
      }
      opaquePixels += 1;
      uniqueColors.add(
        `${canvasPng.data[offset] ?? 0}:${canvasPng.data[offset + 1] ?? 0}:${canvasPng.data[offset + 2] ?? 0}`
      );
    }
  }

  if (opaquePixels < 100 || uniqueColors.size < 16) {
    throw new Error(
      `${name} canvas did not render enough varied pixels: ${opaquePixels} opaque samples, ${uniqueColors.size} colors`
    );
  }

  await page.screenshot({ path: path.join(root, outputPath), fullPage: true });
  await page.close();
}
