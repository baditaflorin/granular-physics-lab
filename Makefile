.PHONY: help install-hooks dev build test test-integration smoke visual-check lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@printf "Targets:\n"
	@printf "  make install-hooks     Wire local git hooks\n"
	@printf "  make dev               Run the Vite dev server\n"
	@printf "  make build             Build the Pages-ready static site into docs/\n"
	@printf "  make test              Run unit tests\n"
	@printf "  make test-integration  Reserved for future browser integration tests\n"
	@printf "  make smoke             Build, serve docs/, and run Playwright smoke checks\n"
	@printf "  make visual-check      Capture desktop/mobile screenshots and validate canvas pixels\n"
	@printf "  make lint              Run ESLint and Prettier checks\n"
	@printf "  make fmt               Format files\n"
	@printf "  make pages-preview     Preview the built Pages site\n"
	@printf "  make release           Tag a local semver release marker\n"
	@printf "  make clean             Remove generated caches\n"

install-hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

test-integration:
	@printf "No separate integration suite yet; use make smoke.\n"

smoke:
	npm run smoke

visual-check:
	npm run visual-check

lint:
	npm run lint

fmt:
	npm run fmt

pages-preview:
	npm run pages-preview -- --outDir docs

hooks-pre-commit:
	npm run hooks:pre-commit

hooks-commit-msg:
	npm run hooks:commit-msg

hooks-pre-push:
	npm run hooks:pre-push

release:
	@test -n "$(VERSION)" || (printf "Usage: make release VERSION=v0.1.0\n" && exit 1)
	git tag "$(VERSION)"

clean:
	rm -rf coverage .cache playwright-report test-results
