# 0007 Data Generation Pipeline

## Status

Accepted

## Context

Mode A does not require prebuilt datasets.

## Decision

Do not add a Mode B data-generation pipeline in v1.

## Consequences

`make data` is omitted. Static material presets are source-controlled with the app.

## Alternatives Considered

Precomputing simulation traces was rejected because interactive browser simulation is the core value.
