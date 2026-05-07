import { beforeEach, describe, expect, it } from "vitest";
import { defaultStoredSettings, readStoredSettings, writeStoredSettings } from "./storage";

describe("storage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when no settings are stored", () => {
    expect(readStoredSettings()).toEqual(defaultStoredSettings);
  });

  it("round-trips valid settings", () => {
    writeStoredSettings({ ...defaultStoredSettings, material: "snow", tiltDegrees: 12 });
    expect(readStoredSettings()).toMatchObject({ material: "snow", tiltDegrees: 12 });
  });

  it("recovers from invalid JSON", () => {
    window.localStorage.setItem("granular-physics-lab:settings:v1", "{");
    expect(readStoredSettings()).toEqual(defaultStoredSettings);
  });
});
