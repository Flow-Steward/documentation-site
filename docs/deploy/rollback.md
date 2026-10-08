---
sidebar_position: 11
title: Rollback Runbook
description: Choose a bounded recovery path and preserve evidence before reversing a Flow Steward change.
---

# Rollback Runbook

There is no single operation that rolls back every Flow Steward layer. A
PostgreSQL restore replaces database state but does not reverse object-storage
changes, queue deliveries, provider calls, notifications, webhook deliveries,
workspace files, logs, extension files, or model usage.

## Stabilize first

1. Identify the failed release, configuration, extension, workflow, or data
   change.
2. Enable or retain Maintenance Mode to stop new admissions and drain admitted
   work:

   ```bash
   ./flow-steward maintenance enable --confirm
   ./flow-steward maintenance status
   ```

3. Capture health, stack state, active jobs, queues, events, logs, image pins,
   storage identity, and the current database backup.
4. Inventory effects that occurred after the proposed recovery point.
5. Select the narrowest recovery that addresses the failure.

## Narrow recovery options

Prefer one of these when it is sufficient:

- on Scalable, restore the previous validated configuration with the lifecycle recovery
  details reported by `config apply`;
- disable an affected workflow or extension;
- revoke a compromised token;
- cancel, retry, replay, or restart only jobs that meet the documented action
  prerequisites;
- redrive only failed/dead-lettered events whose external effects are safe;
- follow the recorded release/installer recovery procedure for the exact image
  and database state, rather than changing image pins in isolation.

Ordinary official `release upgrade` rejects downgrades. A target-bound Clone
restore can activate an older archived official release when its contract and
exact images are compatible; this replaces product state as well as code. See
[server migration and rollback](diagnostics-and-migration#interrupted-restore-and-rollback).

The selected application source does not contain a complete, independently
verified generic image-rollback procedure. Do not improvise a database downgrade
or claim that changing one image variable is sufficient.

## Database recovery

If database restore is required, follow [Backups And Restore](backups-and-restore).
The key is `FS_BACKUP_ENCRYPTION_KEY`, and the internal restore script uses
destructive database-replacement semantics. Reconcile all non-database assets and
post-backup external effects separately.

## Resume deliberately

After the selected recovery:

```bash
./flow-steward status
./flow-steward doctor
./flow-steward maintenance status
```

On Scalable also run `./flow-steward stack status`. Compact has no retained
`stack` command; use its status/doctor results and host or provider container
evidence. For provider Compact, follow the provider-specific restore process;
the host Compose restore helper does not run inside its service console.

Use plain `doctor` while intentionally retaining maintenance. An unqualified
`doctor --fix` can include `maintenance_left_enabled` and reopen admissions.

Verify database parity, storage access, queues, jobs/events, role-image
provenance, public route, MCP, worker/control health, and one low-risk local
workflow. Only then run:

```bash
./flow-steward maintenance disable --confirm
```

This runbook is source-checked but no destructive rollback or restore was
performed for this documentation pass.

## Related pages

- [Backups And Restore](backups-and-restore)
- [Upgrade Reference](../reference/upgrade)
- [Events And Redrive](../admin/events-and-redrive)
