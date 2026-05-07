import { materialPresets, pickMaterialColor } from "./materials";
import type { GranularKernel } from "./kernel";
import type { LabMetrics, LabSettings, Particle, RendererMode, RigidBody } from "./types";

const world = {
  left: -6.1,
  right: 6.1,
  bottom: -3.35,
  top: 4.1
};

const defaultMetrics: LabMetrics = {
  fps: 0,
  particleCount: 0,
  renderer: "WebGL fallback",
  kernel: "TypeScript fallback",
  flowingRatio: 0,
  transitionRatio: 0,
  jammedRatio: 0,
  averageSpeed: 0,
  rigidSetup: "ramp"
};

export class GranularSolver {
  readonly particles: Particle[] = [];
  readonly bounds = world;

  private nextParticleId = 1;
  private settings: LabSettings;
  private readonly kernel: GranularKernel;
  private nozzleX = -1.8;
  private pouring = true;
  private spawnCarry = 0;
  private elapsed = 0;
  private metrics = defaultMetrics;

  constructor(settings: LabSettings, kernel: GranularKernel) {
    this.settings = settings;
    this.kernel = kernel;
    this.seedPile(120);
  }

  updateSettings(settings: LabSettings) {
    this.settings = settings;
    this.trimToBudget();
  }

  setNozzle(x: number) {
    this.nozzleX = clamp(x, world.left + 0.5, world.right - 0.5);
  }

  setPouring(value: boolean) {
    this.pouring = value;
  }

  clear() {
    this.particles.splice(0, this.particles.length);
    this.spawnCarry = 0;
  }

  seedPile(count = 180) {
    const material = this.settings.material;
    for (let index = 0; index < count; index += 1) {
      const row = Math.floor(Math.sqrt(index));
      const spread = Math.max(0.2, row * 0.075);
      this.addParticle(
        jitter(spread),
        world.bottom + 0.55 + row * 0.08 + Math.random() * 0.05,
        material
      );
    }
  }

  seedSlide() {
    this.clear();
    const previousSetup = this.settings.rigidSetup;
    this.settings = { ...this.settings, rigidSetup: "ramp", tiltDegrees: 16 };
    for (let index = 0; index < 260; index += 1) {
      const x = -4.3 + Math.random() * 2.4;
      const y = 1.3 + Math.random() * 2.2;
      this.addParticle(x, y, this.settings.material);
    }
    this.settings = { ...this.settings, rigidSetup: previousSetup };
  }

  step(deltaSeconds: number) {
    const frameDelta = clamp(deltaSeconds, 0, 0.05);
    const substeps = this.settings.quality === "dense" ? 3 : 2;
    const dt = frameDelta / substeps;

    for (let step = 0; step < substeps; step += 1) {
      this.elapsed += dt;
      this.spawn(dt);
      this.integrate(dt);
      this.resolveRigidBodies();
      this.resolveParticleContacts(dt);
      this.resolveBoundaries();
      this.updatePhases();
      this.trimToBudget();
    }
  }

  getRigidBodies(): RigidBody[] {
    const bodies: RigidBody[] = [
      {
        kind: "segment",
        id: "floor",
        ax: world.left,
        ay: world.bottom,
        bx: world.right,
        by: world.bottom
      }
    ];

    if (this.settings.rigidSetup === "ramp" || this.settings.rigidSetup === "intruder") {
      bodies.push({ kind: "segment", id: "ramp", ax: -4.8, ay: -2.25, bx: 2.25, by: -0.55 });
      bodies.push({ kind: "box", id: "catcher", x: 3.55, y: -2.47, width: 0.55, height: 1.65 });
    }

    if (this.settings.rigidSetup === "intruder") {
      bodies.push({
        kind: "circle",
        id: "intruder",
        x: Math.sin(this.elapsed * 0.75) * 2.25,
        y: -1.32 + Math.cos(this.elapsed * 0.45) * 0.1,
        radius: 0.58
      });
    }

    return bodies;
  }

  getMetrics(fps: number, renderer: RendererMode): LabMetrics {
    return {
      ...this.metrics,
      fps,
      renderer,
      kernel: this.kernel.mode,
      particleCount: this.particles.length,
      rigidSetup: this.settings.rigidSetup
    };
  }

  private spawn(dt: number) {
    if (!this.pouring || this.particles.length >= this.settings.particleBudget) {
      return;
    }

    this.spawnCarry += this.settings.flowRate * dt;
    while (this.spawnCarry >= 1) {
      this.spawnCarry -= 1;
      this.addParticle(
        this.nozzleX + jitter(0.28),
        world.top - 0.2 + jitter(0.08),
        this.settings.material
      );
    }
  }

  private addParticle(x: number, y: number, materialKey: Particle["material"]) {
    if (this.particles.length >= this.settings.particleBudget) {
      this.particles.shift();
    }

    const material = materialPresets[materialKey];
    const radius = material.radius * (0.85 + Math.random() * 0.3);
    const mass = Math.PI * radius * radius * material.density;
    const id = this.nextParticleId;
    this.nextParticleId += 1;

    this.particles.push({
      id,
      x,
      y,
      z: jitter(0.12),
      vx: jitter(0.35),
      vy: -0.25 - Math.random() * 0.3,
      radius,
      mass,
      color: pickMaterialColor(materialKey, id),
      material: materialKey,
      phase: 0,
      contacts: 0
    });
  }

  private integrate(dt: number) {
    const angle = (this.settings.tiltDegrees * Math.PI) / 180;
    const gx = Math.sin(angle) * 8.6;
    const gy = -Math.cos(angle) * 8.6;
    const fluidization = Math.abs(this.settings.tiltDegrees) / 28;

    for (const particle of this.particles) {
      const material = materialPresets[particle.material];
      const jamDamping = 1 - particle.phase * (0.08 + material.friction * 0.06);
      const drag = Math.max(0.92, 0.993 - fluidization * 0.012);

      particle.vx = (particle.vx + gx * dt) * drag * jamDamping;
      particle.vy = (particle.vy + gy * dt) * drag;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.contacts = 0;
    }
  }

  private resolveParticleContacts(dt: number) {
    const grid = new Map<string, Particle[]>();
    const cellSize = this.settings.quality === "dense" ? 0.28 : 0.34;

    for (const particle of this.particles) {
      const key = gridKey(particle.x, particle.y, cellSize);
      const bucket = grid.get(key);
      if (bucket) {
        bucket.push(particle);
      } else {
        grid.set(key, [particle]);
      }
    }

    for (const particle of this.particles) {
      const cx = Math.floor(particle.x / cellSize);
      const cy = Math.floor(particle.y / cellSize);

      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          const bucket = grid.get(`${cx + ox}:${cy + oy}`);
          if (!bucket) {
            continue;
          }

          for (const other of bucket) {
            if (other.id <= particle.id) {
              continue;
            }
            this.resolvePair(particle, other, dt);
          }
        }
      }
    }
  }

  private resolvePair(a: Particle, b: Particle, dt: number) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distanceSquared = dx * dx + dy * dy;
    const minDistance = a.radius + b.radius;
    const nearDistance = minDistance + 0.045 + this.settings.cohesionBoost * 0.05;

    if (distanceSquared > nearDistance * nearDistance || distanceSquared <= 0.000001) {
      return;
    }

    const distance = Math.sqrt(distanceSquared);
    const nx = dx / distance;
    const ny = dy / distance;
    const tx = -ny;
    const ty = nx;
    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const normalSpeed = rvx * nx + rvy * ny;
    const material = materialPresets[a.material];
    const otherMaterial = materialPresets[b.material];
    const friction = (material.friction + otherMaterial.friction) * 0.5;
    const cohesion =
      (material.cohesion + otherMaterial.cohesion) * 0.5 + this.settings.cohesionBoost * 0.16;
    const stiffness = (material.stiffness + otherMaterial.stiffness) * 0.5;
    const damping = (material.damping + otherMaterial.damping) * 0.5;

    if (distance < minDistance) {
      const overlap = minDistance - distance;
      const totalMass = a.mass + b.mass;
      const correction = overlap * 0.52;
      const aShare = b.mass / totalMass;
      const bShare = a.mass / totalMass;
      const impulse = clamp(
        this.kernel.contactImpulse(
          overlap,
          Math.max(0, -normalSpeed),
          cohesion,
          stiffness,
          damping
        ) * dt,
        0,
        1.4
      );

      a.x -= nx * correction * aShare;
      a.y -= ny * correction * aShare;
      b.x += nx * correction * bShare;
      b.y += ny * correction * bShare;

      if (normalSpeed < 0) {
        a.vx -= nx * impulse * aShare;
        a.vy -= ny * impulse * aShare;
        b.vx += nx * impulse * bShare;
        b.vy += ny * impulse * bShare;
      }

      const tangentSpeed = rvx * tx + rvy * ty;
      const frictionImpulse = clamp(tangentSpeed * friction * 0.035, -0.08, 0.08);
      a.vx += tx * frictionImpulse * aShare;
      a.vy += ty * frictionImpulse * aShare;
      b.vx -= tx * frictionImpulse * bShare;
      b.vy -= ty * frictionImpulse * bShare;
      a.contacts += 1;
      b.contacts += 1;
    } else if (cohesion > 0.04) {
      const attraction = cohesion * (nearDistance - distance) * 0.18 * dt;
      a.vx += nx * attraction;
      a.vy += ny * attraction;
      b.vx -= nx * attraction;
      b.vy -= ny * attraction;
    }
  }

  private resolveRigidBodies() {
    for (const body of this.getRigidBodies()) {
      for (const particle of this.particles) {
        if (body.kind === "segment") {
          collideSegment(particle, body);
        } else if (body.kind === "circle") {
          collideCircle(particle, body);
        } else {
          collideBox(particle, body);
        }
      }
    }
  }

  private resolveBoundaries() {
    for (const particle of this.particles) {
      const material = materialPresets[particle.material];
      const bounce = material.restitution;

      if (particle.x - particle.radius < world.left) {
        particle.x = world.left + particle.radius;
        particle.vx = Math.abs(particle.vx) * bounce;
      } else if (particle.x + particle.radius > world.right) {
        particle.x = world.right - particle.radius;
        particle.vx = -Math.abs(particle.vx) * bounce;
      }

      if (particle.y - particle.radius < world.bottom) {
        particle.y = world.bottom + particle.radius;
        particle.vy = Math.abs(particle.vy) * bounce;
        particle.vx *= 1 - material.friction * 0.07;
        particle.contacts += 1;
      } else if (particle.y + particle.radius > world.top) {
        particle.y = world.top - particle.radius;
        particle.vy = -Math.abs(particle.vy) * bounce;
      }
    }
  }

  private updatePhases() {
    let flowing = 0;
    let transition = 0;
    let jammed = 0;
    let speedSum = 0;
    const fluidization = Math.abs(this.settings.tiltDegrees) / 28;

    for (const particle of this.particles) {
      const speed = Math.hypot(particle.vx, particle.vy);
      const density = clamp(particle.contacts / 5, 0, 1);
      const material = materialPresets[particle.material];
      particle.phase = this.kernel.phaseState(
        speed,
        density,
        material.cohesion + this.settings.cohesionBoost * 0.22,
        fluidization
      );
      speedSum += speed;

      if (particle.phase < 0.34) {
        flowing += 1;
      } else if (particle.phase > 0.66) {
        jammed += 1;
      } else {
        transition += 1;
      }
    }

    const total = Math.max(1, this.particles.length);
    this.metrics = {
      ...this.metrics,
      particleCount: this.particles.length,
      flowingRatio: flowing / total,
      transitionRatio: transition / total,
      jammedRatio: jammed / total,
      averageSpeed: speedSum / total
    };
  }

  private trimToBudget() {
    const overflow = this.particles.length - this.settings.particleBudget;
    if (overflow > 0) {
      this.particles.splice(0, overflow);
    }
  }
}

function collideSegment(particle: Particle, segment: Extract<RigidBody, { kind: "segment" }>) {
  const abx = segment.bx - segment.ax;
  const aby = segment.by - segment.ay;
  const lengthSquared = abx * abx + aby * aby;
  const t = clamp(
    ((particle.x - segment.ax) * abx + (particle.y - segment.ay) * aby) / lengthSquared,
    0,
    1
  );
  const px = segment.ax + abx * t;
  const py = segment.ay + aby * t;
  resolveAgainstPoint(particle, px, py, particle.radius);
}

function collideCircle(particle: Particle, circle: Extract<RigidBody, { kind: "circle" }>) {
  resolveAgainstPoint(particle, circle.x, circle.y, particle.radius + circle.radius);
}

function collideBox(particle: Particle, box: Extract<RigidBody, { kind: "box" }>) {
  const closestX = clamp(particle.x, box.x - box.width / 2, box.x + box.width / 2);
  const closestY = clamp(particle.y, box.y - box.height / 2, box.y + box.height / 2);
  resolveAgainstPoint(particle, closestX, closestY, particle.radius);
}

function resolveAgainstPoint(particle: Particle, px: number, py: number, minDistance: number) {
  const dx = particle.x - px;
  const dy = particle.y - py;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared >= minDistance * minDistance || distanceSquared <= 0.000001) {
    return;
  }

  const distance = Math.sqrt(distanceSquared);
  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = minDistance - distance;
  const normalVelocity = particle.vx * nx + particle.vy * ny;
  const material = materialPresets[particle.material];

  particle.x += nx * overlap;
  particle.y += ny * overlap;

  if (normalVelocity < 0) {
    particle.vx -= (1 + material.restitution) * normalVelocity * nx;
    particle.vy -= (1 + material.restitution) * normalVelocity * ny;
  }

  particle.vx *= 1 - material.friction * 0.04;
  particle.contacts += 1;
}

function gridKey(x: number, y: number, cellSize: number): string {
  return `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;
}

function jitter(amount: number): number {
  return (Math.random() - 0.5) * amount * 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
