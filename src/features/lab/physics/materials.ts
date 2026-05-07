import type { MaterialKey } from "./types";

export type MaterialPreset = {
  key: MaterialKey;
  label: string;
  description: string;
  radius: number;
  density: number;
  friction: number;
  restitution: number;
  cohesion: number;
  stiffness: number;
  damping: number;
  palette: readonly string[];
};

export const materialPresets = {
  sand: {
    key: "sand",
    label: "Sand",
    description: "Low cohesion, high friction, clean avalanche angle.",
    radius: 0.07,
    density: 1.2,
    friction: 0.7,
    restitution: 0.08,
    cohesion: 0.025,
    stiffness: 54,
    damping: 0.55,
    palette: ["#d7a84f", "#c99036", "#e6bf68", "#b9822e"]
  },
  gravel: {
    key: "gravel",
    label: "Gravel",
    description: "Chunkier grains, lower cohesion, more bouncing and voids.",
    radius: 0.105,
    density: 1.55,
    friction: 0.62,
    restitution: 0.2,
    cohesion: 0.005,
    stiffness: 68,
    damping: 0.42,
    palette: ["#6f6a5f", "#8c8678", "#58544d", "#a59d8a"]
  },
  snow: {
    key: "snow",
    label: "Snow",
    description: "Cohesive grains that compact, bridge, and jam.",
    radius: 0.08,
    density: 0.82,
    friction: 0.86,
    restitution: 0.035,
    cohesion: 0.22,
    stiffness: 46,
    damping: 0.82,
    palette: ["#eef7f8", "#d8ebef", "#b9d7da", "#ffffff"]
  }
} satisfies Record<MaterialKey, MaterialPreset>;

export const materialKeys = Object.keys(materialPresets) as MaterialKey[];

export function pickMaterialColor(material: MaterialKey, index: number): string {
  const palette = materialPresets[material].palette;
  return palette[index % palette.length] ?? palette[0];
}
