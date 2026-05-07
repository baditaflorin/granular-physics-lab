# 0016 Local Git Hooks

## Status

Accepted

## Context

The project explicitly uses local hooks instead of GitHub Actions.

## Decision

Use `.githooks/` wired by `make install-hooks`.

## Consequences

Contributors must run `make install-hooks` locally. Hooks remain readable shell scripts.

## Alternatives Considered

Lefthook was considered but plain shell hooks are sufficient for this small repo.
