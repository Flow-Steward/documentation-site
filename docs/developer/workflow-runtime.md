---
sidebar_position: 6
title: Workflow Runtime
description: Runtime model behind workflow graphs, containers, steps, agents, tools, and datasets.
---

# Workflow Runtime

The workflow runtime executes the contracts authored in the UI and registry.
Developer Platform pages should explain how the runtime interprets those
contracts, while the User Guide explains how operators create and run them.
The behavior described here reflects the current main source.

## Runtime objects

| Object | Runtime responsibility |
|---|---|
| Workflow | Defines steps, containers, an execution graph, and input/output contracts; runs use project bindings and scope. |
| Group | Runs a body once, using a sequence or parallel lanes. |
| For each | Runs a body over input items, tracking item and container execution state. |
| Step | Executes one unit of work and reports an outcome for graph routing. |
| Agent step | Runs an AI role with skill/tool context. |
| Connector step | Invokes a tool or extension action. |
| Dataset query step | Reads scoped data exposed through datasets and saved query templates. |
| Transform step | Applies a deterministic configured transformation. |
| Tabular feed step | Processes tabular input through the Artifact/Dataset Plane. |
| Job | Tracks execution state, logs, messages, approvals, errors, and result. |

A run executes a pinned workflow definition, not the live registry definition.
Its checkpoint carries a snapshot reference with a revision and digest. Missing
or mismatched archived definitions stop the run rather than falling back to the
current workflow. An incompatible runtime state version requires a new run.

The run cursor follows the execution graph edge for a step's reported outcome.
It tracks the active step, logical execution ID, attempt, and container frames;
step sort order does not determine routing.

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
it does not execute the workflow. Simulation validates the workflow and returns
a deterministic task classification and step preview without executing workflow
steps. UI Test Run executes the selected workflow or step and can reach
configured connectors, HTTP endpoints, models, child workflows, and other
external systems. Treat Test Run as execution, not an automatic sandbox. The
workflow Test Run API's explicit `dry_run` option validates and previews the
materialized input envelope without executing the workflow.

## Execution diagnostics

Step results identify the execution and attempt they answer. Failures and
approval decisions produce structured orchestrator journal entries. The job
runtime journal combines job metadata, orchestrator journal entries, selected
events, and agent messages; its query returns at most 500 entries.

Use job logs, messages, errors, events, artifacts, approval decisions, and the
runtime journal together when diagnosing a failure. Diagnostic messages may
summarize large step outputs, so they are not a complete copy of runtime state
or execution history.
