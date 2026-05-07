import { describe, expect, it } from "vitest";
import { fallbackKernel } from "./kernel";

describe("fallbackKernel", () => {
  it("computes positive contact impulse for overlap", () => {
    const impulse = fallbackKernel.contactImpulse(0.1, 0.5, 0.2, 50, 0.6);
    expect(impulse).toBeGreaterThan(5);
  });

  it("clamps phase state between flowing and jammed", () => {
    expect(fallbackKernel.phaseState(10, 0, 0, 1)).toBe(0);
    expect(fallbackKernel.phaseState(0, 1, 1, 0)).toBe(1);
  });
});
