---
sidebar_position: 2
title: Render (Compact)
description: Install Flow Steward Compact with one Render Blueprint.
---

# Install Compact on Render

The single public [`render.yaml`](https://github.com/Flow-Steward/flow-steward-deploy/blob/main/render.yaml) describes one Compact web service, a private
PostgreSQL service with the Flow Steward database extensions, and a private
RabbitMQ service. Render creates and connects the three services from one
Blueprint. It pulls from the same public Compact image repository used by other platforms;
there is no Render-specific application image or Dockerfile. PostgreSQL and
RabbitMQ can start in parallel; Compact waits for
both before it initializes the database or writes to its persistent volume.
You do not need to run a local shell script, change disk permissions manually,
or copy connection passwords between services.

This is the **Compact** topology. For **Scalable**, use the
[VPS installation](installation#vps-guided-installation) until a Render-specific
Scalable deployment has been tested.

Fresh Blueprint acceptance on **2026-09-28** used Compact source
`31652e30e9c65b16576e9a4b3d105072c24b8337`, image digest
`sha256:dee794207e38a4828cadd659cb41cbeaf65a1bdfedd6e4532bcb2a89c77681b1`.
It covered readiness, first-administrator setup, browser sign-in, the users,
projects, jobs and status CLI commands, and a restart preserving the user,
existing session, a data file and saved runtime keys. Graceful shutdown was
also checked under Render's actual container permissions. AI-provider execution
and a full backup/restore exercise were outside this installation check.

## Before you start

- Have a Render account with a payment method. The Blueprint repository and
  all three container images are public; Render does not need access to the
  Flow Steward application source. Render's Hobby workspace itself is free,
  but the three services and their persistent disks are paid.
- Use a new Blueprint and new disks for a new installation. A previous test
  disk is not a clean first-install test, even if its service is suspended.
- Review the service plans and disk sizes in the public `render.yaml`
  before confirming the Blueprint. The file is the deployment configuration;
  Render can show its resources and estimated charges before provisioning.

The September 2026 test configuration was quoted at **$140.25/month**:

| Service | vCPU | RAM | Persistent disk | Monthly compute + disk |
| --- | ---: | ---: | ---: | ---: |
| Compact | 2 | 4 GB | 10 GB | $87.50 |
| PostgreSQL | 1 | 2 GB | 10 GB | $27.50 |
| RabbitMQ | 1 | 2 GB | 1 GB | $25.25 |

These are separate allocations, not a shared 8 GB memory pool. This is a test
configuration, not a measured minimum. Confirm current prices in Render before
deploying; traffic overages and applicable taxes may add to the estimate.
PostgreSQL is our extension-enabled container on a private service, not Render's
managed PostgreSQL product. Plan database backups and upgrades accordingly.

## Deploy

1. Use the [Deploy to Render button](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FFlow-Steward%2Fflow-steward-deploy). It opens the public configuration repository; choose its `main` branch and the root `render.yaml`. No application-source Git connection is required.
2. Review the three proposed services, their **Frankfurt** region, plans, and disks. Deploy the Blueprint. It generates separate PostgreSQL and RabbitMQ passwords and links them to Compact without exposing them in the YAML file.
3. Wait until PostgreSQL and RabbitMQ are running and the Compact web service is **Live**. Compact uses `/health/ready` as its health check. The first image pull can take longer than a restart; a web address appearing in the dashboard is not a readiness signal.
4. Open **flow-steward-compact → Logs**. Find the line beginning `Flow Steward has no administrator yet`. Privately copy the complete one-time setup URL printed there and open it to create the first administrator. The URL expires **15 minutes** after issue. Opening `/bootstrap` directly without it displays a token field because the public page does not reveal the secret.

Do not paste the setup URL into a support ticket or screenshot. It contains a
one-time token. After creating the administrator, sign in at `/login`.

If the link expires before any user exists, restart **only** the Compact service
from its dashboard, then read its fresh logs. Keep the PostgreSQL and RabbitMQ
services and all three disks intact. If the logs say an earlier link is still
valid, use that link or wait for it to expire before restarting again.

## Operate and update

Open **flow-steward-compact → Shell** in Render to inspect the running
container. The packaged application is under `/app`; `/data` is the persistent
volume. The Blueprint keeps one Compact instance because two instances must
not write to the same volume. PostgreSQL and RabbitMQ are private services;
only the Compact web service has a public HTTPS URL.

A restart or deployment temporarily interrupts access while Render replaces
the instance attached to the persistent disk. Wait for **Live** and
`/health/ready` before retrying; this single-instance configuration does not
provide zero-downtime deployments.

Run the packaged CLI directly from the Shell, from any working directory:

```bash
flow-steward --help
flow-steward users --help
flow-steward --json users list
flow-steward status
```

If you cannot use the first-administrator link, create an administrator from
this private Shell instead:

```bash
flow-steward users create --role admin --plain
```

Enter your email and password in the interactive form. For a shell that does
not support the form, start `bash`, then read the password without echoing it
or writing it into shell history:

```bash
bash
read -rsp 'New admin password: ' FS_ADMIN_PASSWORD; printf '\n'
printf '%s\n' "$FS_ADMIN_PASSWORD" | flow-steward users create --email you@example.com --role admin --password-stdin --confirm
unset FS_ADMIN_PASSWORD
```

Replace `you@example.com` with your own address. Do not run the host repository's
`./flow-steward` Docker launcher inside this container. The packaged command
loads the running installation's saved settings itself; do not export secrets
or copy files out of `/data/state`. Host installation and stack commands, and
`users issue-bootstrap-token`, are unavailable in the container. Use the
Render dashboard for deployment operations and `/health/ready` for HTTP readiness.

The Blueprint disables automatic application redeployment, but Blueprint
configuration changes can still sync from its public repository. Review image
digest and configuration changes before an upgrade, with a verified backup and the
release's database-upgrade procedure. Suspending a service pauses compute,
but it does not replace a backup or establish that data will survive deletion.
Keep all three disks if you intend to resume the installation.

If deployment fails, inspect each service's **Deploy Logs**. A database image
that lacks Apache AGE or pgvector, an unavailable private hostname, or a
missing disk will prevent Compact from becoming ready. Do not repeatedly
delete and recreate the application disk just to make the health check green:
record the failing step and preserve the data for diagnosis.
