---
sidebar_position: 7
title: Documentation Site
description: How to run, build, and publish the Flow Steward documentation site.
---

# Documentation Site

The documentation site is a separate Docusaurus project. It is designed to be
deployed independently from the Flow Steward application.

## Open the docs locally

From the documentation repository:

```bash
npm install
npm run start -- --host 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000/
```

`npm run start` builds the static site first, then serves the production output.
Use it when you want search to work locally.

For fast editing with hot reload:

```bash
npm run dev -- --host 127.0.0.1 --port 3000
```

The dev server is useful while writing pages, but the local-search index is not
generated until a production build.

## Build

```bash
npm run typecheck
npm run build
```

The static output is written to `build/`.

## Production URL variables

The site reads these environment variables at build time:

| Variable | Purpose |
|---|---|
| `SITE_URL` | Absolute public origin for canonical URLs and social metadata. |
| `BASE_URL` | Path prefix where the site is served. Use `/` for a root domain. |

Examples:

```bash
SITE_URL=https://flowsteward.org BASE_URL=/ npm run build
```

```bash
SITE_URL=https://flow-steward.github.io BASE_URL=/documentation-site/ npm run build
```

## Publication

The repository's GitHub Pages workflow builds and deploys on pushes to `main`.
It explicitly uses `SITE_URL=https://flow-steward.github.io` and
`BASE_URL=/documentation-site/`. A manual workflow dispatch uses the same path.

The default root-domain build uses `https://flowsteward.org` and `/`; a different
host must serve that build separately. Configure the actual public origin and
base path for the destination. A successful local build does not prove that a
hosted deployment completed; inspect its deployment result after pushing.

## Content model

Keep the documentation split clear:

- Start Here: product framing, role routing, concepts, and first-run paths.
- User Guide: product UI, dashboard, projects, workflows, jobs, agents, data,
  extensions, and lifecycle controls.
- Admin & Operations: users, providers, security policy, audit evidence, events,
  queues, retries, and monitoring.
- Deploy & Run: install, update, configuration, backups, storage, observability,
  rollback, and deployment troubleshooting.
- Integrations & Extensions: incoming webhooks, MCP clients and catalogs, data
  connections, provider callbacks, and extension authoring.
- Developer Platform: codebase, CLI usage patterns, MCP server, workflow
  runtime, extension internals, and docs-site maintenance.
- API & Reference: stable lookup tables for CLI, MCP, API, env vars, installer,
  upgrade, and workflow step kinds.
- Internal audit and planning material stays under `audits/`; it is not part of
  the public Docusaurus corpus, navigation, search index, sitemap, or agent index.

## Agent index

The site serves `static/llms.txt` as a lightweight public documentation index
for clients that discover documentation through an agent-readable entry point.

Update `static/llms.txt` when:

- a page is added;
- a page is renamed;
- a page moves to a different audience section;
- a major topic becomes important for support or onboarding.

Keep the file factual and navigation-oriented. It should point agents to the
right source page, not duplicate full documentation content.

Use relative `docs/...` targets in this static file. Unlike Docusaurus-managed
links, the file is copied without base-path rewriting; relative targets work at
both `/llms.txt` and `/documentation-site/llms.txt`.

## Local search

Search is provided by `@easyops-cn/docusaurus-search-local`. It indexes the
production build, so search behavior should be checked after `npm run build` and
preview, not only during dev server editing.

Use:

```bash
npm run start -- --host 127.0.0.1 --port 3000
```

or:

```bash
npm run preview -- --host 127.0.0.1 --port 3000
```

Do not use `npm run dev` as the final search check.
