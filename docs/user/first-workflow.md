---
sidebar_position: 3
title: First Workflow
description: A simple operator path for running the first Flow Steward workflow.
---

# First Workflow

The first workflow should be a controlled smoke run, ideally against demo data or
a low-risk repository.

## 1. Start from demo data

Install the demo pack during database initialization:

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml exec fs-app \
  python -m core.entrypoints.cli tooling db init-db --with-demo-data
```

The demo pack creates a Flow Steward Demo Project with tools, skills, agents, and
runnable workflows.

## 2. Inspect tool contracts

Open a demo tool in the registry and review its action contracts before running
a workflow. The Actions tab shows the expected input parameters and returned
fields.

## 3. Submit a task

From the CLI, submit a manual task to a project:

```bash
.venv/bin/python -m core.entrypoints.cli tasks submit \
  --project-name "Flow Steward Demo Project" \
  --summary "Run a controlled demo workflow" \
  --workflow-id auto
```

The same command can run inside Docker:

```bash
docker compose -p flow-steward -f infra/docker/docker-compose.yaml exec fs-app \
  python -m core.entrypoints.cli tasks submit \
  --project-name "Flow Steward Demo Project" \
  --summary "Run a controlled demo workflow" \
  --workflow-id auto
```

## 4. Follow the job

Use the Jobs page or CLI to watch the job:

```bash
.venv/bin/python -m core.entrypoints.cli jobs list --limit 20
```

If a job waits for approval, review the proposed action before resuming. If a
test run fails, inspect the failure path and retry only after the underlying
issue is understood.
