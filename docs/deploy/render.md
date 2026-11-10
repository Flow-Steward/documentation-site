---
sidebar_position: 2
title: Render (Compact)
description: Install Flow Steward Compact with one Render Blueprint.
---

# Install Compact on Render

The public [`render.yaml`](https://github.com/Flow-Steward/flow-steward-deploy/blob/main/render.yaml) is maintained in a separate deployment repository. The
**2026-09-28** acceptance configuration described one Compact web service, a
private PostgreSQL service with the Flow Steward database extensions, and a
private RabbitMQ service, connected through one Blueprint. It used the public
Compact image rather than a Render-specific application image or Dockerfile.

The deployment repository and Render's current configuration, image availability,
plans and dashboard behavior were not verified in this source review. Before
provisioning, inspect the linked Blueprint and confirm the settings described
below. The application behavior documented here is supported by the reviewed
source on main; this does not establish that a corresponding image or release
has been published.

PostgreSQL and RabbitMQ can start in parallel. Set
`FS_COMPACT_WAIT_FOR_DEPENDENCIES=1` on Compact so it waits for both before
initializing the database or writing to its persistent volume. The provider
entrypoint builds connection URLs from linked-service settings when canonical
URLs are absent. Confirm that the Blueprint supplies those settings and mounts
writable persistent storage; the dated installation did not require a local
shell script, manual disk-permission changes or manual password copying.

Compact reaches RabbitMQ over Render's private network. Flow Steward refuses
unencrypted AMQP by default, so the Blueprint declares that one broker:
`FS_RABBITMQ_TRANSPORT_MODE=platform-private`, and `FS_RABBITMQ_PRIVATE_HOST`
taken from the RabbitMQ service's private host, the same value as
`RABBITMQ_HOST`. Plaintext is then allowed only to that host on port 5672.
Render's private network spans every service in the same workspace and region,
and Render does not document that this traffic is encrypted. If that is not
acceptable, use a TLS broker (`amqps://`, mode `tls`) instead. See
[RabbitMQ transport](../reference/environment-variables#rabbitmq-transport).
The Blueprint needs a Compact image from a release that supports this mode;
it is not compatible with images that predate it.

This is the **Compact** topology. For **Scalable**, use the
[VPS installation](installation#vps-guided-installation); the dated Render
acceptance covered Compact only.

On **2026-11-10** a fresh Blueprint instance with the `platform-private` broker
settings and a Compact image carrying that mode reached `/health/ready` in about
two minutes after Compact was created, and `flow-steward status` in the service
Shell reported ready with 13 of 13 core checks. In a second fresh instance the
same day, the first administrator was created from the one-time link in a browser,
signed in, created a project, imported the [smoke workflow](../user/first-workflow)
and ran it (`Hello, …!` output); after a Compact restart the same browser session,
project, workflow and job were still there and a second run completed. Both times Compact's first deploy exited once and
Render's automatic second deploy went live about a minute later; no action was
needed.

Fresh Blueprint acceptance on **2026-09-28** used Compact source
`31652e30e9c65b16576e9a4b3d105072c24b8337`, image digest
`sha256:dee794207e38a4828cadd659cb41cbeaf65a1bdfedd6e4532bcb2a89c77681b1`.
It covered readiness, first-administrator setup, browser sign-in, the users,
projects, jobs and status CLI commands, and a restart preserving the user,
existing session, a data file and saved runtime keys. Graceful shutdown was
also checked under Render's actual container permissions. AI-provider execution
and a full backup/restore exercise were outside this installation check.

## Before you start

- Have a Render account with a payment method. The dated configuration used a
  public Blueprint repository and three public container images without access
  to the Flow Steward application source. Confirm their current availability
  and Render's account requirements. The test used paid services and disks.
- Use a new Blueprint and new disks for a new installation. A previous test
  disk is not a clean first-install test, even if its service is suspended.
- Review the service plans and disk sizes in the public `render.yaml`
  before confirming the Blueprint. The file is the deployment configuration;
  review Render's proposed resources and estimated charges before provisioning.

The September 2026 test configuration was quoted at **$140.25/month**:

| Service | vCPU | RAM | Persistent disk | Monthly compute + disk |
| --- | ---: | ---: | ---: | ---: |
| Compact | 2 | 4 GB | 10 GB | $87.50 |
| PostgreSQL | 1 | 2 GB | 10 GB | $27.50 |
| RabbitMQ | 1 | 2 GB | 1 GB | $25.25 |

These are separate allocations, not a shared 8 GB memory pool. This is a test
configuration, not a measured minimum. Confirm current prices in Render before
deploying; traffic overages and applicable taxes may add to the estimate.
The tested PostgreSQL service used our extension-enabled container, not Render's
managed PostgreSQL product. Plan database backups and upgrades accordingly.

## Deploy

1. Use the [Deploy to Render button](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FFlow-Steward%2Fflow-steward-deploy). It targets the public configuration repository; choose its `main` branch and the root `render.yaml`. Confirm that no application-source Git connection is required.
2. Review the three proposed services, region, plans, and disks. The dated configuration used **Frankfurt**, generated separate PostgreSQL and RabbitMQ passwords, and linked them to Compact without embedding passwords in the YAML file. Confirm those connections and `FS_COMPACT_WAIT_FOR_DEPENDENCIES=1` before deploying.
3. If the first sync shows `flow-steward-compact` as *canceled: another action
   failed* while PostgreSQL and RabbitMQ were created, open the Blueprint, choose
   **Manual sync** and approve it once. On 2026-11-10 the first sync did this
   without an error message, and the second one created Compact.
4. Wait until PostgreSQL and RabbitMQ are running and the Compact web service is **Live**. Confirm that its health check is `/health/ready`. The first image pull can take longer than a restart; a web address appearing in the dashboard is not a readiness signal.
5. Open the Compact service's **Logs**. Find the line beginning `Flow Steward has no administrator yet`. Privately copy the complete one-time setup URL printed there and open it to create the first administrator. The URL expires **15 minutes** after issue. Opening `/bootstrap` directly without it displays a token field because the public page does not reveal the secret.

Do not paste the setup URL into a support ticket or screenshot. It contains a
one-time token. After creating the administrator, sign in at `/login`.

If the link expires before any user exists, restart **only** the Compact service
from its dashboard, then read its fresh logs. Keep the PostgreSQL and RabbitMQ
services and all three disks intact. If the logs say an earlier link is still
valid, use that link or wait for it to expire before restarting again.
Self-issuance also requires local authentication and first-administrator
bootstrap to be enabled, with no separately configured setup token.

## Operate and update

Open the Compact service's **Shell** in Render to inspect the running
container. The packaged application is under `/app`; `/data` is the persistent
volume. Keep one Compact instance per volume: the runtime locks the volume
against concurrent use. Confirm that PostgreSQL and RabbitMQ remain private
services and only Compact has a public HTTPS URL, as in the dated configuration.

A restart or deployment can temporarily interrupt access while Render replaces
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

The dated Blueprint disabled automatic application redeployment. Confirm the
current setting and Blueprint configuration-sync behavior in Render before
relying on it. Review image digest and configuration changes before an upgrade,
with a verified backup and the release's database-upgrade procedure. Suspending
a service does not replace a backup or establish that data will survive deletion.
Confirm Render's current suspension and disk-retention policies, and keep all
three disks if you intend to resume the installation.

If deployment fails, inspect each service's **Deploy Logs**. A database image
that lacks Apache AGE or pgvector, an unavailable private hostname, or an
unwritable persistent volume can prevent Compact from becoming ready. Do not
repeatedly delete and recreate the application disk just to make the health
check green: record the failing step and preserve the data for diagnosis.
