export type MaterialKey = "sand" | "gravel" | "snow";
export type RigidSetup = "basin" | "ramp" | "intruder";
export type QualityMode = "balanced" | "dense";
export type ToolMode = "pour" | "inspect" | "plow";
export type RendererMode = "WebGPU" | "WebGL fallback";
export type KernelMode = "WASM" | "TypeScript fallback";

export type LabSettings = {
  material: MaterialKey;
  flowRate: number;
  tiltDegrees: number;
  cohesionBoost: number;
  particleBudget: number;
  rigidSetup: RigidSetup;
  quality: QualityMode;
};

export type Particle = {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  material: MaterialKey;
  phase: number;
  contacts: number;
};

export type LabMetrics = {
  fps: number;
  particleCount: number;
  renderer: RendererMode;
  kernel: KernelMode;
  flowingRatio: number;
  transitionRatio: number;
  jammedRatio: number;
  averageSpeed: number;
  rigidSetup: RigidSetup;
};

export type RigidBody =
  | {
      kind: "segment";
      id: string;
      ax: number;
      ay: number;
      bx: number;
      by: number;
    }
  | {
      kind: "circle";
      id: string;
      x: number;
      y: number;
      radius: number;
    }
  | {
      kind: "box";
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    };
