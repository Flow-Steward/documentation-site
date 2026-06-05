---
sidebar_position: 1
title: Getting Started
description: Run Flow Steward locally and create the first admin user.
---

# Getting Started

Run these commands from the Flow Steward application repository, not from this
documentation site repository.

## Requirements

- Docker with Compose support
- A local checkout of the Flow Steward application repository
- At least one LLM provider key in `.env`, such as `ANTHROPIC_API_KEY` or
  `OPENAI_API_KEY`

## Start the stack

```bash
cp .env.example .env
# Edit .env and add at least one LLM API key.

docker compose -p flow-steward -f infra/docker/docker-compose.yaml up -d --build
```

For local development with relaxed auth and hot reload:

```bash
docker compose -p flow-steward \
  -f infra/docker/docker-compose.yaml \
  -f infra/docker/docker-compose.dev.yaml \
  up -d --build
```

## Initialize the database

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml exec fs-app \
  python -m core.entrypoints.cli tooling db init-db
```

Upgrade an existing environment to the current canonical schema and seed state:

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml exec fs-app \
  python -m core.entrypoints.cli tooling db upgrade
```

## Optional demo data

Demo data creates a separate Flow Steward Demo Project plus demo tools, skills,
agents, and runnable workflows.

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml exec fs-app \
  python -m core.entrypoints.cli tooling db init-db --with-demo-data
```

You can remove the demo pack later:

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml exec fs-app \
  python -m core.entrypoints.cli tooling db demo-data -- uninstall
```

## Create the first admin user

The bootstrap endpoint is localhost-only and closes after the first user exists.

```bash
curl -k https://localhost:8099/auth/bootstrap \
  -d '{"username":"admin","password":"changeme123"}'
```

Then open the application:

```bash
open https://localhost:8099
```

If the dev frontend is enabled, the Vite shell is available at:

```bash
open http://localhost:5173/app/
```
