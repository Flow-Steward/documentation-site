---
sidebar_position: 10
title: Deployment Troubleshooting
description: Source-backed checks for installation, lifecycle, storage, queue, MCP, and public-route failures.
---

# Deployment Troubleshooting

Preserve the first failure and the installer/CLI log path it reports. Do not
delete volumes, regenerate durable secrets, or bypass TLS/authentication to make
a check pass.

## Installer refuses to continue

Run read-only checks:

```bash
./flow-steward status
./flow-steward doctor
```

On Scalable, also use `./flow-steward config show`, `config validate`, and
`stack status`. Compact does not retain those command families. For exact
`doctor --fix` syntax and repair boundaries see
[Diagnose, Repair, and Move a Server](diagnostics-and-migration).

Common boundaries:

- Running as root is refused.
- A pre-journal stack is preserved and not adopted automatically.
- Existing resources without matching installer configuration are ambiguous.
- Protected backups without `FS_BACKUP_ENCRYPTION_KEY` block safe lifecycle
  classification.
- A previous failed rollback can require manual recovery before another
  `./install.sh` run.
- Docker/Compose access, disk space, selected ports, provided files, TLS, or S3
  validation can fail before runtime mutation.

Correct only the reported cause, then rerun `./install.sh` to resume. Do not use
obsolete `./install.sh status` or `doctor` subcommands.

## Services are unhealthy

On Scalable:

```bash
./flow-steward stack status
./flow-steward stack logs --tail 200
./flow-steward doctor
```

On Compact, use `status`, the Docker-host `doctor`, and runtime-container logs
from your host/provider. Provider Compact has no Docker-host repair capability;
its doctor can report **NOT CHECKED**, not a health pass. Use read-only doctor
during maintenance; an unqualified `doctor --fix` can disable it.

Inspect the first unhealthy dependency. Production Compose requires immutable
role image/provenance values, `FS_METRICS_TOKEN` when metrics are enabled,
production PII/security material, worker MCP identity, and service-specific
configuration. Do not add model credentials merely to clear an optional warning.

## Storage fails readiness

- On Scalable inspect `environment show` and `config show`; on Compact use
  installer-recorded storage and status/doctor evidence.
- For local filesystem storage, check persistent volume/directory attachment,
  writable space and permissions. Compact artifacts normally live under
  `/data/artifacts`; a provider needs a durable `/data` volume.
- For external S3, verify HTTPS endpoint, bucket, region, credential-file
  ownership, and provider policy.
- For bundled storage, inspect SeaweedFS and the internal artifact network.
- Treat a failed authenticated put/get/delete probe as not ready even when DNS
  and TCP connect.
- Do not assume changing an arbitrary `.env` name forwards it to each service;
  use only verified configuration paths.

## Queue or jobs are stuck

1. Inspect Monitoring, ready queue depth, active leases, and worker/control
   health.
2. Open the oldest affected job and its runtime journal/causal errors.
3. Inspect worker logs.
4. Use the watchdog or a job recovery action only after checking its
   prerequisites and external-effect risk.
5. Keep retry, replay-step, restart, event redrive, and broker delivery retry as
   separate mechanisms.

## MCP authorization fails

Confirm the public endpoint, TLS, `Authorization: Bearer <token>`, required token
scopes, and project/workflow restrictions. A permission-filtered empty
`tools/list` is not proof that the server has no tools. Anonymous MCP is only a
local-development override, not the production default.

## Public route or reverse proxy fails

- Compare `public_host`, `public_port`, TLS mode, certificate SANs, and the URL
  printed by installer-owned configuration.
- Host Apache/Nginx uses the configured loopback backend (default
  `127.0.0.1:18099`; Scalable MCP defaults to `18100`). A Docker proxy uses
  the configured external network and service aliases instead.
- Run `./flow-steward proxy-fragment --json` to inspect recorded route
  destinations. Preserve WebSocket/SSE and MCP discovery behavior.
- The Docker external-proxy branch has a source-observed readiness mismatch:
  its probe still targets an unpublished host backend port. See
  [the walkthrough](installer-walkthrough#4c-apache-or-nginx-already-runs-in-docker).
- Do not publish the private HTTP backend or disable TLS/authentication for a
  documentation screenshot.

## Evidence limit

These checks are source-backed at
`62a95e3456d3a692092b5a04daecca504c3f97b1` (2026-10-04). No new installation,
repair, or provider deployment was executed in this documentation pass.

## Related pages

- [Installation And Updates](../user/installation-and-updates)
- [Installer Reference](../reference/installer)
- [Monitoring And Troubleshooting](../user/monitoring-and-troubleshooting)
- [Storage And Artifacts](storage-and-artifacts)
