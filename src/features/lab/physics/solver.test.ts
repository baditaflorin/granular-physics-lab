import { describe, expect, it } from "vitest";
import { fallbackKernel } from "./kernel";
import { GranularSolver } from "./solver";
import type { LabSettings } from "./types";

const settings: LabSettings = {
  material: "sand",
  flowRate: 80,
  tiltDegrees: 0,
  cohesionBoost: 0.2,
  particleBudget: 320,
  rigidSetup: "ramp",
  quality: "balanced"
};

describe("GranularSolver", () => {
  it("seeds and advances particles inside the budget", () => {
    const solver = new GranularSolver(settings, fallbackKernel);
    expect(solver.particles.length).toBeGreaterThan(80);

    for (let index = 0; index < 20; index += 1) {
      solver.step(1 / 60);
    }

    expect(solver.particles.length).toBeLessThanOrEqual(settings.particleBudget);
    expect(solver.getMetrics(60, "WebGL fallback").particleCount).toBe(solver.particles.length);
  });

  it("can prepare a slide sample", () => {
    const solver = new GranularSolver(settings, fallbackKernel);
    solver.seedSlide();
    expect(solver.particles.length).toBeGreaterThan(200);
    expect(solver.getRigidBodies().some((body) => body.id === "ramp")).toBe(true);
  });
});
