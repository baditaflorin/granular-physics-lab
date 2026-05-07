# 0012 Metrics And Observability

## Status

Accepted

## Context

Mode A has no backend metrics endpoint. The prompt prefers no analytics by default.

## Decision

Ship no analytics in v1. Show local-only runtime metrics in the UI: FPS, particle count, renderer mode, and phase mix.

## Consequences

No PII is collected. Observability is educational and local to the page.

## Alternatives Considered

Plausible and beacon analytics were rejected because usage insight is not required for v1.
