# 0011 Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser console noise should be minimal.

## Decision

Use browser console warnings only for degraded capabilities such as WebGPU fallback or WASM fallback. Avoid routine production logging.

## Consequences

Users see a clean console unless the browser lacks an optional capability.

## Alternatives Considered

Verbose simulation logging was rejected because it would hurt performance and clutter production use.
