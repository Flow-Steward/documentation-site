# Docusaurus design transfer — 12 November 2026

final result: passed

## Target and scope

Source: the designer's live Docs.dc.html in Claude Design, inspected in the user's Chrome, plus the saved responsive source in fs-org/design/review-2026-11-10/Docs.dc.html. Implementation: http://localhost:3098/docs/user/connect-an-ai-client and existing Getting Started, CLI Reference and Workflow Runtime routes.

This is a theme transfer, not a content migration. All 82 real articles, six category files, sidebar structure, published paths, search configuration and heading anchors remain intact, including three previously uncommitted article changes. The reference has a much smaller sample menu and different demonstration copy; those are intentionally replaced by the existing documentation content. Original footer destinations remain available in three styled columns.

## Visual comparison

Desktop source preview was isolated from editor panels in an agent-created Claude Design tab: outer viewport 1460×960, inner reference frame 1442×898 at offset9,53. The implementation was compared at1442×898; the 53px editor toolbar is excluded conceptually when judging vertical alignment. Source and implementation screenshots were opened together in the same browser tool result. Reference Getting started and existing Getting Started copy differ by design; typography, shell geometry, navigation, colors and component treatment were compared rather than asserting equal paragraph positions.

Required fidelity surfaces:

- Typography: self-hosted Google Sans Flex and Code, original responsive title formula, title tracking and body line-height. Original article wording retained.
- Spacing/layout: 60px common header,1360px shell,20–56px outer gutters,232px sidebar, article and right contents rail. Below860px, sticky52px document navigation replaces the sidebar; contents rail appears from1180px.
- Colors: white canvas, dark ink, green controls/active states, neutral borders and terminal code surfaces match source tokens. Native syntax highlighting remains readable on the dark background.
- Assets: existing Flow Steward logo and existing source GitHub/menu/EU flag assets reused. Fonts load successfully; no placeholder artwork or designer runtime imported.
- Content: all original articles, sidebar categories and code content retained. Native copy, heading anchors, search and previous/next remain functional.

## Issues found and corrected

1. P2: native container utilities added16px internal gutters and a75% article column on desktop/tablet. Replaced unstable hashed-class selectors and overrode layered utilities in Infima's layer. Post-fix mobile article x20,width339 at390px; desktop article width724 at1442px.
2. P2: native mobile TOC interrupted the badge/title hierarchy. Hid that extra control to match the responsive reference; full document navigation remains in the second toolbar.
3. P1: local search's native dropdown opened off-screen, then remained narrowed by a competing position rule. Fixed its positioning below1100px. Post-fix390px results box x20–359,width339 with eight complete results; ArrowDown/Enter opens the selected article.
4. P2: native code copy controls were invisible until hover. Kept controls visible for touch and desktop.
5. P2: Escape from a keyboard-opened main dialog was consumed by an already-open docs menu. The docs handler now defers to native modal dialogs. Verified open docs → Shift+Tab → Enter main menu → Escape dismisses the dialog while retaining normal docs-menu behavior.

## Browser verification

Only the user's Chrome was used; no Playwright CLI or isolated browser.

-320×740: CLI Reference, long inline paths, scrollable command blocks; document width309≤320.
-390×844: article, mobile docs categories, route change/current title, main menu, Escape focus restoration, code copy confirmation, local search and keyboard result navigation; document width379≤390.
-768×1024: single-column article, sticky document toolbar, readable tables.
-1024×900: sidebar and article, no right contents rail; native75% utility regression was corrected.
-1442×898 and1440×900: desktop shell, readable dark code and copy controls, full sidebar, scroll-aware nested contents rail. Clicking Codex sets its aria-current=location and moves the measured active marker to y221.156px with31.59px height.

Temporary comparison/duplicate tabs were closed. One ready documentation preview remains open for the user, with viewport override reset and DevTools closed.

Saved evidence: docusaurus-design-desktop-viewport.png in the session visualizations directory. Its crop removes only Chrome's unpainted black export tail, preserving the captured1440×900 CSS viewport at2×density.

## Automated verification

- `npm run typecheck`: passes.
- `npm run build`: passes.
- `node scripts/check-docs-preservation.cjs`:88 source files byte-identical;92 published routes retained; no new broken internal destinations/heading anchors; all eight former header destinations remain linked, all13 former footer destinations remain in the footer.
- `git diff --check`: passes.

No P0/P1/P2 findings remain. External marketing URLs are production destinations and were not published or altered by this local theme task.
