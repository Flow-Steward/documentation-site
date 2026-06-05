---
sidebar_position: 2
title: Core Concepts
description: The main product objects used across Flow Steward.
---

# Core Concepts

Flow Steward is easiest to understand as an operator workspace around projects,
jobs, workflows, agents, and extension-backed tools.

## Workspace

A workspace is the operator context for navigation, search, projects, jobs,
registries, datasets, connections, guardrails, and system settings.

## Project

A project is a delivery target. In local development, the optional
`tooling db self-project` command can register the Flow Steward repository as a
project so MCP code search and blast-radius tools can work against the platform
codebase.

## Job

A job is a tracked unit of work. Jobs can be in progress, awaiting approval,
completed, failed, blocked, interrupted, cancelled, or restarted by operators.

## Workflow

A workflow is an executable plan made of phases and steps. Workflows can combine
deterministic steps, AI-assisted planning, tool calls, approvals, and failure
paths.

## Agent

An agent is an AI role that participates in delivery. Agents can plan, implement,
review, operate tools, or coordinate follow-up work depending on the workflow.

## Tool

A tool is an executable capability exposed to the runtime. Tools can be local,
MCP-backed, generated, or provided through extensions.

## Skill

A skill is the public product term for a reusable agent ability. Internally, some
runtime surfaces may still use `capability` while the repository converges on the
public naming.

## Extension

An extension is an out-of-process provider bundle. Flow Steward discovers,
validates, enables, and invokes extension contracts without importing provider
Python modules into the core server process.

## Approval

Approval gates keep humans in control of important transitions such as starting,
resuming, cancelling, retrying, or applying generated work.
