import { z } from "zod";

const storageSchema = z.object({
  material: z.enum(["sand", "gravel", "snow"]).catch("sand"),
  flowRate: z.number().min(0).max(140).catch(56),
  tiltDegrees: z.number().min(-28).max(28).catch(0),
  cohesionBoost: z.number().min(0).max(1).catch(0.2),
  particleBudget: z.number().min(120).max(1100).catch(620),
  rigidSetup: z.enum(["basin", "ramp", "intruder"]).catch("ramp"),
  quality: z.enum(["balanced", "dense"]).catch("balanced")
});

export type StoredLabSettings = z.infer<typeof storageSchema>;

export const defaultStoredSettings: StoredLabSettings = {
  material: "sand",
  flowRate: 56,
  tiltDegrees: 0,
  cohesionBoost: 0.2,
  particleBudget: 620,
  rigidSetup: "ramp",
  quality: "balanced"
};

const key = "granular-physics-lab:settings:v1";

export function readStoredSettings(): StoredLabSettings {
  if (typeof window === "undefined") {
    return defaultStoredSettings;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return defaultStoredSettings;
  }

  try {
    return { ...defaultStoredSettings, ...storageSchema.parse(JSON.parse(raw)) };
  } catch {
    return defaultStoredSettings;
  }
}

export function writeStoredSettings(settings: StoredLabSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(storageSchema.parse(settings)));
}
