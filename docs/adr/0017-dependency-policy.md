# 0017 Dependency Policy

## Status

Accepted

## Context

The lab needs production-ready libraries without unnecessary runtime weight.

## Decision

Use established packages: Vite, React, Three.js, Zod, Vitest, Playwright, ESLint, Prettier, and WABT for compiling the tiny WASM module.

Dependencies are pinned by `package-lock.json`; high or critical audit findings block release.

## Consequences

The project avoids hand-rolled rendering, build, lint, and test infrastructure.

## Alternatives Considered

Custom canvas rendering was rejected because Three.js provides better device coverage and future WebGPU growth.

