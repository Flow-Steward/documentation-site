---
sidebar_position: 4
title: Workflow Step Kinds
description: Reference for workflow step kinds, Groups, For each containers and where each may be placed.
---

# Workflow Step Kinds

A workflow definition has steps, Groups, For each containers and one execution
graph (`entry` and edges `source → outcome → target`). There are no phases. The
[Workflow Builder](../user/workflow-builder) guide shows how to build them in
the UI; this page is the stored-name lookup for Flow Steward 0.7.27.

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
| Template | `template` | Render one text from declared inputs. | Text, format, inputs, result target. |
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

`batch` only groups data; it does not run an operation per batch. To run steps
per item or per batch, put them in a For each.

## Outcomes

| Source | Outcomes it must route |
|---|---|
| Ordinary step, including Wait | `success` (shown as Next) |
| If | `true` and `false` |
| Switch | one `case` per case, plus `default` |
| Approval | `approved` and `rejected` |
| Stop · success, Stop · fail | none |
| Any step or group with an On error route | additionally `error` |

One outcome leads to exactly one target. Every root path ends at a Stop step;
a step with no continuation is a definition issue, never an implicit success.

## Containers

### Group

A Group runs its body once. Its body is a sequence (`{kind: sequence, entry}`)
or lanes (`{kind: lanes, lanes: [{lane_id, entry}], concurrency_limit}`). The
body or each lane ends at the group exit; the Group then leaves on `success`.
A lanes body runs its lanes in parallel up to `concurrency_limit` and joins when
all have finished; each lane lands only the values it changed, and for the same
field the later lane in lane order wins.

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

Items run one at a time. A list is walked as it is, a missing value is an empty
pass, any other value is one item. At most `FS_DATASET_QUERY_MAX_RUNTIME_ROWS`
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

Validation refuses an unsupported placement before the workflow can be saved or
run.
