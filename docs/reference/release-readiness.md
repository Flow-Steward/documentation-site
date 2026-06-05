---
sidebar_position: 4
title: Release Readiness
description: Documentation and repository checks before the first public release.
---

# Release Readiness

Use this page as the public documentation checklist for the first open source
release.

## Repository hygiene

- `README.md` explains what Flow Steward is, who it is for, and how to run it.
- `LICENSE` is present and matches the intended open source license.
- `NOTICE` is present when required by the license.
- `CONTRIBUTING.md` explains local setup, tests, branch flow, and pull requests.
- `CODE_OF_CONDUCT.md` sets community expectations.
- `SECURITY.md` explains vulnerability reporting.
- `TRADEMARK_POLICY.md` is present if the project name and marks need explicit
  handling.

## Documentation

- The quick start works from a clean checkout.
- The docs distinguish user guides, developer docs, and reference material.
- Configuration examples are current and do not leak secrets.
- Demo data can be installed and removed.
- CLI examples work both from the host virtualenv and from the Docker app
  container.
- Extension authoring docs point to a canonical reference implementation.

## Engineering checks

- Database init and upgrade paths are verified.
- The frontend production build passes.
- The full quality/security gate passes or has documented release exceptions.
- Long E2E and workflow-matrix tests use the isolated test runner.
- Release upgrade commands have a dry-run path.

## Deployment

This documentation site builds to static files with:

```bash
npm run build
```

The resulting `build/` directory can be deployed to GitHub Pages, Cloudflare
Pages, Netlify, Vercel, or any static host.
