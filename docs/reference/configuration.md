---
sidebar_position: 2
title: Configuration
description: Environment files and runtime profiles.
---

# Configuration

The behavior below is supported by the current source on main; it does not
establish availability in a published release.

For an installed Scalable deployment, stage typed settings through the CLI,
validate them, then apply the reviewed change:

```bash
./flow-steward config set --public-host flow.example.test --public-port 443
./flow-steward config show
./flow-steward config validate
./flow-steward config apply --confirm
```

`config set` does not change the running system. Each call replaces the pending
patch, so include all intended changes together and review the active/pending
diff with `config show`. A restart does not apply staged configuration. The
public HTTPS base URL is generated from typed host/port settings and used with
the deployment's TLS configuration, not set as an arbitrary environment variable.

Typed settings also accept `NAME=VALUE` syntax, such as
`public_host=flow.example.test`. Approved non-secret host settings accept their
canonical environment names through the same command. An empty host-setting
value resets it to its default. Installer-managed keys and secrets are not
arbitrary host settings.

Compact installations do not support the `config` command family through the
public launcher. For approved host settings, use
`./install.sh --setting NAME=VALUE`; follow the supported installer/provider
instructions for other changes. See [CLI Reference](cli).

For contributor development setup only, start from the environment example:

```bash
cp .env.example .env
```

Core installation does not require an LLM credential. After bootstrap, an
administrator configures account-scoped model providers and credentials in the
application and selects verified provider/model combinations for projects or
agents. Do not treat process-wide provider environment keys as the primary
credential model. Model resolution uses per-agent project overrides, then
project defaults, then registry agent configuration. An unavailable selected
route does not silently fall back to another provider or an environment default;
execution reports `model_unavailable`.

## Optional environment overlays

The application repository includes additional examples for specific concerns:

- `.env.example.test`
- `.env.example.quality`
- `.env.example.ops`
- `.env.example.memory`
- `.env.example.prod`

Keep the attachment and redaction policy block from the example files intact.
Runtime defaults for those lists bootstrap from the canonical environment
examples.

## Contributor memory setup

Canonical memory records live in Postgres. Vector and graph backends provide
indexes in Postgres; separate vector or graph services are not required. The
following raw Compose example is for a contributor checkout, not the
installation or configuration-update path for an installed deployment.

The standard Compose stack builds the canonical Postgres image and initializes
Apache AGE, pgvector, `pg_trgm`, and `unaccent`.

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml up -d --build
```

The supported memory profile is `postgres_unified`, with pgvector and Apache AGE
in the platform Postgres image. Neo4j and the old `memory-neo4j` Compose profile
are not supported memory setup paths.

## Built-in MCP client configuration

Configure an MCP client using that client's supported settings and the Flow
Steward MCP endpoint. The public CLI has no `setup-codex-mcp` command. The
application's connection setup derives the endpoint from the public origin,
normally `https://<public-host>/mcp`, and reports missing or internal-only
addresses instead of handing out a container address.

For token-based clients, configure the client to read the environment variable
that holds a narrowly scoped PAT or service-account token. Exporting a variable
alone does not configure the client. The current client setup catalog uses
`FLOW_STEWARD_TOKEN`, for example:

```bash
export FLOW_STEWARD_TOKEN='<platform_pat_or_machine_token>'
```

Start the client in an environment containing that variable and use the matching
variable name in its authentication settings. Follow the client's current
instructions; source-provided setup templates do not establish current
third-party client compatibility. Never disable MCP auth outside an isolated
local-development environment.

## Full environment reference

See [Environment Variables](environment-variables) for a grouped reference of
the main `.env.example`, production, ops, quality, test, provider, MCP, storage,
auth, monitoring, and docs exposure variables.
