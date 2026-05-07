# Contributing

Thanks for improving Granular Physics Lab.

## Local Setup

```bash
npm install
make install-hooks
make dev
```

## Commit Style

Use Conventional Commits:

- `feat: add simulation control`
- `fix: correct particle collision damping`
- `docs: document Pages deployment`
- `test: cover material kernel fallback`

## Checks

Run these before pushing:

```bash
make lint
make test
make build
make smoke
```

Do not commit secrets, private keys, `.env` files, or generated local caches.
