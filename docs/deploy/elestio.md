---
sidebar_position: 3
title: Elestio (Compact)
description: Install Flow Steward Compact on an Elestio CI/CD server.
---

# Install Compact on Elestio

Elestio runs the three Compose services on one dedicated VM: Compact,
PostgreSQL with the required Flow Steward extensions, and RabbitMQ. The
deployment uses the same public container images as the other installation
guides. It does not build the application or require its private source code.

The public configuration repository contains `docker-compose.yml` and
`elestio.yml`. The first defines the services, persistent volumes, dependency
health checks and image digests. The second fills in Elestio's deployment
commands, generated passwords and HTTPS reverse proxy settings.

Fresh GitHub-template acceptance on **2026-09-26** used Compact source
`367d5ff885a5b7557cdb0fb712fe754539fa4d09`, image digest
`sha256:e41f179da299904b02cd60cb8b50d73e20f7fcf9f384a5bbc8edd17c8bfcf214`.
It covered generated credentials, HTTPS readiness, first-administrator creation,
browser sign-in, users/projects/jobs/status CLI commands, graceful shutdown,
and a restart preserving the user, existing sessions, a file and runtime keys.
AI-provider execution and backup/restore were outside this installation check.

## Before you start

- Activate an Elestio account with credit and a service quota. New-account
  approval may require a support request before a VM can be created.
- Connect a GitHub account to Elestio CI/CD and review the OAuth permissions.
  The deployment repository contains public configuration only. Organization
  access is not required when deploying your own fork.
- Use a fresh VM and fresh volumes for a new installation. This recipe does
  not migrate an existing database.
- Review the current price before creating the pipeline. Our September 2026
  test used Netcup Nuremberg, **4 CPU / 8 GB RAM / 100 GB storage**, quoted at
  **$0.0411/hour**, approximately **$30/month** at 730 hours. These resources
  are shared by the three containers. This is a tested size, not a measured
  minimum; prices and availability can change.

## Deploy

1. Fork the [public deployment repository](https://github.com/Flow-Steward/flow-steward-deploy)
   into your GitHub account. This copies configuration, not application images.
2. In Elestio, open **CI/CD → GitHub → Import Git Repository**. Choose your fork.
3. Choose **Deploy on a new VM**, a provider, region and suitable plan. Give
   the target a name, then continue to **Configuration**.
4. Select the branch containing both configuration files. Set the pipeline
   name to `flow-steward-compact`. Confirm that Elestio selected **Docker Compose**,
   build command `docker-compose pull`, and run command `docker-compose up -d`.
5. Verify the generated environment settings and the reverse proxy route:
   **HTTPS 443 → HTTP 172.17.0.1:3000**. Leave additional HTTP Basic Auth off;
   Flow Steward provides its own sign-in. Create the CI/CD pipeline.
6. Wait for the pipeline to finish and the public `/health/ready` endpoint to
   return HTTP 200. PostgreSQL and RabbitMQ start first; Compact waits for
   both before initialization. A VM marked **Running** does not yet mean the
   application is ready.

Import the template through GitHub. Do **not** paste `random_password` into
the manual Docker Compose environment editor: in our direct-paste test,
Elestio kept that literal text as the password. Template import expands it.
The generated password values are secrets; do not copy them into Git.

## Create the first administrator

Open the pipeline logs and find `Flow Steward has no administrator yet`.
Privately open the complete one-time setup URL printed there. It includes the
token needed by `/bootstrap` and expires after **15 minutes**. Opening the
public application URL without this token cannot authorize first-user creation.

If the link expires while no user exists, open the VM's **Open terminal** and
restart only Compact:

```bash
cd /opt/app/flow-steward-compact
docker compose restart compact
docker compose logs --tail=100 compact
```

Read the fresh setup URL, or use an earlier link if the log says it remains
valid. Do not remove any volumes to regenerate a link.

## Use the administrative CLI

Elestio's VM terminal opens on the Docker host. Run the packaged CLI inside
Compact; you do not need a source checkout or manual secret exports:

```bash
cd /opt/app/flow-steward-compact
docker compose exec compact flow-steward --help
docker compose exec compact flow-steward --json users list
docker compose exec compact flow-steward status
```

The directory follows the pipeline name. If you chose another name, replace
`flow-steward-compact` in the path. For an interactive container shell:

```bash
docker compose exec compact sh
flow-steward users --help
```

Inside the container, application files are under `/app` and persistent files
under `/data`. The CLI works from any directory. As an alternative to the
first-user web form, run this from the VM terminal and answer its prompts:

```bash
docker compose exec compact flow-steward users create --role admin
```

Host installation and stack commands, and `users issue-bootstrap-token`, are
not available in the packaged CLI. Use Elestio and Compose for deployment
operations.

## Persistence, updates and cleanup

Only Compact is exposed through Elestio's HTTPS proxy. PostgreSQL and RabbitMQ
are private to the Compose network. The three named volumes hold database,
broker and application data. Restarting Compact preserves them; deleting
volumes does not.

GitHub CI/CD can redeploy when you push to its configured branch. Review
changes before syncing your fork, especially image digests and database
upgrade requirements. Keep one Compact instance with this configuration.
Restart and replacement temporarily interrupt access; wait for readiness
before retrying.

Arrange and test backups of all three persistent stores before keeping real
data. A provider VM backup is not evidence that application-level recovery
has been tested.

After a disposable test, remove its pipeline and VM rather than leaving an
unused server running. Confirm that no billable test resources remain in the
Elestio dashboard. Keep production volumes and backups whenever the
installation is intended to resume.
