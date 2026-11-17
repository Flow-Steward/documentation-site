# Connected documentation queue — cache only

The production workflow proposed in this branch has **no AI action**, no page
matrix, no full-site fallback, no workflow_dispatch, test or build job. Luna
remains the only permitted configured model. Cache misses and unknown impact
stop the queue; they never authorize a model request, retry or fake successful
no-op. Paid execution is not enabled by this integration.

On an authorized product dispatch or docs-main push:

1. Check out public source and documentation with history. Parse the source as
   text/AST into a candidate dependency graph; never import product code.
2. Carry forward reviewed dynamic boundaries only when the defining file bytes
   still match their reviewed evidence. Unknown/changed dynamic boundaries block.
3. Restore `codex/docs-receipts` with bounded paths, sizes and object checks.
   Select the cumulative source diff from the accepted site checkpoint or a
   completed no-change coverage record whose complete documentation input tree
   still matches. Coverage records never claim site publication.
4. Route mapped changed paths to affected pages. Unknown/new paths stay pending;
   commit labels and unchanged UI are not non-impact evidence. Explicit reviewed
   no-documentation decisions remain bound to exact change and evidence hashes.
5. Look up current content-bound receipts. Historical paid receipts are eligible
   only with an unchanged **whole public source tree**, unchanged prompt/schema,
   unchanged other documentation/dependency inputs and the same assigned-page
   input or already-applied output. Validate completed status, summary, paths and
   evidence. Original receipt SHAs/bytes are retained with a separate reuse proof.
   Do not infer old scoped inputs from citation lists or relabel legacy records.
6. Require a valid result for every affected page. Missing/failed/incomplete
   outputs or an oversized read view block publication. No partial checkpoint.
7. If cached changes are complete, open/refresh the usual human-reviewed docs PR
   with `[skip ci]`. Matching existing trees do not create duplicate commits.
   If complete coverage needs no content change, persist its immutable proof on
   the receipt branch. No fake PR and no site checkpoint advance for a no-op.

The prepare job has read permissions only. The downstream persistence/publisher
uses the already configured documentation-only app and lease checks; no secret
or repository permission was changed during implementation. It neither merges
PRs nor deploys. Files crossing jobs are hash-bound to the saved queue report.
Reports are retained as artifacts for 90 days.

## Paid output preservation

The local preservation bundle indexes **1,432 original JSON receipts from 18
runs**, including four outputs that do not declare completed status. Declared
status is not a validity claim. Original ZIPs, metadata, trusted plans and
incomplete/rejected outputs remain saved, with archive SHA-256 checks.

The newly downloaded archive is intentionally **not included in this public PR
or its Git history**: automatic approval review requires explicit user approval
for publication of that full payload. Existing recovery files already on main
remain unchanged. Until an approved durable location/import is chosen, the new
archive is local preservation, not an available remote cache. The connected
reader uses the existing public recovery data and the receipt ledger, validates
any proposed reuse and stops on missing results. It never silently regenerates.

## Activation and validation

- Stop-only PR #18 disables the old workflow entry job; it must be merged by the
  user or under new explicit permission. Queued old runs 44070159993 and
  44066595482 were cancelled, not rerun; their available outputs were preserved.
- This integration is a separate PR. It becomes connected only after merging;
  it requires no planning-enable variable and contains no paid-generation switch.
- Existing non-incremental `run.mjs prepare` now refuses to prepare a full-site
  paid plan. Historical offline recovery helpers remain available.
- Main's API reference rename to MDX is retained and the dependency map names its
  renderer and schema sync source files. A renamed receipt is not silently
  reassigned to the new page identity.
- Chroma is not installed or started. Custom/private implementation behavior
  remains excluded by `public-default-v1`.
- No tests, builds, JS planner/queue execution, workflow dispatch or rerun were
  performed. Static code/data inspection and Git diff checks only. End-to-end
  runtime validation is still unperformed; this is not a verified production run.
