# 0014 Error Handling Conventions

## Status

Accepted

## Context

Browser capabilities vary. WASM and WebGPU can fail independently.

## Decision

Use explicit fallback states and user-visible status labels. WASM has a TypeScript fallback. WebGPU has a WebGL fallback. Fatal UI errors are caught by a React error boundary.

## Consequences

The app remains usable on older browsers, with reduced capability labels.

## Alternatives Considered

Failing hard when WebGPU is unavailable was rejected because it would exclude many current browsers.

