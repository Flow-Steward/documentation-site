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
- workflow validation and contracts;
- job diagnostics and controls;
- operational report generation/retrieval and installation diagnostic reports;
- release checks and upgrades;
- extension scaffolding and validation;
- test and quality gates.

For contributor verification, see
[Quality And Testing](quality-and-testing). For logs, backups, retention,
workspace artifact pruning, and prompt debug traces, see
[Operations Internals](operations-internals).

## Launchers

From the deployment or development host, as the checkout/deployment owner:

```bash
./flow-steward --help
```

The launcher uses Docker: Scalable selects its retained `fs-cli` runtime;
Compact dispatches supported commands into its platform/product runtimes and
refuses families requiring absent services. It is not a host-virtualenv command
and is not supported from inside `fs-app`. Contributors
who need a direct Python entry point for isolated parser tests must use the
specific module documented by that test, not the installed launcher.

## Developer usage principles

- Prefer UI docs for user workflows.
- Prefer CLI docs for repeatable setup, diagnostics, CI, and automation.
- Keep examples copy-pasteable.
- Show Docker and host variants when both are common.
- Use `--help` for discovery before relying on memory.

See [CLI Reference](../reference/cli) for the command catalog.
