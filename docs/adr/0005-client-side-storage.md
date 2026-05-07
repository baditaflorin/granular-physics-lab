# 0005 Client-Side Storage Strategy

## Status

Accepted

## Context

Users benefit from preserved controls, but v1 does not need accounts or sync.

## Decision

Use `localStorage` for small preference objects: material, flow rate, tilt, cohesion boost, particle budget, and selected rigid-body setup.

## Consequences

State is private to the current browser and can be reset by clearing site data.

## Alternatives Considered

IndexedDB and OPFS were rejected for v1 because saved simulations and large exports are not required.

