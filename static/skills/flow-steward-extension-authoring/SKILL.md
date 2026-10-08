---
name: flow-steward-extension-authoring
description: Use when a developer or integrator wants to create or change a Flow Steward extension bundle using the platform's existing manifest and CLI lifecycle.
---

# Flow Steward Extension Authoring

Build against the target release's contracts and existing lifecycle. Keep
provider logic in the extension's out-of-process runtime.

## Locate the contracts

Find the target Flow Steward application checkout. Read `AGENTS.md`, applicable
`docs/standards/*`, `docs/standards/extension-manifest-standard.yaml`, and
`docs/extension-authoring-agent-playbook.md`. Locate its version-matched
documentation checkout for `docs/integrations/build-an-extension.md`,
`docs/developer/extensions.md` and `docs/reference/cli.md`; the playbook identifies
fallbacks when supporting docs are unavailable. Report gaps instead of inventing
flags. Do not assume an absolute machine path or repository-relative links from
this copied skill folder.

Choose a compatible reference exercising the required features; Core bundles no
reference extension. Inspect its manifest, contracts and representative runtime
handlers. Keep schemas in their canonical owners rather than copying them here.

## Author and verify

Work from an installed, healthy Development source environment. Use the public
Docker-backed `./flow-steward` launcher and current `extensions --help` plus
subcommand help. The public module is `python -m core.entrypoints.cli` inside
the supported runtime; private CLI modules are not executable alternatives.
Do not use host pytest or a host virtual environment for platform verification.

1. Define the extension ID, behavior and operation input/output contracts.
   Scaffold through `extensions create` or adapt the chosen compatible reference.
   Implement only the requested features, using the canonical YAML manifest,
   bundle-local references and public extension SDK/runtime contracts.
2. Run `extensions validate` and focused `extensions test`. Repair actual
   contract/runtime failures before packaging. Health checks can execute the
   extension's health command; choose fixtures appropriate to the requested task.
3. For third-party Python dependencies, follow the target release's wheel guide
   and playbook: `extensions lock-deps` must lock the full transitive closure and
   wheel hashes, then `extensions bundle --with-wheels` must include portable
   wheels for both Linux AMD64 and ARM64. The default platforms are
   `manylinux2014_x86_64,manylinux2014_aarch64`, for the tooling interpreter's
   Python version/implementation/ABI, not every Python version. A compatible
   universal wheel may cover both; compiled dependencies require matching wheels
   and hashes for each. Use `--platforms active` only for an explicitly requested
   local-only bundle. If either target lacks compatible wheels, stop portable
   packaging and report the gap; do not silently omit a target or rely on runtime
   downloads.

Native executables require two separately built and targeted archives using
`--runtime-target linux-amd64` and `--runtime-target linux-arm64`. Wheel tooling
is not a cross-compiler. Packaging and wheel coverage are not actual installation
verification on both architectures; report the environments and checks actually
run, including missing architecture coverage. Keep the full procedure in the
located `docs/integrations/build-an-extension.md` wheel/distribution guide.

The bare bundle example below is for zero third-party Python dependencies, from
the application checkout with a task-authorized new ID:

```bash
./flow-steward extensions create com.acme.example --non-interactive --confirm
./flow-steward extensions validate com.acme.example --root extensions --health
./flow-steward extensions test com.acme.example --root extensions --non-interactive
./flow-steward extensions bundle com.acme.example --root extensions --output-dir dist/extensions --non-interactive --confirm
```

`--root` is the parent containing the normalized bundle folder, not that folder.
The leaf `--confirm` accepts the reviewed create/package operation; it is not
permission for installation or publication. `extensions test` has no `--confirm`.
It requires the Development launcher's dedicated `fs-test-runner`; a generic
MCP/QA/admin client can refuse. Report that limitation and use the supported
launcher, without setting `FS_EXTENSION_TEST_RUNTIME` to bypass it. Production
does not provision test tooling implicitly. Nonzero or review exits are not
successful validation.

## Install only within the request

When installation is requested and authorized, inspect the archive and run the
existing `extensions install --archive <path>` lifecycle, following its review.
Then use `extensions list`, `extensions show <extension_id>` and
`extensions health <extension_id>` to inspect the installed result. Report what
ran, actual results, archive identity and remaining connection/readiness needs.
Do not install, enable or publish automatically. After authorized installation,
use the workflow-authoring skill's live discovery through the existing knowledge
synchronization path; do not create another index or execution interface.
