---
sidebar_position: 7
title: Documentation Site
description: How to run, build, and publish the Flow Steward documentation site.
---

# Documentation Site

The documentation site is a separate Docusaurus project. It is designed to be
deployed independently from the Flow Steward application.

## Open the docs locally

Use Node.js 20 or newer; the repository workflows use Node.js 22.
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
SITE_URL=https://docs.flowsteward.org BASE_URL=/ npm run build
```

```bash
SITE_URL=https://flow-steward.github.io BASE_URL=/documentation-site/ npm run build
```

## Publication

The repository's server deployment workflow is configured to build and publish
pushes to `main` to `https://docs.flowsteward.org`, with `BASE_URL=/`. A manual
workflow dispatch from main uses the same destination. This deployment path does
not use GitHub Pages or perform a DNS or demo migration.

Build and typecheck complete before deployment. The deployment scripts require a
dedicated forced-command SSH key and a receiver restricted to
`/home/admin/docs-flowsteward/site`. With the documented server setup, that key
cannot open a shell or change the demo installation, and the existing Nginx
container serves the same bind-mounted directory without a restart. The workflow
checks `deployment-revision.txt` over HTTPS after transfer. Checked-in configuration
does not establish the current server setup or successful publication; confirm
the deployment result and public revision marker. A local build alone does not
prove hosted deployment. See the repository README for the restricted receiver,
environment secret, reviewed host key and failure/retry setup.

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


## AI documentation proposals

Public product changes request an update through the documentation workflow.
Codex compares the source with the last accepted checkpoint and proposes updates
in one bot PR. Each existing page has its own bounded review job (at most three
concurrent jobs); the initial run checks the existing claims in every page.
Incremental reviews search cumulative changed paths relevant to each page.
All planned page receipts must report `completed` with matching source and docs
revisions before any results are published. `incomplete`/`failed` results and
failure summaries fail the run even when they contain no proposed edits. A green
no-op means every page review completed, rather than the model abandoning a large
repository review. The workflow does not claim an exhaustive audit of unrelated
implementation files.
AI can update existing Markdown pages; additions needing navigation changes remain
separate reviewed work. The generated content is validated and built without
publication credentials before a PR is opened.

Review the source evidence and unreleased-versus-released wording before accepting
the PR. Merging advances the accepted checkpoint and triggers server deployment;
closing a PR does not accept its changes. Failed generation or builds leave the
checkpoint unchanged. Human commits to the bot branch require manual review.

For a missed dispatch or stale generation, run **Propose product documentation
updates** manually on main. It covers all public source changes since acceptance,
including events coalesced while an earlier run was active. See the repository
README for GitHub App permissions, model/API setup, required secrets and retry
instructions. Configure credentials through GitHub settings; never include them
in documentation or PR content.
