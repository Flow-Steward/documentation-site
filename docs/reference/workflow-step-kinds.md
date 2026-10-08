---
sidebar_position: 4
title: Workflow Step Kinds
description: Reference for supported workflow step kinds.
---

# Workflow Step Kinds

Workflow steps describe what happens inside a phase. The user guide explains how
to create workflows from the UI; this page is the stable step-kind lookup.

| Step kind | Purpose | Typical output |
|---|---|---|
| `agent` | Run an agent role with instructions, inputs, and expected outputs. | Agent message, artifact, decision, or structured field. |
| `connector` | Invoke a tool, extension action, or connector-backed action. | Tool result, command result, event, or error. |
| `http_request` | Call an HTTP endpoint. | Response status, headers, and body. |
| `dataset_query` | Query a scoped dataset. | Rows or structured query result. |
| `transform` | Apply a deterministic configured transformation to prior data. | Transformed structured value. |
| `tabular_feed` | Read and process a bounded tabular feed. | Normalized rows and feed metadata. |
| `invoke_workflow` | Call a reusable child workflow. | Child workflow result. |
| `if` | Route between true/false paths. | Branch decision. |
| `switch` | Route among named cases and an optional default. | Case decision. |
| `set_variable` | Write workflow state. | Updated state value. |
| `for_each` | Execute a supported inline body for each collection item. | Collected per-item results. |
| `batch` | Split collection data into grouped values. | Grouped data written to a result target. |
| `stop_success` | End execution successfully. | Final success result. |
| `stop_fail` | End execution as failed. | Final failure result. |

## Choosing a step kind

- Use `agent` for reasoning, writing, review, or judgement.
- Use `connector` when the workflow needs an executable tool contract.
- Use `dataset_query` for structured data that has been exposed through a
  dataset.
- Use `transform` for deterministic data shaping that does not need an agent.
- Use `tabular_feed` for bounded row-oriented feed processing.
- Use `http_request` for direct service calls that are not modeled as tools.
- Use `invoke_workflow` when the work is reusable across multiple workflows.
- Use `if` or `switch` when runtime state chooses the next path.
- Use `for_each` only when its inline step kind is supported. Use `batch` to
  group data; it does not invoke an arbitrary operation for every group.

## Grouping versus iteration

`batch` requires a positive `batch_size` and a `result_target`. It reads a
collection from `source_path`, groups it, and stores those groups. A downstream
step consumes the grouped value; the batch step itself is not an agent,
connector, or child-workflow executor.

```yaml
step_kind: batch
override:
  batch:
    source_path: state.rows
    batch_size: 25
    emit_partial_batch: true
    result_target: state.row_batches
```

`for_each` executes inline steps. At this candidate, inline dispatch supports
only `set_variable`, `batch`, `http_request`, and `transform`.
Validation rejects inline `if`/`switch` with
`workflow.step_loop_inline_routing_unsupported`: the inline runtime does not
prune later steps based on their selector. Move routing to a top-level phase
after aggregation. Inline `agent`, `connector`, and `invoke_workflow` bodies
are rejected with `workflow.step_loop_inline_step_kind_unsupported`; runtime
dispatch also reports `for_each.inline_step_kind_unsupported` for unsupported
kinds.

```yaml
step_kind: for_each
override:
  for_each:
    source_path: state.rows
    item_name: row
    index_name: row_index
    result_target: state.normalized_rows
    concurrency_limit: 1
    continue_on_error: false
    steps:
      - label: Copy row
        step_kind: set_variable
        override:
          set_variable:
            assignments:
              state.current_row:
                source: state.row
```

`break_when` cannot be combined with concurrency above one because completion
order would make the break boundary ambiguous. Keep `concurrency_limit: 1` when
using a break condition. There is no supported inline route for repeating an
agent, connector, or child workflow in this candidate; model those operations
as separately submitted bounded jobs or redesign the workflow instead of
placing them inside `for_each`.

## Inputs and outputs

Every step should make clear:

- which state fields or prior outputs it reads;
- what it writes;
- whether the output is consumed by later steps;
- whether failure should stop, branch, or retry;
- whether an approval gate is expected before or after the step.

Good workflow contracts are boring to inspect: each step has one obvious job,
named inputs, named outputs, and predictable failure behavior.
