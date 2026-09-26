---
sidebar_position: 1
title: Installation
description: Install Flow Steward on a VPS, Railway, Render, Elestio, or Fly.io.
---

# Installation

On a VPS, the normal path is to clone the repository, run `./install.sh`, answer
the guided questions, and wait for readiness. Production installation downloads
verified images from an official release and creates its Docker services.
Railway uses a published Compact image
and three Railway services; the downloadable fresh-project example stages them
in dependency order.

| Destination | Application layout | Entry point |
| --- | --- | --- |
| VPS with Docker | Compact (default) or Scalable | `./install.sh` in a Git checkout |
| Railway | One Compact runtime, separate PostgreSQL and RabbitMQ | Railway project settings and a published image |
| Render | One Compact runtime, separate PostgreSQL and RabbitMQ | [One public Blueprint](render) that pulls the Compact image |
| Elestio | Compact, PostgreSQL and RabbitMQ on one dedicated VM | [Compose template](elestio) using the same public images |
| Fly.io | One Compact Machine, separate PostgreSQL and RabbitMQ Machines | [Three TOML examples](#flyio-compact-with-persistent-volumes) and sequential deployment commands |

The Railway, Render, Elestio and Fly.io guides cover Compact. For Scalable, use the VPS
installation path until a separate hosted deployment has been tested and
documented.

## VPS: guided installation

You need access to the Flow Steward Git repository, Git LFS, Docker Engine, and
the Docker Compose v2 plugin. Run Docker as a regular deployment user, not
`root`. On a Linux VPS with systemd, the user also needs sudo to set up automatic
startup; the installer requests it after the runtime is ready. The host does not
need Python or Node for the normal installation path;
the launcher runs product commands in Linux containers. Allow enough disk space
for the images and persistent data. For a public HTTPS site, prepare a DNS name
pointing at the VPS and decide whether Flow Steward or an existing reverse proxy
will own TLS.

```bash
git clone <flow-steward-repository-url> flow-steward
cd flow-steward
git lfs pull
./install.sh
```

Use a full clone, without `--depth`: the installer resolves an official release
and switches to its exact Git tag. Production requires an available stable
GitHub Release and a complete set of verified product images; it does not fall
back to building application images from an arbitrary checkout. If the repository is private, configure
your normal Git authentication before cloning. The installer does not provision
GitHub access for you.

Select **Production**. Accept **Compact** for one runtime container, or select
**Scalable** when app, workers, MCP, and control services need separate
containers. The wizard also asks who owns ingress and TLS, the public hostname,
artifact storage, and worker capacity. Select **Local filesystem** explicitly
for local persistent storage; choosing bundled storage adds its own SeaweedFS
service.
For a first local trial, the default local certificate and `localhost:8099`
are enough. For a public VPS, choose the TLS/ingress option that matches the
actual network: bundled ACME with working DNS and ports 80/443, or the existing
proxy/Traefik option and its requested backend/network details. Do not accept
the localhost default for a public domain.

For a temporary test by IP, select **Bundled Traefik**, **Hostname generated
certificate**, and enter the server IP in **Public host**. Set an unused
**Public port**, for example `18599`. Expand **Show advanced** to set an unused
**Plain-HTTP redirect port**, for example `18598`. Open
`https://<server-ip>:18599`. The generated certificate is self-signed, so a
browser will warn about its trust; a production public site should use a DNS
name and a trusted certificate. Database, broker, and storage ports remain
private to Docker.

The normal interactive form lets you edit these fields. The line-oriented
`--plain` mode currently prompts for choices but keeps defaults for optional
text and numeric fields. Supply the address and ports explicitly in that mode:

```bash
./install.sh --plain --public-host <server-ip> \
  --public-port 18599 --redirect-http-port 18598
```

When testing alongside an existing installation, use a separate clone,
unused ports, and a unique Compose project name on the first invocation:
`FS_COMPOSE_PROJECT_NAME=fs-demo-test ./install.sh`. The installer records that
identity for subsequent commands in that clone. Do not reuse a working
installation's directory, project name, or persistent data.

The first image download and infrastructure preparation can take time. Leave the installer running until it reports
completion; rerun the same `./install.sh` after a recoverable interruption.
Then check the result:

```bash
./flow-steward status
./flow-steward doctor
```

Open the URL printed by the installer and create the first administrator.
For a non-local address, the installer prints the location of an owner-only
setup token and a bootstrap URL. Keep the token private. If it expires while
no administrator exists, rerun `./install.sh` to issue a new link. AI provider
credentials are optional at installation and can be configured after login.

Run administrative commands from the clone; the `./flow-steward` launcher
selects the installed containers and their configuration:

```bash
./flow-steward users list
./flow-steward projects list
./flow-steward jobs list
./flow-steward users create --help
./flow-steward status
```

`stack status` and `stack restart` are Scalable commands. Compact does not retain
the CLI container those commands manage; use `status` and `doctor` for its
readiness, and the installer for installation recovery.

### Linux VPS automatic startup

For Compact on native Linux with systemd and the system Docker daemon, successful installation
configures `flow-steward-<compose-project>.service`. The installer prints its exact
name. This service starts the installed containers after a server or Docker
restart, waiting for the database and broker health checks first. It does not
download images, rebuild, or rerun the installation wizard during boot.

The systemd service is a one-time startup action, so `active (exited)` is normal;
use `./flow-steward status` and `doctor` to check application readiness. Docker
still owns failure retries, including Compact's finite retry policy. This avoids
two supervisors continually restarting the same containers.

Use the service name printed by your installer:

```bash
sudo systemctl status flow-steward-<compose-project>.service
# Stop this installation and keep it stopped across reboots:
sudo systemctl disable --now flow-steward-<compose-project>.service
# Restore automatic startup and start the installation:
sudo systemctl enable --now flow-steward-<compose-project>.service
```

Rerunning the installer refreshes the recorded container IDs but preserves an
explicitly disabled service. That explicit installation starts the application
and restores stop control, but does not re-enable future automatic startup.
Stopping the service drains the application before stopping its database and
broker. If containers were deleted, rerun `./install.sh`;
the boot service refuses to silently recreate them. Keep the checkout,
configuration and volumes. Never delete volumes to recover a stopped service.

If system service setup fails because sudo is unavailable, the runtime may
already be running, but automatic startup is not configured. Have an administrator
provide the required sudo access and rerun the installer. On Mac, Windows,
rootless/remote Docker, or managed platforms, follow that platform's startup
settings; the installer reports that no host systemd service was configured.
Scalable retains its existing Docker restart policies. Switching from Compact to
Scalable removes the matching Compact startup service automatically.

The VPS installer link lasts **60 minutes**; the Compact provider startup link
described below lasts **15 minutes**. After a restart, verify that the same user
can still sign in. Email delivery and AI execution require their respective
provider settings; a successful installation does not configure those services.

The guided path does **not** currently configure your DNS, an external proxy,
or off-host backups. Those remain operator steps. The installer also requires
the repository and Git LFS content to be accessible from that host. Before
holding real data, verify backups and a restore procedure for your installation.

## Railway: Compact in dependency order

For a **new, empty Railway project**, download the
[Compact deployment example](/examples/railway/deploy-compact.sh). Install the
Railway CLI, `jq`, `openssl`, and `curl`, then run from a new directory:

```bash
railway login
railway init --name flow-steward
bash deploy-compact.sh
```

If you already created an empty project, use `railway link` instead of
`railway init`. The example refuses to modify a project that already has
services. It generates distinct PostgreSQL and RabbitMQ passwords, creates
the three services and their volumes before connecting images, waits for the
database and broker to become ready, and only then starts Compact. It pins the
2026-09-26 evaluated images, checks `/health/ready`, and prints the private
first-admin setup link from Compact's deploy logs. Open that link promptly;
it expires 15 minutes after Compact starts. Keep the downloaded file if you need
to review the exact commands;
it is a fresh-install example, not an upgrade tool. If a step fails, inspect
the named Railway services and their logs before deciding whether to remove
the partial installation and start with a new empty project.

Railway's older `railway.json` configures only one service and is deprecated;
it cannot enforce the PostgreSQL → RabbitMQ → Compact sequence. Railway's
[project-level IaC](https://docs.railway.com/infrastructure-as-code) can
describe the graph, but a staged installer still has to wait for the two
dependencies before enabling the app image.

### Manual sequence

Railway does not run this repository's Compose file. Create **three services in
one project and environment**, with private networking enabled. Start the
database first, then the broker, and only then connect the Compact image. Do
not attach an image to an empty Compact service before configuring its volume
and variables: Railway starts image-backed services immediately, so an early
boot can write incomplete state. Use immutable image digests from an evaluated
Flow Steward release, not a mutable `latest` tag.

### 1. PostgreSQL

Create an empty service named `postgres`. Attach a persistent Railway volume at
`/var/lib/postgresql/data`. Set these service variables before choosing the
image:

```text
PGDATA=/var/lib/postgresql/data/pgdata
POSTGRES_DB=flow_steward
POSTGRES_USER=flow_steward
POSTGRES_PASSWORD=<new strong random password>
```

`PGDATA` must be a subdirectory of the volume because a new Railway volume can
contain `lost+found`, which PostgreSQL refuses as its data directory. Use the
published **Flow Steward PostgreSQL 17 image with Apache AGE and pgvector**,
`ghcr.io/vasily-piksis/fs-postgres-extended@sha256:47a10afb648b55a29e0422f7944a5eb8f12f99f4fecfbb5a2af721fe42196ce8`
for the 2026-09-26 evaluated deployment.
Railway's standard managed PostgreSQL image does not supply the required AGE
extension. Wait until its logs say the database is ready to accept connections.
Keep port 5432 private.

### 2. RabbitMQ

Create an empty service named `rabbitmq`. Attach a persistent volume at
`/var/lib/rabbitmq` so queue data survives replacement. Set:

```text
RABBITMQ_DEFAULT_USER=flow_steward
RABBITMQ_DEFAULT_PASS=<different strong random password>
RABBITMQ_DEFAULT_VHOST=flow
```

Connect the 2026-09-26 evaluated RabbitMQ image
`rabbitmq@sha256:e582c0bc7766f3342496d8485efb5a1df782b5ce3886ad017e2eaae442311f69`.
Wait for the AMQP listener on port 5672 and keep it private; the management
port must not be published just to make the app work.

### 3. Compact runtime

Create an **empty** service named `compact`, attach a persistent volume at
`/data`, and generate a Railway public domain routed to container port `8080`.
Set the following variables before adding its image. The `${{...}}` strings
are Railway references to the two backing services; keep the service names
exactly as shown or adjust the references accordingly.

```text
FS_DB_DSN=postgresql://${{postgres.POSTGRES_USER}}:${{postgres.POSTGRES_PASSWORD}}@postgres.railway.internal:5432/${{postgres.POSTGRES_DB}}
RABBITMQ_URL=amqp://${{rabbitmq.RABBITMQ_DEFAULT_USER}}:${{rabbitmq.RABBITMQ_DEFAULT_PASS}}@rabbitmq.railway.internal:5672/flow
POSTGRES_HOST=postgres.railway.internal
POSTGRES_DB=${{postgres.POSTGRES_DB}}
POSTGRES_USER=${{postgres.POSTGRES_USER}}
POSTGRES_PASSWORD=${{postgres.POSTGRES_PASSWORD}}
RABBITMQ_HOST=rabbitmq.railway.internal
FS_PUBLIC_BASE_URL=https://<generated-railway-domain>
ARTIFACT_STORAGE_BACKEND=local_fs
PORT=8080
```

Configure one replica, health check `/health/ready`, **Always** restart, zero
deployment overlap, and at least 180 seconds of draining time. Compact is a
single-runtime profile; overlapping two live copies against the same database
and broker is unsupported. Finally connect the 2026-09-26 evaluated Compact
image
`ghcr.io/vasily-piksis/flow-steward-compact@sha256:e41f179da299904b02cd60cb8b50d73e20f7fcf9f384a5bbc8edd17c8bfcf214`
from source commit `367d5ff885a5b7557cdb0fb712fe754539fa4d09`.
Wait for Railway deployment status **Success** and HTTP readiness. A successful
image upload or a running PostgreSQL service alone does not prove the app is
ready.

The two `*_HOST` values are required even though the connection URLs already
contain hostnames: Compact checks dependency readiness through those separate
settings. Its LangGraph schema setup also builds a PostgreSQL URI from the
`POSTGRES_*` components, including the password. The default PostgreSQL
hostname, `pg-fs`, belongs to the Compose network and does not resolve inside
Railway.

The runtime initializes the empty database, generates its own long-lived app
secrets on `/data`, and logs a one-time first-admin URL. Open that URL within
15 minutes and create the administrator. If it expires while there is still no
administrator, restart the runtime to receive a new link. Do not copy the
token into tickets, screenshots, or a query string.

### First administrator and the Railway container

Opening the public `/bootstrap` page directly shows a **Setup token** field:
the public page cannot display the secret. Use the complete URL containing
`#setup-token=...` instead. The browser removes that fragment from the address
bar and submits the token with the form. The downloaded deployment example
prints this URL when Compact first becomes ready. If you configured Railway
manually, open **Compact → Deployments → current deployment → Deploy Logs** in
the Railway dashboard and find the line beginning `Flow Steward has no
administrator yet`. Copy the whole URL at the end of that line privately. The
link is issued at startup and lasts **15 minutes**, not an hour.

If the link has expired and no user has been created, restart **only the
Compact service** from its deployment menu, then read its fresh Deploy Logs.
Keep the PostgreSQL and RabbitMQ services and all three volumes in place. From
a local terminal linked to the Railway project, the equivalent commands are:

```bash
railway restart --service compact --yes
railway logs --service compact --lines 100 --filter 'Flow Steward has no administrator yet'
```

The restart mints another link while the user table is empty. If the logs say
`a setup link issued earlier is still valid`, read the earlier deployment's
log or wait until it expires before restarting. Do not use an old link after a
new one is issued. After you submit the form, sign in at `/login` with the new
administrator account.

Railway runs a **published Docker image**, not a Git checkout. Inside the
running Compact container the packaged application is under `/app`; `/data`
is the persistent volume, and `/project` points to `/data/projects` for user
projects. The service source in Railway therefore need not contain a visible
repository folder. You do **not** need a shell or a Flow Steward CLI command
to create the first administrator. If you need to inspect the running container,
register an SSH key with Railway and run `railway ssh --service compact`
from a linked local terminal; `pwd` there returns `/app`. `railway run` runs a
command on your **local machine** with Railway variables and is not a shell in
the deployed container. On Compact, `flow-steward users issue-bootstrap-token`
is installer-owned and is not the recovery command; use the restart and log
procedure above.

### Administrative commands on Railway

Open the **Compact service console** in Railway. You start inside the running
container; no repository checkout or local environment variables are needed.
The application is under `/app`, but you can run its management command from
any directory:

```bash
flow-steward --help
flow-steward users list
flow-steward users create --role admin
flow-steward projects list
flow-steward jobs list
flow-steward status
flow-steward users create --help
```

`users create --role admin` opens an interactive form in the service terminal;
enter the email and password there. It is an alternative to the one-time setup
link when no administrator exists yet. The built-in command obtains Compact's
saved runtime settings for that command alone, then uses its container-aware
management adapters. Do not read or copy
`/data/state/runtime-secrets.json` yourself. If `flow-steward` is not found,
the deployed image predates this command: update the Compact image. Until then,
the [legacy Railway command wrapper](/examples/railway/admin-compact.sh) can
run the packaged CLI over Railway SSH from your computer. That fallback needs
Railway CLI and a registered SSH key; `railway ssh --service compact` opens the
same running container from a locally linked Railway project.

The command is part of the Compact image, so its invocation is the same in a
container console on another provider. Each provider's deployment, persistent
storage, and console access still need their own tested installation guide.

For user changes, inspect the command-specific help first. For example,
`users create` and `users set-password` accept `--password-stdin`, so do not
put passwords on the command line. Creating the initial administrator in the
browser using the one-time setup link remains the simplest path.

Compact on Railway has
no Docker daemon, Compose installation, retained `fs-cli`, `fs-audit`, or
`fs-test-runner` services. Host installation, stack/config management, quality
and test commands that require those services are therefore **not** available
through this runtime shell. The built-in command explains this for unsupported
operations. Use the Railway dashboard/CLI for deployment operations and the
supported product/Compact maintenance commands for app administration.

The 2026-09-26 fresh-project check used the downloadable example and this exact
image: dependency startup, readiness, first administrator, browser sign-in,
`users list`, `projects list`, `jobs list`, and `status` passed. After restarting
Compact, the same administrator and existing session still worked, and a file
on `/data` and the saved runtime keys retained their checksums. This was an
installation check, not a test of every CLI command or AI workflow.

Verify the public `/health` and `/health/ready` endpoints, the sign-in page,
an authenticated sign-in, and one small workflow. Restart Compact once and
confirm the same login and data still work; this checks that the `/data` volume
and generated keys survived. Before holding valuable data, arrange backups of
**all three** persistent stores: PostgreSQL, RabbitMQ, and `/data`. The
Compose-based Flow Steward restore command is not a Railway restore procedure.

The downloadable example automates the passwords, services, volumes, domain,
variables, and dependency sequence for a fresh project. Manual setup still
requires these steps. `PORT=8080` must match the Compact listener because
Railway uses it for its health check; the domain target port alone does not
configure that check. A prebuilt image is required: Railway's native builder
has rejected the source Dockerfile's BuildKit bind mounts in testing. The
Railway CLI and its helper tools are separate from the VPS installer.

## Fly.io: Compact with persistent volumes

Use the same public Compact, extension-enabled PostgreSQL and RabbitMQ images
as the Render and Elestio examples. Fly uses one application per image, so
this installation has three TOMLs:

- [Compact configuration](/examples/fly/compact.toml)
- [PostgreSQL configuration](/examples/fly/postgres.toml)
- [RabbitMQ configuration](/examples/fly/rabbitmq.toml)
- [Complete installation commands](/examples/fly/installation.txt)

The same files are in the public
[deployment configuration repository](https://github.com/Flow-Steward/flow-steward-deploy/tree/main/fly).
They pull pinned images; they do not build a separate Fly-specific image.

Install [Fly CLI](https://fly.io/docs/flyctl/install/) and sign in with
`fly auth login`. A paid account is needed for a persistent installation:
the trial stops each Machine after five minutes. Choose one organization,
one region and a globally unique app-name prefix. Replace `your-fs-demo`
in all three files, including private hostnames and the public URL.

Follow the supplied commands to create three apps and volumes, import
generated passwords through stdin, and allocate public IPs only for Compact.
Start PostgreSQL first and verify `pg_isready`; start RabbitMQ second and
verify `rabbitmq-diagnostics -q ping`; then deploy Compact. Keep
`--ha=false`: these are single-instance stores, without database or broker
replication. Compact also waits for its dependencies before initialization.

The example uses 2 performance CPUs / 4 GB RAM for Compact, 1 shared CPU / 2 GB for each
dependency, and 10 GB / 10 GB / 1 GB volumes. These are tested sizes, not a
minimum requirement. Review Fly's current estimate. Auto-stop is disabled
because workers must run without web traffic; this means ongoing compute
charges. PostgreSQL and RabbitMQ stay on the organization's private network.

During testing, 2 shared CPUs started the fresh installation, but a restart
did not become ready within ten minutes after CPU burst credits were spent.
Linux reported about 76% CPU steal time. Changing only Compact to performance
CPUs, keeping the same image, memory and volume, restored readiness in about
2–3 minutes. The template therefore uses performance CPUs for Compact; its
price differs from the shared-CPU plans. See
[Fly's CPU performance explanation](https://fly.io/docs/machines/cpu-performance/).

Wait for public `/health/ready` to return HTTP 200. Initial role startup can
take several minutes after Fly reports a Machine as `started`. Read Compact's
logs for the private first-administrator URL; it expires after 15 minutes.
Alternatively, create the first administrator inside the existing Machine:

```bash
fly ssh console -a <prefix>-compact --pty -C 'flow-steward users create --role admin'
```

Enter the email and password interactively, then open
`https://<prefix>-compact.fly.dev` and sign in. Administrative commands are
already on `PATH`:

```bash
fly ssh console -a <prefix>-compact -C 'flow-steward --help'
fly ssh console -a <prefix>-compact -C 'flow-steward users list'
fly ssh console -a <prefix>-compact -C 'flow-steward status'
fly ssh console -a <prefix>-compact -C 'flow-steward doctor'
```

Use `fly ssh console`, which connects to the running installation.
`fly console` creates a separate temporary Machine. The application is under
`/app`, persistent files are under `/data`, and no Git checkout or manual
database-secret exports are needed for administration. As on Railway,
commands that require host Docker/Compose or quality containers are not
available in this runtime shell.

Restart with `fly apps restart <prefix>-compact`, retaining all volumes.
This interrupts availability. The TOML specifies SIGTERM and time to drain;
keep dependencies running during shutdown. Do not use force-stop. The
`fly machine restart --time 180` invocation was rejected by the Machines
API during testing, so use the tested app restart command.

Before storing valuable data, arrange and test backups of PostgreSQL,
RabbitMQ and `/data`. These files do not configure high availability or
certify backup/restore or AI-provider execution. Remove disposable test apps
and their volumes when finished; merely stopping Machines retains storage.

## Other providers

Compact's provider contract is not Railway-specific: it requires persistent
`/data`, compatible PostgreSQL 17 with AGE/pgvector, RabbitMQ, a public HTTP
route, and graceful shutdown. Do not treat the Railway walkthrough as proof
that another provider has been tested. Verify each provider's volumes, network,
startup ordering, health checks, and backup/restore path independently.
