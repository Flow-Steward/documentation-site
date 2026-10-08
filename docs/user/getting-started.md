---
sidebar_position: 1
title: Getting Started
description: Reach a healthy Flow Steward instance and prepare for a first controlled workflow.
---

# Getting Started

Choose the path that matches what you have.

- If an operator already gave you a healthy URL and account, sign in and
  continue with the [Product Tour](product-tour) and
  [First Workflow](first-workflow).
- If you operate the stack, choose a destination in [Installation](../deploy/installation),
  then follow the [Installer Walkthrough](../deploy/installer-walkthrough) for a
  Docker host or [Platform Deployment](../deploy/platforms) for provider hosting.


## Install a local instance

This sequence runs in a Flow Steward application checkout on the machine that
will host Docker. For Railway, Fly.io, or Render with a prebuilt image, follow
the provider guide instead; those deployments do not need a local Docker daemon.
A DigitalOcean Droplet follows this Docker-host sequence over SSH.

Before running `./install.sh`, install and start Docker with **Linux containers**
and Docker Compose v2. This prerequisite applies to both Compact and Scalable,
on a desktop or a server; downloading Flow Steward does not install Docker.

- Linux server: follow the official [Docker Engine installation](https://docs.docker.com/engine/install/)
  instructions ([Ubuntu](https://docs.docker.com/engine/install/ubuntu/)) and the
  [Compose plugin instructions](https://docs.docker.com/compose/install/linux/).
- Mac, Windows or Linux desktop: install [Docker Desktop](https://docs.docker.com/desktop/),
  which includes Compose. On Windows, run the shell entrypoints in Git Bash or WSL.

Check from the same non-root account that will install Flow Steward:

```bash
docker --version
docker compose version
docker info
```

If Docker/Compose is missing, follow the appropriate official installation guide.
If `docker info` fails, start Docker or fix access to its socket using Docker's
[Linux post-install instructions](https://docs.docker.com/engine/install/linux-postinstall/).
Do not solve access errors by running Flow Steward as root.

From the Flow Steward application repository:

```bash
./install.sh
./flow-steward status
./flow-steward doctor
```

`./install.sh` installs or resumes; it has no subcommands. It also reconciles
installer-built images after an intentional source update; see
[Installation And Updates](installation-and-updates). A host Python runtime
and model-provider credentials are not required for core readiness.

Open the bootstrap URL printed by the installer. For the default local endpoint:

```bash
open https://localhost:8099
```

Complete first-administrator setup in the web interface. Do not invent or reuse
an old `/auth/bootstrap` payload; the current installer supplies the applicable
bootstrap URL and, for non-loopback setup, the owner-only token handoff.

## Confirm your access

Before a first workflow, confirm:

1. the instance is healthy;
2. your account has the role required by the guide;
3. you know which workspace and project will own the work;
4. a model provider is configured only if the selected workflow needs one;
5. tests will not call real providers or create unintended external effects.

The core installer applies the canonical schema baseline and seed. Old
`tooling db init-db` and demo-data commands are not public commands. To use
ready-made automation, open the [Workflow Catalog](workflow-and-extension-catalogs)
and create a local workflow draft; installing demo data is not required.

## What to read next

- [Product Tour](product-tour) for current navigation and role boundaries.
- [First Workflow](first-workflow) for a deterministic local result.
- [Users, Roles, And Access](users-roles-and-access) before issuing tokens or
  inviting operators.
- [Workflows](workflows) before creating production automation.
- [Datasets And Data Connections](datasets-and-data-connections) before exposing
  database-backed context.
