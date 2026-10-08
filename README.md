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
