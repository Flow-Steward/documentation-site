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
source of truth for these rules; read the current copy before you publish.

## 1. Prepare the workflow

| Field | Rule |
|---|---|
| Name (`display_name`) | A readable title, not an identifier: "Import supplier stock from email attachments", not `stock_import`. At most 120 characters. |
| Description | At least 40 characters. The first sentence becomes the card summary, so say what the workflow does. |
| Version | Semantic, such as `1.0.0` (the default for a new workflow). The same workflow id and version cannot be published twice. |
| Format | A current, phase-free workflow. The catalog accepts only `platform.workflow_bundle.v2`; a phase-based v1 export is refused. |

The workflow screens show no version field. To publish a later version, an
administrator changes `version` through the workflow metadata API: read the
workflow, then send a full `PUT /api/workflows/<workflow_id>` with the same
metadata and the new version (see the [API Reference](../reference/api)).

Validate the workflow and run it once with a controlled **Test Run**, so you
know the template works.

## 2. Export

Open **Workflows**, the workflow's **⋯** menu, then:

- **Export YAML** for a workflow that calls no other workflows;
- **Export YAML with child workflows** when it calls other workflows, so they
  travel in the same file and the template installs complete.

One file is one template: the main workflow and the child workflows it calls,
nothing else. Do not edit the exported file by hand.

Through MCP, `workflow_export(project_name, workflow_id, include_children=true)`
returns the same bundle.

## 3. Review it for private data

Exports leave configured secret values out, and the catalog check refuses a
value under keys such as `password`, `secret`, `api_key`, `access_token` or
`private_key`. Still read the whole file. Look for:

- literal values in step settings and mappings: email addresses, customer or
  shop names, internal URLs and host names, file paths, account ids;
- prompts and notes that quote real data;
- sample data embedded in inputs.

Change anything private in Flow Steward — replace it with an input or a
placeholder — and export again.

## 4. Add the file

1. Fork [Flow-Steward/workflows](https://github.com/Flow-Steward/workflows)
   and create a branch.
2. Choose one category folder from the repository's `categories.json`, for
   example `ai`, `crm`, `ecommerce`, `email`, `marketing`, `operations` or
   `other`. Reviewers only check that it is in the list.
3. Add the export as `workflows/<category>/<workflow_id>.yaml`.
4. Do not edit `index.json` (a GitHub Action rebuilds it after the merge) or
   `categories.json` (it is a copy of the extension catalog's list).

To run the same check locally, from your clone of the catalog:

```bash
pip install -r requirements.txt
python scripts/build_index.py --check --base origin/main
```

## 5. Open the pull request

Give the pull request a title like "Add Import supplier stock 1.0.0". In the
description, say what the workflow does, which extensions and connections it
needs, and whether child workflows are included.

The **Validate submission** check refuses:

- an export that is not `platform.workflow_bundle.v2`;
- a called workflow missing from the file, or an extra workflow the main one
  does not call;
- a folder that is not a category;
- an identifier-style name, or a description shorter than 40 characters;
- a version that is not semantic, or one already published;
- a value under a secret-like key;
- a file larger than 2 MB;
- a change to a file that is already published.

Fix what it reports in Flow Steward, export again and push to the same branch.

After the merge, the index is rebuilt. Each Flow Steward server caches the
index for up to one hour, so the template appears within about an hour.

## 6. Publish a new version

Published files never change, because every catalog entry pins its file's
exact bytes. Raise the version, export again, and add the new file next to the
old one, for example `workflows/email/mailbox_search_1_1_0.yaml`. The catalog
lists the highest version; older files keep working for anyone who pinned them.

The one exception: a phase-based `platform.workflow_bundle.v1` file may be
removed by the pull request that adds its v2 export under a new name.

## With an AI agent

The [Flow Steward agent plugin](../integrations/agent-plugin) includes the
`flow-steward-publish-workflow` skill, which follows this page and reviews the
export for private data with you before it opens the pull request.
