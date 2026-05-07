# 0013 Testing Strategy

## Status

Accepted

## Context

The risky code is physics math, persistence, build output, and browser startup.

## Decision

Use Vitest for unit tests and Playwright in `scripts/smoke.sh` for a static-site happy path.

## Consequences

`make test` and `make smoke` are fast enough for pre-push.

## Alternatives Considered

A large browser e2e suite was rejected for v1 to avoid flaky simulation assertions.

