---
sidebar_position: 6
title: Diagnose, Repair, and Move a Server
description: Read doctor reports, apply targeted repairs, and migrate a complete installation with an encrypted Clone.
---

# Diagnose, Repair, and Move a Server

Use `doctor` to diagnose an installation, `doctor --fix` for supported repairs,
and `clone` to move product state to another preinstalled server. These are
separate operations: diagnosis does not repair, repair does not back up, and
Clone replaces a target rather than merging two installations.

The original source baseline was
`62a95e3456d3a692092b5a04daecca504c3f97b1` (2026-10-04). The CLI context and
Clone admission contracts were rechecked against candidate
`f09b196c25cbacffdb25147751faedfd93198ac8` on 2026-10-06. This guide covers
Docker-host checkout installations of both Compact and Scalable. That source
review is not an executed repair, profile-by-profile recovery, or release-backed
Clone acceptance test; the rehearsal boundaries below still apply.

## Read a doctor report first

On the server, change to the installation's checkout and run as its deployment
owner:

```bash
./flow-steward status
./flow-steward doctor
```

`status` gives runtime readiness. `doctor` inspects the actual installation:
services, interrupted operations, maintenance, file permissions, graph catalog,
schema, backups, certificate, public route, worker counts, image availability,
release retention and installer state. It reads fresh facts rather than treating
an earlier successful log as current proof.

Plain `doctor` does not change installation state or acquire its mutation lock.
Its scratch log is temporary. It can still run a management container to perform
those read-only inspections. While another operation runs, findings may describe
work in progress and repairs are not offered.

The text report separates **Installation** and **Configuration**. For each
reported issue, read its check ID, cause and next-step command. Installation
statuses are `ok`, `fail`, `warn` and `info`; an `info` entry can say **Not
checked** because a prerequisite is down. “No problems found” does not mean
that every unavailable check ran. Read the individual statuses, not just the
last line. A missing Configuration section is also not a configuration pass.

For a structured report:

```bash
./flow-steward doctor --json
```

The installation-doctor schema is `flow-steward.doctor.v1`. Diagnosis includes
`profile`, `operation_running`, `installation`, `configuration`, `problems`,
`fix_command`, and `exit_code`; each installation finding includes `check_id`,
`status`, `cause`, `next_step`, and `repairable`.

| Exit code | Meaning for this doctor controller |
|---|---|
| `0` | No fail/warn findings counted; still inspect informational/not-checked entries. |
| `2` | Invalid usage or unknown check ID. |
| `4` | Problems remain, including warnings or configuration findings. |
| `5` | Installation checks cannot run inside provider Compact without Docker, with no separate configuration problem taking precedence. |
| `6` | A repair cannot acquire the installation/lifecycle lock because another operation is active. |

Launcher/bootstrap failures can occur before this controller; use their printed
cause and exit status. A nonzero diagnosis is evidence to investigate, not a
reason to delete state or regenerate keys.

### Docker host versus a provider console

Run the full installation doctor on the **Docker host** through
`./flow-steward`. Compact installed this way supports the same installation
checks as Scalable; `stale_cli_runtime` is Scalable-only.

Inside a standalone Compact container on Railway or another provider,
`flow-steward doctor` uses the container-native core-readiness service, not the
Docker-host installation doctor. It can succeed when core readiness passes;
`--fix` is unsupported and returns usage exit `2`. That result does not verify
host installation configuration, image identity, volumes, proxy routing, or
startup integration. Use native status, public health endpoints, provider logs,
volume evidence and the provider's deployment controls for their respective
checks. Host installer and Clone instructions below are not a provider-console
migration procedure. The installation controller's `no_docker`/NOT CHECKED
handling is not the native command's output contract.

## Apply only the repairs you intend

Use the exact IDs offered by the current report:

```bash
./flow-steward doctor --fix secrets_modes
./flow-steward doctor --fix container_names stale_cli_runtime
```

These are examples, not a routine list to run. The second example applies only
to Scalable and only if those findings are present. `doctor fix` is not a
subcommand; the syntax is **`doctor --fix`**, followed by zero or more
space-separated check IDs.

A fix run acquires the installation lock, diagnoses again, prints
**doctor --fix will repair:**, and asks **Repair these now? [y/N]**. Without a
TTY it does not repair unless `--confirm` is supplied. To approve an already
reviewed targeted repair in automation:

```bash
./flow-steward doctor --fix secrets_modes --confirm --json
```

Omitting IDs selects all currently repairable findings. **Do not use an
unqualified `doctor --fix` during a migration, upgrade, backup drill or restore
that intentionally retains maintenance.** One repair is
`maintenance_left_enabled`, which disables maintenance and can reopen work.
Read-only `doctor` is appropriate there; select other IDs only when needed.

| Repair ID | What it can change |
|---|---|
| `lifecycle_interrupted` | Continue only interrupted operations classified as safely continuable. Other operations give their own recovery command. |
| `stack_stopped` | Start stopped services when recorded images/source/state make that safe. It refuses a plain start with missing images, interrupted operations, temporary-name issues or changed source. |
| `maintenance_left_enabled` | Disable maintenance. Use only when you have deliberately decided to reopen work. |
| `shared_dirs_modes` | Normalize the shared trees' group/mode settings where that data layout uses them. |
| `secrets_modes` | Narrow overly broad permissions on secret/state files. |
| `graph_catalog` | Repair graph namespace/catalog identity left inconsistent after restore; this changes database catalog state. |
| `release_retention` | Remove superseded releases/image archives under the retention policy. Images with unproven exclusive ownership remain protected. |
| `container_names` | Restore expected names after an interrupted container recreation, including handling a stopped replaced container. |
| `stale_cli_runtime` | Refresh Scalable's retained `fs-cli` runtime. Compact has no such retained container. |
| `orphan_installer` | Stop abandoned installer containers when safe; a still-active operation is not forcibly taken over. |

A known check ID is not a guarantee that a repair is currently safe. The service
checks immediately before and after each repair. Outcomes are `repaired`,
`already_fine`, `still_failing`, or `refused`, followed by a fresh diagnosis.
JSON fix output includes `plan`, `confirmed`, `outcomes`, `final`, `log_path`
and `exit_code`. A repair run does not include a fresh Configuration report;
run plain `doctor` again after it.

There is no doctor-fix resume journal or `--operation-id`: rerun diagnosis after
an interruption and repair what it now reports. Keep its printed owner-only log
path. Do not remove locks while another installer or lifecycle operation runs.

### Issues doctor does not repair automatically

These IDs provide a next step instead of a repair: `schema_state`,
`backup_freshness`, `certificate_expiry`, `public_route`, `docker_host_gateway`,
`workers_consuming`, `worker_count_recorded`, and `recorded_images_present`.

For example, doctor does not apply migrations, restore a database, create a
backup, renew an operator's certificate, change DNS/proxy settings, or install
Docker. A backup warning concerns absence or age of verified backups (the
current freshness threshold is seven days); it does not prove an off-host
recovery copy exists. Follow the relevant [backup](backups-and-restore),
[installer/proxy](installer-walkthrough), or [upgrade](../reference/upgrade)
procedure. Some printed hints reference Scalable commands such as `stack` or
`config`: Compact does not provide those retained-CLI families. Use its
installer/provider procedure instead of assuming every hint applies unchanged.

## Plan a move to another server

Clone creates one encrypted `.fsclone` archive from the **source**, then
replaces allowlisted product state on an **already installed target**. It is a
point-in-time move, not replication, backup scheduling, profile conversion,
SSH transport or DNS automation.

Prepare both machines before the outage:

1. Install the target using [Installation](installation) and the
   [installer questions guide](installer-walkthrough), with its intended
   target domain, ingress, networks, volumes and ports.
2. Use the same profile **and data placement** on both: Compact → Compact or Scalable → Scalable, with matching `host_directories` or `compact_volume` placement.
   Both must have compatible Linux CPU platforms (`linux/amd64` or
   `linux/arm64`); do not assume Clone converts between architectures.
3. On each installation inspect `release info`, `doctor`, and `maintenance
   status`. Clone requires verified **official installed release identities**.
   A source-mode checkout must explicitly transition using the release
   procedure in [Upgrade Reference](../reference/upgrade) before Clone.
4. Ensure the archived release and its complete digest-pinned image set remain
   available through the configured release resolver/registry. Restore does
   not substitute a newer version or build missing images locally.
5. Arrange private free space for archive/staging/replacement, an encrypted
   transfer channel, a privately retained passphrase, and a maintenance window.
6. If the target contains anything to preserve, create its own rollback Clone
   before replacement. Clone restore does not back up the target automatically.

For a private release repository, each server needs its own release access
configuration; `.flow-steward/secret-input/github-release-token` is target-local
and is not imported from the source. Registry access is a separate prerequisite.

### What is copied, retained, and excluded

| State | Clone behavior |
|---|---|
| PostgreSQL product data, broker state, local/bundled artifacts, extensions, allowlisted durable app state | Replaced with the source snapshot. Existing target data is not merged. |
| Source-owned application secrets and settings | Imported according to the canonical allowlist so restored encrypted product data remains usable. This can retain live external-service credentials. |
| Installed official release | Activated at the exact archived identity and image set; restore does not run migrations. |
| Target installation/Compose identity, public host/ports, ingress/TLS, external network names, host UID/GID, filesystem locations, PostgreSQL server-role credentials | Retained from the target deployment. |
| Source Git checkout, task worktrees, generated caches/build trees, operation journals and unrelated server content | Not a general server copy; excluded/outside the allowlisted replacement. |
| External S3 objects | Not copied. Source references/endpoints/credentials can still point to the same external service. |
| DNS, firewall, external proxy service/config, provider-side state and effects | Not transferred or changed automatically. |

The Clone passphrase protects this archive; it is not
`FS_BACKUP_ENCRYPTION_KEY`, which protects PostgreSQL backup exports. Keep both
recovery secrets privately where applicable. Do not copy whole `.env` files or
replace target-local state manually to make a clone “match” the source.

## 1. Freeze and capture the source

On the **source** server:

```bash
./flow-steward maintenance enable --confirm
./flow-steward maintenance status
./flow-steward release info
./flow-steward doctor
./flow-steward clone create
```

Wait for manual maintenance to be fully enabled, not merely draining. The
interactive create command asks for a non-echoed passphrase and reviews the
capture. Record the archive path printed on completion. Keep the source in
maintenance until cutover is settled.

For automation, your own secret-store command can supply exactly one nonempty
line; `secret-command` below is a placeholder, not a Flow Steward command:

```bash
secret-command | ./flow-steward clone create --passphrase-stdin --confirm
```

Do not put the passphrase in an argument, environment variable, file committed
to source control, log, or captured output. `--output-directory` defaults to
`backups` and remains constrained to the configured transfer area; it is not a
way to expose arbitrary host directories.

Creation briefly stops the state-owning broker/bundled-storage services needed
for capture and restores their previous running state even on failure. It
publishes the completed archive atomically. Plaintext staging and partial
outputs are not migration artifacts. Maintenance remains enabled.

## 2. Transfer the completed archive

The CLI path `backups/NAME.fsclone` maps to different **host** transfer locations:

| Profile | Source output on host | Target input on host |
|---|---|---|
| Compact | `.flow-steward/clone/outbox/NAME.fsclone` | `.flow-steward/clone/inbox/NAME.fsclone` |
| Scalable | Configured `FS_BACKUPS_DIR`, default checkout `backups/NAME.fsclone` | Target's configured `FS_BACKUPS_DIR`, default checkout `backups/NAME.fsclone` |

These are the usual paths for installations created in those profiles. A
profile switch retains its data placement: Compact and any `compact_volume` placement use the inbox/outbox area, including a switched Scalable installation. Scalable with `host_directories` uses the selected host transfer root.
An explicit installer state-root override changes the Compact-area base path.
Use the actual output path and target configuration. `FS_BACKUPS_DIR` here is
Clone's transfer root; it does not relocate the separate PostgreSQL backup
script's output.

Transfer over an operator-controlled encrypted channel such as SSH/SFTP. For
example, after preparing the target Compact inbox with owner-only directory
permissions, run on the source (substitute real paths, file and server):

```bash
scp /srv/flow-steward/.flow-steward/clone/outbox/NAME.fsclone \
  deploy@target.example.com:/srv/flow-steward/.flow-steward/clone/inbox/NAME.fsclone
```

The transfer does not restore anything. On the target restrict the received
file to its deployment owner (`chmod 600`), and optionally compare `sha256sum`
on both hosts to catch a wrong/incomplete transfer. Hash equality is a transport
check; authenticated decryption during restore is the archive integrity check.
Do not send the passphrase alongside the archive in the same message.

## 3. Review the exact target replacement

On the **target** server, enable manual maintenance and keep any required target
rollback Clone independently available:

```bash
./flow-steward maintenance enable --confirm
./flow-steward maintenance status
./flow-steward release info
./flow-steward doctor
./flow-steward clone restore backups/NAME.fsclone
```

Enter the source archive's passphrase privately. Before destructive changes,
restore authenticates the archive, validates manifest/path allowlists,
checksums, sizes, profile/platform and space, resolves the exact release, and
prints the target-bound plan. Verify the target installation ID, profile,
public host, retained ports/networks/TLS/filesystem roots and PostgreSQL identity,
replacement classes and external-effect warnings. Secret values are not shown.

The confirmation is bound to the target installation, profile, public host and
plan digest. Type the exact value printed by the command. A generic `--confirm`
or a guessed hostname is not a substitute. Declining leaves target product
state untouched; preflight may use private temporary staging, which is cleaned.

For **Scalable's retained CLI**, the unattended review-first workflow is:

```bash
review_status=0
secret-command | ./flow-steward clone restore backups/NAME.fsclone \
  --passphrase-stdin --non-interactive || review_status=$?
if [ "$review_status" -eq 0 ]; then echo "Unexpected review success" >&2; exit 70; fi
if [ "$review_status" -ne 10 ]; then exit "$review_status"; fi

# Only after reviewing the plan; substitute its exact printed confirmation:
secret-command | ./flow-steward clone restore backups/NAME.fsclone \
  --passphrase-stdin --non-interactive --confirm '<printed-target-or-plan-value>'
```

Exit `10` on the first invocation is the expected review-only cancellation.
Any other nonzero status is a failure to investigate, not permission to continue.
The second invocation authenticates the archive again and requires the same
reviewed plan to remain valid.

Compact's host launcher rejects explicit `--non-interactive` restore without a nonempty `--confirm TARGET` before dispatch (exit `2`), so that Scalable review command does not produce a Compact review token. Do not guess a target-bound confirmation or treat exit `2` as review success. On Compact, use the interactive `./flow-steward clone restore backups/NAME.fsclone`, enter the passphrase privately, inspect the printed target plan and decline the confirmation to finish a review-only pass. Only after reviewing an actual plan may a later noninteractive invocation pass its exact printed confirmation. An interactive cancellation in the canonical CLI returns `10`; preflight/launcher errors are separate failures. If no valid review value was printed, stop and investigate rather than inventing one.

## 4. Restore and verify while maintenance stays on

Confirmed restore journals phases that stop target services, replace product
state, restore the database and related state, regenerate derived configuration,
activate the archived release, start in maintenance, and check parity/readiness.
The operation can replace a populated target and can activate an older archived
official release when its schema is understood and the exact release is
available. This is distinct from ordinary release upgrade's downgrade refusal.

After successful completion, on the target run:

```bash
./flow-steward maintenance status
./flow-steward release info
./flow-steward status
./flow-steward doctor
```

Intentionally enabled maintenance can appear as `maintenance_left_enabled` in
doctor. Do not auto-fix it while validating. Check business records/counts,
credential decryption, extensions, artifact reads/hashes, broker state, public
TLS/routing, login and applicable API/MCP access. Review schedules, polling,
mail/notifications, inbound webhooks, OAuth callbacks, provider allowlists,
shared object storage and all copied external credentials before permitting
work. Maintenance is not a substitute for reviewing those external effects.

If the public domain is moving unchanged, validate the target before switching
DNS, for example with a private hosts-file mapping or:

```bash
curl --resolve flow.example.com:443:TARGET_IP --fail https://flow.example.com/health/ready
```

Replace `TARGET_IP` with the target's address. This preserves the domain/TLS
name while reaching the selected server. Use a browser mapping for login tests.
Clone does not change DNS or routing.

If the target has a different domain, that target domain remains in place.
Stored URLs and provider callbacks are not globally rewritten. Prefer installing
the target with its intended final hostname; on Compact do not copy a Scalable
`config set`/`config apply` example, because those retained-CLI commands are not
available. Validate the supported profile-specific change process separately
if the hostname must change later.

After checks and the traffic-switch decision, reopen **only the selected
active target**:

```bash
./flow-steward maintenance disable --confirm
```

Keep the old source in maintenance. Run one small, controlled workflow and
verify its records and external effects before considering the migration
accepted. Retain the source archive, target rollback archive where applicable,
passphrases, exact release/image identities, operation log and verification
record according to your recovery policy.

## Interrupted restore and rollback

Wrong passphrases, corrupt/unsafe archives, incompatible profiles/platforms,
missing exact releases and other preflight failures refuse replacement. Correct
the reported prerequisite and retry; do not weaken validation or substitute a
different image set.

After mutation starts, keep maintenance enabled and use the exact recovery
command and operation ID printed by the failed restore. The resume option is:

```bash
./flow-steward clone restore backups/NAME.fsclone --operation-id PRINTED_OPERATION_ID
```

Use the original archive/passphrase and the command's requested confirmation.
The real operation ID must match the interrupted target plan; do not invent one.
Proven completed phases can be skipped; unproven phases are rerun idempotently.
If staging was removed, re-authentication may be required. Do not manually start
services or disable maintenance after a failed restore. There is no automatic
transaction that rolls back every replaced resource.

Before the new target accepts writes, routing back to the old maintained source
can preserve the source snapshot's consistency. Once the target accepts writes,
a DNS switch back can lose/diverge those writes: use an explicit reverse Clone
or another reconciled recovery plan. To recover the pre-existing target's
complete product state, use its separately captured rollback Clone; a PostgreSQL
backup alone cannot restore broker/files/artifacts. See
[Backups and Restore](backups-and-restore) and [Rollback Runbook](rollback).
