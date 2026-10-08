---
sidebar_position: 2
title: Configuration
description: Environment files and runtime profiles.
---

# Configuration

For an installed Scalable deployment, stage typed settings through the CLI,
validate them, then apply the reviewed change:

```bash
./flow-steward config set --public-host flow.example.test --public-port 443
./flow-steward config validate
./flow-steward config apply --confirm
```

`config set` does not change the running system. A restart does not apply staged
configuration. The public base URL is generated from typed host/port and TLS
settings, not set as an arbitrary environment variable. Compact installations
must follow their supported provider/profile instructions; the Scalable `config`
family is not automatically available there. See [CLI Reference](cli).

For contributor development setup only, start from the environment example:

```bash
cp .env.example .env
```

Core installation does not require an LLM credential. After bootstrap, an
administrator creates an account-scoped credential profile in the application
and selects permitted provider/model combinations for projects or agents. Do
not treat process-wide provider environment keys as the primary credential
model, and do not assume an unavailable model silently falls back to another
provider; execution reports `model_unavailable`.

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

Canonical memory records live in Postgres. Optional vector and graph services are
indexes. The following raw Compose example is for a contributor checkout, not
the installation or configuration-update path for an installed deployment.

The standard Compose stack builds the canonical Postgres image with Apache AGE,
pgvector, `pg_trgm`, and `unaccent`.

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml up -d --build
```

The candidate's canonical public deployment uses the Postgres unified profile,
with pgvector and Apache AGE in the platform Postgres image. Neo4j variables
and the old `memory-neo4j` Compose profile are not in the pinned environment
manifest and are not a supported public setup path.

## Built-in MCP client configuration

Configure an MCP client using that client's supported settings and the Flow
Steward MCP endpoint. The pinned public CLI has no `setup-codex-mcp` command;
an internal repository note that names one is stale and is tracked as an
application-owner follow-up.

Export a platform token before launching Codex:

```bash
export MCP_BEARER_TOKEN=<platform_pat_or_machine_token>
```

Use a narrowly scoped PAT or service-account token. Never disable MCP auth
outside an isolated local-development environment.

## Full environment reference

See [Environment Variables](environment-variables) for a grouped reference of
the main `.env.example`, production, ops, quality, test, provider, MCP, storage,
auth, monitoring, and docs exposure variables.
