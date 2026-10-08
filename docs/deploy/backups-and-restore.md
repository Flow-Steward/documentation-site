---
sidebar_position: 7
title: Backups And Restore
description: Create, verify, and rehearse protected PostgreSQL recovery without confusing it with full-system backup.
---

# Backups And Restore

The public backup surface protects PostgreSQL only. It does not include object
storage, RabbitMQ, application/source images, logs, generated builds,
extensions, projects/workspaces on the host, TLS material, installer state, or
provider-side effects.

The checkout commands below use the selected installation's Docker/Compose context. Compact stores its database backup inside its durable `/data` volume; Scalable uses the host checkout. The host restore helper is not a Railway or
other standalone-container restore procedure. On a hosting platform, plan and
rehearse provider-specific recovery of PostgreSQL, RabbitMQ and Compact’s `/data`
volume; its container has no host Compose tooling.

## Keep the correct key

Encrypted backups require `FS_BACKUP_ENCRYPTION_KEY`. This is not
`FS_SECRET_KEY`, `ENCRYPTION_KEY`, a database password, or an authentication
token. Preserve the exact backup key separately and securely; do not print it
in logs or copy it into a change record.

## Create, list, and verify

```bash
./flow-steward backup create
./flow-steward backup list
./flow-steward backup verify backups/<file>.dump.enc
```

`backup create` writes an owner-only encrypted PostgreSQL custom-format dump
under the canonical `backups/` directory, decrypts it to an owner-only temporary
file, and runs non-mutating `pg_restore -l` before publishing it. `backup
verify` repeats the envelope/path and catalog checks without modifying the
database.

| Context | Public create/list storage | Verification path |
| --- | --- | --- |
| Checkout Scalable | Deployment checkout `backups/` on the host, reached through the installed CLI's checkout mount. | `backups/<file>.dump.enc` |
| Checkout Compact | `/data/backups/` in the Compact durable volume, not checkout `backups/`. | `backups/<file>.dump.enc` through the Compact launcher. |
| Standalone provider Compact | `/data/backups/` inside its mounted durable volume. Use native `flow-steward backup create/list/verify` in the provider console. | Container-native path; exporting the file requires provider volume/file controls. |

Use the filename returned by `backup create` and confirm it appears in `backup list`. Keep an encrypted off-installation copy; a durable volume alone is not an independent recovery copy. `FS_BACKUPS_DIR` selects Clone transfer storage, not the public PostgreSQL backup gateway. The separate internal `db_backup.sh` uses `${FS_ARTIFACT_ROOT:-<application-repository>}/backups`; do not apply that script's environment override to the public gateway.

For checkout Compact, exporting or importing a database backup is a separate file-copy operation on the Docker host. Resolve the running container through the selected context, not a guessed container name:

```bash
# If installer state is external, first set FS_STACK_ENV_FILE to that
# installation's exact <selected-state-root>/compose.env, not another checkout.
source core/entrypoints/cli/scripts/docker_compose_env.sh
compact_container=$(fs_compose ps -q compact-runtime)
test -n "$compact_container" || exit 1
# Substitute the exact filename returned by backup create.
docker cp "$compact_container:/data/backups/<file>.dump.enc" /private/recovery/<file>.dump.enc
chmod 600 /private/recovery/<file>.dump.enc
```

Prepare `/private/recovery` as an existing owner-only directory and keep the key separately. The shown destination is a placeholder, not a directory the product creates. For a host-helper restore, put the exported encrypted file in the **target checkout's** `backups/` directory with mode `600`, verify its identity and use the explicit target helper below. To import it for Compact's public `backup verify`, copy it separately into the target container's `/data/backups/`, set ownership to that runtime's backup owner, and verify through that installation's launcher. Host copy/import does not restore a database. Do not apply Docker-host commands inside a standalone provider container.

The helper defaults to checkout `.flow-steward/compose.env`; `FS_INSTALLER_STATE_DIR` alone does not redirect that read. With a supported external state root, set `FS_STACK_ENV_FILE` to its exact `compose.env` before sourcing and before invoking the restore helper, which loads the same context. Inspect the resolved services/project before any copy or recovery operation.

## Preserve the other recovery assets

Alongside the encrypted database artifact, preserve as applicable:

- object-storage contents and bucket lifecycle/versioning evidence;
- `.env`/`.env.prod`, installer-owned configuration, and generated durable
  secrets without exposing their values;
- TLS certificates/keys and public endpoint configuration;
- immutable role image tags/digests or the exact source tag/commit;
- mutable extension and project/workspace content;
- external-provider reconciliation information and idempotency records.

## Restore only to an explicit target

Database-only restore is deliberately absent from the public CLI. The internal
operator helper **drops and recreates the exact confirmed target database from
`template0`**, then imports the dump and repairs the AGE graph catalog. It is
not a merge, and it is distinct from Installation Clone below. Rehearse on a
disposable installation before a real recovery.

Capture parity evidence while the source is available, and enable manual
maintenance before the real restore:

```bash
./flow-steward database restore-parity-capture \
  --output backups/restore/baseline_<timestamp>.json --confirm
./flow-steward maintenance enable --confirm
./flow-steward maintenance status
./flow-steward backup verify backups/<file>.dump.enc
```

Use the actual output path returned by parity capture. In native Compact,
`backups/restore/baseline_<timestamp>.json` resolves beneath
`/data/state/backups/restore/`, unlike database dumps beneath `/data/backups/`.
Export the baseline separately and import it into the target's corresponding
state path before parity verification; copying a dump alone does not supply it.

Preflight on the **target host**, in Bash, from the target checkout:

```bash
source core/entrypoints/cli/scripts/docker_compose_env.sh
fs_compose config --services
fs_compose ps pg-fs
printf 'Compose project: %s\n' "$FS_COMPOSE_PROJECT_NAME"
printf 'target database: user=%s database=%s\n' "${POSTGRES_USER:-flow_steward}" "${POSTGRES_DB:-flow_steward}"
```

Check that the project, database user and database name are the target you
intend to replace. Set explicit `POSTGRES_USER` / `POSTGRES_DB` in the recovery
shell if your target differs from the helper's `flow_steward` defaults. Do not
substitute an independently assembled Compose command: the helper uses the
installer-selected project, file set, environment, overrides and profiles.

The current helper decrypts through a one-shot container of the selected
`fs-app` or `compact-runtime` image, with `--pull never`; that recorded image
must already be available. It no longer needs a host Python/cryptography
installation. Docker/Compose, the target files and the correct protected export
are prerequisites. Load the exact original `FS_BACKUP_ENCRYPTION_KEY` privately
into the recovery shell from your secret store; the script deliberately does
not infer it from an environment file. Do not type the key into shell history.

Run the destructive helper only after identifying the exact target:

```bash
core/entrypoints/cli/scripts/db_restore.sh backups/<file>.dump.enc \
  --target-compose-project '<exact-project-from-preflight>' --confirm
```

Both target and confirmation flags are required. The helper starts `pg-fs`
alone and verifies the dump before replacing the database. It stops the
currently running writer services (Compact's runtime, or the applicable
Scalable services), replaces the database, imports state, and repairs the graph
catalog. It leaves writers stopped.

**Continue only after `[restore] done`.** If failure occurs after replacement,
the database can be incomplete; keep writers stopped and follow the instruction
to rerun restore. Do not start the runtime just because decryption or part of the
SQL succeeded. Once the helper completes successfully, use the checkout for the
intended restored release and start/verify through the installer:

```bash
./install.sh
./flow-steward maintenance status
./flow-steward database restore-parity-verify \
  --baseline backups/restore/baseline_<timestamp>.json \
  --output backups/restore/restored_<timestamp>.json --confirm
./flow-steward status
./flow-steward doctor
```

The runtime maintenance marker is independent filesystem state, not part of a PostgreSQL-only backup. Preserve and verify the **target's** enabled marker and traffic controls before restarting writers; do not expect restoring a database to create that marker or carry the source's maintenance setting. A later status check cannot retroactively prevent work that started while the marker was missing.
Read-only doctor may report intentional maintenance. Do not run an unqualified
`doctor --fix`, which can disable it; use the
[diagnosis and repair guide](diagnostics-and-migration#apply-only-the-repairs-you-intend).

Record backup and target identities, operator, timestamps, parity result, RTO,
RPO, object-storage reconciliation, and the decision to resume. Disable
Maintenance Mode only after all checks pass.

## Installation Clone

For the practical source → transfer → target → cutover procedure, use
[Diagnose, Repair, and Move a Server](diagnostics-and-migration#plan-a-move-to-another-server).

Clone is an encrypted point-in-time replacement of an **already installed**
target. It is not the PostgreSQL-only backup command, live replication, profile
conversion, SSH transport, or a DNS switch.

Both source and target need verified official installed releases before Clone.
If either was installed from a checkout in source mode, first complete the
release check, backup, manual-maintenance, and confirmed exact official upgrade
sequence in [Upgrade Reference](../reference/upgrade). Clone does not perform
that transition implicitly.

Both source and target must already be in fully enabled manual maintenance.
Only same-profile, same-data-placement installations and compatible Linux CPU architectures are
supported. Restore replaces allowlisted product state, preserves the target's
deployment-local shell, domain, ports, TLS, and installation identity, and
activates the exact source release through the common release contract.
External S3 objects and provider-side services are not copied.

```bash
# Source: secret-command is your own secret-store command, not a product command.
./flow-steward maintenance enable --confirm
secret-command | ./flow-steward clone create --passphrase-stdin --confirm

# Transfer the encrypted archive using your operator-managed transport.
# Preinstalled same-profile/same-placement Scalable target:
./flow-steward maintenance enable --confirm
review_status=0
secret-command | ./flow-steward clone restore backups/source.fsclone \
  --passphrase-stdin --non-interactive || review_status=$?
if [ "$review_status" -eq 0 ]; then echo "Unexpected review success" >&2; exit 70; fi
if [ "$review_status" -ne 10 ]; then exit "$review_status"; fi
# Repeat with the exact target-bound confirmation printed by the review:
secret-command | ./flow-steward clone restore backups/source.fsclone \
  --passphrase-stdin --non-interactive --confirm '<printed-target-or-plan-value>'
./flow-steward status
./flow-steward doctor
./flow-steward maintenance status
```

The Scalable review exits `10` without replacement. Compact's host launcher rejects explicit noninteractive restore without a confirmation value with exit `2`, before any review is dispatched. On Compact, run an interactive restore, review and decline; use only a confirmation actually printed by that reviewed plan for a later confirmed invocation. See the [profile-specific review procedure](diagnostics-and-migration#3-review-the-exact-target-replacement). Every other nonzero status is a failure, not authorization to continue.
Declining confirmation leaves the target untouched. Pass exactly one line via
stdin; never put the passphrase in arguments, environment files, or logs.
Archive authentication, safe extraction, checksums, profile compatibility, and
exact-release availability are checked before replacement. Preserve the printed
operation identity and follow its resume instructions after an interruption;
do not bypass recovery guards. Maintenance remains enabled after restore.
Review external-effects warnings before explicitly reopening work.

## Verification boundary

On 2026-10-05, source commit
`eb1626b05d06ca893a451560df2b5e95b972c47e` passed an actual local Compact
PostgreSQL-only rehearsal: encrypted create/list/verify and owner-only export;
verification on a separate empty target; wrong-project rejection; maintenance
enable; confirmed target replacement; and exact baseline parity for two
projects and three jobs. The target's filesystem maintenance marker remained
unchanged, and writers were deliberately left stopped.

This does not accept post-restore runtime startup or credential rotation,
Scalable or standalone-provider recovery, official-release Installation Clone,
production recovery, or a complete system backup. Those require their own
target-specific rehearsal.

## Related pages

- [Rollback Runbook](rollback)
- [Storage And Artifacts](storage-and-artifacts)
- [Upgrade Reference](../reference/upgrade)
