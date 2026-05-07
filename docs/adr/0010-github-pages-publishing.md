# 0010 GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live URL must work from the start. The repository also needs documentation under `docs/`.

## Decision

Serve GitHub Pages from the `main` branch `/docs` folder. Vite builds the app into `docs/` with `emptyOutDir: false`, preserving markdown documentation and ADRs.

The Vite base path is `/granular-physics-lab/`. Asset filenames are hashed. `404.html` is copied from `index.html` for SPA fallback.

## Consequences

`docs/` is intentionally committed and must not be gitignored. The folder contains both the Pages app and project documentation.

## Alternatives Considered

A `gh-pages` branch was rejected because committing the build output into `main/docs` keeps local hooks and Pages publishing simpler without GitHub Actions.

