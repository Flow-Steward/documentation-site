---
sidebar_position: 6
title: Workflow Runtime
description: Runtime model behind workflow phases, steps, agents, tools, and datasets.
---

# Workflow Runtime

The workflow runtime executes the contracts authored in the UI and registry.
Developer Platform pages should explain how the runtime interprets those
contracts, while the User Guide explains how operators create and run them.

## Runtime objects

| Object | Runtime responsibility |
|---|---|
| Workflow | Selects phases, step graph, entrypoints, and project bindings. |
| Phase | Groups ordered or connected steps. |
| Step | Executes one unit of work. |
| Agent step | Runs an AI role with skill/tool context. |
| Connector step | Invokes a tool or extension action. |
| Dataset query step | Reads scoped data exposed through datasets. |
| Transform step | Applies a deterministic configured transformation. |
| Tabular feed step | Processes bounded tabular input with feed-specific limits. |
| Job | Tracks execution state, logs, messages, approvals, errors, and result. |

## Design principles

- The UI should make workflow intent clear.
- The runtime should enforce scope, contracts, and approvals.
- Tools should be explicit executable capabilities.
- Skills should remain human-readable agent abilities.
- Dataset access should go through datasets, not raw data connections.
- Control-flow steps should make branch outcomes inspectable.

## Step contracts

Every step kind should define:

- configuration fields;
- required inputs;
- produced outputs;
- retry/failure behavior;
- approval behavior;
- how it appears in job logs and messages.

See [Workflow Step Kinds](../reference/workflow-step-kinds) for the current
step-kind list.

Validation checks schema, references, types, selectors, and graph constraints;
it does not execute the workflow. Simulation and UI Test Run can still reach
configured connectors, HTTP endpoints, models, child workflows, and other
external systems unless the selected capability explicitly implements a dry-run
contract. Treat them as execution modes, not automatic sandboxes.

At runtime, phases and gates produce durable journal entries. Parallel lanes,
nested workflows, retries, approvals, resumptions, replays, and restarts retain
distinct identities. Use job logs, messages, errors, events, artifacts,
decision overrides, and the runtime journal together when diagnosing
a failure; no single projection is a complete execution history.
