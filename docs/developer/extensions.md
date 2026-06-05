---
sidebar_position: 3
title: Extensions
description: Extension runtime and authoring model.
---

# Extensions

Flow Steward extensions are out-of-process provider bundles. The core server
discovers and validates extension contracts, but it does not import provider
Python modules into the server process.

## Supported kinds

- `task_provider`
- `notification_provider`
- `tool_provider`

The canonical filesystem shape is:

```text
extensions/<extension_id>/
  extension.yaml
  schemas/*.schema.yaml
  ui/ui_manifest.yaml
  ui/actions/actions.yaml
  ui/queries/queries.yaml
  ui/pages/*.yaml
  ui/components/*.yaml
```

Author-facing extension contract files are YAML-only. JSON remains valid for
REST payloads, JSONB storage, compiled manifest responses, fixtures, package
metadata, and validator output.

## Manifest fields

Required fields:

- `extension_id`
- `kind`
- `version`
- `features`
- `entrypoint`
- `health`
- `ui_manifest`

Recommended fields:

- `manifest_version`
- `display_name`
- `description`
- `supported_events`
- `required_scopes`
- `schemas`
- `query_manifest`
- `action_manifest`
- `machine_auth`
- `account_scope`
- `callbacks`

## Response envelope

Extensions return JSON on stdout using the canonical response envelope:

```json
{
  "ok": true,
  "result": {},
  "commands": [],
  "events": [],
  "reload": [],
  "errors": []
}
```

## Command-bound mutations

Extensions may request host-side mutations only through declared commands such
as:

- `start_workflow`
- `pause_job`
- `resume_job`
- `cancel_job`
- `retry_step`
- `request_approval`
- `resolve_approval`
- `enqueue_followup_job`

Provider-specific behavior belongs in the extension runtime or a narrow runtime
adapter, not in Flow Steward core services.
