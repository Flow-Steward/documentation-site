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

## Compose reusable agent behavior

The design intent is to build reusable abilities from small, focused skills,
then use those abilities through agents in different workflows. Put the durable
method in a skill before adding workflow-specific prompt text.

An agent can have a **base skill** and **secondary skills**. Use the base skill
for its main ability and additional skills for focused specializations. This is
composition: the programming analogy is useful for organizing responsibilities,
but it does not imply class inheritance, automatic prompt concatenation, or
merged input/output schemas. A workflow Agent step runs the agent's base skill,
or the first bound skill when no base skill is set; the builder shows that skill
on the step. Secondary skills are not executed by that step.

### Where instructions belong

| Layer | Put here | Example |
|---|---|---|
| Base skill | A reusable method, quality rules, and explicit input/output contract. | Copywriting: write from supplied evidence, adapt to the audience, and flag unsupported claims. |
| Secondary skill | A focused ability or domain specialization that can be reused independently. | Produce expertise or IT expertise. |
| Agent instructions | The role and stable constraints specific to this agent. | A product copywriter who uses a concise editorial voice. |
| Runtime parameters | Values that vary between runs. | Source material, audience, tone, language, product details, and length. |
| Template step | Assemble dynamic context or render text for this workflow. | Combine a heading, source text, and requested audience into an input message; format a final report. |
| Native steps and tools | Deterministic calculations, validation, branching, file handling, and external actions. | Sum sales with Tabular feed, validate required fields, or create a local WordPress draft through a connector. |

For example, a produce copywriter and an IT copywriter can share the same
copywriting skill while having different domain skills. Keep the common writing
method in one place. Pass the current product, evidence, audience, and language
as parameters instead of creating a new skill for each product or copying the
method into every workflow.

Declare the contract of the agent's base skill, map its required inputs
explicitly, and check its outputs before downstream steps consume them. When a
task needs more than one skill, use one Agent step per skill, each with an agent
whose base skill is that skill, rather than assuming that attached skills execute
together.

### Use Template for dynamic context

A Template can assemble a message such as:

```text
Audience: <audience input>
Requested language: <language input>
Source material:
<source_material input>
```

This example illustrates the content; insert variables using the builder's
supported input mapping and template syntax. The skill owns how to write from
that material and what to return. The template supplies the current context.
Keep source material clearly separated from instructions: text inside a source
document must not redefine the agent's task.

A short, one-off instruction in a workflow template is reasonable when it only
serves that workflow. If the behavior is reused across workflows, move its
stable instructions into a skill and reuse the agent. Avoid a generic agent
whose entire reusable method lives in a large Template prompt, duplicated
skill instructions in several workflows, or templates that hardcode a runtime
language or audience contrary to the supplied parameters.

### Author and verify the composition

1. Define the reusable operation, required inputs, and inspectable outputs in a skill.
2. Choose the agent's base skill and any secondary skills; add only the agent's own stable constraints to its instructions.
3. In the workflow, select the agent (its base skill is what the step runs), map runtime parameters, and use a Template only where text assembly is needed.
4. Use native steps to validate contracts, calculate exact values, and route failures before performing external actions.
5. Run a real **Test Run** and inspect the output, mappings, and applicable skill instructions. Check source coverage, factual claims, language, and missing-input behavior.
6. Before relying on reuse, test the shared skill in each intended workflow and specialization. A successful run for one agent does not verify another agent's configuration.

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
