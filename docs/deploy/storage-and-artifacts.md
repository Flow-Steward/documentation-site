---
sidebar_position: 8
title: Storage And Artifacts
description: Separate PostgreSQL, queue, artifact, backup, extension, workspace, log, and installer-state storage.
---

# Storage And Artifacts

Flow Steward uses several independent persistence layers. Backing up one does
not protect the others.

## Storage map

| Layer | Typical source/configuration | Recovery boundary |
|---|---|---|
| PostgreSQL | `pg-fs` durable volume | Covered by `flow-steward backup`; derived indexes may be rebuilt. |
| RabbitMQ | broker durable volume | Not included in the PostgreSQL backup. Reconcile deliveries and effects. |
| Job artifacts | `ARTIFACT_STORAGE_BACKEND` | Persistent local filesystem or S3-compatible objects for installed deployments; memory is a runtime/test option, not durable production storage. |
| Bundled storage | Installer-selected SeaweedFS S3 service | Separate durable volume; backup and restore outside the database flow. |
| External S3 | `ARTIFACT_S3_*` plus provider policy | Operator/provider-managed backup, versioning, retention, and recovery. |
| Extensions | `FS_EXTENSIONS_DIR` / installed bundle state | Preserve mutable self-hosted files separately. |
| Projects/workspaces | configured project/workspace roots | Preserve source/worktree content separately. |
| Runtime logs | `FS_LOGS_DIR` and service logging | Operational evidence; not in database backups. |
| Installer state | `.flow-steward/` | Required for safe lifecycle classification, configuration, and provenance. |
| Protected backups | `${FS_ARTIFACT_ROOT:-<repo>}/backups` | Encrypted PostgreSQL exports; copy off host with their recovery metadata. |

`FS_BACKUPS_DIR` exists in the environment manifest but is not consumed by the
shipped backup script. Do not rely on it to relocate backups.

## Artifact backend choices

The runtime factory supports `memory`, `local_fs`, and `s3`. The installer
exposes the supported deployment choices as:

- `local_fs`: persistent local artifact files; new Compact data uses
  `/data/artifacts` in its durable data volume, while Scalable normally uses
  the configured persistent artifacts directory. Include this tree in backups;
- `bundled`: provisions SeaweedFS and owner-only credentials under
  `.flow-steward/runtime/`;
- `external_s3`: requires endpoint, bucket, region, and an owner-only credential
  file. Production requires HTTPS.

App, worker, control plane, CLI, and applicable tooling use the selected
internal endpoint. `ARTIFACT_S3_PUBLIC_ENDPOINT_URL` is a distinct browser-
reachable endpoint when downloads must leave the container network; it must be
reachable by the client and does not replace the internal endpoint.

Changing storage selection does not copy existing objects. Scalable
`environment switch` requires an explicit decision that objects were already
copied or that their temporary unavailability is accepted. Do not apply its
retained-CLI configuration instructions to Compact unchanged; consult
[Installation and Updates](../user/installation-and-updates). A profile switch
can retain the original data placement, so inspect recorded storage rather than
assuming the current profile always implies a new directory layout.

Plain installer mode displays bundled storage as its default; non-interactive
Compact with no explicit storage selects `local_fs`. See the
[installer walkthrough](installer-walkthrough#2-file-storage) for these defaults
and the exact credential-file format.

Standalone provider Compact needs a durable `/data` volume. Protect that volume
as well as PostgreSQL and RabbitMQ using provider-specific procedures; a
PostgreSQL backup alone does not include `/data`. Installation Clone captures
allowlisted local/bundled state for supported Docker-host installations, but
external S3 objects still require their own transfer/recovery plan.

## Readiness and recovery

Bundled/external S3 readiness is an authenticated put/get/delete probe, not a
DNS-only check. Monitor database size, broker queues, local artifact growth,
bucket lifecycle/versioning, logs, installer state, and orphan cleanup
separately.

Coordinate retention across jobs, messages, logs, events, retry queues, trash,
checkpoints, registry changelog, workspaces, and provider/object-storage
lifecycle rules. Use dry-run cleanup before deleting production evidence.

## Related pages

- [Backups And Restore](backups-and-restore)
- [Feature Configuration](../user/feature-configuration)
- [Operations Internals](../developer/operations-internals)
