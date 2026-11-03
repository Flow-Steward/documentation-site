---
sidebar_position: 13
title: Registry Management
description: Understand the registry screens that manage reusable Flow Steward objects.
---

# Registry Management

The registry is the control room for reusable automation objects. A job uses
registry records at runtime, but the registry itself is where operators and
admins decide what is available.

Registry read access requires operator or admin capability; a viewer should not
be directed to these routes. Authoring and protected detail screens can require
admin even when an operator can read a list.

## Registry sections

| Section | What it manages |
|---|---|
| Agents | AI roles used by workflow steps. |
| Skills | Reusable abilities and input/output contracts. |
| Tools | Executable tool definitions. |
| MCP | External MCP catalogs and allowlisted tools. |
| Workflows | Executable delivery plans. |
| Data Connections | Source connection definitions and health. |
| Datasets | Scoped data access for projects and workflows. |
| Workspaces | Client/team boundaries, child projects, workspace data connections, and datasets. |
| Guardrails | Policy records that constrain automation. |
| Changelog | Registry change history at `/registry/changelog`. |

Flow Steward also has system-managed schema primitives such as data contracts,
fields, and published blocks. Their current registry screens are available for
inspection at `/registry/data-contracts`, `/registry/fields`, and
`/registry/published-blocks`; direct editing is disabled. They are not normal
operator or administrator authoring tasks.

## Create a registry object

As an admin, most editable registry list pages follow the same pattern:

1. Open `Registry`.
2. Choose the object type.
3. Click the create action.
4. Fill in the required identity fields, description, and configuration shown for that object type.
5. Save.
6. Open the detail page where available.
7. Add contracts, assignments, or related records supported by that object type.
8. Run a low-risk workflow or test action before relying on the object.

Agents and skills are disabled by default. Enabling them requires passing
contract readiness validation; dependent enabled workflows can prevent disabling
them later.

## IDs and names must be unique

Agents, skills and workflows keep the ID you enter. On current main, Flow Steward
refuses to create an agent or skill with an ID that is already taken, including
IDs held by records in Trash or records you cannot see. It also refuses to
create or rename an agent, skill or workflow to a display name already used by
another visible object of the same type. Names are compared ignoring case and
extra spaces. Keeping the current name does not prevent editing other fields,
even if older duplicates exist.

A conflict response lists visible matches and suggests a free ID or name;
there may be no visible match for a taken ID. Nothing is renamed automatically
and the suggestion is not reserved. Agent and skill ID conflicts use
`registry_id_conflict`; display-name conflicts use `registry_name_conflict`.
The display-name rule also applies to workflow draft save and converting a
group to a child workflow. The UI, HTTP API and MCP authoring tools report these
conflicts. Open a listed match to reuse it, or choose another ID or name.

## Use the changelog

Open `/registry/changelog` when you need to understand why behavior changed,
or use an object's **Changelog** tab where available. Look up the entity type
and entity ID, then compare the changed fields.

Good use cases:

- an agent started producing different output;
- a skill input disappeared;
- a workflow route changed;
- a dataset scope was widened or narrowed;
- a guardrail changed before a failed job.

## Find an object and narrow scope

Use the search on the relevant registry list, then narrow by the filters shown
on that surface, such as status or category. Use workspace/project context where
available. Open the exact record and verify its stable ID before changing a
similarly named object. Search results are discovery aids; role and scope checks
still govern the detail page.

## Apply a guardrail

[![Guardrail detail showing project scope, agent scope, rule configuration, and severity](/img/screenshots/2026-10-04/guardrail-scope-and-severity.png)](/img/screenshots/2026-10-04/guardrail-scope-and-severity.png)

*A synthetic draft guardrail captured on 2026-10-04. The screenshot shows configuration fields; it does not demonstrate a passing or blocked workflow run.*

[![Guardrail Agent Scope tab with one selected agent and two available agents](/img/screenshots/2026-10-04/guardrail-agent-scope.png)](/img/screenshots/2026-10-04/guardrail-agent-scope.png)

*The 2026-10-04 capture recorded an existing synthetic assignment and an editor requiring explicit agent scope. No assignment was changed or saved during capture. These are historical capture observations, not verification of a current deployment.*

Open `Registry > Guardrails` and review the deterministic rule configuration:
`forbidden_patterns` checks agent output for case-insensitive regular-expression
matches, while `required_sections` checks for configured headings, keywords, or
supported structured output fields. These checks skip empty output when there
is nothing applicable to inspect; they do not independently guarantee a
complete response.

Set **Project Scope** to Global or one project, then use **Agent Scope** to
assign at least one explicit agent. Project scope alone is not enough; the
editor does not expose a workflow-scope or generic action selector. Agent scope
cannot be saved until assignment choices have loaded and unavailable references
have been removed.

Choose severity deliberately. **Warning** records a violation without blocking
the step. **Error** prevents accepting the violating result: the runtime retries
within the step's guardrail budget, then escalates if violations persist.
Checker failures are logged and are non-blocking, so the absence of a blocked
result alone does not prove that a check ran successfully.

Save the configuration and agent scope, then run one controlled case that
should pass and one that should violate the rule with an assigned agent.
Diagnose the result from the job's guardrail events and evidence before
weakening policy; a blocked Error result can be the expected safe outcome.

The editor also offers **Semantic** mode with an AI condition. Workflow and
step test runs skip semantic checks, so those test actions cannot verify
semantic enforcement. Use a controlled normal workflow run when evaluating a
semantic rule.

## Restore from trash

Admins can open `System > Trash` to inspect soft-deleted registry records and
restore records removed accidentally. Review deletion impact before hard
deletion, and plan it only after dependent workflows, projects, and jobs no
longer need the records.
