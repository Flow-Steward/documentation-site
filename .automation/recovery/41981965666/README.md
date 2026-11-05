# Preserved documentation reconciliation

- Original run: https://github.com/Flow-Steward/documentation-site/actions/runs/41981965666
- Requester: https://github.com/Flow-Steward/flow-steward-app/actions/runs/41981945944
- Product source: `f9f918745298806b6247594e4dbb3203a8a9f417`
- Reviewed documentation: `42f2a9e8affa46a84c6b79aa1d8c7ef70bf132cd`
- Run cancelled at the user's request to stop the remaining paid queue.
- Model configuration remains `gpt-6-luna`; the existing fail-closed guard and
  explicit generation model are unchanged.

`receipts/` contains the 37 original JSON outputs, including failed validation
outputs, without edits. `context/` contains the original trusted plan and source
metadata. `artifacts.json` records all 38 original GitHub archive IDs and digests.
`archives/` retains the original ZIP bytes; the local preservation bundle also
contains a separate copy.
GitHub's original artifacts have a seven-day retention period; these committed
JSON copies preserve the paid results independently of that expiration.

`recovery-report.json` was produced by offline recovery of the actual saved
receipts, without a model call, tests, build, workflow rerun, or publication.
It records 36 reusable receipts, one rejected receipt, and 45 missing tasks.
The rejected contributing guide cites the nonexistent product path
`core/application/tooling/quality/upgrade_preflight.py`. Its output remains
preserved and is not silently corrected or marked valid.

Recovery accepts an older `path — explanation` citation while still checking
the exact product file, every path component, and symlinks. It preserves the
original explanatory evidence and records normalized paths separately.

To inspect a saved run offline, use a clean product checkout at the exact saved
source SHA and a docs checkout with unchanged reviewed pages and checkpoint:

```sh
node scripts/automation/recover.mjs .automation/recovery/41981965666 /path/to/product /path/to/new-report.json
```

The output path must not already exist. The command does not call any API,
generate content, execute tests, apply updates, or publish. Missing or invalid
receipts produce an `incomplete` report without a combined publication payload.
It does not reassign the original receipt SHAs to a new base.

`prepare` blocks automatic regeneration of this saved product SHA before any
page jobs are scheduled. Do not remove the recovery directory to bypass that
block or rerun the failed workflow. No documentation checkpoint has advanced;
the original reconciliation remains incomplete.
