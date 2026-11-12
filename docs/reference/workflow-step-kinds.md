---
sidebar_position: 4
title: Workflow Step Kinds
description: Reference for workflow step kinds, Groups, For each containers and where each may be placed.
---

# Workflow Step Kinds

A workflow definition has steps, Groups, For each containers and one execution
graph (`entry` and edges `source → outcome → target`). There are no phases. The
[Workflow Builder](../user/workflow-builder) guide shows how to build them in
the UI; this page is the stored-name lookup for current behavior on main.
Availability in a published release has not been verified.

## Steps

| Builder name | `step_kind` | Use it for | Key configuration |
|---|---|---|---|
| Agent | `agent` | Run an agent/skill pair. | Agent, skill, input/output mappings, error policy. |
| System tools, Extension tools, MCP tools | `connector` | Call a built-in tool, an extension action or a connected MCP server tool. | Connector, install, connection binding, operation. |
| HTTP request | `http_request` | Call an HTTP/HTTPS endpoint or download a bounded file. | Method, URL, headers, query, body, auth, timeout, expected statuses, response mode, response target. |
| Invoke workflow | `invoke_workflow` | Run a child workflow and map its results back; also the stored form of a hook. | Child `workflow_id`, input/output/returned-file mappings. |
| Set variable | `set_variable` | Write values into workflow state. | Assignments (`state.path` → literal or `{"source": "state.…"}`). |
| Transform | `transform` | Map and reshape JSON with typed actions. | Source, fields, result target. |
| Tabular feed | `tabular_feed` | Process CSV, TSV, JSON, NDJSON, Parquet or XLSX feeds without loading all rows into state. | Operation, input, actions, result target. |
| DataSet | `dataset_query` | Run a saved dataset query. | Query template, params, row limit, result target. |
| File from base64 | `file_from_base64` | Turn base64 data into a file artifact. | Base64 source, file name, content type, file handle target, size limit. |
| Template | `template` | Render one text from declared inputs, or with `format: report` a structured [report](../user/workflows#reports). | Text or report definition, format, inputs, result target. |
| Collect | `collect` | Add one value to an existing list or object. For each body only. | Target, source, mode (`append` or `set_key`), key. |
| If | `if` | Branch on a condition. | Selector, operator, value; routes `true` and `false`. |
| Switch | `switch` | Route by value to one of several cases. | Selector, cases with a stable `case_id`; routes each `case` and `default`. |
| Approval | `approval` | Wait for a person to approve or reject. | Message, outputs shown to the reviewer; routes `approved` and `rejected`. |
| Wait | `wait` | Pause the run for a duration. | Duration. |
| Batch | `batch` | Split a list into batches. | Source path, batch size, partial-batch behaviour, result target. |
| Break | `break` | End the For each now. For each body only. | None. |
| Continue | `continue` | End the current item. For each body only. | None. |
| Stop · success | `stop_success` | End the run successfully and return the outputs. | Optional message. |
| Stop · fail | `stop_fail` | End the run as failed. | Optional message. |

These twenty kinds are the complete list. Validation refuses any other
`step_kind` (`workflow.step.kind_unsupported`); a step stored without a kind is
an `agent` step.

`batch` only groups data; it does not run an operation per batch. To run steps
per item or per batch, put them in a For each.

### Builder entries that are not step kinds

**Add step** also offers entries that are stored differently:

| Builder name | Stored as | Use it for |
|---|---|---|
| For each | A `for_each` container | Run the steps inside once per item. |
| Inline loop | A `for_each` container shown inside its card | Repeat a few simple steps per item. |
| Group | A Group with a sequence body | Steps that belong together; can become a child workflow. |
| Parallel lanes | A Group with a lanes body | Lanes that run side by side. |
| Hook | An `invoke_workflow` step with a `hook` declaration | A place where a project adds its own steps (workflow authors only). |
| Note | A canvas note | Text and images on the canvas; saved separately and never run. |

## Custom code (code step)

Flow Steward has no inline code step. Custom logic belongs in an extension,
where:

- the developer owns the code in a repository and can review every change;
- it can be covered by its own tests (`extensions test`) and must pass extension
  validation before it can be installed;
- it is versioned and released, so a workflow run uses a known version and an
  update is a deliberate install;
- it runs out of process with its own pinned dependencies, not inside the
  workflow engine.

To add custom logic to a workflow:

1. Generate an extension: `./flow-steward extensions create <extension_id>`,
   or ask a coding agent with the
   [Extension Authoring Skill](../integrations/extension-authoring-skill).
   [Build An Extension](../integrations/build-an-extension) describes the
   bundle.
2. Write the logic as an action handler and expose it to workflows: mark the
   action `workflow_visible: true` and declare an operation with the same id,
   its inputs and outputs, in the extension's Contract v2 operation manifest.
   See [Use An Action As A Workflow Step](../integrations/build-an-extension#use-an-action-as-a-workflow-step).
3. Validate, test, bundle and install the extension.
4. In the workflow, add an **Extension tools** step (`step_kind: connector`),
   pick the extension and its operation, and map inputs from workflow state.
   The operation's outputs land in state like any other step's.

For small data changes you may not need code at all: **Set variable**,
**Transform**, **Template**, **If** and **Switch** cover mapping, reshaping,
text and branching.

## Outcomes

| Source | Outcomes it must route |
|---|---|
| Ordinary step, including Wait | `success` (shown as Next) |
| If | `true` and `false` |
| Switch | one `case` per case, plus `default` |
| Approval | `approved` and `rejected` |
| Stop · success, Stop · fail, Break, Continue | none |
| Nonterminal step, Group or For each with its own On error route | additionally `error` |

One outcome leads to exactly one target. Every root path ends at a Stop step;
a nonterminal step with no continuation is a definition issue, never an implicit
success. Break and Continue terminate the For each or current item without an
outgoing edge.

## Containers

### Group

A Group runs its body once. Its body is a sequence (`{kind: sequence, entry}`)
or lanes (`{kind: lanes, lanes: [{lane_id, entry}], concurrency_limit}`). The
body or each lane ends at the group exit; the Group then leaves on `success`.
A lanes body runs its lanes in parallel up to `concurrency_limit` and joins when
all have finished. Only changed fields are merged, in step-position order and
then lane order; a later write in that merge order wins for the same field.

### For each

A For each runs its body once per item of a ready collection:

```yaml
for_each:
  - for_each_id: each_order
    group_id: orders_batch      # optional: the sequence Group it sits in
    over: state.orders          # a ready collection in state
    item_name: order            # the current item, read as state.order
    index_name: order_index     # optional: its position, from 0
    body: {kind: sequence, entry: {kind: step, id: build_shipment}}
```

Items run one at a time. A list is walked as it is, a null or missing value is an
empty pass, any other value is one item. At most `FS_DATASET_QUERY_MAX_RUNTIME_ROWS`
items (1000 by default) are walked and the run reports truncation. A dataset
cursor is refused as a source: read the rows first.

## Placement

| Placement | Supported |
|---|---|
| Root sequence, If/Switch branches | Yes |
| Group with a sequence or lanes body | Yes |
| For each at the root or in a sequence Group | Yes |
| Collect, Break, Continue in a sequence For each body | Yes |
| Approval and Wait at the root, in a sequence Group or a sequence For each body | Yes |
| Hook (`invoke_workflow` with a hook declaration) at the root | Yes |
| If, Switch, Approval, Wait or Stop in a parallel lane | No |
| A Group in a Group, a For each in a For each, parallel items | No |
| A hook inside a Group, For each or lane | No |

Validation reports unsupported placements. A disabled workflow may retain
structural diagnostics, but unsupported hook placement is refused even in a
draft. An enabled workflow, and every run, must pass definition validation.
