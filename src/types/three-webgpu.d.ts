declare module "three/webgpu" {
  export const WebGPURenderer: {
    new (parameters?: Record<string, unknown>): {
      domElement: HTMLCanvasElement;
      init?: () => Promise<void>;
      setAnimationLoop: (callback: ((time: number) => void) | null) => void;
      setPixelRatio: (value: number) => void;
      setSize: (width: number, height: number, updateStyle?: boolean) => void;
      render: (scene: import("three").Scene, camera: import("three").Camera) => void;
      dispose: () => void;
      outputColorSpace?: string;
    };
  };
}
