---
sidebar_position: 4
title: CLI And Automation
description: How developers and operators use the Flow Steward CLI.
---

# CLI And Automation

The CLI is a developer and operator surface. It should not be mixed into the
User Guide unless a user task specifically needs a command fallback. Deployment
runbooks belong in Deploy & Run.

Use the CLI for:

- bootstrap and database operations;
- user and role management;
- project inspection and notifications;
- workflow validation, contracts, runs, change sets, hooks, and YAML export/import;
- job diagnostics and controls;
- operational report generation/retrieval and the installation diagnostic report
  (`reports diagnostics`), the file to attach to a bug report;
- release checks and upgrades;
- extension scaffolding and validation;
- test and quality gates.

For contributor verification, see
[Quality And Testing](quality-and-testing). For logs, backups, retention,
workspace artifact pruning, and prompt debug traces, see
[Operations Internals](operations-internals).

## Launchers

From the deployment or development host, as the non-root checkout/deployment owner
without `sudo`:

```bash
./flow-steward --help
```

The launcher uses Docker. Scalable routes lifecycle commands to its retained
`fs-cli` runtime, product commands to `fs-app`, and tooling commands to dedicated
services. Database commands on Scalable use a one-shot container of the configured
`fs-app` image so they can access that image's migrations. Compact dispatches
supported commands into its platform/product runtimes and refuses commands
requiring absent services, including retained-CLI operations such as `config` and
`stack`.

Run this launcher on the host. It is not a host-virtualenv command
and is not supported from inside `fs-app`. Contributors
who need a direct Python entry point for isolated parser tests must use the
specific module documented by that test, not the installed launcher.

## Automation

For schema-driven product commands, use `--json` for machine-readable output and
`--non-interactive` to make unattended intent explicit:

```bash
./flow-steward projects list --json --non-interactive
```

JSON mode disables prompts. Plain text is the default; `--tui` explicitly opts
into full-screen forms and rich output. Commands requiring review still need
confirmation in unattended runs. Check the command's `--help`: `--confirm` is
either a flag or requires the exact canonical confirmation value printed after
review, depending on the command.

Commands exposing `--input-json` accept a JSON object of non-secret fields;
explicit command options override values from that input. Use the supported
field-specific `--<field>-stdin` or `--<field>-file` options for secrets.

## Developer usage principles

- Prefer UI docs for user workflows.
- Prefer CLI docs for repeatable setup, diagnostics, CI, and automation.
- Keep examples copy-pasteable.
- Show Docker and host variants when both are common.
- Use `--help` for discovery before relying on memory.

See [CLI Reference](../reference/cli) for the command catalog.
