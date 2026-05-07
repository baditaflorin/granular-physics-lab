# 0009 Configuration And Secrets Management

## Status

Accepted

## Context

The frontend is public and static. It must not contain secrets.

## Decision

Use build-time public configuration only. Keep `.env.example` for documented placeholders and gitignore real `.env` files.

## Consequences

The app has no secret-dependent features. External links are public constants.

## Alternatives Considered

Runtime secrets were rejected because there is no runtime backend.

