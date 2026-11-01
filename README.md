# Flow Steward Documentation Site

This repository contains the public documentation site for Flow Steward. It is a
Docusaurus docs-as-code site: documentation is written in Markdown/MDX and built
as static files that can be deployed independently from the application runtime.

## Installing the Flow Steward application

This README's npm commands build the documentation site, not the product.
For Flow Steward itself, start with [Getting Started](docs/user/getting-started.md)
and [Installation](docs/deploy/installation.md). A checkout-based installation
requires running Docker with Linux containers and Docker Compose v2 before
`./install.sh`; Flow Steward does not install Docker for you. Use Docker's official
[Engine installation](https://docs.docker.com/engine/install/) for Linux servers
or [Docker Desktop](https://docs.docker.com/desktop/) for Mac, Windows or Linux
desktops. Linux Engine users also need the
[Compose plugin](https://docs.docker.com/compose/install/linux/).

## External AI clients

Connect an external client through the [built-in MCP quick start](docs/integrations/built-in-mcp-quick-start.md).
Basic MCP calls work without a skill. The optional [Flow Steward Agent Plugin](docs/integrations/agent-plugin.md)
adds two skills over that existing authenticated connection: workflow reuse,
authoring and operational inspection for users, and extension authoring for developers.
Users need no application source checkout; developers work against the target
release’s contracts and supported Development tooling. Follow the
[extension authoring guide](docs/integrations/extension-authoring-skill.md) for
developer tasks and the [MCP reference](docs/reference/mcp.md) for current tools,
scope and report-period details.

## Installation

```bash
npm ci
```

## Local Development

```bash
npm run dev
```

This starts the live-reloading development server. Local search is generated
only by a production build; use `npm run start` (or `npm run preview`) when you
need to build and serve that production output.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Content Structure

- `docs/user/` - operator and product usage guides
- `docs/developer/` - contributor, architecture, and extension authoring docs
- `docs/admin/` and `docs/deploy/` - administration, installation and operations
- `docs/integrations/` - external clients, providers and extension authoring
- `audits/` - dated internal evidence; excluded from the built site
- `docs/reference/` - CLI, API, MCP, configuration, limits, installer, upgrade,
  and workflow-contract references

The first source of truth for product behavior is still the Flow Steward
application repository. Public-facing release docs should be published in this
site when they are stable enough for users and contributors.

The GitHub Pages workflow automatically builds and publishes pushes to `main`.
It uses `https://flow-steward.github.io/documentation-site/`. Run typecheck and
verify both root-domain and project-path builds before pushing; inspect the
workflow result to confirm hosted publication. For other hosting, set `SITE_URL`
and `BASE_URL` and serve the resulting `build/` directory.

Local preview builds, verification environments and recovery snapshots under
`.tmp/` are ignored by Git and retained locally. Historical audit runners are
candidate-specific evidence, not the current application's test suite.

## Automated documentation updates

The public application repository dispatches changes on `main` to this site's
`Propose product documentation updates` workflow. It compares the public source
with the last accepted checkpoint and uses Codex to propose Markdown updates in
one `codex/documentation-sync` PR. The first run also checks existing documentation
gaps. A person reviews and merges the PR; the Pages workflow then publishes it.
The bot never merges its own changes.

Setup requires a GitHub App installed on `Flow-Steward/documentation-site` with
Contents: write and Pull requests: write. Do not grant Workflows or Administration
permissions. Set `DOCS_SYNC_APP_ID` as a repository variable and
`DOCS_SYNC_APP_PRIVATE_KEY` as a repository secret in both the public application
repository and this repository. The application uses a contents-only installation
token for dispatch; this repository mints its PR write token only after validation.
Set `DOCS_SYNC_ACTOR` here to the App's exact bot login (`<app-slug>[bot]`).
Store `OPENAI_API_KEY` here as a repository secret and optionally set
`DOCS_AI_MODEL` to an available model ID. API usage is billed to that key's
project. Action and CLI versions are pinned in the workflow.

Enable GitHub Actions and Pages with the GitHub Actions build source. Optionally
require the `Validate documentation / build` PR check and human review in branch
rules. `SITE_URL` and `BASE_URL` repository variables override the existing Pages
URL defaults in both validation and deployment. Inspect Pages' custom-domain
settings before changing these: a root-domain build requires `BASE_URL=/` and the
actual HTTPS origin. Domain/DNS migration is a separate operation.

Documentation main pushes also trigger catch-up, so acceptance or a concurrent
manual docs edit cannot strand an in-flight source update. A cumulative no-op
withdraws obsolete changes from any pending bot PR while preserving the accepted
checkpoint.

Run `Propose product documentation updates` manually on `main` for initial
reconciliation or to catch up after a failed dispatch. Runs resolve current public
main and include all changes since `.automation/docs-source.json` on documentation
main. GitHub may coalesce pending events; the cumulative checkpoint prevents lost
updates. A completed no-op records its reason in the run artifact and does not
advance the accepted checkpoint. Generation/build failures do not advance it.

Generation has no GitHub write or registry tokens. Its JSON output is validated
on fresh runners; only existing Markdown/MDX pages may change, within 100 files
and 1 MiB. New pages/navigation need a separate reviewed PR. AI-generated MDX is
built without secrets before the PR is opened. Review claims, especially behavior
that is on product main but has not yet been released.

A stale documentation main/branch causes a failed run rather than overwriting
changes: rerun against the current state. Human commits on the bot branch stop
updates for manual review. Reopen a manually closed bot PR to resume review;
closure is not acceptance. Do not manually edit checkpoint metadata to suppress
unreviewed changes. Artifacts retain the proposal and trusted context for 7 days.

Automation tests: `node --test scripts/automation/*.test.mjs`.
