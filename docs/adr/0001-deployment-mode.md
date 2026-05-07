# 0001 Deployment Mode

## Status

Accepted

## Context

The lab must be easy to publish, cheap to host, and safe to run publicly. The core requirements are visualization, bounded local simulation, local preferences, and static documentation.

## Decision

Use Mode A: Pure GitHub Pages.

The app ships as static files from `main` branch `/docs`. Simulation runs in the browser with TypeScript, Three.js, browser APIs, and a small WASM material kernel.

## Consequences

- No runtime backend, Docker, database, server secrets, or API deployment.
- GitHub Pages is the only production host.
- Large native Chrono builds and shared-memory WASM threads are out of scope for v1.

## Alternatives Considered

- Mode B: unnecessary because no offline data pipeline is needed.
- Mode C: unnecessary because v1 has no auth, server-side writes, secrets, or shared compute.
