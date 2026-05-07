# 0004 Static Data Contract

## Status

Accepted

## Context

Mode A has no backend and no generated external data.

## Decision

Use static in-repo configuration only: material presets, app metadata, manifest assets, and the WASM kernel under `wasm/granular_kernel.wasm`.

## Consequences

No freshness policy or artifact release workflow is needed. Breaking material-preset changes are versioned with app releases.

## Alternatives Considered

A Mode B data directory was rejected because v1 does not depend on remote datasets.

