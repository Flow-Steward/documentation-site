# Flow Steward Documentation Site

This repository contains the public documentation site for Flow Steward. It is a
Docusaurus docs-as-code site: documentation is written in Markdown/MDX and built
as static files that can be deployed independently from the application runtime.

## Installation

```bash
npm install
```

## Local Development

```bash
npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Content Structure

- `docs/user/` - operator and product usage guides
- `docs/developer/` - contributor, architecture, and extension authoring docs
- `docs/reference/` - CLI, configuration, and release-readiness references

The first source of truth for product behavior is still the Flow Steward
application repository. Public-facing release docs should be promoted into this
site when they are stable enough for users and contributors.

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
