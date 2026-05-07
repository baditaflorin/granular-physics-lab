# 0003 Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs strict TypeScript, a fast dev server, static build output, and a familiar component model.

## Decision

Use React, TypeScript strict mode, Vite, Three.js, Vitest, ESLint, and Prettier.

## Consequences

The build can target GitHub Pages with a base path of `/granular-physics-lab/` and write directly to `docs/`.

## Alternatives Considered

Vanilla TypeScript was possible but would make the control surface and state persistence more verbose.

