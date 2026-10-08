---
sidebar_position: 9
title: Contributing Documentation
description: Update public guidance with source-backed contracts and reproducible evidence.
---

# Contributing Documentation

Documentation changes should identify the application candidate they describe.
Use public command specs, curated OpenAPI policy, MCP registrations/scopes,
workflow schemas, extension validators, the canonical environment manifest, and
the selected UI source as primary evidence. A README, historical audit, folder
count, or source-present bundle is useful context but is not a release contract.

## Small contribution loop

1. State the reader and task the page enables.
2. Locate the owning source contract and record its candidate SHA.
3. Add or change the smallest public page that owns the answer; link instead of
   cloning large tables into multiple guides.
4. Use placeholders in executable examples and never include local absolute
   paths, tokens, credentials, private hostnames, or client data.
5. Parse commands and validate JSON/YAML/schema examples without performing
   production mutations.
6. Run typecheck, both base-path builds, local link/anchor and publication
   checks, and `git diff --check`.
7. Label source-only, live-verified, contract-validated, externally unverified,
   blocked, and deferred behavior honestly.

## Review triggers

Recheck documentation whenever a change touches installer fields/journal steps,
public CLI specs, the public OpenAPI allowlist, MCP tools/scopes, environment
manifest/readers, Compose roles/profiles/ports, auth/capabilities, workflow step
kinds and states, extension schemas/lifecycle, limits, storage, TLS/bootstrap,
backup/restore, upgrade, branding, or routes/navigation.

Database changes require a migration and rollback/compatibility decision; do
not document a schema edit as deployable until the migration path and restore
evidence exist. UI screenshots require a clean English fixture, privacy review,
route/role/date/build provenance, useful alt text, and replacement tracking when
the screen is scheduled to change.

Raw review evidence and internal planning material belong outside the public
documentation tree and must not enter routes, search, sitemap, or `llms.txt`.

## Links and headings

Use descriptive public links to published pages. Never direct readers to an
internal audit, local checkout path, or unpublished evidence artifact. Preserve
meaningful heading text when other pages cite it; when a section moves, update
all inbound links and keep a concise public replacement page when an established
route must remain reachable. Both supported base paths must pass local link and
anchor checks before handoff.

## Accessible content

Put prerequisites, roles, commands, units, warnings, expected results, and
recovery steps in text. Images may illustrate a flow but must not be the only
source of an instruction. Give useful images concise alt text and provenance;
label tabs or platform-specific variants in text so the page remains usable in
search, `llms.txt`, and nonvisual reading contexts.

## Versioned facts

Use exact command, option, configuration, event, schema, and identifier names.
State the application revision or release applicability when behavior differs
between candidates, and distinguish code fallback, example-file value,
deployment interpolation, stored account value, and observed live value. A
source-present setting or route does not prove support or deployment
availability.
