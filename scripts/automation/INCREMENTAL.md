# Incremental documentation: first implementation stage

This stage implements offline impact planning, candidate dependency inventories,
receipt storage primitives and a disabled queue preparation contract. Chroma,
model inference, active queue execution and site publication are not part of
this stage.

The legacy paid path remains the default. A separate planning-only job is
prepared behind `DOCS_INCREMENTAL_PLANNING == 'true'`; enabling that switch
disables legacy prepare/generate/validate/publish for that run, rather than
running the old paid queue alongside the planner. No repository variable has
been changed. The new commands always report `generationAllowed: false` and
contain no inference, tests, installation, publishing or workflow API call.

## Offline planning

From the documentation checkout, the following **future manual command** writes a
new report without inference, tests, workflow dispatch or checkpoint changes:

```
node scripts/automation/run.mjs plan-incremental /path/to/product /path/to/new-report.json /path/to/restored-receipt-ledger
```

The cache argument is optional. The report destination must not exist. Product
HEAD must be on its public origin/main and descend from the accepted checkpoint.
Planning reads Git objects and local public files only. Do not put the output in
the receipts directory. This command has not been executed during implementation.

An empty policy produces unresolved changes, not a successful skip. The initial
dependency file enumerates every current Markdown/MDX page. Preserved receipt
citations originally seeded unreviewed candidate scopes. The current 84 entries
have subsequently received static dependency review for the explicitly selected
`public-default-v1` profile. This approval does not validate runtime behavior;
citations alone are never a complete dependency graph. New scopes/consumers require source review, especially shared
contracts, renames, deleted files and newly added files within a directory.

## Reviewed impact decisions

`.automation/documentation-impact.json` contains `version: 1` and `decisions`.
Start with the report's `classification.changeIdentity`, which binds the exact
base, target, statuses, old/new names and tree inventories. A decision contains:

```
{
  "changeIdentity": "<64 hex from the report>",
  "scopes": ["core/application/example/"],
  "outcome": "review_existing_pages",
  "reviewedBy": "<review provenance>",
  "reason": "<documented contract affected or evidence of non-impact>",
  "evidence": [
    {"kind": "documentation", "path": "docs/user/workflows.md", "sha256": "<file hash>"}
  ]
}
```

Outcomes: `no_documentation_required`, `review_existing_pages`,
`possible_new_documentation`, `unresolved`. Evidence binds current public source
or documentation bytes. The decision is an explicit reviewed input, not an
automatically inferred proof of behavioral equivalence. Overlaps are rejected;
a rename's old and new paths must both be covered. A `fix`/`security` label or
unchanged UI alone never authorizes skipping. API/CLI/default/permission/upgrade
changes can still need guides. No broad test/CI exclusion exists.

For required existing pages, dependency entries need `reviewed: true`, nonempty
`reviewedBy`, `reason`, and `scopes` (exact source paths, trailing-slash directory
prefixes or a single trailing `*` for a flat module-name family; no arbitrary
globs). `docsScopes` records dependencies on this repository's guides, site code,
navigation and workflows. These file hashes are additional receipt inputs;
the reviewed page's own text remains a separate input/output hash so applying
a receipt does not invalidate its already-applied alias. Unreviewed candidates
and unmatched areas block the plan.
New-documentation gaps block coverage; this stage never creates new pages.

## Receipt identity and storage

`input-identity.mjs` and `impact.mjs` bind page bytes; before/after scoped Git blob
inventories (including absent/new files); the dependency rule; relevant changes;
release facts; and reviewer/prompt/schema/helper/workflow versions. Overall SHAs
remain in provenance. Dependency reviewer attribution and review SHA are excluded
from reusable content identity; actual rule, profile and source inventories remain
bound. `gpt-6-luna` is required. Current fingerprints are deliberately
conservative; relevant baseline changes may invalidate reuse.

`receipt-cache.mjs` exposes `openReceiptCache`, `lookupReceipt`, `reserve`,
`markDispatched`, `saveReceipt`, `ledgerFiles`, and the explicitly invoked
`persistLedger`. Raw responses and validated records are immutable objects with
verified content hashes. Invalid outputs are preserved but cannot be cache hits.
Human-edited page content misses the cache; original-input and already-applied
output identities are kept separately. Original receipt SHAs are never rewritten.
The caller must retain the original provenance plus a current reuse attestation.

The execution adapter, when implemented, must persist reservation state to
`codex/docs-receipts`, recheck reuse, persist the dispatch grant **before** calling
Luna, then persist the response before any downstream action. Local writes alone
are not a durable distributed grant. Remote updates reject a changed expected
head, immutable-object replacement and invalid reservation transitions. A lease
conflict stops paid work; callers must restore/reconcile the latest ledger.

Reservations and dispatch markers are never automatically removed or reclaimed.
Expired state is uncertain, not permission to repeat an AI call. A crash after
provider acceptance but before saving cannot guarantee exactly-once billing.
Manual resolution is required; this stage supplies no automatic retry.

The optional per-task `source_allowlist` restricts the retrieval helper to the
hashed inventory. An incremental task without one fails closed. The adapter must
also supply a constrained product view rather than relying on prompt instructions
to prevent arbitrary direct filesystem reads. This runtime isolation is not yet
connected to the legacy workflow.

## Boundaries before activation

- Review and complete scope/impact decisions rather than treating candidate maps
  as approved. Confirm full page and changed-area coverage.
- Connect plan, scope isolation, remote ledger restoration/persistence, coverage
  state and budget accounting to an execution adapter in a separate stage.
- Persist no-op coverage independently of site publication. Currently planning
  never advances a checkpoint, even for a justified no-documentation decision.
- Proposed preflight cap is ten cache misses; unresolved/over-budget plans remain
  blocked. This is not a dollar cap or a complete execution budget implementation.
- Keep Chroma and embeddings disabled. No additional dependency is installed.
- All checks remain unrun at the user's request. Changes received static review
  only; syntax/runtime behavior, races, Git API persistence and retrieval isolation
  have not been verified by execution. Do not present this stage as production-ready.

## Dependency audit and queue handoff

`.automation/dependency-audit.json` records all 84 current pages against public
product `a237cb9494b24b53de944b61b05c814e2e81e3d9` and docs base `ac717b6`.
It binds page bytes and each proposed rule hash, records old missing citations,
local links, external repository dependencies, and static Python import reachability.
An import edge outside a scope is a review question, not proof that its entire
module belongs in a model prompt. Composition roots and wildcard imports cause
large over-approximations; dynamic dispatch and frontend import closure still
are now recorded with explicit public-default boundaries and conservative deep
watch inventories. Current static dependency approval is limited to that profile;
see `DEPENDENCY-REVIEW.md` for evidence and remaining execution gates.

The static data review can be reproduced later with:

```
python3 scripts/automation/review-dependencies.py /path/to/public-product
```

Without `--write` this prints a summary only. `--write` deliberately regenerates
candidate rules/audit and resets all approvals, so do not run it over curated
approvals without retaining those decisions separately. It parses source syntax
without importing product modules, running tests or contacting any model.

The prepared queue command (not executed in this implementation) is:

```
node scripts/automation/run.mjs prepare-incremental-queue /path/to/public-product /path/to/new-queue.json /path/to/restored-ledger
```

It writes the plan and disabled queue contract; unresolved coverage exits 1
after saving the report. The gate checks inventory, audit revision, page/rule
hashes, completeness approval, dependency gaps, scope size and page budget.
`generationTasks` is always empty, `generationAllowed` is always false, and
Chroma remains disabled. A content-bound no-documentation decision is a proposed
skip; pending/stale dependency audits still block this staged queue contract.
Only a fully approved contract may report no work, and that still does not
advance publication/checkpoints.

The optional `plan_incremental_queue` workflow job only prepares and uploads that
report. No repository setting has been enabled, no workflow has been dispatched,
and no remote receipt branch has been written. The future active adapter must
still restore/persist the ledger, physically constrain source retrieval, arbitrate
reservations, handle accepted coverage and perform paid work only after separate
activation. Independent docs-only change routing is also not implemented yet;
`docsScopes` currently invalidates receipts for pages already selected by product
impact. These gaps must not be described as a production-ready queue.


## Compact contract views

`contract-boundaries.json` defines topic ownership, public contract anchors,
static evidence hashes/symbols and direct source import watchers.
`page-dependencies.json` separates `scopes` (wide invalidation/routing) from
`readScopes` (contract files to read). Changed watched files join the read list;
renames include both existing sides, and deleted content remains a requirement
for the future before/after adapter. The limit applies to the final read list.
`contract-scopes.mjs` checks per-page catalog hashes, exact read selections and
external pin identities before planning. A read scope outside its watch scope
fails closed.

Context version 3 binds both inventories; contract provenance revision alone
is excluded from the boundary hash. External reference revisions/file hashes
are page-specific inputs. Unrelated catalog edits do not invalidate all pages.
Version 2 cached records remain readable with their original identities; they
are not silently relabeled as version 3 hits. A changed context may miss the
cache, but cannot authorize regeneration while this queue is disabled. No
stored raw receipt, reservation or evidence was modified in this pass.

Raw transitive diagnostics are preserved alongside explicit current dispositions.
The queue checks reviewed closure/profile hashes and open boundaries instead of
blanket historical counters. Dependency approval does not enable the executor. The earlier `review-dependencies.py --write` rebuilds conservative
candidates and discards curated contract fields; retain these catalogs and
reapply a contract review before planning after that regeneration.


## Reviewed deep dependencies and public profile

`deep-dependencies.json` records the source graph, file evidence hashes,
per-page closure hashes and dynamic boundary decisions for the reviewed SHA.
`deep-dependencies.mjs` expands each rule's invalidation/routing scopes with
reachable public files. The compact read scopes remain separate. Changing the
product SHA requires refreshing this static graph; a stale graph fails closed.
The graph and audit must agree, and queue reports include the coverage profile.

`dependency-profile.json` binds coverage to the standard public installation.
Custom/private tool/bootstrap implementations, custom frontend manifests and
live installation/provider state are excluded. Public loader/validation contracts
remain included. The complete profile is part of receipt inputs; no existing
receipt is relabeled for a different profile and no cache miss permits a new
call while generation is disabled.

Pinned external evidence under `.automation/external-evidence/` is checked
against stored public file hashes before planning. Affected pages hash these
files as documentation inputs. Fragment anchors are excluded from repository
identity. The future execution/citation adapter still must expose this evidence;
eight such pages retain a specific connection blocker until it is implemented.

The optional static candidate parser is `review-deep-dependencies.py`; it has not
been executed as a committed tool. This pass used source-text/AST data extraction,
read-only Git operations and static diff inspection only. No JS planner/queue,
model, tests, build or workflow was run.

## Connected cache-only replacement

The current branch replaces the legacy workflow with the connected path in
`CONNECTED-QUEUE.md`. Earlier planning-only/default-legacy descriptions above
record preceding stages and are superseded by this replacement. No generation
is enabled: complete matching receipts can produce a proposed docs update;
missing proofs stop work with a report. The new CLI rejects legacy `prepare`.
The prepared connection has not been run or merged during implementation.
