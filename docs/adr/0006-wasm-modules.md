# 0006 WASM Modules Used

## Status

Accepted

## Context

The pitch references a Project Chrono WASM subset. Full Chrono is too large for a fast GitHub Pages v1, but a WASM boundary is useful for native-style contact math.

## Decision

Ship a small WASM module compiled from `src/wasm/granular_kernel.wat`. It exports contact impulse and phase-state helpers used by the TypeScript solver.

The module avoids threads and shared memory because GitHub Pages cannot set COOP/COEP headers.

## Consequences

The app has a real WASM physics component while staying portable. It is not full Project Chrono parity.

## Alternatives Considered

Compiling the full Chrono C++ stack to WASM was rejected for v1 due to asset size, memory use, and Pages header limits.
