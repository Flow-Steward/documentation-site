---
sidebar_position: 1
title: CLI Reference
description: Common Flow Steward CLI commands.
---

# CLI Reference

Every CLI command is the same after the launcher. Use the host virtualenv or run
inside the Docker app container.

## Launchers

```bash
.venv/bin/python -m core.entrypoints.cli --help
```

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml exec fs-app \
  python -m core.entrypoints.cli --help
```

## Discovery

```bash
.venv/bin/python -m core.entrypoints.cli users --help
.venv/bin/python -m core.entrypoints.cli projects --help
.venv/bin/python -m core.entrypoints.cli tasks --help
.venv/bin/python -m core.entrypoints.cli jobs --help
```

## Database

```bash
.venv/bin/python -m core.entrypoints.cli tooling db init-db
.venv/bin/python -m core.entrypoints.cli tooling db upgrade
.venv/bin/python -m core.entrypoints.cli tooling db init-db --with-demo-data
.venv/bin/python -m core.entrypoints.cli tooling db demo-data -- uninstall
.venv/bin/python -m core.entrypoints.cli tooling db self-project
```

## Users

```bash
.venv/bin/python -m core.entrypoints.cli users create \
  --email admin@example.com \
  --password 'StrongPass_123!' \
  --roles admin
```

```bash
.venv/bin/python -m core.entrypoints.cli users force-password-reset \
  --email admin@example.com
```

## Projects

```bash
.venv/bin/python -m core.entrypoints.cli projects reindex \
  --project-name my-project \
  --mode full
```

## Tasks

```bash
.venv/bin/python -m core.entrypoints.cli tasks submit \
  --project-name my-project \
  --summary "Fix login redirect bug" \
  --workflow-id auto
```

## Jobs

```bash
.venv/bin/python -m core.entrypoints.cli jobs list --limit 20
.venv/bin/python -m core.entrypoints.cli jobs cancel 42 --comment "Operator cancel"
.venv/bin/python -m core.entrypoints.cli jobs restart 42
```

## Global flags

Global flags go before the domain command:

```bash
.venv/bin/python -m core.entrypoints.cli --json jobs list --limit 20
.venv/bin/python -m core.entrypoints.cli --traceback jobs list --limit 20
```
