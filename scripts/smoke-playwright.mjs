import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_URL ?? "http://127.0.0.1:4173/granular-physics-lab/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 820 } });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Granular Physics Lab" }).waitFor();
  await page.getByRole("button", { name: /Pile/i }).click();
  await page.waitForTimeout(900);
  const particleText = await page.getByTestId("particle-count").innerText();
  const particleCount = Number(particleText.replace(/[^0-9]/g, ""));

  if (!Number.isFinite(particleCount) || particleCount < 40) {
    throw new Error(`Expected at least 40 particles, got ${particleText}`);
  }

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors found:\n${consoleErrors.join("\n")}`);
  }
} finally {
  await browser.close();
}
