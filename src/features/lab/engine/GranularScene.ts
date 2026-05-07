import * as THREE from "three";
import { loadGranularKernel } from "../physics/kernel";
import { GranularSolver } from "../physics/solver";
import type { LabMetrics, LabSettings, RendererMode, RigidBody, ToolMode } from "../physics/types";

type RendererLike = {
  domElement: HTMLCanvasElement;
  setPixelRatio: (value: number) => void;
  setSize: (width: number, height: number, updateStyle?: boolean) => void;
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;
  dispose: () => void;
  setAnimationLoop?: (callback: ((time: number) => void) | null) => void;
  init?: () => Promise<void>;
  outputColorSpace?: string;
};

type SceneHandles = {
  floor: THREE.Mesh;
  ramp: THREE.Mesh;
  catcher: THREE.Mesh;
  intruder: THREE.Mesh;
};

const maxParticles = 1200;
const viewHalfHeight = 4.2;

export class GranularScene {
  private readonly mount: HTMLElement;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(
    -6.5,
    6.5,
    viewHalfHeight,
    -viewHalfHeight,
    0.1,
    100
  );
  private readonly particleMesh: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private readonly color = new THREE.Color();
  private readonly jamColor = new THREE.Color("#235f51");
  private readonly flowColor = new THREE.Color("#f3d483");
  private readonly handles: SceneHandles;
  private readonly onMetrics: (metrics: LabMetrics) => void;

  private settings: LabSettings;
  private renderer: RendererLike | null = null;
  private rendererMode: RendererMode = "WebGL fallback";
  private solver: GranularSolver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastTime = performance.now();
  private fps = 0;
  private tool: ToolMode = "pour";
  private disposed = false;

  constructor(mount: HTMLElement, settings: LabSettings, onMetrics: (metrics: LabMetrics) => void) {
    this.mount = mount;
    this.settings = settings;
    this.onMetrics = onMetrics;
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    this.scene.background = new THREE.Color("#edeae0");
    this.particleMesh = this.createParticleMesh();
    this.handles = this.createRigidMeshes();
    this.scene.add(this.particleMesh);
    this.addLighting();
  }

  async start() {
    const [renderer, kernel] = await Promise.all([this.createRenderer(), loadGranularKernel()]);

    if (this.disposed) {
      renderer.dispose();
      return;
    }

    this.renderer = renderer;
    this.solver = new GranularSolver(this.settings, kernel);
    this.mount.appendChild(renderer.domElement);
    this.resize();
    this.bindEvents();
    this.lastTime = performance.now();

    if (renderer.setAnimationLoop) {
      renderer.setAnimationLoop(this.animate);
    } else {
      requestAnimationFrame(this.animate);
    }
  }

  updateSettings(settings: LabSettings) {
    this.settings = settings;
    this.solver?.updateSettings(settings);
  }

  setTool(tool: ToolMode) {
    this.tool = tool;
  }

  setPouring(value: boolean) {
    this.solver?.setPouring(value);
  }

  clear() {
    this.solver?.clear();
  }

  pile() {
    this.solver?.seedPile(210);
  }

  slide() {
    this.solver?.seedSlide();
  }

  dispose() {
    this.disposed = true;
    this.resizeObserver?.disconnect();
    this.mount.removeEventListener("pointermove", this.handlePointerMove);
    this.mount.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointerup", this.handlePointerUp);

    if (this.renderer?.setAnimationLoop) {
      this.renderer.setAnimationLoop(null);
    }

    this.renderer?.dispose();
    this.particleMesh.geometry.dispose();
    disposeMaterial(this.particleMesh.material);
    for (const mesh of Object.values(this.handles)) {
      mesh.geometry.dispose();
      disposeMaterial(mesh.material);
    }
    this.renderer?.domElement.remove();
  }

  private async createRenderer(): Promise<RendererLike> {
    if (navigator.gpu) {
      try {
        const { WebGPURenderer } = await import("three/webgpu");
        const renderer = new WebGPURenderer({ antialias: true, alpha: false }) as RendererLike;
        await renderer.init?.();
        this.rendererMode = "WebGPU";
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        return renderer;
      } catch (error) {
        console.warn("WebGPU renderer unavailable; using WebGL fallback.", error);
      }
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor("#edeae0");
    this.rendererMode = "WebGL fallback";
    return renderer;
  }

  private createParticleMesh() {
    const geometry = new THREE.SphereGeometry(1, 16, 10);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.86,
      metalness: 0.02,
      vertexColors: true
    });
    const mesh = new THREE.InstancedMesh(geometry, material, maxParticles);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    return mesh;
  }

  private createRigidMeshes(): SceneHandles {
    const rigidMaterial = new THREE.MeshStandardMaterial({
      color: "#33423d",
      roughness: 0.8,
      metalness: 0.08
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.25), rigidMaterial.clone());
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.25), rigidMaterial.clone());
    const catcher = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.28), rigidMaterial.clone());
    const intruder = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.32, 40).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: "#b86b44", roughness: 0.64, metalness: 0.08 })
    );

    this.scene.add(floor, ramp, catcher, intruder);
    return { floor, ramp, catcher, intruder };
  }

  private addLighting() {
    const ambient = new THREE.HemisphereLight("#fff7e5", "#5d695f", 1.9);
    const key = new THREE.DirectionalLight("#ffffff", 2.5);
    const fill = new THREE.DirectionalLight("#b7dce0", 0.9);
    key.position.set(2.8, 5.5, 7);
    fill.position.set(-4, 2, 5);
    this.scene.add(ambient, key, fill);
  }

  private bindEvents() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.mount);
    this.mount.addEventListener("pointermove", this.handlePointerMove);
    this.mount.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointerup", this.handlePointerUp);
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    const worldPoint = this.toWorld(event.clientX, event.clientY);
    this.solver?.setNozzle(worldPoint.x);
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    this.handlePointerMove(event);
    if (this.tool === "pour") {
      this.solver?.setPouring(true);
    }
  };

  private readonly handlePointerUp = () => {
    if (this.tool === "pour") {
      this.solver?.setPouring(true);
    }
  };

  private animate = (time: number) => {
    if (this.disposed || !this.renderer || !this.solver) {
      return;
    }

    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.fps =
      this.fps === 0
        ? 1 / Math.max(delta, 0.001)
        : this.fps * 0.9 + (1 / Math.max(delta, 0.001)) * 0.1;

    this.solver.step(delta);
    this.updateRigidMeshes();
    this.updateParticles();
    this.renderer.render(this.scene, this.camera);
    this.onMetrics(this.solver.getMetrics(this.fps, this.rendererMode));

    if (!this.renderer.setAnimationLoop) {
      requestAnimationFrame(this.animate);
    }
  };

  private updateParticles() {
    if (!this.solver) {
      return;
    }

    const particles = this.solver.particles;
    this.particleMesh.count = Math.min(particles.length, maxParticles);

    for (let index = 0; index < this.particleMesh.count; index += 1) {
      const particle = particles[index];
      if (!particle) {
        continue;
      }
      const phaseLift = particle.phase * 0.025;
      this.dummy.position.set(particle.x, particle.y, particle.z + phaseLift);
      this.dummy.scale.setScalar(particle.radius);
      this.dummy.updateMatrix();
      this.particleMesh.setMatrixAt(index, this.dummy.matrix);

      this.color.set(particle.color);
      if (particle.phase > 0.66) {
        this.color.lerp(this.jamColor, 0.22);
      } else if (particle.phase < 0.34) {
        this.color.lerp(this.flowColor, 0.14);
      }
      this.particleMesh.setColorAt(index, this.color);
    }

    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  private updateRigidMeshes() {
    const bodies = this.solver?.getRigidBodies() ?? [];
    this.handles.floor.visible = false;
    this.handles.ramp.visible = false;
    this.handles.catcher.visible = false;
    this.handles.intruder.visible = false;

    for (const body of bodies) {
      if (body.kind === "segment" && body.id === "floor") {
        applySegment(this.handles.floor, body);
      } else if (body.kind === "segment") {
        applySegment(this.handles.ramp, body);
      } else if (body.kind === "box") {
        this.handles.catcher.visible = true;
        this.handles.catcher.position.set(body.x, body.y, -0.08);
        this.handles.catcher.scale.set(body.width, body.height, 1);
      } else {
        this.handles.intruder.visible = true;
        this.handles.intruder.position.set(body.x, body.y, 0.06);
        this.handles.intruder.scale.setScalar(body.radius);
      }
    }
  }

  private resize() {
    if (!this.renderer) {
      return;
    }

    const width = Math.max(320, this.mount.clientWidth);
    const height = Math.max(320, this.mount.clientHeight);
    const aspect = width / height;
    const halfWidth = viewHalfHeight * aspect;

    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = viewHalfHeight;
    this.camera.bottom = -viewHalfHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
  }

  private toWorld(clientX: number, clientY: number) {
    const rect = this.mount.getBoundingClientRect();
    const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    const halfWidth = viewHalfHeight * (rect.width / rect.height);

    return {
      x: normalizedX * halfWidth,
      y: normalizedY * viewHalfHeight
    };
  }
}

function applySegment(mesh: THREE.Mesh, segment: Extract<RigidBody, { kind: "segment" }>) {
  const dx = segment.bx - segment.ax;
  const dy = segment.by - segment.ay;
  const length = Math.hypot(dx, dy);
  mesh.visible = true;
  mesh.position.set(segment.ax + dx / 2, segment.ay + dy / 2, -0.08);
  mesh.rotation.z = Math.atan2(dy, dx);
  mesh.scale.set(length, 1, 1);
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }
  } else {
    material.dispose();
  }
}
