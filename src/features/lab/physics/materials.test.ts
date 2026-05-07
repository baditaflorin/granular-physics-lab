import { describe, expect, it } from "vitest";
import { materialKeys, materialPresets, pickMaterialColor } from "./materials";

describe("material presets", () => {
  it("defines the three v1 granular materials", () => {
    expect(materialKeys).toEqual(["sand", "gravel", "snow"]);
  });

  it("keeps physical coefficients in usable ranges", () => {
    for (const key of materialKeys) {
      const material = materialPresets[key];
      expect(material.radius).toBeGreaterThan(0);
      expect(material.friction).toBeGreaterThanOrEqual(0);
      expect(material.friction).toBeLessThanOrEqual(1);
      expect(material.palette.length).toBeGreaterThan(2);
      expect(pickMaterialColor(key, 8)).toMatch(/^#/);
    }
  });
});
