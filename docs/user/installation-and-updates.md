---
sidebar_position: 3
title: Installation And Updates
description: Install, verify, manage, and update a self-hosted Flow Steward stack.
---

# Installation And Updates

This guide follows the current source contracts. The documentation and repository
are being prepared for their first public release; the planned documentation
origin is https://flowsteward.org. A local build does not establish live deployment
verification.

Use this page for a checkout-based Docker installation. For prebuilt images on
Railway, Fly.io, or Render, use [Platform Deployment](../deploy/platforms);
provider lifecycle operations differ and no local Docker daemon is required.
DigitalOcean Droplets follow the Docker-host path here. Start with the
[Installer Walkthrough](../deploy/installer-walkthrough) for a first installation.

Use this page if you operate a Flow Steward stack. Developers changing the
application should use [Local Development](../developer/local-development).

## Understand the two command surfaces

- `./install.sh` installs, resumes, starts stopped installed services, and
  reconciles installer-built images with intentionally updated source. It also
  supports profile switching and Compact worker-process changes. It has no
  subcommands.
- `./flow-steward` manages an installed stack: status, diagnostics,
  configuration, start/stop/restart, backup, maintenance, and upgrades.

Commands such as `./install.sh configure`, `./install.sh up`, and
`./install.sh doctor` are obsolete and fail on this revision.

## Prerequisites

These requirements apply on the Docker host, including a remote VPS or Droplet.

- A Linux, macOS or Windows host with a running Docker engine using Linux
  containers and Docker Compose v2. On Windows, use Git Bash or WSL for the shell
  entrypoints; a PowerShell/cmd prompt does not directly run `./install.sh`.
- A source checkout or release bundle for the intended candidate.
- Free local ports and durable storage appropriate to the selected topology.
- For `external_s3`, an existing bucket endpoint and an owner-only JSON file
  containing `access_key` and `secret_key`.
- For provided TLS, an operator-owned certificate chain and private key.

Install Docker **before** running Flow Steward. Use the official
[Docker Engine guide](https://docs.docker.com/engine/install/) on Linux servers
([Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/)), plus the
[Compose plugin](https://docs.docker.com/compose/install/linux/). On Mac, Windows
or Linux desktops, [Docker Desktop](https://docs.docker.com/desktop/) includes Compose.
Flow Steward does not install these prerequisites automatically.

Run these checks as the deployment user; all must succeed:

```bash
docker --version
docker compose version
docker info
```

If the first two fail, install the missing component. If `docker info` fails,
start Docker or correct socket access. For Linux permission setup, follow the
[official post-install guide](https://docs.docker.com/engine/install/linux-postinstall/).
This prerequisite applies to both deployment profiles.

Do not run the installer as root. A host Python runtime is not required for the
normal Docker-based installer path. Core installation does **not** require model
provider credentials; AI features remain unavailable until an administrator
configures a supported account-scoped provider profile.

## Install or resume

Run from the application repository:

```bash
./install.sh
```

Plain interaction is the default for both launchers. Use `--tui` only if you want
the full-screen interface; `--plain` explicitly forces line-oriented interaction.
A fresh checkout install uses local source, not a GitHub Release lookup.

The [Installer Walkthrough](../deploy/installer-walkthrough) explains the guided
sequence and each choice. The installer asks for:

- `production` (default) or `development` environment;
- `compact` (default) or `scalable` deployment profile;
- ingress owner: bundled/external Traefik, external proxy, or hosting platform;
- `local_fs`, `bundled`, or `external_s3` artifact storage;
- a TLS mode compatible with the ingress/profile; see [Installer Reference](../reference/installer);
- public host and port, plus mode-specific file or backend details.

Use your public domain or IP during installation, not just afterward. The
installer derives `FS_PUBLIC_BASE_URL` from these supported fields. For local
use without a domain, keep `localhost`.

For a non-interactive install, review every supplied value first and confirm the
plan explicitly:

```bash
./install.sh \
  --non-interactive \
  --confirm \
  --environment production \
  --deployment-profile compact \
  --ingress-mode bundled_traefik \
  --file-storage bundled \
  --tls-mode self_signed \
  --public-host flow.example.test \
  --public-port 8099
```

The installer journals verified postconditions. Rerunning `./install.sh` resumes
a recoverable installation and skips a step only when its postcondition still
holds. A signal-interrupted initial install removes only runtime resources
created by that operation; it does not delete external S3 data or provided TLS
material. An ambiguous pre-journal stack is preserved and refused rather than
adopted automatically.

## Verify the result

After the installer returns successfully:

```bash
./flow-steward status
./flow-steward doctor
./flow-steward database status
```

`stack status` and the staged `config` commands are retained Scalable CLI
operations; do not assume they are available on Compact. Use the profile-aware
[CLI Reference](../reference/cli).

`status` is the concise core-readiness view. `doctor` separates core blockers
from optional-feature warnings, so missing model credentials do not make the
core installation fail.

The installer verifies the canonical schema baseline and seed. Do not run an
old `init-db` command. If `database status` reports unapplied post-1.0
migrations, follow the applicable release procedure and run the supported
`database upgrade` command only with maintenance and backup prerequisites.

## Create the first administrator

Open the bootstrap URL printed by the installer. On a local default install it
is normally:

```bash
open https://localhost:8099
```

For a non-loopback install, the installer can print an owner-only setup-token
path and a bootstrap URL. Keep the token out of query strings and logs. Treat the printed setup link as a secret: it includes a token in the URL fragment.
If its 60-minute window expires before first-user creation, rerun `./install.sh`
for a new link on either profile. Scalable also supports:

```bash
./flow-steward users issue-bootstrap-token --confirm
```

The web bootstrap closes after the first administrator exists. Provider
credentials are configured afterward and are not part of core bootstrap.

## Manage an installed Scalable stack

```bash
./flow-steward stack start --confirm
./flow-steward stack stop --confirm
./flow-steward stack restart --confirm
./flow-steward stack rebuild --confirm
./flow-steward stack logs --service fs-app --tail 200
```

These commands preserve volumes. `restart` does not apply a pending
configuration; use `config set`, review the staged diff, and then `config apply`
for a supported configuration change:

```bash
./flow-steward config show
./flow-steward config set --public-host flow.example.test --public-port 443
./flow-steward config validate
./flow-steward config apply --confirm
```

## Update a checkout installation

For images built and owned by the installer, update the checkout to the intended
reviewed tag or commit, pull its Git LFS files, and rerun the installer:

```bash
git fetch
git checkout <reviewed-tag-or-commit>
git lfs pull
./install.sh
./flow-steward status
./flow-steward doctor
```

The installer compares source, recorded images, and running containers. If its
own images are older, it rebuilds them and checks schema compatibility before
restarting the runtime. It preserves installed configuration, secrets, TLS,
and persistent data. A code-only update can complete without a database
migration. Operator-pinned images are preserved, not silently rebuilt.

If the schema check stops with `release_migration_required`, the previous runtime
remains running. Review the release instructions, enable maintenance, create and
verify a backup, then run `./flow-steward database upgrade --maintenance-confirmed --confirm`
before retrying the supported release/installer update. Do not run a raw Compose
start in that interval: the durable environment may already name the new image
while the running image is still the old one. Keep maintenance enabled until
post-update verification passes. See [Upgrade Reference](../reference/upgrade)
for the complete procedure and recovery boundaries.

| Installer schema error | Exit | Meaning and next step |
|---|---|---|
| `release_migration_required` | `8` | Forward migration is required; back up, enable maintenance, apply the supported database upgrade, then retry the update. |
| `database_newer_than_release` | `8` | The selected older release does not know migrations already applied. Return to the newer release, or rehearse restoration of a matching pre-migration backup before rolling back. Database upgrade cannot reverse this condition. |
| `schema_baseline_failed` | `8` | Generic baseline-check failure remains possible. Read the actual cause; do not assume every occurrence means a pending migration. |

A plain rerun on the same revision verifies the installation and can restart
stopped services. It is not a general configuration editor. Compact worker
capacity is an explicit supported change:

```bash
./install.sh --worker-processes 4
```

A host installation can switch profiles with
`./install.sh --deployment-profile scalable` or `compact`; follow the
[Installer Reference](../reference/installer) and make a complete recoverable
backup first. Provider image deployments have no profile-switch path.

## Upgrade to an official release

Check official stable GitHub releases separately from installation. Enable
maintenance explicitly before upgrade preflight; upgrade neither enables
maintenance nor makes a database backup automatically. It does not reopen work.
Checkout installation records source origin, not an official published version.
The reviewed upgrade explicitly transitions that installation to the selected
official release. See [Upgrade Reference](../reference/upgrade) for this boundary
and private-repository credentials.

```bash
./flow-steward release info
./flow-steward release check
./flow-steward backup create
./flow-steward backup verify backups/<file>.dump.enc
./flow-steward maintenance enable --confirm
./flow-steward release upgrade --dry-run
./flow-steward release upgrade --target-version <version> --confirm
./flow-steward maintenance status
./flow-steward doctor
./flow-steward maintenance disable --confirm
```

The shared release contract verifies the exact tag commit and complete
immutable image set. Do not substitute another release or floating images. Keep maintenance enabled after either a success or failure
until database, storage, queues, runtime health, and preservation checks are
green.

Installation, upgrade, and restore have not been executed as part of this
documentation pass. Treat them as externally unverified until the final
candidate completes a disposable-environment walkthrough.

## Related pages

- [Installer Walkthrough](../deploy/installer-walkthrough)
- [Platform Deployment](../deploy/platforms)
- [Installer Reference](../reference/installer)
- [Upgrade Reference](../reference/upgrade)
- [Deployment Checklist](../deploy/deployment-checklist)
- [Backups And Restore](../deploy/backups-and-restore)
- [Deployment Troubleshooting](../deploy/troubleshooting)
