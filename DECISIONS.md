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

---

## ADR-002. Published writing stays where it is and is linked

**Date:** 2026-09-25
**Status:** Accepted
**Phase:** P4 (open decision D1)

### Decision

Posts already published on the personal site at `www.dj-elliott.com` stay there. The
writing list on this site links each one at its original URL. That URL stays canonical.
Nothing is copied, moved or redirected. New technical posts are published here, under
`/writing/`.

### Consequences

- The list takes each post's title, summary and dates from the personal site's
  `blog/posts.json` at build time. CI reads it live and fails if the fetch fails. A local
  build reads `data/writing/back-catalogue.json`.
- No canonical URL changes, so search engines keep the index they have.
- The feed at `/writing/rss.xml` carries every post, each linked to its original URL.
- A post the personal site has not listed in its `posts.json` does not appear. A draft
  there stays off this site.
- The layout for posts hosted here, with its `BlogPosting` structured data, ships with
  the first such post.

---

## ADR-003. The SN programme is Seam Networks, shown before its work runs

**Date:** 2026-09-29
**Status:** Accepted
**Phase:** P3 (open decisions D7 and D4)

### Decision

"SN" names Seam Networks. Active inference agents couple only through a shared world, and
a ladder of six rungs, from one E. coli to neurons in a body, builds every coupling on
that one join. It is a string of thought experiments of mine, grown out of cpomdp's work
on the p* programme and its harness, with one maintainer and no work run. The page opens by
saying so. Its question is whether the structure is worth exploring at all, and whether
cpomdp can tell.

The page goes public now, as D4's default has it. The ladder and every target sit inside
roadmap callouts. Only the generic pattern row and the flagship figure sit outside, since
they define the join and claim no result.

### Consequences

- A programme can lead with a figure in place of an equation. The schema takes one or the
  other.
- A programme can open with a premise, a note above its question. Running text can mark
  terms, shown with a definition on hover, and carry links to this site or to https
  addresses.
- The ladder, its targets and its literature items are frontmatter. The schema refuses a
  tag with no line behind it, and the link check refuses a tag whose line is missing from
  the page.
- Target IDs stay on the page, each linked to its one-line claim. The IDs trace a claim to
  its registered check.
- A literature badge stays on a rung until its L item closes against the paper. No
  rationale that cites the literature prints before then.
- Rung 0 names the part that ships, the chemotaxis network as a factor graph at cpomdp
  v0.4.0, and marks the rest scoped. The swimming cell and its gradient are not built.
- The drawings are static SVG in the site's tokens. The page adds no client script.
