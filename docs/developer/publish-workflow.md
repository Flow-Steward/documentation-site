---
title: Publish a Workflow Template
description: Share a workflow in the public Flow Steward workflow catalog - name and description, export with child workflows, privacy review, category folder and pull request.
---

# Publish a Workflow Template

The public workflow catalog is the repository
[Flow-Steward/workflows](https://github.com/Flow-Steward/workflows). Flow
Steward reads its `index.json` and shows the templates on the **Workflows ›
Catalog** tab, where users create local drafts from them (see
[Workflow and Extension Catalogs](../user/workflow-and-extension-catalogs)).

Each template is one exported YAML file in that repository. The catalog's
[README](https://github.com/Flow-Steward/workflows#share-a-workflow) is the
source of truth for submission rules; read the current copy before you publish.
The repository layout, local check and CI rules below reflect the publishing
guidance included in the product source. The separate catalog repository's
current checks and automation have not been verified here; confirm them in
its README before submitting. Product behavior below describes the reviewed
main source and does not establish availability in a published release.

## 1. Prepare the workflow

| Field | Rule |
|---|---|
| Name (`display_name`) | A readable title, not an identifier: "Import supplier stock from email attachments", not `stock_import`. At most 120 characters. |
| Description | At least 40 characters. The first sentence becomes the card summary, so say what the workflow does. |
| Version | Semantic, such as `1.0.0` (the default for a new workflow). Use a new version for each submission of the same workflow id. |
| Format | A current, phase-free workflow exported as `platform.workflow_bundle.v2`. |

The workflow screens show no version field. To publish a later version, an
administrator changes `version` through the workflow metadata API: read the
workflow, then send a full `PUT /api/workflows/<workflow_id>` containing the
supported metadata fields, preserving their values except for the new version.
Set `expected_revision` to the returned `revision`. Do not copy the whole GET
response into the PUT: the metadata model rejects unknown fields, including
workflow definition fields such as steps and groups (see the
[API Reference](../reference/api)). Confirm the new version in the export.

Validate the workflow and run it once with a controlled **Test Run**, so you
know the template works. If it was not run, say so in the pull request.

## 2. Export

Open **Workflows**, the workflow's **⋯** menu, then:

- **Export YAML** for a workflow that calls no other workflows;
- **Export YAML with child workflows** when it calls other workflows, so they
  travel in the same file.

These actions are shown when the workflow's export policy allows full export.
Extension-provided workflows are protected by default and may export only an
extension reference.

One file is one template: the main workflow and the child workflows it calls,
with their dependencies. Current exports also carry definitions of the agents,
skills, manual data contracts and guardrails they use. Do not edit the exported
file by hand.

Through MCP, `workflow_export(project_name, workflow_id, include_children=true)`
returns the bundle as `bundle_yaml`. Leave `reference_only` at its default
`false` to include those definitions. A project-scoped export also carries that
project's hook bindings; the admin UI export has no project context and omits
them. Review any required hook setup before sharing the template.

## 3. Review it for private data

Exports redact recognized credential values and local secret references, but
redaction cannot identify every private literal. The catalog publishing guidance
also describes checks for values under secret-like keys such as `password`,
`secret`, `api_key`, `access_token` or `private_key`. Still read the whole file,
including bundled definitions and hook bindings. Look for:

- literal values in step settings and mappings: email addresses, customer or
  shop names, internal URLs and host names, file paths, account ids;
- prompts, agent and skill definitions, and notes that quote real data;
- sample data embedded in inputs.

Change anything private in Flow Steward — replace it with an input or a
placeholder — and export again.

## 4. Add the file

Confirm these submission steps against the catalog's current README:

1. Fork [Flow-Steward/workflows](https://github.com/Flow-Steward/workflows)
   and create a branch.
2. Choose one category folder from the repository's `categories.json`, for
   example `ai`, `crm`, `ecommerce`, `email`, `marketing`, `operations` or
   `other`.
3. Add the export as `workflows/<category>/<workflow_id>.yaml`.
4. Leave `index.json` and `categories.json` to the catalog maintainers and
   automation. The product's publishing guidance describes an index rebuild
   after merge and a category list shared with the extension catalog.

The documented optional local check, run from your clone of the catalog, is:

```bash
pip install -r requirements.txt
python scripts/build_index.py --check --base origin/main
```

## 5. Open the pull request

Give the pull request a title like "Add Import supplier stock 1.0.0". In the
description, say what the workflow does, which extensions and connections it
needs, and whether child workflows are included.

The product's publishing guidance describes a **Validate submission** check
that refuses:

- an export that is not `platform.workflow_bundle.v2`;
- a called workflow missing from the file, or an extra workflow the main one
  does not call;
- a folder that is not a category;
- an identifier-style name, or a description shorter than 40 characters;
- a version that is not semantic, or one already published;
- a value under a secret-like key;
- a file larger than 2 MB;
- a change to a file that is already published.

Confirm the current rules in the catalog repository. Fix what the check reports
in Flow Steward, export again and push to the same branch.

Once the rebuilt index is available from the configured catalog host, Flow
Steward revalidates it on each catalog read, using conditional requests when
supported. There is no one-hour freshness window. Host or CDN caching can still
delay visibility; no external propagation time is guaranteed here. If a refresh
fails, the server serves its last valid index as stale and waits 10 seconds
before retrying. Without a cached index, it reports the catalog unavailable.

## 6. Publish a new version

Catalog entries pin their file's size and SHA-256, which Flow Steward verifies
before import. Follow the catalog's immutable-file submission policy: raise the
version, export again, and add a new file next to the old one, for example
`workflows/email/mailbox_search_1_1_0.yaml`.

The product's publishing guidance describes listing the highest version and
retaining older files for pinned consumers. It also describes one exception to
retaining published files: a pull request adding a v2 export under a new name
may remove its phase-based `platform.workflow_bundle.v1` predecessor. Confirm
these policies in the current catalog README before changing published files.

## With an AI agent

The [Flow Steward Operator package](../integrations/agent-plugin) includes the
`flow-steward-publish-workflow` skill, which follows this publishing process and
reviews the export for private data with you. It requires your explicit go-ahead
before opening the public pull request.
