import type { KernelMode } from "./types";

type KernelExports = {
  contactImpulse: (
    overlap: number,
    closingSpeed: number,
    cohesion: number,
    stiffness: number,
    damping: number
  ) => number;
  phaseState: (
    kinetic: number,
    contactDensity: number,
    cohesion: number,
    fluidization: number
  ) => number;
};

export type GranularKernel = KernelExports & {
  mode: KernelMode;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const fallbackKernel: GranularKernel = {
  mode: "TypeScript fallback",
  contactImpulse(overlap, closingSpeed, cohesion, stiffness, damping) {
    return overlap * stiffness + closingSpeed * damping + cohesion * 0.08;
  },
  phaseState(kinetic, contactDensity, cohesion, fluidization) {
    const raw =
      (contactDensity - 0.55 + cohesion * 0.45 - kinetic * 0.25 - fluidization * 0.65) * 3 + 0.5;
    return clamp(raw, 0, 1);
  }
};

export async function loadGranularKernel(): Promise<GranularKernel> {
  if (typeof WebAssembly === "undefined") {
    return fallbackKernel;
  }

  const wasmUrl = `${import.meta.env.BASE_URL}wasm/granular_kernel.wasm`;

  try {
    const response = await fetch(wasmUrl);
    const module = await WebAssembly.instantiate(await response.arrayBuffer(), {});
    const exports = module.instance.exports as unknown as KernelExports;

    if (typeof exports.contactImpulse !== "function" || typeof exports.phaseState !== "function") {
      return fallbackKernel;
    }

    return {
      mode: "WASM",
      contactImpulse: exports.contactImpulse,
      phaseState: exports.phaseState
    };
  } catch (error) {
    console.warn("WASM material kernel failed to load; using TypeScript fallback.", error);
    return fallbackKernel;
  }
}
