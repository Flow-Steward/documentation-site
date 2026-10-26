---
title: Publish an Extension
description: List your extension in the public Flow Steward extension catalog - repository layout, manifest listing fields, icon, tests, wheels for Linux AMD64 and ARM64, release tags and the catalog pull request.
---

# Publish an Extension

The public extension catalog is the repository
[Flow-Steward/extensions](https://github.com/Flow-Steward/extensions). Flow
Steward reads its `index.json` and shows the entries on the **Extensions ›
Catalog** tab, where an administrator installs them.

The catalog holds only a **link** to your repository. Your code and your
releases stay in your own public GitHub repository; the catalog downloads,
checks and records each release. The catalog's
[README](https://github.com/Flow-Steward/extensions#share-an-extension) is the
source of truth for these rules; read the current copy before you publish.

Build and test the extension first: see [Build An Extension](../integrations/build-an-extension)
and the [Extension Authoring Skill](../integrations/extension-authoring-skill).

## 1. One repository per extension

- `extension.yaml` sits at the **root** of a public GitHub repository.
- Name the repository `ext-<kind>-<implementation>`, for example
  `ext-llm-openrouter`, and add the topic `flow-steward-extension`.
- Use your own id namespace, such as `com.acme.crm-sync`. The `flowsteward.`
  namespace is reserved for the Flow-Steward organization
  (`verified_publishers.json` in the catalog).
- To move an existing extension out of another checkout, the catalog provides
  a helper that copies the tracked files and adds CI and release workflows:

  ```bash
  python3 scripts/new_extension_repo.py <extension folder> ../ext-<kind>-<name> \
      --repository https://github.com/<owner>/ext-<kind>-<name>
  ```

## 2. Manifest fields the catalog checks

| Field | Rule |
|---|---|
| `display_name` | A readable name. |
| `description` | At least 40 characters. |
| `listing.category` | One id from the catalog's `categories.json`, for example `ai`, `crm`, `data`, `ecommerce`, `email`, `messaging`, `other`. |
| `listing.summary` | Optional, at most 160 characters; otherwise the first sentence of the description. |
| `listing.tags`, `listing.setup_summary` | Optional. |
| `runtime.contract_version` | Must be `extension_host_v2`, built on `flowsteward-extension-sdk` 0.4.0 or later. Other releases are not listed. |
| `egress` | Declare the outbound network access (`egress: {}` for none); otherwise installation warns `egress_undeclared`. |
| `version` | Semantic, such as `1.2.0`; equal to the release tag without the `v`. |
| `extension-descriptor.yaml` | Optional; if present, its `extension_id` and `release_version` must match the manifest. |

**Logo**: a file named `icon.png` next to `extension.yaml` — PNG only, square,
32–512 px (128×128 recommended), at most 100 KB. There is no manifest field;
replacing the file is enough. `flow-steward extensions create` writes a neutral
default icon you should replace. A release without a valid `icon.png` is
refused by the catalog and by the Flow Steward installer.

**No secrets**: the check refuses `.env` and key files, and any value under
keys such as `password` or `api_key`.

## 3. Validate and test

From a Flow Steward application checkout installed in the
[Development environment](local-development), check the committed extension
checkout with the quality gate:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks extension-static,extension-tests \
  --extension-root /abs/path/to/extension-checkout
```

`extension-static` runs compile, ruff, ruff format, mypy and bandit;
`extension-tests` validates the manifest and runs the extension's tests in an
offline virtual environment. For the catalog's listing checks, place a copy of
the bundle at `extensions/<canonical folder>/` in the application checkout
(`acme.crm-sync` becomes `acme_crm_sync`; do not commit the copy) and run:

```bash
./flow-steward extensions validate <extension_id> --root extensions --health --marketplace
```

Stop on any nonzero exit and fix the cause.

## 4. Dependencies and architectures

Flow Steward runs on Linux AMD64 and ARM64 and installs Python dependencies
offline, from the bundle's `wheels/` folder.

| Your extension | What to release |
|---|---|
| No third-party Python packages | One archive. |
| Third-party Python packages | Lock the full closure with `flow-steward extensions lock-deps`, then `flow-steward extensions bundle --with-wheels`. The default platforms are `manylinux2014_x86_64,manylinux2014_aarch64`, so the wheels for both targets go into one archive. |
| Compiled wheels you prefer to split | One archive per target: `<extension_id>-<version>-linux-amd64.zip` and `<extension_id>-<version>-linux-arm64.zip`, each with only its own wheels and a `.fs-package.yaml` naming the target. The catalog's `templates/single-extension` packaging script does this when `wheels/` holds architecture-specific wheels. |
| A native executable | One archive per target, built with `flow-steward extensions bundle --runtime-target linux-amd64` and `--runtime-target linux-arm64`, each carrying only its own `bin/<target>/`. |

The runtime is CPython 3.12 on glibc 2.36. For packages that publish only
`manylinux_2_28` wheels, pass
`--platforms manylinux_2_28_x86_64,manylinux_2_28_aarch64` to both `lock-deps`
and `bundle`. `extensions validate` does not check both architectures: before
you release, list `wheels/` and confirm, for every requirement, an `_x86_64`
and an `_aarch64` wheel, or one `any` wheel.

A release attaches either one portable archive or per-target archives, never
both, and per-target releases must include `linux-amd64`. If a wheel is
missing for one target, do not publish: the installer cannot download it at
run time.

## 5. Release from your repository

The catalog accepts a release when:

- the tag is `v<version>`, the same version as `extension.yaml`;
- the asset is named `<extension_id>-<version>.zip` (or the per-target names);
- every file sits under one top folder named after the id with `.` and `-`
  replaced by `_` (`acme.crm-sync` → `acme_crm_sync/`);
- it has no symbolic links and is at most 50 MB zipped, 150 MB unpacked.

The catalog ships GitHub workflow templates that do this for you:

- `templates/single-extension/.github/` — CI on every push (tests, packaging,
  and the catalog's own archive check), and a release job on every tag;
- `templates/release-extension.yml` — a simpler release-only workflow.

Copy one into your repository, then tag and push:

```bash
git tag v1.2.0
git push origin v1.2.0
```

Check that the GitHub Release exists with the expected archive.

## 6. First listing: one pull request

Fork [Flow-Steward/extensions](https://github.com/Flow-Steward/extensions) and
add exactly one file, `extensions/<extension_id>.yaml`:

```yaml
repository: https://github.com/<owner>/<repo>
```

Open the pull request **from the repository owner's account**, or as a public
member of the owning organization. Do not edit `index.json` or `releases/`;
they are generated. The **Validate submission** check downloads your latest
release and lists what to fix. After the merge, the release is listed within
minutes.

## 7. New versions

Raise `version` in `extension.yaml` (and `release_version` in the descriptor,
if you have one), commit, and push a new `v<version>` tag. **No new catalog
pull request is needed**: the catalog checks every listed repository every five
minutes and publishes each new release that passes. A release that fails is
reported in the catalog's Actions log, and the previous version stays listed.

Never move a published tag or replace a published asset. When a release is
first published, the catalog records its URL, size and SHA-256 in
`releases/<extension_id>/<version>.json`, and Flow Steward verifies that digest
before installing. If the bytes change later, the release is withdrawn. Fix a
broken release by publishing a new version.

Removing your entry keeps the extension listed as **deprecated**.

## With an AI agent

The [Flow Steward agent plugin](../integrations/agent-plugin) includes the
`flow-steward-publish-extension` skill, which follows this page. It asks before
pushing a tag or opening the catalog pull request.
