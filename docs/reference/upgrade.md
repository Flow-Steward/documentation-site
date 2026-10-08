---
sidebar_position: 6
title: Upgrade Reference
description: Check official releases and apply an exact release while preserving recovery boundaries.
---

# Upgrade Reference

Source contract: `core/application/management/command_specs/release.py` and
the shared release services. An official installed release version comes from
verified installer state, not the checkout's `VERSION` file.

A completed checkout installation has source origin and an installed commit SHA,
not an inferred official version. Its semantic ordering relative to a published
release is unknown. `release info` reports that source origin; `release check`
can report `transition_available`. A reviewed, confirmed `release upgrade`
explicitly transitions to the selected exact official release through the same
installer contract. It does not upgrade implicitly during installation or Clone.

## Commands

| Command | Effect |
|---|---|
| `release info` | Inspect installed source origin/commit, or official release identity and image pins. |
| `release check` | Check stable GitHub Releases tagged exactly `vX.Y.Z`. |
| `release upgrade` | Preflight an exact official release and its complete digest-pinned image set, then perform a resumable checkout handoff through the shared installer contract. |

A fresh installation from a checkout builds from the files already present. It
does not require a GitHub Release lookup. Official release upgrade is a separate
operation: it does not silently build replacement product images locally or use
floating tags.

## Upgrade options

| Option | Default | Meaning |
|---|---:|---|
| `--target-version <version>` | latest eligible stable release | Select an exact release version. |
| `--dry-run` | false | Review preflight without applying the upgrade. |
| `--timeout-seconds <seconds>` | `60` | Timeout for an individual runtime operation. |
| `--confirm` | false | Explicitly approve the reviewed upgrade. |

`--base-url`, `--backup-output`, and `--author` are not public upgrade options.

## Required sequence

Create and verify a PostgreSQL backup and preserve non-database recovery assets.
Enable maintenance explicitly **before** upgrade preflight. Upgrade does not
create your backup, apply SQL migrations for you, or enable/disable maintenance.

```bash
./flow-steward release info
./flow-steward release check
./flow-steward backup create
./flow-steward backup verify backups/<file>.dump.enc
./flow-steward maintenance enable --confirm
./flow-steward release upgrade --dry-run --target-version <version>
./flow-steward release upgrade --target-version <version> --confirm
./flow-steward maintenance status
./flow-steward status
./flow-steward doctor
```

Follow the candidate's database instructions separately before reopening work.
Only after readiness and preservation checks pass:

```bash
./flow-steward maintenance disable --confirm
```

Maintenance remains enabled after both success and failure.

## Private repository access

Git clone credentials do not automatically become credentials for the release
HTTP client. Until the source repository becomes public, use a fine-grained PAT
limited to that repository with `Contents: read` and any required organization
authorization. Write it with an editor or secret-management tool to:

```text
.flow-steward/secret-input/github-release-token
```

The directory must be owner-only (`0700`) and the file owner-only (`0600`).
Do not put the token in command arguments, environment files, or logs. This
deployment-local credential is not copied into Clone archives. Private registry
access is a separate prerequisite when the selected images are not public.

## Failure and recovery

Keep maintenance enabled, preserve the reported operation identity and recovery
instructions, and inspect database, storage, queues, image identity, and health.
Do not replace an exact unavailable release with a different version. A database
restore cannot reverse external provider calls or object-storage changes.

See [Backups And Restore](../deploy/backups-and-restore) and
[Rollback Runbook](../deploy/rollback).

This page is source-checked, not evidence of a live upgrade walkthrough.
