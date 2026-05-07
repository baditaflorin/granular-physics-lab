# 0008 Go Backend Layout

## Status

Accepted

## Context

The bootstrap asks for Go backend structure only when Mode B or Mode C applies.

## Decision

Skip Go backend layout for v1 because the project is Mode A.

## Consequences

No `cmd/`, `internal/`, Dockerfile, compose stack, or backend env vars are needed.

## Alternatives Considered

Adding an unused Go skeleton was rejected because it would imply a server surface that does not exist.
