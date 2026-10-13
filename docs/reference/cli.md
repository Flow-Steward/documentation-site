---
sidebar_position: 1
title: CLI Reference
description: The schema-driven public Flow Steward CLI and profile-specific operator paths.
---

# CLI Reference

This reference covers the 101 public command specifications in
`core/application/management/command_specs/registry.py`, verified against the
current application checkout. The installed version's help is the exact option
contract. Run commands from the deployment host, as its owner:

```bash
./flow-steward --help
./flow-steward <command> --help
./flow-steward <domain> <command> --help
```

The host launcher selects the Docker-managed runtime and validates lifecycle
identity. Do not run it inside `fs-app`.

## Common behavior

- Plain, line-oriented interaction is the default, including bare
  `./flow-steward`. `--tui` opts in to full-screen forms/rich output;
  `--plain` overrides it. Doctor diagnostics remain line-oriented.
- Interactive mode collects missing fields and reviews change plans.
- `--non-interactive` refuses missing required input rather than prompting.
- `--json` normally returns the versioned `flow-steward.cli.v1` envelope.
  The Docker-host installation `./flow-steward doctor` is the exception and
  returns its `flow-steward.doctor.v1` diagnostics contract. The Compact
  container-native `flow-steward doctor` is a different, core-readiness command.
- Commands exposing `--input-json` read their declared non-secret command fields
  from a JSON object file (`-` for stdin). Unknown and secret fields are rejected;
  explicit CLI options take precedence over JSON values.
- Use documented secret file/stdin channels; never put secrets in shell history.
- Mutating operations may require a reviewed plan and leaf-level `--confirm`.
  Confirmation does not supply missing input or bypass policy.

Stable schema-driven CLI exit codes are `0` success, `2` syntax, `3` validation,
`4` precondition, `5` permission, `6` conflict, `7` dependency, `8` stable
failure, `9` recovery required, `10` interrupted, and `70` internal error.
Host bootstrap/doctor paths also report their own documented installation
findings; read the returned message rather than treating every nonzero exit alike.

## Command inventory

| Domain | Commands |
|---|---|
| Root | `status`, `doctor`, `proxy-fragment` |
| Stack | `stack status`, `start`, `stop`, `restart`, `rebuild`, `logs` |
| Environment | `environment show`, `switch` |
| Maintenance | `maintenance status`, `enable`, `disable` |
| Release | `release info`, `check`, `upgrade` |
| Backup | `backup create`, `list`, `verify` |
| Clone | `clone create`, `restore` |
| Configuration | `config show`, `validate`, `set`, `apply` |
| Users | `users list`, `create`, `set-password`, `force-reset`, `unlock`, `set-active`, `set-roles`, `issue-bootstrap-token` |
| Extensions | `extensions list`, `show`, `health`, `install`, `uninstall`, `enable`, `disable`, `create`, `validate`, `test`, `bundle`, `lock-deps` |
| Projects | `projects list`, `show`, `notification-routes`, `notification-deliveries`, `dispatch-notification` |
| Workflows | `workflows list`, `entrypoints`, `validate`, `contract`, `suggestions` |
| Jobs | `jobs list`, `show`, `status`, `logs`, `messages`, `errors`, `approve`, `reject`, `ack`, `unack`, `cancel`, `restart`, `health-snapshot` |
| Reports | `reports generate`, `get`, `diagnostics` |
| Database | `database status`, `upgrade`, `bootstrap-seed`, `generate-migration`, `query-diagnostics`, `tune-env`, `restore-parity-capture`, `restore-parity-verify` |
| Testing | `testing smoke-test`, `nightfire-regression`, `fuzz-api`, `fuzz-mcp`, `fuzz-ui`, `cutover-preflight`, `cutover-smoke` |
| Quality | `quality verify`, `lint`, `check-ci-excludes`, `check-naming`, `release-gate`, `sonar-export-issues`, `sonar-ensure-rules`, `sonar-generate-backlog` |
| Localization | `localization bootstrap-catalog`, `rebuild-pot`, `init-locale`, `update`, `compile`, `validate-keys` |

There are no public task-submit, workflow-run, project code-index/reindex, or
`setup-codex-mcp` commands. Start explicit runs through the API, MCP, or a
configured trigger; use CLI workflow commands for discovery and validation.
The old `tooling db/ops/testing/quality/extensions/i18n` paths are not public
commands; use the domains above.

Command presence does not guarantee dispatch on both profiles. Scalable uses
its retained CLI runtime. Compact dispatches supported platform/product commands
through its own runtimes and refuses commands requiring absent retained,
tooling, or delegated services. Check the installed launcher's profile-specific
help; do not bypass a refusal by running it inside an application container.

## Doctor and configuration

`doctor` inspects installation findings without applying repairs. Review the
named repair plan before running:

```bash
./flow-steward doctor
./flow-steward doctor --fix <reported-check-id>
# Only after reviewing an unattended repair:
./flow-steward doctor --fix <reported-check-id> --confirm
```

Doctor does not promise to repair every finding and refuses repairs while
another installation operation owns the lock.

Inside a Compact provider/container console, `flow-steward doctor` reports core
readiness through the native management CLI. It does not diagnose the Docker-host
installation and does not accept `--fix`. A successful native result is not
evidence that host configuration, image provenance, volumes, proxy routing, or
startup integration passed installation checks.

On Scalable, configuration edits are staged, not applied by a restart:

```bash
./flow-steward config set --public-host flow.example.test --public-port 443
./flow-steward config validate
./flow-steward config apply --confirm
```

Use typed `public_host`/`public_port` settings, not a raw
`FS_PUBLIC_BASE_URL` option. The runtime URL is generated from configuration.
Do not assume the retained `config` family is available on Compact.

## Installation diagnostic report

From the deployment host, collect an installation report for a bug report:

```bash
./flow-steward reports diagnostics
```

This bare host-launcher call adds host/Docker/container and doctor facts to the
runtime report and saves a successful result to
`.flow-steward/diagnostics/flow-steward-diagnostics-<UTC>.json` (or `diagnostics/`
under the configured installer-state directory). The filename uses a UTC
`YYYYMMDDTHHMMSSZ` timestamp. This installation file is separate from persisted
operational reports produced by `reports generate`.

Explicit `--json`, `--plain` or `--input-json` selects ordinary runtime output
and bypasses the host enrichment/file-save wrapper. For example:

```bash
./flow-steward reports diagnostics --json
```

That command does not automatically collect the host facts or save the enriched
file. See [Diagnostics And Migration](../deploy/diagnostics-and-migration) for
installation diagnosis and repair procedures.

## Release and Clone

`release info` reads durable installed state. `release check` discovers published
stable GitHub Releases; `release upgrade` selects an exact release with
`--target-version`, supports `--dry-run` and `--timeout-seconds`, and requires
enabled maintenance. Backup and database migrations are explicit operator
actions. A source installation reports its source commit, not an invented
official version; transitioning to an official release is explicit and confirmed.
See [Upgrade Reference](upgrade).

`clone create` captures allowlisted product state in an encrypted `.fsclone`
archive. `clone restore <archive>` destructively replaces that state on an
already installed target. Both require fully enabled manual maintenance,
matching profiles, and a compatible Linux CPU platform. Both source and target
must have verified official installed identities. A checkout source installation
must complete its explicit official release transition before Clone is available.

Restore preserves target-local domain, ports, TLS, and installation identity.
It activates the archive's exact official release through the shared release
contract. External S3 objects and provider systems are not copied. Maintenance
remains enabled after restore.

Use a secure prompt or `--passphrase-stdin`, never a passphrase argument.
Restore requires the exact target-bound confirmation printed by its review;
`--operation-id` resumes a matching interrupted restore. See
[Backups And Restore](../deploy/backups-and-restore#installation-clone) for the
review/restore sequence and external-effects boundary.

For end-to-end diagnosis, repair, and installation Clone procedures, see
[Diagnostics And Migration](../deploy/diagnostics-and-migration).

## Database migrations

`database upgrade` is a mutation, not a readiness check or an automatic part of
release upgrade. Inspect the launcher's help and database state first:

```bash
./flow-steward database upgrade --help
./flow-steward database status
```

On Compact, the host launcher's database help is the profile's restricted help
page, not the full schema-driven per-command help. Do not infer that every
database command in the inventory is supported there.

Before applying SQL, review the matching release's instructions, verify a
current backup and recovery assets, enable manual maintenance, wait for writers
to stop, and confirm the target installation. Only then run:

```bash
./flow-steward database upgrade --author operator --maintenance-confirmed --confirm
```

`--maintenance-confirmed` asserts that writers are stopped and a verified backup
exists; it does not create that backup or enable maintenance for you. Keep
maintenance enabled after failure and until post-update verification passes.

| Database command outcome | Public exit | Meaning |
|---|---|---|
| Upgrade completes | `0` | Inspect the result and verify the post-update state before reopening work. |
| Invalid syntax or a launcher-required consent option is missing | `2` | No successful migration is established; correct the reported usage first. |
| SQL fails, or migration safety checks reject checksum drift, empty/template-only files or an unresolved non-transactional marker | `9` | Recovery/inspection is required before retrying; never treat this as success. |

These are not the installer's schema-preflight error exits. Authentication,
dependency, confirmation and other launcher prerequisites can fail separately;
read the actual returned context rather than assuming every nonzero exit is `9`.

The 1.0 database baseline is `db/schema/`; post-1.0 migrations are ordered SQL
files under `db/migrations/`, tracked in `public.platform_schema_migrations`.
A database without a ledger must match the canonical baseline before it is
stamped; upgrade does not replay the whole baseline DDL. Pre-1.0 development
databases are refused rather than carried into 1.0: create a separate clean
installation, not a destructive reset of the existing data.

A transactional migration failure rolls back that migration and its tracking
insert, not previously committed migrations. A non-transactional failure can
leave partial effects and a durable in-progress marker. Inspect and reconcile
that state before retrying; do not clear the marker or claim an automatic
rollback. See [Installation and Updates](../user/installation-and-updates) for
the separate installer schema-preflight outcomes and update procedure.

## Safe discovery

```bash
./flow-steward status --json
./flow-steward projects list --help
./flow-steward workflows contract --help
./flow-steward jobs logs --help
./flow-steward extensions validate --help
./flow-steward release upgrade --help
./flow-steward clone restore --help
```
