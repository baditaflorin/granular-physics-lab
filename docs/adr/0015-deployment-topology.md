# 0015 Deployment Topology

## Status

Accepted

## Context

Mode A deployment is GitHub Pages only.

## Decision

Deploy static files from `main/docs` to https://baditaflorin.github.io/granular-physics-lab/.

## Consequences

No `deploy/` directory, nginx, Docker Compose, Prometheus, TLS configuration, or server runbook is required.

## Alternatives Considered

Mode C topology was rejected because there is no runtime API.
