---
sidebar_position: 2
title: Platform Deployment
description: Choose a Compact provider guide or a Docker-host installation and review its evidence boundaries.
---

# Platform Deployment

This page explains shared provider requirements and manual configuration.
Start with the dedicated installation guide where one is available. The source
contracts below were reviewed at `62a95e3456d3a692092b5a04daecca504c3f97b1`.
Provider acceptance recorded in the upstream guides uses its own dated image
pins; it is not a deployment of every later source revision.

| Platform | Installation guide | Local prerequisites |
| --- | --- | --- |
| Railway | [Guided fresh-project helper](installation#railway-compact-in-dependency-order) | Bash, Railway CLI, `jq`, `openssl`, `curl`, authorized account access |
| Fly.io | [Guided installer and TOML examples](installation#flyio-compact-with-persistent-volumes) | Fly CLI, `jq`, `openssl`, `curl`, authorized account access |
| Render | [Public Compact Blueprint](render) | Dashboard access and registry image access |
| Elestio | [Compact Compose template](elestio) | Provider account and registry image access |
| DigitalOcean Droplet | [Docker-host procedure and recorded checks](installation#digitalocean-droplet) | SSH, Git, Git LFS, Docker Engine and Compose v2 on the Droplet |

A prebuilt image deployment on Railway, Fly.io or Render needs no local Docker
daemon. Building the image locally does. On a Droplet, Docker runs on the
Droplet itself; your SSH client does not need Docker. Provider access and
registry credentials are separate from Flow Steward application credentials.

## Shared Compact requirements

Use an immutable Compact runtime image and compatible dependency images from
the intended release. Record the exact digest and source revision; a successful
pull does not establish that an image matches the current source. The application
build target is `compact-runtime` in `infra/docker/Dockerfile`. A custom build
must set `BUILD_SHA` to its full source commit and `FS_IMAGE_PLATFORM` to its
actual platform. See [Installation And Updates](../user/installation-and-updates)
for the distinction between checkout builds and published releases.

Prepare all volumes and variables before the first runtime start:

| Service | Persistent mount | Configuration |
| --- | --- | --- |
| PostgreSQL 17 with Apache AGE and pgvector | `/var/lib/postgresql/data` | `PGDATA=/var/lib/postgresql/data/pgdata`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| RabbitMQ | `/var/lib/rabbitmq` | `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`, `RABBITMQ_DEFAULT_VHOST=flow` |
| Compact runtime | `/data` | Database/broker connections, public origin, listener port, worker count |

The extended database image is built from
`infra/docker/postgres-extended/Dockerfile`. Generic PostgreSQL or pgvector-only
hosting is insufficient: the canonical schema also requires Apache AGE. Verify
extension support and required database privileges before substituting a managed
database. Keep database and broker ports private.

Use these Compact settings, replacing every placeholder with that provider's
private service address or secret. Set both the connection URLs and matching
components so bootstrap, readiness, and management resolve the same services.
URL-encode credentials inside URLs.

```text
FS_DB_DSN=postgresql://<user>:<encoded-password>@<postgres-private-host>:5432/flow_steward
LANGGRAPH_POSTGRES_URI=postgresql://<user>:<encoded-password>@<postgres-private-host>:5432/flow_steward
POSTGRES_HOST=<postgres-private-host>
POSTGRES_PORT=5432
POSTGRES_DB=flow_steward
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<password>
RABBITMQ_URL=amqp://<user>:<encoded-password>@<rabbitmq-private-host>:5672/flow
RABBITMQ_HOST=<rabbitmq-private-host>
RABBITMQ_PORT=5672
FS_PUBLIC_BASE_URL=https://<public-hostname>
ARTIFACT_STORAGE_BACKEND=local_fs
PORT=8080
FS_RUNTIME_HTTP_PORT=8080
FS_WORKER_PROCESSES=2
FS_COMPACT_WAIT_FOR_DEPENDENCIES=1
```

The image already sets `FS_DEPLOYMENT_PROFILE=compact`. Its provider entrypoint
can derive `FS_DB_DSN` from `DATABASE_URL` or PostgreSQL components, and derive
`RABBITMQ_URL` from broker components. Explicit URLs above avoid relying on a
provider's automatic variable naming. The wait setting delays bootstrap until
the database and broker answer; still start those dependencies first.

Route public HTTP to port 8080 with provider-managed HTTPS. Set `/health/ready`
as the health check, allow the initial bootstrap time to finish, and configure
at least 180 seconds for graceful shutdown. Keep **exactly one Compact runtime**,
with no overlapping replacement, autoscaling, or sleep-on-idle behavior. Workers
also process background work when no HTTP requests arrive. Increase
`FS_WORKER_PROCESSES` by redeploying the same single runtime; do not add Compact
replicas.

Keep the image's default entrypoint. It establishes schema, seed, identity, and
persistent application keys before starting its supervised processes. `/data`
contains more than artifacts: it also holds extensions, runtime state, keys,
logs, and backups. Preserve it with PostgreSQL and RabbitMQ. A build or release
hook without the same `/data` volume is not an equivalent bootstrap environment.

## Railway

### Guided fresh-project installation

Use the [Railway installation guide](installation#railway-compact-in-dependency-order)
and [downloadable helper](/examples/railway/deploy-compact.sh). The current helper
handles sign-in and empty-project setup, starts PostgreSQL then RabbitMQ, and
connects Compact only after its dependencies are ready. It refuses a populated
project and is not an update or resume tool. Review its fixed image digests;
these provider release pins are distinct from a local source build.

```bash
bash deploy-compact.sh
```

An interrupted run can leave billable partial resources. Inspect and clean up
only that installation before retrying. The manual equivalent follows below.

### Current-candidate manual setup

Create three services in one project/environment using the shared requirements
above. Railway supports registry image services and durable volumes; use a
prebuilt image for this path. See [Railway services](https://docs.railway.com/services)
and [volumes](https://docs.railway.com/volumes).

1. Configure `postgres` and its volume before connecting the extended PostgreSQL
   image. Use the `PGDATA` subdirectory to avoid initializing into a nonempty
   volume root. Wait for database readiness.
2. Configure `rabbitmq` with its own password, `flow` virtual host, and volume.
   Connect its image and wait for the AMQP listener.
3. Create an empty `compact` service with `/data` and all runtime variables.
   Use `postgres.railway.internal` and `rabbitmq.railway.internal` for the
   private hosts when those are the service names.
4. Generate the public domain targeting port 8080; set `FS_PUBLIC_BASE_URL` to
   that HTTPS origin. Keep `PORT` and `FS_RUNTIME_HTTP_PORT` at 8080. Set the
   readiness path, one replica, Always restart, zero deployment overlap, and
   at least 180 seconds of draining time. Disable application sleeping.
5. Connect the intended immutable Compact image and wait for both provider
   deployment success and `/health/ready` to report `ready: true`.

Railway service references can keep secrets synchronized. For example, the
Compact value for `POSTGRES_PASSWORD` can be
`${{postgres.POSTGRES_PASSWORD}}`; its DSN can use the corresponding references
for user, password, and database. Keep referenced names consistent with the
services you created.

Use `railway ssh --service compact` from a linked project for a remote shell.
`railway run` executes on **your local machine** with injected variables; it is
not the container console. See the official [SSH](https://docs.railway.com/cli/ssh)
and [run](https://docs.railway.com/cli/run) references.

## Fly.io

There is no Fly deployment script or complete `fly.toml` in the checked
repositories. Configure three apps or equivalent isolated services manually:
extended PostgreSQL, RabbitMQ, and the Compact runtime. Keep their private
addresses and durable stores separate, then apply the shared settings above.

Create a volume for each service in the chosen region. Mount Compact's volume
at `/data`, route its HTTP service to internal port 8080, and configure
`/health/ready`. Fly volumes are local to a Machine and are not automatically
replicated. Keep a separate backup plan. See
[Fly Volumes](https://docs.fly.io/volumes/overview).

For the Compact app's operator-created `fly.toml`, set `kill_signal = "SIGTERM"`,
`kill_timeout = 180`, and disable automatic stopping in `[http_service]`. Keep
one Machine and no spare or overlapping runtime. These settings follow Fly's
[application configuration](https://docs.fly.io/reference/configuration).
Once the app configuration, volume, secrets, and healthy dependencies exist,
a prebuilt-image deployment has this form:

```bash
fly deploy --app <compact-app> \
  --image <registry>/<compact-image>@sha256:<digest> \
  --ha=false --strategy immediate
```

`--ha=false` suppresses spare Machines; it does not remove already-created
replicas. Verify the resulting count is one. Fly supports prebuilt images and
remote builds; `--local-only` is specifically the local-Docker build mode.
See [fly deploy](https://docs.fly.io/flyctl/cmd/fly_deploy).

The upstream Fly.io guide records its dated installer acceptance. This manual
recipe does not independently repeat that acceptance for the source SHA above.
Validate the image's architecture, private networking, volume ownership,
shutdown, and restart persistence before using production data. Do not run
volume-dependent bootstrap in a Fly release command: release Machines do not
mount application volumes.

## Render

Use the [Render Blueprint guide](render) for its public three-service configuration.
For a manual equivalent, configure an
image-backed **web service** for Compact and image-backed **private services**
for PostgreSQL and RabbitMQ in the same private-network region. Render supports
prebuilt images by digest. See
[Deploy a Prebuilt Docker Image](https://render.com/docs/deploying-an-image).

Give each service its own persistent disk at the shared contract's mount path.
Configure the database and broker first, then set Compact's private hostnames,
secrets, HTTPS origin, port 8080, and `/health/ready`. Use a plan that provides
the required persistent disks and continuously running services. Render's
managed PostgreSQL extension list includes pgvector but does not list Apache
AGE; do not assume it can replace the extended PostgreSQL image. See
[Render PostgreSQL extensions](https://render.com/docs/postgresql-extensions).

Keep the runtime's default start command. A disk is available only to its owning
service at runtime; it is unavailable in a build, pre-deploy command, or one-off
job. Use the running service shell for commands needing `/data`. An attached
disk restricts a service to one instance and stops the old instance before
replacement. See [Persistent Disks](https://render.com/docs/disks).

Set `maxShutdownDelaySeconds` to at least 180 through your Blueprint or the
Render API. Render's default 30-second shutdown delay is shorter than Compact's
required grace period. See [Render deploys](https://render.com/docs/deploys).
Complete the verification below; this documentation review did not run a Render
deployment or restore.

## DigitalOcean Droplets

A Droplet is the Docker-host installation path. Use the [recorded Droplet installation checks](installation#digitalocean-droplet)
and the standard Docker-host installer. This section does not describe
DigitalOcean App Platform.

Create a suitable Linux Droplet with SSH access and durable capacity for images,
PostgreSQL, RabbitMQ, application files, and backups. DigitalOcean's optional
[Docker Marketplace image](https://docs.digitalocean.com/products/marketplace/catalog/docker/)
preinstalls Docker tooling; verify Docker Engine and **Compose v2** even when
using it. For a plain Linux image, install them using the Docker links in
[Installation](installation#docker-host-prerequisites).

Connect over SSH, prepare a non-root deployment account with Docker access,
and run the repository checkout sequence and `./install.sh` on the Droplet.
Follow the [Installer Walkthrough](installer-walkthrough). Both Compact and
Scalable are available. Local Docker or the DigitalOcean CLI is unnecessary
when managing the host through SSH and the provider dashboard.

Point DNS at the Droplet before selecting bundled ACME; its HTTP-01 challenge
needs reachable port 80, with HTTPS on 443. If an existing proxy owns TLS,
select that ingress mode and configure its forwarding separately. Publish only
the required public ingress, keeping database and broker services private.
Arrange off-host backups in addition to retaining Docker volumes on the Droplet.

## First administrator and verification

On a managed provider, read Compact's startup log for the line beginning
`Flow Steward has no administrator yet`. Open its complete
`/bootstrap#setup-token=...` URL privately within 15 minutes. A bare `/bootstrap`
page asks for the token because it cannot reveal the secret. If the link expires
before an administrator exists, restart only Compact and use the fresh log link.
If logs say an earlier link is still valid, use that earlier link or wait for
its expiry before restarting. Preserve all backing services and volumes. The checkout installer has a separate
setup-link handoff described in the [Installer Walkthrough](installer-walkthrough).

Current Compact images contain an in-container management command:

```bash
flow-steward --help
flow-steward status
flow-steward users list
flow-steward database status
```

Run it in the provider's live container shell with the existing `/data` mount.
It loads saved runtime settings without requiring you to extract secret files.
The historical [Railway admin wrapper](/examples/railway/admin-compact.sh)
(`static/examples/railway/admin-compact.sh`) is a fallback for older images:
`bash admin-compact.sh users list`. It requires Railway CLI and SSH access;
optional selectors are `FS_RAILWAY_SERVICE` (default `compact`),
`FS_RAILWAY_PROJECT`, `FS_RAILWAY_ENVIRONMENT`, and `FS_RAILWAY_IDENTITY_FILE`.

Host installation, Compose stack/config management, and Docker quality commands
are unavailable in this provider shell. `doctor` can report configuration but
cannot certify the Docker installation checks it cannot run. Use provider tools
for container replacement and image changes; do not apply a checkout upgrade
recipe to a provider deployment.

Verify public `/health`, `/health/ready`, first-admin login, and a small
workflow. Restart Compact and confirm that the same account and data remain.
Before relying on the deployment, test backup and recovery for PostgreSQL,
RabbitMQ, `/data`, and operator-managed secrets. A database dump alone is
incomplete. The existing `db_restore.sh` depends on Compose and repairs the AGE
graph after restore; there is **no supported Flow Steward provider restore
command**. Provider recovery still needs its own validated procedure; read
[Backups And Restore](backups-and-restore) before committing valuable data.
