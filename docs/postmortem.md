# Postmortem

## What Was Built

V1 builds a pure GitHub Pages granular simulation lab with browser-side rendering, physics, local storage, and no runtime backend.

## Was Mode A Correct?

Yes. The v1 workload fits the browser: bounded particle counts, static assets, local preferences, and no authenticated or shared state.

## What Worked

- GitHub Pages keeps hosting simple.
- Three.js gives a stable rendering baseline with a WebGPU-first strategy.
- A small WASM kernel provides a realistic boundary for future native physics work without requiring a server.

## What Did Not

- Full Project Chrono C++ is too large for a first Pages-friendly release.
- GitHub Pages cannot set COOP/COEP headers, so the WASM module avoids threaded shared-memory features.

## Surprises

- The most important teaching value comes from tunable cohesion, friction, tilt, and jamming indicators rather than raw particle count.

## Accepted Tech Debt

- The solver is a browser-tuned 2.5D approximation, not Chrono parity.
- WebGPU has a WebGL fallback because browser support is still uneven.

## Next Improvements

1. Add optional OPFS scenario export/import.
2. Add more guided labs for avalanche angle and snow compaction.
3. Add a true Chrono-derived WASM solver experiment behind an advanced flag.

## Time Spent Vs Estimate

V1 was scoped as a medium feasibility static app. The final mode stayed within that scope by keeping the simulation bounded and client-side.
