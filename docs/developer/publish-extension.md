---
title: Publish an Extension
description: List your extension in the public Flow Steward extension catalog - repository layout, manifest listing fields, icon, tests, wheels for Linux AMD64 and ARM64, release tags and the catalog pull request.
---

# Publish an Extension

The public extension catalog is the repository
[Flow-Steward/extensions](https://github.com/Flow-Steward/extensions). By default,
Flow Steward reads its `index.json` and shows the entries on the **Extensions ›
Catalog** tab, where an administrator installs them. Deployments can change or
disable the catalog with `FS_EXTENSION_CATALOG_URL`.

Your code and releases stay in your own public GitHub repository. The catalog's
[README](https://github.com/Flow-Steward/extensions#share-an-extension) is the
source of truth for submission and release processing rules; read the current
copy before you publish. The catalog-side conventions below are described by
the developer package, but the application checkout does not establish the
separate catalog's current checks, templates, schedule or publication status.

The application behavior described here is supported by the source on main;
confirm that your installed version and SDK artifacts support it before use.

Build and test the extension first: see [Build An Extension](../integrations/build-an-extension)
and the [Extension Authoring Skill](../integrations/extension-authoring-skill).

## 1. One repository per extension

The developer package describes these catalog conventions; confirm them in the
current catalog README:

- `extension.yaml` sits at the **root** of a public GitHub repository.
- Name the repository `ext-<kind>-<implementation>`, for example
  `ext-llm-openrouter`, and add the topic `flow-steward-extension`.
- Use your own id namespace, such as `com.acme.crm-sync`. The `flowsteward.`
  namespace is reserved for the Flow-Steward organization
  (`verified_publishers.json` in the catalog).
- To move an existing extension out of another checkout, use the catalog's
  helper if it is available in the current checkout:

  ```bash
  python3 scripts/new_extension_repo.py <extension folder> ../ext-<kind>-<name> \
      --repository https://github.com/<owner>/ext-<kind>-<name>
  ```

## 2. Manifest fields for publication

The catalog conventions described by the developer package include:

| Field | Rule |
|---|---|
| `display_name` | A readable name. |
| `description` | At least 40 characters. |
| `listing.category` | One id from the catalog's `categories.json`, for example `ai`, `crm`, `data`, `ecommerce`, `email`, `messaging`, `other`. |
| `listing.summary` | At most 160 characters. The catalog convention allows a description fallback, but the application's `--marketplace` check requires a nonempty summary. Supply it explicitly. |
| `listing.tags`, `listing.setup_summary` | Optional. |
| `runtime.contract_version` | Must be `extension_host_v2` for the current host. The SDK source on main is version 0.4.0 and implements this contract; confirm compatible artifact availability before publishing. |
| `egress` | Declare the outbound network access (`egress: {}` for none); otherwise installation warns `egress_undeclared`. |
| `version` | Semantic, such as `1.2.0`; equal to the release tag without the `v`. |
| `extension-descriptor.yaml` | Optional; if present, its `extension_id` and `release_version` must match the manifest. |

The application's `extensions validate --marketplace` also requires `kind`,
`vendor.name`, a nonempty `required_scopes` list,
`machine_auth.service_account_key`, a nonempty
`machine_auth.required_scopes` list, and `account_scope.scope_type` and
`account_scope.description`. These local checks do not replace the catalog's
submission checks.

**Logo**: a file named `icon.png` next to `extension.yaml` — PNG only, square,
32–512 px (128×128 recommended), at most 100 KB. There is no manifest field;
replacing the file is enough. `flow-steward extensions create` writes a neutral
default icon you should replace. Flow Steward validation, packaging and
installation refuse a bundle without a valid `icon.png`.

**No secrets**: never include `.env`, private keys or real passwords and API
keys in a release. Consult the current catalog README for its secret checks;
passing local validation is not proof that a bundle contains no secrets.

## 3. Validate and test

From a Flow Steward application checkout installed in the
[Development environment](local-development), check the committed extension
checkout with the quality gate:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks extension-static,extension-tests \
  --extension-root /abs/path/to/extension-checkout
```

`extension-static` runs `scripts/validate_bundle.py` when present, compile,
ruff, ruff format, mypy and bandit; `extension-tests` validates the manifest
and runs the extension's tests in an offline virtual environment. For the
application's additional marketplace checks, place a copy of the bundle at
`extensions/<canonical folder>/` in the application checkout
(`acme.crm-sync` becomes `acme_crm_sync`; do not commit the copy) and run:

```bash
./flow-steward extensions validate <extension_id> --root extensions --health --marketplace
```

Stop on any nonzero exit and fix the cause. Run the current catalog's own
submission checks as well.

## 4. Dependencies and architectures

Flow Steward supports Linux AMD64 and ARM64 and installs Python dependencies
from the bundle's `wheels/` folder by default.

| Your extension | What to release |
|---|---|
| No third-party Python packages | One archive. |
| Third-party Python packages | Lock the full closure with `flow-steward extensions lock-deps <extension_id>`, then `flow-steward extensions bundle <extension_id> --with-wheels`. The default platforms are `manylinux2014_x86_64,manylinux2014_aarch64`, so the wheels for both targets go into one archive. |
| Compiled wheels you prefer to split | Build `<extension_id>-<version>-linux-amd64.zip` and `<extension_id>-<version>-linux-arm64.zip` with `flow-steward extensions bundle <extension_id> --runtime-target linux-amd64` and `--runtime-target linux-arm64`. Each archive filters the existing wheels for its target and includes a `.fs-package.yaml` naming that target. |
| A native executable | One archive per target, built with `flow-steward extensions bundle <extension_id> --runtime-target linux-amd64` and `--runtime-target linux-arm64`, each carrying only its own `bin/<target>/`. |

The Docker runtime uses CPython 3.12. Confirm the target image's glibc and Python
wheel compatibility before selecting newer wheel tags. For compatible targets
and packages that publish only `manylinux_2_28` wheels, pass
`--platforms manylinux_2_28_x86_64,manylinux_2_28_aarch64` to both `lock-deps`
and `bundle`. `extensions validate` does not check both architectures: before
you release, confirm that every requirement has a compatible wheel for each
target, or a compatible `any` wheel, with hashes declared in
`python_requirements`.

The developer package describes releases with either one portable archive or
per-target archives, never both, and requires `linux-amd64` for per-target
catalog submissions. Confirm these rules in the current catalog README.

If a wheel is missing for one target, do not publish. Install-time downloads
are off by default (`FS_EXTENSION_DEPS_FETCH=off`). An operator can opt into
allowlisted downloads with `FS_EXTENSION_DEPS_FETCH=allowlist`, but a public
bundle should carry its full dependency closure for offline installation.

## 5. Release from your repository

The developer package describes these catalog archive conventions; check them
against the current catalog README:

- the tag is `v<version>`, the same version as `extension.yaml`;
- the asset is named `<extension_id>-<version>.zip` (or the per-target names);
- every file sits under one top folder named after the id with `.` and `-`
  replaced by `_` (`acme.crm-sync` → `acme_crm_sync/`);
- it has no symbolic links and is at most 50 MB zipped, 150 MB unpacked.

Flow Steward's packager uses these archive names and folder layout and enforces
the size limits.

Look for the catalog's GitHub workflow templates and verify their current
behavior before copying one:

- `templates/single-extension/.github/` — described as CI with tests, packaging
  and archive checks, plus a release job on tags;
- `templates/release-extension.yml` — described as a simpler release-only workflow.

After configuring and checking the release workflow, tag and push:

```bash
git tag v1.2.0
git push origin v1.2.0
```

Check that the GitHub Release exists with the expected archive. A version in a
manifest or a pushed tag alone does not establish that an artifact was published.

## 6. First listing: one pull request

The developer package describes this submission format. Confirm it in the
current catalog README, then fork
[Flow-Steward/extensions](https://github.com/Flow-Steward/extensions) and
add exactly one file, `extensions/<extension_id>.yaml`:

```yaml
repository: https://github.com/<owner>/<repo>
```

It instructs authors to open the pull request **from the repository owner's
account**, or as a public member of the owning organization, and to leave
`index.json` and `releases/` to catalog automation. Follow the current submission
check's feedback. After merge, verify that the expected release actually appears
in the catalog; publication timing depends on that repository's automation.

## 7. New versions

Raise `version` in `extension.yaml` (and `release_version` in the descriptor,
if you have one), commit, and push a new `v<version>` tag. The developer package
describes automatic discovery for already listed repositories without another
catalog pull request. Confirm the current update policy and schedule in the
catalog README, and check its Actions results and resulting listing.

Never move a published tag or replace a published asset. Flow Steward verifies
the release size and SHA-256 supplied by the catalog before installing, and
rejects mismatched bytes. Fix a broken release by publishing a new version.
The separate catalog controls release records, withdrawal and deprecation;
consult its current policy before removing an entry.

## With an AI agent

The [Flow Steward Developer package](../integrations/agent-plugin) includes the
`flow-steward-publish-extension` skill. It requires the user's go-ahead before
pushing a tag or opening the catalog pull request.
