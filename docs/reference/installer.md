---
sidebar_position: 5
title: Installer Reference
description: Exact installation options, defaults, visibility, and resume behavior for the reviewed application source.
---

# Installer Reference

For help choosing each answer, use [Answer the Installer Questions](../deploy/installer-walkthrough).
This reference is checked against application revision
`62a95e3456d3a692092b5a04daecca504c3f97b1` on 2026-10-04. The field contract is
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
The checkout must have a resolvable Git revision and materialized Git LFS files.
The host preflight supports amd64/arm64 and rejects less than 4 GiB free space;
that minimum is not a production sizing recommendation.

## Global options

| Option | Meaning |
|---|---|
| `--json` | Emit one JSON document and do not prompt. Fresh installation still needs `--confirm`. The live setup link is printed separately to stderr. |
| `--plain` | Use line-oriented interaction, also the default without `--tui`. |
| `--tui` | Opt into the full-screen form; advanced fields are behind **Show advanced**. |
| `--no-color` | Disable color. |
| `--verbose` | Request redacted technical output; ordinary non-JSON installation also streams progress/technical output. |
| `--non-interactive` | Never prompt. A fresh install requires `--confirm`. |
| `--confirm` | Confirm the fresh-install plan. |
| `-h`, `--help` | Show launcher/private installer help. |

Plain mode uses numbered choices and asks visible advanced fields directly.
Command-line values skip their corresponding plain questions. Review is
**Review pending change:** followed by **Apply this change?**, default No.
Conditional visibility controls questions, not whether incompatible CLI values
are valid; model validation enforces the combinations below.

## Installation fields

“Always” means no field visibility condition. “Advanced” applies to the
full-screen form; it does not hide the question in plain mode.

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

The effective Compact storage default differs by interface: plain mode accepts
its displayed `bundled` answer; non-interactive Compact with no supplied
`--file-storage` normalizes to `local_fs`. The current full-screen path also
normalizes Compact storage against the original CLI-supplied keys, so pin
`--file-storage` explicitly when using `--tui` to avoid replacing a form choice.
The local trial in the walkthrough deliberately chooses local storage.

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
both Development and `--allow-insecure-s3-http`. Storage verification needs
write/read/delete access.

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

Source limitation: the reverse-proxy readiness probe targets a host backend
port even with Docker placement, whose overlay publishes no host backend port.
That can block completion of the Docker Apache/Nginx branch; it remains
unverified end to end for this revision. Host reverse-proxy verification checks
private HTTP, so successful installer output is not proof of external HTTPS,
DNS or firewall correctness.

## State classification and resume

| State | Behavior |
|---|---|
| `fresh` | Collect/review configuration and start a journaled operation. |
| `resumable` | Reuse journaled configuration and rerun steps whose postconditions do not hold. |
| `installed` | Verify/reconcile the recorded installation; changed source can enter the image/update path. Rerunning the installer is not a read-only health check. |
| `ambiguous` | Preserve detected resources and refuse mutation until the reported identity, journal, secret, or configuration issue is resolved. |

Journaled steps cover preflight, configuration, durable secrets, TLS, images,
core start, schema/seed verification, worker identity, application runtime,
health, CLI runtime, storage probe, route probe, first-admin bootstrap, and
initial preservation manifest. Resume from the same checkout. An operation
that cannot recover cleanly may report `recovery_required`; inspect the error
and `./flow-steward doctor` before retrying. Never delete state/volumes to bypass
the guard. See [Installation and Updates](../user/installation-and-updates) for
update behavior and supported deployment changes.

## Generated state and first administrator

Default paths are relative to the checkout:

- `.flow-steward/install-state.json`: installer journal.
- `.flow-steward/logs/install-*.log`: owner-only operation logs.
- `.flow-steward/stack.toml`, `pending-config.json`, and `compose.env`: active,
  pending and generated deployment state.
- `.env.prod` or `.env`: managed runtime environment blocks.
- `.flow-steward/runtime/`: runtime material including bundled-storage
  credentials and bootstrap-token state.
- `.flow-steward/secret-output/bootstrap-token`: owner-only setup-token output.
- The initial preservation manifest and release/pending-release records under
  installer-managed state.

An explicit `FS_INSTALLER_STATE_DIR` relocates the installer state root; use the
printed paths. Do not hand-edit managed blocks, credentials, journals, or locks.

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
readiness and full-screen Compact storage behavior have the limitations named
above. No live VPS, external proxy, ACME CA, or S3 service was changed or tested
for this documentation pass. Use the walkthrough's public health, browser,
WebSocket and MCP checks before treating a deployment as ready.
