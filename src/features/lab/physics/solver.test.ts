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

  it("holds a real slope instead of creeping flat once a pile settles", () => {
    // Regression test for a real bug: inter-particle friction was capped at
    // a fixed +/-0.08 impulse regardless of the material's `friction`
    // coefficient, so a resting pile crept sideways a little every substep
    // and settled almost flat (measured ~13.5deg here, sliding all the way
    // to the world's outer wall) instead of holding a slope, no matter how
    // high `friction` was set. After tying the Coulomb friction cap to
    // `friction`, the same setup holds a materially steeper, better
    // contained slope (measured ~21deg, comfortably clear of the wall).
    const settleSettings: LabSettings = {
      material: "sand",
      flowRate: 0,
      tiltDegrees: 0,
      cohesionBoost: 0,
      particleBudget: 500,
      rigidSetup: "ramp",
      quality: "dense"
    };
    const solver = new GranularSolver(settleSettings, fallbackKernel);
    solver.setPouring(false);
    solver.clear();
    solver.seedPile(400);

    for (let i = 0; i < 900; i += 1) {
      solver.step(1 / 60);
    }

    const floorY = solver.bounds.bottom;
    const xs = solver.particles.map((p) => p.x);
    const ys = solver.particles.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const peakHeight = Math.max(...ys) - floorY;
    const halfWidth = (maxX - minX) / 2;
    const angleDeg = (Math.atan2(peakHeight, halfWidth) * 180) / Math.PI;

    for (const p of solver.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
    expect(angleDeg).toBeGreaterThan(16);
    expect(minX).toBeGreaterThan(-5.8);
  }, 20000);

  it("stays numerically stable and inside world bounds under sustained max load", () => {
    const settings: LabSettings = {
      material: "sand",
      flowRate: 140,
      tiltDegrees: 0,
      cohesionBoost: 0.2,
      particleBudget: 900,
      rigidSetup: "basin",
      quality: "dense"
    };
    const solver = new GranularSolver(settings, fallbackKernel);
    const bounds = solver.bounds;

    for (let i = 0; i < 900; i += 1) {
      solver.step(1 / 60);
      if (i % 200 === 0) {
        for (const p of solver.particles) {
          expect(Number.isFinite(p.x)).toBe(true);
          expect(Number.isFinite(p.y)).toBe(true);
          expect(Number.isFinite(p.vx)).toBe(true);
          expect(Number.isFinite(p.vy)).toBe(true);
          expect(p.x).toBeGreaterThanOrEqual(bounds.left - p.radius - 1e-3);
          expect(p.x).toBeLessThanOrEqual(bounds.right + p.radius + 1e-3);
          expect(p.y).toBeGreaterThanOrEqual(bounds.bottom - p.radius - 1e-3);
          expect(p.y).toBeLessThanOrEqual(bounds.top + p.radius + 1e-3);
        }
      }
    }

    expect(solver.particles.length).toBeLessThanOrEqual(900);
  }, 30000);

  it("survives rapid nozzle/pour/tilt/budget changes without crashing or producing NaNs", () => {
    const stirSettings: LabSettings = {
      material: "snow",
      flowRate: 140,
      tiltDegrees: 20,
      cohesionBoost: 1,
      particleBudget: 500,
      rigidSetup: "intruder",
      quality: "dense"
    };
    const solver = new GranularSolver(stirSettings, fallbackKernel);

    for (let i = 0; i < 600; i += 1) {
      solver.setNozzle(Math.sin(i * 0.7) * 8);
      solver.setPouring(i % 7 !== 0);
      if (i % 50 === 0) {
        solver.updateSettings({
          ...stirSettings,
          particleBudget: 200 + ((i * 37) % 300),
          tiltDegrees: ((i * 13) % 56) - 28
        });
      }
      solver.step(1 / 60);
    }

    for (const p of solver.particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(Number.isFinite(p.vx)).toBe(true);
      expect(Number.isFinite(p.vy)).toBe(true);
    }
    expect(solver.particles.length).toBeGreaterThan(0);
  }, 20000);
});
