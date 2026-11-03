---
sidebar_position: 7
title: Agents And Skills
description: Manage the AI roles and reusable capabilities used by workflows.
---

# Agents And Skills

Agents and skills define who does work and what that role is expected to know.
They are registry objects, so changes should be treated like product
configuration rather than one-off job state.

## Agent

An agent is an AI role. Examples include analyst, planner, reviewer, validator,
or incident responder. These are authored roles; they do not provide implicit
code-writing, shell, Git, or test-runner abilities.

Use an agent record to describe:

- the role's purpose;
- instructions and operating constraints;
- linked skills;
- model or behavior preferences;
- expected inputs and outputs;
- change history.

The base skill defines what the agent does. Secondary skills describe additional
abilities it may use along the way. An agent workflow step derives its skill
from the agent: runtime selection uses the base skill, falling back to the first
bound skill when no base skill is set.

## Skill

A skill is a reusable ability that an agent can apply in a workflow. Examples
include classifying requests, analyzing datasets, reviewing evidence, generating
reports, and handling incidents. External actions require separately installed
and authorized tools or extensions.

Use a skill record to describe:

- what the skill does;
- input fields the workflow or agent must provide;
- output fields the skill returns;
- which agents use the skill;
- validation and history.

## Tools

Tools are executable capabilities. Agents may reason about what should happen,
but tools perform concrete operations such as querying a scoped dataset,
generating a report, or invoking an installed provider action. Runtime provider
tools require enabled project ToolProvider bindings backed by enabled
`tool_provider` extensions. Assigning a skill does not itself grant tools:
effective tool IDs come from the agent's attached tools and workflow step
`add_tools` or `remove_tools` overrides.

Think of the relationship this way:

```text
Workflow step
  -> chooses an agent or connector
Agent
  -> follows instructions and uses skills
Skill
  -> describes the reusable ability and I/O contract
Tool
  -> executes a concrete function when the workflow allows it
```

The same skill can be useful with different tools. The same tool can be used by
different skills. Keeping them separate makes permission and behavior easier to
review.

## Create or edit an agent

[![Agents catalog with search, filters, and agent records](/img/screenshots/2026-10-04/agents-catalog.png)](/img/screenshots/2026-10-04/agents-catalog.png)

*The Agents catalog in a synthetic workspace on October 4, 2026. Screenshots on this page illustrate that dated fixture, not current provider availability.*

1. Open `Registry`.
2. Open `Agents`.
3. Choose `Agent` to create a new record, or open an existing agent.
4. Set the ID, display name, role description, and instructions. Agent IDs must start with a lowercase letter and contain only lowercase letters, digits, or underscores.
5. Define the agent's own inputs and outputs in `I/O`. Inherited skill and tool fields are read-only and show their source; editing the agent's own fields does not change shared skills.
6. In `Skills`, choose a base skill and any secondary skills, then choose `Save skills`.
7. Review allowed tools in `Tools` and save each edited section with its own save control.
8. Run a low-risk workflow to confirm the agent produces the expected messages
   and artifacts.

[![Agent Skills tab with base-skill and secondary-skill assignment controls](/img/screenshots/2026-10-04/agent-skills-assignment.png)](/img/screenshots/2026-10-04/agent-skills-assignment.png)

*This synthetic agent has no available skill assignment. The screenshot shows the exact empty-state controls; Save was not used.*

[![Agent Tools tab with allowed-tool assignment controls](/img/screenshots/2026-10-04/agent-tools-assignment.png)](/img/screenshots/2026-10-04/agent-tools-assignment.png)

*The Tools tab shows one available tool and no assignment. Save was not used.*

## Create or edit a skill

[![Skills catalog with search, filters, and skill records](/img/screenshots/2026-10-04/skills-catalog.png)](/img/screenshots/2026-10-04/skills-catalog.png)

*The Skills catalog in the same isolated fixture.*

1. Open `Registry`.
2. Open `Skills`.
3. Choose `Skill` to create a new record, or open an existing skill.
4. Describe the skill in product terms and save its configuration. Use `Instructions` for execution guidance, one instruction per line, and choose `Save instructions`.
5. Open the `I/O` tab.
6. Add inputs with clear field names, types, and descriptions. Mark required inputs explicitly; new inputs default to optional.
7. Add expected outputs. New outputs default to required. Field types include `text`, `json`, `list`, `number`, and `boolean`.
8. Choose `Save Inputs` and `Save Outputs` separately.
9. Check the `Agents` tab to see which agents use the skill. Manage assignments from the agent's `Skills` tab.

## Input and output principles

Good inputs answer "what does the agent need before this work can start?"

Examples:

- task summary;
- project context;
- acceptance criteria;
- scoped source reference;
- dataset result;
- previous step output;
- approval constraints.

Good outputs answer "what should later steps or operators be able to inspect?"

Examples:

- action plan;
- analysis summary;
- validation result;
- review finding list;
- approval packet;
- generated document;
- follow-up recommendation.

Avoid vague fields such as `data` or `result` when a clearer name is possible.
The more explicit the contract, the easier it is to build workflows that compose
multiple agents and tools.

## Review history

Use the record's `Changelog` tab when a workflow starts behaving differently after a
configuration change. Agent and skill history should answer:

- what changed;
- who changed it;
- when it changed;
- whether the previous version should be restored.

## Operational guidance

Keep agents narrow enough that job logs are understandable. Keep skills explicit
enough that workflow authors know which inputs and outputs are available.
