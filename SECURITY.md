# Security Policy

## Supported Versions

The current `main` branch and latest semver tag are supported.

## Reporting A Vulnerability

Please report security issues by email to baditaflorin@gmail.com.

Do not open public issues for suspected vulnerabilities.

## Baseline

- The app is static and does not require secrets.
- No runtime backend is deployed.
- Browser persistence is local to the user's device.
- Gitleaks is wired into the local pre-commit hook.
