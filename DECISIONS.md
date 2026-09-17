# Architecture decisions

Decisions are append-only. Each records the choice, the evidence and the date. A
correction or a reversal is a new ADR that names the one it supersedes. A path inside an
ADR is the path as of that ADR's date and is not maintained against the tree.

---

## ADR-001. Docs layout is bare Astro with a custom layout

**Date:** 2026-09-17
**Status:** Accepted
**Phase:** P0 (the spike in plan section 3.1)

### Decision

The site is built on bare Astro with its own layout, sidebar, contents panel and header.
Starlight is not used. Search comes from Pagefind through the `astro-pagefind`
integration at P1.

### Evidence from the spike

The project page template was built both ways on the same content entry, the same
Zod schema and the same body components (project header, install block with copy
button, snippet, capability table, releases, cite block, callout). Only the shell
differed. Both built, type-checked, linted and passed the gate. Both rendered the
section 4 order, the sidebar pill on the active item and a roadmap callout.

The plan asked for both branches to be pushed. Neither was. The bare build became the
P1 shell in the same PR as this record, and the Starlight build was kept only as a
local patch. This record carries the evidence instead.

What the Starlight branch had to fight:

1. `StarlightPage` renders its own H1 from the page title, so the project header
   produced a second H1. Fixed with a `PageTitle` override that renders nothing. That
   is the first of the overrides the plan counted, before any styling.
2. Starlight's footer renders its own edit link, last-updated line and pagination. The
   section 4 footer meta then appears twice. Fixing it means a `Footer` override.
3. The header (mark, wordmark, top nav) is a `Header` override. The three-column
   widths are two variables. The landing page and the blog are further overrides or
   plugins. With items 1 and 2 that is five overrides for the pages in scope at P2,
   and the plan's estimate of eight for the full site holds.
4. Theming is a mapping of fifteen `--sl-*` variables onto the ten tokens, and the
   mapping is lossy: Starlight's seven greys and its accent-low and accent-high have no
   token to land on.
5. Starlight requires a `docs` collection with its loader and schema even when no docs
   page exists, and every build warns that the `docs` and `i18n` collections are empty.

What the bare branch had to write: a base layout, header, sidebar, contents panel and
breadcrumbs, about 250 lines of Astro and CSS, with nothing fought.

Page weight of `/projects/cpomdp/`, gzipped:

| Asset | Starlight | Bare Astro |
| --- | --- | --- |
| HTML | 9.3 KB | 4.6 KB |
| CSS | 12.6 KB | 1.5 KB |
| JS on load | 3.2 KB plus 15 inline scripts | one inline script (the copy button) |
| Deferred | Pagefind UI, about 440 KB raw, on first search | none yet |

### What Starlight gave for free, and what it costs to replace

Search, the theme toggle, the mobile menu, contents-panel highlighting, a skip link
and print styles. All of these are on the P1 list already. Search is one integration.
The toggle, the drawer and the highlighting are three small scripts, which is the
section 8 baseline the plan expects to measure at P1.

### Consequences

- Accessibility of the shell is owned here. The axe check in Playwright runs on every
  template, which the plan requires in any case.
- No docs theme to pin or upgrade. The Astro major is the only framework pin.
- `starlight-blog` is out. The blog at P4 is plain Astro pages with an RSS integration.
- The `tokens.css` contract stays ten tokens with no mapping layer.
- The prose gate learned to skip MDX `import` and `export` lines, which the spike's
  content entry tripped on.
