---
sidebar_position: 2
title: Configuration
description: Environment files and runtime profiles.
---

# Configuration

Flow Steward runtime configuration is environment-driven. Start by copying the
example file:

```bash
cp .env.example .env
```

Add at least one LLM provider key:

```bash
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

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

## Memory profiles

Canonical memory records live in Postgres. Optional vector and graph services are
indexes and must be selected explicitly through `.env`.

The standard Compose stack builds the canonical Postgres image with Apache AGE,
pgvector, `pg_trgm`, and `unaccent`.

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml up -d --build
```

Optional Neo4j code graph index:

```bash
docker compose -p flow-steward \
  -f infra/docker/docker-compose.yaml \
  -f infra/docker/docker-compose.memory-extras.yaml \
  --profile memory-neo4j up -d --build
```

Supported first-release values are limited to the Postgres unified profile,
optional `postgres_pgvector`, and optional `neo4j` for code graph only.

## MCP for local Codex sessions

Codex App and Codex CLI use the global config at `~/.codex/config.toml`, not the
repo-local `.mcp.json`.

```bash
python -m core.entrypoints.cli tooling ops setup-codex-mcp
python -m core.entrypoints.cli tooling ops setup-codex-mcp -- --check
codex mcp list
```

Export a platform token before launching Codex:

```bash
export MCP_BEARER_TOKEN=<platform_pat_or_machine_token>
```
