---
sidebar_position: 5
title: Installer Reference
description: Exact installation options, defaults, visibility, and resume behavior for the reviewed application source.
---

# Installer Reference

For help choosing each answer, use [Answer the Installer Questions](../deploy/installer-walkthrough).
This reference is checked against application revision `750d4a7d073591dad067fb5cefe937d1f88a9fc4`
on main on 2026-11-03; this does not establish release publication. The field contract is
`core/application/installer/spec.py`; the private adapter is
`core/entrypoints/cli/installer.py`.

## Command boundary and prerequisites

```bash
./install.sh
./install.sh --plain
./install.sh --non-interactive --confirm [options]
```

The installer has no public subcommands. Post-install management uses
`./flow-steward`; see [CLI Reference](cli). Both Compact and Scalable checkout
installs require an already installed, running local Docker Engine/Desktop with
Linux containers and Compose v2. Verify `docker --version`, `docker compose
version`, and `docker info`. Flow Steward does not install Docker automatically.
See [Getting Started](../user/getting-started) for setup links.

The normal launcher builds a pinned installer image, mounts the checkout and
local Docker socket, mounts explicitly supplied external input files read-only,
and runs the private controller. A remote Docker endpoint is unsupported.
Use `FS_INSTALLER_USE_HOST_PYTHON=1` only as a local-development fallback.
The checkout must be a Git checkout with a resolvable revision; Git LFS is not
used. The installer refuses to run as root (exit 4) and refuses subcommands
such as `./install.sh up` (exit 2). The host preflight accepts only amd64
(`x86_64`) and arm64 (`aarch64`) hosts (`unsupported_architecture` otherwise)
and rejects less than 4 GiB free space (`insufficient_disk_space`); that minimum
is not a production sizing recommendation. Linux servers, Docker Desktop on
macOS, and Windows through WSL or Git Bash are the supported launch
environments.

For a fresh Production installation, a clean checkout exactly at its
`v<VERSION>` tag selects official product images only after verifying the
published stable release, matching commit and image set. Failure to retrieve or
verify that release stops with `release_images_unavailable`; it does not fall
back to a source build. Other checkouts build product images from source.
Resumed source installations keep their source-build mode; recorded official
installations retain their official release identity. The installer announces
which mode it selected. Availability of a particular published release or
registry image was not verified for this reference.

## Global options

| Option | Meaning |
|---|---|
| `--json` | Emit one JSON document and do not prompt (implies `--non-interactive`). Fresh installation still needs `--confirm`. The live setup link is printed separately to stderr. |
| `--plain` | Use line-oriented interaction, also the default without `--tui`. |
| `--tui` | Opt into the full-screen form; advanced fields are behind **Show advanced**. |
| `--no-color` | Disable color. |
| `--verbose` | Request redacted technical output; ordinary non-JSON installation also streams progress/technical output. |
| `--non-interactive` | Never prompt; every field not given as an option takes its default. A fresh install requires `--confirm`. Without a terminal on stdin the installer never prompts either. |
| `--confirm` | Confirm the fresh-install plan. |
| `-h`, `--help` | Show launcher/private installer help. |

Plain mode uses numbered choices and asks visible advanced fields directly,
except the command-line-only `--setting` input described below.
Command-line values skip their corresponding plain questions. Review is
**Review pending change:** followed by **Apply this change?**, default No.
Conditional visibility controls questions, not whether incompatible CLI values
are valid; model validation enforces the combinations below.

## Installation fields

“Always” means no field visibility condition. “Advanced” applies to the
full-screen form; it does not hide the question in plain mode, except for
**Host settings**, which plain mode never asks.

| Exact label | Option | Displayed default / values | Visible when |
|---|---|---|---|
| Environment | `--environment` | `production` (Production); `development` (Development) | Always |
| Deployment profile | `--deployment-profile` | `compact` (Compact single-runtime deployment); `scalable` (Scalable multi-container runtime) | Always |
| Compact runtime HTTP port | `--runtime-http-port` | `8080` | Compact; advanced |
| Ingress owner | `--ingress-mode` | `bundled_traefik` (Bundled Traefik); `external_traefik` (Existing Traefik); `external_proxy` (Existing reverse proxy); `platform` (Hosting platform ingress) | Always |
| Compact worker processes | `--worker-processes` | `2` | Compact |
| File storage | `--file-storage` | `bundled` (Bundled self-hosted storage); also `local_fs` (Local persistent filesystem), `external_s3` (External S3-compatible storage) | Always |
| S3 endpoint | `--s3-endpoint` | No default; required | External S3 |
| S3 bucket | `--s3-bucket` | `flow-steward-artifacts` | External S3 |
| S3 region | `--s3-region` | `us-east-1` | External S3 |
| S3 credentials file | `--s3-credentials-path` | No default; required; private JSON input path | External S3 |
| Allow insecure S3 HTTP | `--allow-insecure-s3-http` | False | External S3 |
| Network and TLS | `--tls-mode` | `local`; full labels/pairs below | Always |
| Public host (domain or IP) | `--public-host` | `localhost` | Always |
| Public port | `--public-port` | `8099` | Always |
| Plain-HTTP redirect port | `--redirect-http-port` | `8080` | Bundled Traefik; advanced |
| Host settings | `--setting` | No overrides by default; `NAME=VALUE` assignments | Advanced; never asked in plain mode |
| Reverse-proxy backend host | `--reverse-proxy-backend-host` | `127.0.0.1`; validator requires this exact value | `reverse_proxy` TLS |
| Reverse-proxy backend port | `--reverse-proxy-backend-port` | `18099` | `reverse_proxy` TLS |
| Reverse-proxy MCP port | `--reverse-proxy-mcp-port` | `18100`; separate MCP host backend is used by Scalable | Existing reverse proxy; advanced |
| Proxy placement | `--proxy-placement` | `host` (Host); `docker` (Docker network) | Existing reverse proxy |
| Proxy kind | `--proxy-kind` | `nginx` (Nginx); `apache` (Apache) | Existing reverse proxy |
| Trusted proxy CIDRs | `--proxy-trusted-ips` | `127.0.0.1/32,::1/128`; comma-separated immediate peers | Always; advanced |
| Existing Traefik network | `--traefik-network` | No default; required for existing Traefik | Existing Traefik |
| Traefik HTTPS entrypoint | `--traefik-https-entrypoint` | `websecure` | Existing Traefik; advanced |
| Traefik HTTP entrypoint | `--traefik-http-entrypoint` | `web`; empty value omits the optional HTTP redirect overlay | Existing Traefik; advanced |
| Traefik certificate resolver | `--traefik-cert-resolver` | No default; required for `external_resolver` | `external_resolver` TLS |
| Existing proxy network | `--proxy-network` | No default; required for Docker existing proxy | `proxy_placement=docker` |
| ACME contact | `--acme-contact` | No default; required for ACME | `acme` TLS |
| ACME directory URL | `--acme-directory-url` | No default; required for ACME | `acme` TLS; advanced |
| Extension installer origin | `--extension-installer-origin` | `http://fs-extension-installer:8099` | Always; advanced |
| Certificate path | `--certificate-path` | `.ssl/cert.pem` | Always; advanced |
| Private key path | `--private-key-path` | `.ssl/key.pem` | Always; advanced |

`--setting 'NAME=VALUE,OTHER_NAME=VALUE'` accepts only non-secret host settings
marked operator-settable by the environment manifest. A comma starts another
assignment only when followed by an uppercase `NAME=`; other commas remain in
the value. Use an empty value (`--setting NAME=`) to reset a setting to its
environment-specific default. Invalid names or disallowed values fail with
`installer_setting_invalid` (exit 3). On an installed system, changed host
settings are merged into the active configuration and the runtime is restarted
on either profile. This option does not accept deployment fields such as
`public_host` or installer-owned secrets.

Compact storage: the **File storage** default, `bundled`, is the Scalable
default. On Compact, that default becomes `local_fs` unless `--file-storage` is
given on the command line. An answer of **Local persistent filesystem** or
**External S3-compatible storage** (with its S3 settings) is kept, in plain
mode, `--tui` and non-interactive runs alike; the review shows the final value.
For bundled storage on Compact pass `--file-storage bundled`. Scalable keeps the
prompted or supplied value.

Ports must be 1–65535. Compact worker processes must be at least 1 (the source
upper bound is 56336, not a recommended operating value). Public host is a bare
hostname/IP, not a URL. The derived origin uses HTTPS and omits `:443` when
443 is selected. Existing-proxy host backends are private HTTP; Docker placement
uses network aliases/container ports and publishes no corresponding host port.

## Valid profile and TLS combinations

| Ingress owner | Permitted Network and TLS choices |
|---|---|
| Bundled Traefik (`bundled_traefik`) | Local/private generated certificate (`local`, default); Hostname generated certificate (`self_signed`); Operator-provided certificate (`provided`); Bundled ACME certificate (`acme`) |
| Existing Traefik (`external_traefik`) | Existing Traefik resolver (`external_resolver`); Existing Traefik certificate (`external_certificate`) |
| Existing reverse proxy (`external_proxy`) | Existing reverse-proxy TLS (`reverse_proxy`) |
| Hosting platform ingress (`platform`) | Hosting platform TLS (`platform_managed`) |

Compact requires Production. Hosting platform ingress requires Compact.
Development is the complete contributor preset and uses Scalable. The plain
TLS menu displays all choices; incompatible owner/TLS pairs fail validation.
For non-interactive invocations, an explicitly supplied `--tls-mode` can infer
its matching ingress owner when `--ingress-mode` is omitted. For a guided run,
choose both consistently, or pass both options explicitly.

External Traefik needs an existing Docker network; the preflight checks that
it exists and has an attached container. That is not proof of a correctly
configured Docker provider, router, resolver or certificate. Docker placement
for Apache/Nginx needs `--proxy-network`. Trusted proxy addresses reject wildcard
networks such as `0.0.0.0/0` and `::/0`. See the walkthrough's
[network, resolver and trusted-peer discovery instructions](../deploy/installer-walkthrough#4d-existing-traefik).

For public bundled ACME, set the real hostname, public port `443`, redirect
port `80`, contact email and CA directory URL explicitly. The source uses
HTTP-01. DNS, public reachability and certificate issuance remain operator
prerequisites. Local/generated TLS is not a publicly trusted certificate.

## Non-interactive examples

Every question has an option, so an installation can run without prompts. A
fresh installation needs `--confirm`; omitted fields take the defaults in the
table above (on Compact, the `bundled` storage default becomes `local_fs`).

Local trial with all defaults (Compact, `https://localhost:8099`):

```bash
./install.sh --non-interactive --confirm
```

Public VPS, Compact, bundled Traefik with a Let's Encrypt certificate:

```bash
./install.sh --non-interactive --confirm \
  --deployment-profile compact \
  --ingress-mode bundled_traefik --tls-mode acme \
  --public-host flow.example.com --public-port 443 --redirect-http-port 80 \
  --acme-contact ops@example.com \
  --acme-directory-url https://acme-v02.api.letsencrypt.org/directory
```

Nginx already on the host terminates HTTPS (the ingress owner is inferred
from `--tls-mode reverse_proxy` when `--ingress-mode` is omitted):

```bash
./install.sh --non-interactive --confirm \
  --tls-mode reverse_proxy --proxy-kind nginx \
  --public-host flow.example.com --public-port 443
```

Then print the routes to add to your Nginx site with
`./flow-steward proxy-fragment`. Add `--json` to any of these to get one JSON
result document on stdout; the setup link still goes to stderr.

## File and credential input contract

Relative paths must remain inside the checkout. Generated TLS output must stay
inside it. Guided file inputs outside it are not mounted automatically: pass
an existing **absolute** input path through `--certificate-path`,
`--private-key-path` or `--s3-credentials-path` when launching. For external TLS
inputs also pass `--tls-mode provided`. The launcher mounts those inputs
read-only. Expand `~` before invocation; do not use `../` escape paths.

The installer S3 file is regular, not a symlink, with permissions `0600` or
stricter, and contains `access_key` and `secret_key`. Do not substitute the
`aws_access_key_id` / `aws_secret_access_key` format used by a later lifecycle
storage-transition command. Production S3 endpoints require HTTPS; HTTP requires
both Development and `--allow-insecure-s3-http`. Fresh S3 verification checks
bucket access with `HeadBucket`, then writes and deletes a temporary object;
it does not test reading object contents. Installed-system verification uses
the read-only bucket check.

`--extension-installer-origin` is a credential-free internal HTTP origin with
an explicit port and no path, query, or fragment. Keep its default for the
standard topology. Certificate/key fields remain visible even when another
ingress owns TLS; they do not configure that external owner.

## Reverse-proxy fragment

```bash
./flow-steward proxy-fragment --json
```

This read-only command works in both profiles after installation configuration
and CLI readiness. It requires `external_proxy` ingress and returns
`proxy_kind`, `proxy_placement`, `public_host`, `app_backend`, `mcp_backend`, and
`fragment` in the result. It selects the backend from the recorded placement,
ports and project aliases. The fragment uses an HTTP port-80 virtual host and
contains no TLS certificate configuration. Adapt its routes into the existing
HTTPS site; see the walkthrough's
[Nginx and Apache examples](../deploy/installer-walkthrough#4b-apache-or-nginx-already-runs-on-the-vps-host).
The installer does not install/reload that external configuration.

Source limitation: the normal containerized installer's reverse-proxy readiness
probe targets a host backend port even with Docker placement, whose overlay
publishes no host backend port. That can block completion of the Docker
Apache/Nginx branch; it remains unverified end to end for this revision.
The normal host reverse-proxy verification checks private HTTP, so successful
installer output is not proof of external HTTPS, DNS or firewall correctness.
The host-Python development fallback instead probes the public URL directly.

## State classification and resume

| State | Behavior |
|---|---|
| `fresh` | Collect/review configuration and start a journaled operation. |
| `resumable` | Reuse journaled configuration and rerun steps whose postconditions do not hold. |
| `installed` | Verify/reconcile the recorded installation; changed source enters the image/update path. Asks no questions. Rerunning the installer is not a read-only health check. |
| `ambiguous` | Preserve detected resources and refuse mutation until the reported identity, journal, secret, or configuration issue is resolved. |

Journaled steps cover preflight, configuration, durable secrets, TLS, images,
core start, schema/seed verification, worker identity, application runtime,
health, CLI runtime, storage probe, route probe, first-admin bootstrap, and
initial preservation manifest. Resume from the same checkout. An operation
that cannot recover cleanly may report `recovery_required`; inspect the error
and `./flow-steward doctor` before retrying. Never delete state/volumes to bypass
the guard. See [Installation and Updates](../user/installation-and-updates) for
update behavior and supported deployment changes.

## Rerunning on an installed system

`./install.sh` on a completed installation reads the applied configuration
(`.flow-steward/stack.toml`), not the spec defaults, and asks nothing. It then:

1. Finishes an interrupted profile switch, or switches profile when
   `--deployment-profile` names the other profile.
2. Checks for options it cannot apply. Apart from the profile switch,
   `--setting` on either profile and `--worker-processes` on Compact are the
   supported rerun changes. Other differing installation options stop with
   `installed_setting_not_applied` (exit 7). This check follows profile-switch
   handling, so a combined request is not guaranteed to leave the profile
   unchanged. On Scalable the message names `./flow-steward config set ...`
   and `config apply --confirm` as the way to change other settings.
   A changed Compact worker count prints
   `Compact worker processes: <old> -> <new>.`; changed host settings are
   recorded and restart the runtime.
3. Compares the checkout's commit with the revision the running images were
   built from. For source-built installations, when they differ it runs the
   update steps: preflight, image build, a migration check against the database,
   core start, schema check, worker identity, runtime, health and CLI runtime,
   followed by storage, route and bootstrap verification. The output says
   `Updated from <old> to <new>.` when both revisions are known. Official
   installations also honor their recorded release identity; a rerun does not
   discover the latest remote release.
4. Otherwise starts stopped services, verifies health, storage, the public
   route and bootstrap, and prints `Flow Steward is already installed.` An
   expired first-administrator link is reissued while no administrator exists.

If the update carries a database migration, step 3 stops with
`release_migration_required` (exit 8) before the update restarts running
services. A rollback to a release that does not know the database's migration
history stops with `database_newer_than_release` (exit 8). Image variables such
as `FS_COMPACT_IMAGE` or `FS_APP_IMAGE` set in the shell mark those images as
yours: they are not rebuilt, and the run warns when the runtime is behind the
checkout.

## Environment variables read by the launcher

`./install.sh` forwards the following installation variables from your shell
into the installer container. Host settings must be supplied with `--setting`;
other installation answers use the options above.

| Variable | Effect |
|---|---|
| `FS_COMPOSE_PROJECT_NAME` | Docker Compose project name for a new installation (default `flow-steward`). Use a unique name for a second installation on the same host; it is recorded and reused. |
| `HTTP_PORT`, `POSTGRES_HOST_PORT`, `RABBITMQ_AMQP_HOST_PORT`, `RABBITMQ_MANAGEMENT_HOST_PORT`, `SEAWEEDFS_S3_HOST_PORT`, `SEAWEEDFS_MASTER_HOST_PORT`, `NEO4J_HTTP_HOST_PORT`, `NEO4J_BOLT_HOST_PORT`, `MCP_HOST_PORT`, `FRONTEND_HOST_PORT`, `MAILPIT_SMTP_PORT`, `MAILPIT_WEB_PORT`, `MAILPIT_HTTP_PORT`, `SONAR_PORT` | Host port overrides for the Compose services that publish one. Prefer `--redirect-http-port` over `HTTP_PORT`. |
| `FS_COMPACT_IMAGE`, `FS_APP_IMAGE`, `FS_WORKER_IMAGE`, `FS_CONTROL_IMAGE`, `FS_CLI_IMAGE`, `FS_FRONTEND_IMAGE`, `MCP_IMAGE`, `POSTGRES_IMAGE` and `FS_COMPACT_IMAGE_REGISTRY_REF`, `FS_COMPACT_IMAGE_REVISION`, `FS_COMPACT_IMAGE_PLATFORM` | Supply existing product images for source/prebuilt installation paths. Leave unset for normal automatic image selection; verified official-release selection supplies its own image environment. |
| `FS_RELEASE_REPOSITORY`, `FS_RELEASE_REGISTRIES` | Where official releases and their images are looked up. |
| `AWS_CA_BUNDLE` | Extra CA bundle for an external S3 endpoint. |
| `NO_COLOR`, `TERM` | Terminal output. |

Read by `install.sh` itself: `FS_INSTALLER_IMAGE` (installer image tag, or an
exact `sha256:` image to reuse), `FS_INSTALLER_STATE_DIR` (state root, default
`.flow-steward`), `FS_INSTALLER_HEARTBEAT_SECONDS` (progress heartbeat while the
installer image builds, default 5), and `FS_INSTALLER_USE_HOST_PYTHON=1` with
`PYTHON_BIN` (development fallback without the installer container).
The launcher also reads Docker context/configuration inputs, including
`DOCKER_CONFIG` and `DOCKER_CERT_PATH`, for its Docker access and read-only mounts.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Installed, updated, or already installed and verified. |
| `2` | Invalid usage, such as a subcommand. |
| `3` | Validation failed: an invalid value or ingress/TLS pair, a bad file path, or an invalid host setting. |
| `4` | Precondition failed: run as root, port in use, not enough disk. |
| `5` | A required file or repository path is unreadable. |
| `6` | Another installer run is active for this installation; wait for it to finish. |
| `7` | Docker, Compose or another dependency is unavailable, the host is unsupported, official release images cannot be verified, or a setting cannot be applied by a rerun. |
| `8` | A step failed after it started, such as a health or schema check. |
| `9` | Ambiguous installation state: inspect the reported identity, configuration or secrets before retrying. |
| `10` | Cancelled or interrupted, including a fresh non-interactive run without `--confirm`; also refusal to resume a journal already marked `recovery_required`. |
| `70` | Unexpected internal error; read the printed log path. |
| `127` | The Docker CLI or a required POSIX utility (`awk`, `sed`, `stat`, ...) is not on `PATH`. |

## Generated state and first administrator

Default paths are relative to the checkout:

- `.flow-steward/install-state.json`: installer journal.
- `.flow-steward/logs/install-*.log`: owner-only operation logs.
- `.flow-steward/stack.toml`, `pending-config.json`, and `compose.env`: active,
  pending and generated deployment state.
- `.env.prod` or `.env`: runtime environment created by the installer, with
  generated passwords and keys. Installer-owned keys are rewritten when the
  corresponding configuration/secrets steps regenerate the environment;
  a verified rerun can skip those steps. Other lines are kept.
- `.flow-steward/runtime/`: runtime material including bundled-storage
  credentials and bootstrap-token state.
- `.flow-steward/secret-output/bootstrap-token`: owner-only setup-token output.
- The initial preservation manifest and release/pending-release records under
  installer-managed state.

On Linux with systemd and the system Docker daemon, a successful Compact
installation also asks for sudo when host service setup or refresh is needed
and installs `flow-steward-<compose-project>.service` to start the installation
after a reboot; see [Linux VPS automatic startup](../deploy/installation#linux-vps-automatic-startup).

An explicit `FS_INSTALLER_STATE_DIR` relocates the installer state root; use the
printed paths. Do not hand-edit installer-owned environment keys, `stack.toml`,
`compose.env`, credentials, journals, or locks: the next run rewrites or
rejects them. Change an installed configuration with the commands in
[Rerunning on an installed system](#rerunning-on-an-installed-system).

A normal checkout installation, including loopback, prints a private
`/bootstrap#setup-token=...` link valid for **60 minutes**. Open it to create the
first administrator, then sign in. Its complete secret-bearing link is excluded
from JSON results and printed to stderr. If it expires while there is still no
administrator, rerun `./install.sh` for a new link. Normal installed loopback
bootstrap also requires this token; a plain URL is not a substitute for the
complete setup link. Standalone Compact can self-mint a separate startup link
with a 15-minute lifetime. No AI-provider credential is required to install core.

## Verification boundary

This is a source review, not a new installation acceptance run. Docker-proxy
readiness has the limitation named above; Compact storage normalization follows
the rules in the installation fields section. No live VPS, external proxy,
ACME CA, S3 service, or release registry was changed or tested for this
documentation pass. Run `./flow-steward status` and
`./flow-steward doctor`, open `https://<host>/health/ready` in a browser, and
use the walkthrough's browser, WebSocket and MCP checks before treating a
deployment as ready.
