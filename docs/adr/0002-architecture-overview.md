# 0002 Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs a teaching UI, rendering engine, simulation loop, WASM material helpers, and browser persistence.

## Decision

Split the frontend into:

- `features/lab/components`: React controls and layout.
- `features/lab/engine`: Three.js scene and simulation orchestration.
- `features/lab/physics`: particles, materials, rigid bodies, WASM kernel.
- `shared`: reusable UI and browser helpers.

## Consequences

Simulation code remains testable without React. Rendering code is isolated from physics behavior.

## Alternatives Considered

A single large React component was rejected because it would make testing and tuning the solver difficult.

