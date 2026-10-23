---
sidebar_position: 2
title: Core Concepts
description: The main product objects used across Flow Steward.
---

# Core Concepts

Flow Steward is easiest to understand as an operator workspace around reusable
building blocks. A workspace groups a client, team, or operating boundary. A
project represents a specific delivery target inside that boundary. A workflow
runs a job. A job uses agents. Agents use skills and tools. Tools may come from
the built-in registry, MCP catalogs, or extensions. Datasets give workflows
controlled access to structured data.

This page explains the product model before the step-by-step guides.

## Workspace

A workspace is the top-level operating context. Use it for a client,
department, team, environment, or other boundary where projects share operating
rules and data governance.

For example, one client workspace can contain separate projects for a CRM,
public website, internal service, and data pipeline. The workspace keeps those
projects together while still letting each project have its own workflows,
rules, jobs, datasets, notification routes, and policy.

Workspaces group:

- projects;
- workspace data connections;
- datasets that are shared with all projects or assigned to specific projects;
- registry objects that should be managed together;
- workspace-level navigation, search, and lifecycle decisions.

Use separate workspaces when teams need separate data boundaries, provider
access, operational ownership, or client separation.

## Project

A project is a delivery target. It is the thing Flow Steward works on: a
repository, service, customer workspace, operational target, or other bounded
unit of work.

Projects can have operational rules, workflow bindings, notification routes,
policy, datasets, project data-connection assignments, queue state, and runtime
history.

| Level | Typical question | Example |
|---|---|---|
| Workspace | Which client, team, or operating boundary owns this? | `Acme Corp` |
| Project | Which target is Flow Steward working on? | `CRM`, `public website`, `billing service` |
| Workflow | Which repeatable process should run? | `Bugfix`, `release review`, `data enrichment` |
| Job | What happened in this one execution? | `Fix login redirect on CRM` |

## Job

A job is one execution. It can be created by an explicit workflow launch, a configured trigger,
a webhook, an MCP call, or an administrator Test Run.

Jobs are where operators see runtime evidence:

- current status;
- selected workflow;
- current agent;
- logs;
- agent messages;
- connector messages;
- errors;
- approvals;
- artifacts;
- cost and trace data.

## Workflow

A workflow is a set of steps connected by one execution graph, with Groups,
parallel lanes, For each loops and hooks where needed. It defines the order of
work and which step runs after each outcome.

Workflows can combine:

- agent work;
- connector or tool calls;
- HTTP calls;
- dataset queries;
- conditional branches;
- loops and batches;
- child workflow invocation;
- success and failure stops;
- human approval steps;
- hooks where each project adds its own steps.

Use workflows when a process should be repeatable and observable.

## Agent

An agent is an AI role. It is not just a model setting; it is the product object
that describes who is doing the work.

An agent usually includes:

- identity, display name, and role;
- instructions;
- linked skills;
- tool access through workflow steps or registry contracts;
- expected inputs and outputs;
- behavior settings such as determinism or operating mode;
- history.

Examples: analyst, planner, reviewer, validator, incident responder. These are
user-defined roles, not built-in code-writing capabilities.

Use agents to make workflow logs readable. A job timeline should make it clear
which role produced each decision or artifact.

## Skill

A skill is a reusable ability an agent can perform. Skills describe what kind of
work the agent is allowed or expected to do.

Examples: analyze an input dataset, classify a request, review evidence,
generate a report, reconcile records, or handle an incident. Provider actions
require separately installed and authorized tools or extensions.

Skills usually define:

- instructions or purpose;
- required inputs;
- produced outputs;
- linked agents;
- validation;
- history.

### Agent vs skill

| Concept | Question it answers | Example |
|---|---|---|
| Agent | Who is doing the work? | `analyst` |
| Skill | What ability is being used? | `analyze_dataset` |

One agent can have many skills. One skill can be used by many agents if the
workflow and registry allow it.

## Tool

A tool is an executable capability. Tools perform concrete actions or return
structured information.

Tools can be:

- built into the platform registry;
- discovered from an MCP connector;
- provided by an extension;
- used by connector workflow steps;
- exposed to agents through workflow/runtime policy.

Examples: job inspection, report generation, dataset queries, and installed
provider actions. File operations and test execution require tools that explicitly
provide them; these are not built-in code-delivery abilities.

### Skill vs tool

| Concept | What it is | Example |
|---|---|---|
| Skill | Human-readable agent ability | `Run QA` |
| Tool | Executable function or provider action | `test_runner.run` |

A skill may instruct an agent how to do QA. A tool may run the actual test
command. The distinction keeps reasoning, permissions, and execution separate.

## MCP

In the product UI, MCP means an external tool catalog that Flow Steward can call.
Flow Steward connects to a streamable HTTP MCP endpoint, syncs its tools, and
allowlists the tools that should be available.

Use MCP when another system already exposes capabilities as MCP tools and Flow
Steward should call them through a structured contract.

Flow Steward also ships its own built-in MCP server for IDEs and agents that
need to call Flow Steward tools. See [MCP Reference](../reference/mcp) for that
agent-facing surface.

## Input And Output Contracts

Inputs and outputs make registry objects understandable and testable.

| Object | Inputs | Outputs |
|---|---|---|
| Skill | Data the agent needs to perform the ability. | Data the skill should produce. |
| Agent | Context the role needs for a step. | Messages, artifacts, decisions, or structured fields. |
| Tool | Function arguments. | Function result or error envelope. |
| Workflow step | Step configuration plus state from previous steps. | State, artifacts, branch decisions, or stop result. |
| Dataset query | Dataset, resource, columns, filters, or query text. | Scoped rows or structured query result. |

Use contracts to avoid vague automation. A workflow author should be able to see
what a step needs and what later steps can consume.

## Data Connection

A data connection stores how Flow Steward reaches a data source. It belongs to a
workspace and includes the connector type, environment, endpoint fields,
credentials through secret references, and schema metadata.

Connections are not automatically exposed to every workflow.

## Dataset

A dataset is the safe, reusable data surface created from a workspace data
connection. It selects resources, columns, availability, and project access.

Use datasets instead of raw connections in workflows. That keeps data exposure
auditable and project-scoped.

Datasets can be available to all projects in the workspace or only to selected
projects. A project cannot attach a dataset from another workspace.

## Extension

An extension is an out-of-process provider bundle. Flow Steward discovers,
validates, enables, and invokes extension contracts without importing provider
Python modules into the core server process.

## Approval

Approval gates keep humans in control of important transitions such as starting,
resuming, cancelling, retrying, or applying generated work.

Approvals should include enough evidence for an operator to decide. A good
approval packet explains what will happen, why it is needed, and what artifacts
or logs support the request.

## Registry

The registry stores reusable product objects: agents, skills, tools, workflows,
MCP connectors, guardrails, datasets, and workspaces.

Some registry-backed primitives, such as data contracts, fields, and published
blocks, are system-managed. They support dynamic contracts and UI/runtime
behavior, but they are not normal objects for users or administrators to edit.

Registry changes can alter how future jobs behave. Treat them like operational
configuration, not like temporary job notes.
