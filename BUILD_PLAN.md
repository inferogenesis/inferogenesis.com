# BUILD_PLAN.md: inferogenesis.com

Organisation site for Inferogenesis. Home of cpomdp, warrantlib, the p* programme, the SN programme and whatever ships next.

Status: scoped, not started. Owner: DanBoringName. Revision 2 (2026-09-16), supersedes revision 1.

## 1. Goal

inferogenesis.com reads as an organisation's reference site. The model is MDN Web Docs. Dense layout, quiet chrome, content carries the authority. Every project page leads with something a visitor can install or run.

Success criteria:

- A competent engineer lands on a project page and has a working `pip install` plus a runnable snippet within one screen. The snippet and the version badge come from the same release tag.
- A researcher lands on a programme page and sees what is claimed, at what warrant, with the pre-registered gates and their outcomes.
- The site is the canonical entry point for the organisation. It carries structured data, mutual links with every docs subdomain, and canonical URLs for everything cross-posted elsewhere.
- The workshop deck has a URL to point at by 12 November 2026.

What the site does not do: it does not fix the backlink deficit on cpomdp.inferogenesis.com. Links between an apex and its own subdomains add no external authority. Third-party links do, and the JOSS submission remains the strongest route to those. The apex removes the other obstacles (no entry point, no structured data, no canonical home for posts).

## 2. Non-goals

- No API reference on the apex. Each package keeps its own docs subdomain. The apex links and summarises.
- No CMS, accounts, comments or newsletter backend.
- No marketing hero copy. The tagline stays: *continuous active inference, from the first cell*.
- No claim on the site that outruns its warrant. Computed numbers are labelled computed. Warrant attaches to claims on programme pages only. Features on project pages carry a version and a backend, never a warrant.

## 3. Stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Generator | Astro, current major at P0 | Static HTML, zero client JS by default, islands for the one interactive component. |
| Docs layout | Decided by the P0 spike: Starlight with overrides, or bare Astro with a custom layout | See §3.1. |
| Content | MDX in content collections, Zod schemas | Frontmatter is typed. A missing DOI or version fails the build. |
| Search | Pagefind | Static index, no service. Ships with Starlight, one integration on bare Astro. |
| Interactive island | Preact via `@preact/compat`, hydrated `client:visible` | Runs the existing React live-agent component at a fraction of react-dom's weight. |
| Blog | `starlight-blog` plugin, or plain Astro pages on bare Astro | Starlight has no blog of its own. |
| Hosting | GitHub Pages via Actions | Same pipeline as the cpomdp docs. Retry wrapper carried over. |
| DNS | Namecheap apex A/AAAA to Pages, `www` CNAME to apex | Subdomains untouched. |
| Repo | `inferogenesis/inferogenesis.com` | Separate from the cpomdp monorepo. Own release cadence. |

### 3.1 The P0 spike

Starlight gives the sidebar, contents panel, breadcrumbs, search and theme toggle for free. The MDN look needs a custom header, sidebar indicator, callouts, project layout, programme layout, landing page and blog. That is eight overrides before any polish, so a component-count threshold would trip on day one.

The spike is one day. Build the project page template both ways, with the sidebar pill and one callout. Pick whichever needed less fighting. Record the outcome as ADR-001 with the two branches linked. The rest of the plan is written to hold under either outcome.

## 4. Information architecture

```text
/                         Organisation landing
/projects/                Index of software
  /projects/cpomdp/
  /projects/warrantlib/
/programmes/              Index of research programmes
  /programmes/p-star/     Certifiable Active Inference
  /programmes/sn/         SN programme
/research/                Papers, preprints, datasets (DOI-first list)
/writing/                 Technical posts (RSS)
/learn/                   Active inference and FEP primers, workshop material
/about/                   Organisation, people, AI-use statement, funding
/support/                 GitHub Sponsors, how to contribute
```

Sidebar groups mirror these sections. The top nav carries Projects, Programmes, Research, Writing, Learn and search. About and Support sit in the footer and header overflow.

### Page templates

**Landing (`/`).** One paragraph on what Inferogenesis builds. A grid of project cards from the `projects` collection. A strip of latest releases and latest posts. The live agent animation runs behind the header band only and is paused under `prefers-reduced-motion`.

**Project page.** Order is fixed by the layout, not by author discipline:

1. Title, one-line description, status badge, latest version, licence, DOI.
2. Install block with copy button.
3. Minimal runnable example, pulled from `examples/site_snippet.py` at the release tag shown in the badge.
4. What it does. Three to six short sections, each linking into the docs subdomain.
5. Capability table (the MDN browser-compatibility analogue). Rows are features. Columns are version introduced and backend support.
6. Releases (last five, from the GitHub releases API at build time).
7. Cite this (BibTeX and CFF from the repo's `CITATION.cff` at the same tag).
8. Footer meta: last modified, edit on GitHub, report an issue.

**Programme page.** Question, scope, papers, pre-registered gates. A gates table lists each cell with outcome (PASS / FAIL / VOID / pending), tier and warrant, and carries an "as of" date. Roadmap items sit inside the roadmap callout.

**Research entry.** DOI, arXiv ID, venue, abstract, reproduction artefacts. Schema.org `ScholarlyArticle`.

**Writing post.** Article layout with contents panel, reading time, tags, RSS. Cross-posts on Bluesky, X, Reddit and the AII Discord link here as canonical.

## 5. Visual system

### Colour tokens

Sampled from the supplied SVGs and banner. Ratios are WCAG contrast against the stated background.

| Token | Dark theme | Light theme | Use |
| --- | --- | --- | --- |
| `--bg` | `#0C1916` | `#F3F0E6` | Page |
| `--bg-gradient` | `#15281F` to `#0B1714`, radial | none | Header band only |
| `--surface` | `#16241F` | `#FFFFFF` | Sidebar, cards, code blocks |
| `--text` | `#EDF3F0` (16.0:1) | `#16241F` (14.1:1) | Body |
| `--text-muted` | `#8FB0A6` (7.6:1) | `#5B6F68` (4.7:1) | Meta, captions, tagline |
| `--accent` | `#E69F00` (8.0:1) | `#8A6000` (4.9:1) | Active nav, focus ring, amber text |
| `--accent-mark` | `#E69F00` | `#E69F00` | Ring graphic only, never text on light |
| `--link` | `#56B4E9` (7.8:1) | `#005F94` (6.0:1) | Links |
| `--pass` | `#009E73` (5.3:1) | `#007A5A` (4.7:1) | PASS |
| `--fail` | `#D55E00` (4.7:1) | `#B34700` (4.8:1) | FAIL |
| `--void` | `--text-muted` | `--text-muted` | VOID |

Amber `#E69F00` on cream is 2.0:1 and fails for text. Light theme uses `#8A6000` for amber text and keeps pure amber for the ring graphic. Every status colour is Okabe-Ito or a darkened Okabe-Ito. Status never relies on colour alone.

Dark is the default theme. Light follows `prefers-color-scheme` and a manual toggle.

Amber is scarce. One amber element per viewport region: the active sidebar item, or a focus ring, or the mark.

Tokens live in one file, `tokens.css`, published as a tagged release of the site repo. The cpomdp docs subdomain (MkDocs) imports that file by URL. A shared theme package is out, since the two sites run different generators.

### Type

| Role | Face | Notes |
| --- | --- | --- |
| Wordmark, H1–H3 | Space Grotesk | Matches the logo. Weights 500 and 700. |
| Body, UI | Inter | MDN-adjacent reading texture. |
| Code | JetBrains Mono | Ligatures off. |

Fonts are self-hosted WOFF2 with `font-display: swap`. No font CDN.

### Shapes from the mark

The mark is three primitives on a 100-unit grid. The ring is the Markov blanket (r 15, stroke 6.5). The dot is the internal state (r 4.5). The stem is a pill (13 × 44, rx 6.5).

- **Sidebar active indicator.** A 3 px vertical pill with fully rounded ends, in `--accent`.
- **Status glyph.** The ring-with-dot is reserved for the logo. Status uses four other ring states. PASS is a solid filled disc. Pending is a hollow ring. FAIL is a hollow ring with one diagonal stroke. VOID is a dashed ring. P1 renders all four at 14 px and 20 px, and any pair that blurs together at 14 px gets redesigned before the component ships.
- **Section anchors.** A small hollow ring beside each H2 on hover as the permalink control.
- **Callouts.** Note, warning and roadmap callouts carry a ring icon in the left gutter. Roadmap is its own type so planned work never looks shipped.
- **Radii.** Cards and code blocks use 6 px. Badges and tags are fully rounded like the stem.
- **Stroke weight.** Borders and dividers are 1 px. The heavy stroke belongs to the mark and the glyphs only.

No decorative illustration. The header band gradient is the only gradient.

### Layout

Three-column grid at 1200 px and above: sidebar 280 px, article max 75ch, contents panel 240 px. The contents panel collapses below 1200 px. The sidebar becomes a drawer below 768 px. Breadcrumbs sit above every H1 outside the landing page.

## 6. Data that ships with the build

Build-time fetches only. The client never calls an API.

- **Release tag** is the single source. For each project the build resolves the latest release tag from the GitHub releases API (authenticated with a token, since the anonymous limit is 60 requests an hour). Version badge, snippet, `CITATION.cff` and release notes all read from that tag. PyPI JSON supplies the Python version range only.
- **Zenodo / DataCite** for DOI metadata on research entries.
- **warrantlib reports** (P4, conditional): a programme page renders its gates table from committed `CheckReport` JSON. Hand-written tables are the fallback until the ledger-to-table generator lands.

A failed fetch fails the build in CI. Local dev falls back to a cached `data/*.json` snapshot committed to the repo.

A nightly scheduled rebuild picks up new releases without a content commit.

## 7. SEO and discoverability

- Confirm at P0 whether the existing Search Console property is a Domain property covering the apex or a URL-prefix property on the docs subdomain. Add the apex if needed. Submit the apex sitemap at launch.
- JSON-LD: `Organization` on every page, `SoftwareSourceCode` on project pages, `ScholarlyArticle` on research entries, `BlogPosting` on posts.
- Canonical URLs on the apex for every cross-posted announcement.
- Each project page links to its docs subdomain. Each docs subdomain gets a header link back to the apex.
- OG images generated at build time from the banner layout (1280 × 640) with the page title in place of the tagline.
- `llms.txt` at root listing projects, docs URLs and citations.

## 8. Quality bars

| Bar | Target | Enforced by |
| --- | --- | --- |
| Accessibility | WCAG 2.2 AA | axe-core in Playwright on every template |
| Lighthouse | 95 or above on performance, a11y, best practices, SEO | Lighthouse CI on PR |
| JS, non-landing pages | Baseline measured at P1 (search, menu, contents highlighting, theme toggle). Budget is baseline plus 5 KB gzipped. | bundle size check |
| JS, landing page | Baseline plus the island. Budget set after the first measured build of the Preact island, and never above 60 KB gzipped total. | bundle size check |
| Links | No broken internal links. External links checked weekly. | lychee |
| Content schema | Build fails on missing required frontmatter | Zod |
| Prose | Style rules in `CLAUDE.md`, grep gate on MDX | CI script |

## 9. Phases

Each checkbox is a review target. A phase closes when every box is ticked and its gate passes. P0 to P2 ship before the symposium (12 to 14 November 2026). P3 onward follows it.

### P0. Foundation and spike (target: end of September)

- [x] Create `inferogenesis/inferogenesis.com` with Astro (current major), pnpm, Node LTS pinned
- [x] One-day spike per §3.1, both branches pushed
- [x] ADR-001 recording the spike outcome
- [x] GitHub Actions: build, test, deploy to Pages with the retry wrapper
- [ ] Apex DNS at Namecheap, HTTPS enforced, `www` redirects to apex
- [x] Search Console property confirmed or added for the apex
- [ ] `CLAUDE.md` with prose rules and the MDX grep gate
- [x] Placeholder page live at inferogenesis.com

Gate: a commit to `main` deploys to the apex over HTTPS in under five minutes.

### P1. Shell and theme (target: mid October)

- [x] `tokens.css` with both themes, published at a tagged URL
- [x] Self-hosted Space Grotesk, Inter and JetBrains Mono
- [x] Header: mark, wordmark, top nav, search, theme toggle
- [x] Sidebar with pill active indicator, drawer below 768 px
- [x] Breadcrumbs, contents panel, footer meta
- [ ] Status glyph component, four states, `aria-label` set, 14 px legibility check passed
- [x] Callout components: note, warning, roadmap
- [ ] Favicon and apple-touch icons from the supplied avatar SVGs
- [x] JS baseline measured and budgets written into the bundle check
- [x] axe and Lighthouse CI wired

Gate: a kitchen-sink page renders every component in both themes and passes axe with zero violations.

### P2. Symposium cut (target: 7 November)

The minimum the workshop deck can point at.

- [x] Zod schemas for `projects`, `programmes`, `research`, `writing`
- [x] Project layout with the §4 order enforced
- [ ] `examples/site_snippet.py` added to the cpomdp repo and executed in cpomdp CI (task lives in the cpomdp repo, tracked here)
- [ ] Same for warrantlib, once it has a repo of its own, else pinned to the monorepo path
- [ ] cpomdp page, version and snippet hand-pinned to v0.4.4 until P3 automates it
- [x] warrantlib page
- [x] Landing page with project grid (releases and posts strips deferred to P3)
- [ ] About: organisation statement, people, AI-use statement, self-funded note
- [ ] Support page linking GitHub Sponsors
- [ ] Header link from the cpomdp docs subdomain back to the apex
- [ ] Sitemap submitted

Gate: the workshop deck's final slide links to inferogenesis.com and every link on that page resolves.

### P3. Programmes and data (after the symposium)

- [ ] Programme layout with hand-written gates table and "as of" date
- [ ] p* programme page
- [ ] SN programme page, every item inside the roadmap callout
- [ ] Research list with arXiv:2607.20306 and its Zenodo artefacts
- [ ] Release-tag resolution from the authenticated GitHub API, with cached fallback
- [ ] Snippet, `CITATION.cff` and release notes fetched at that tag
- [ ] PyPI JSON for the Python version range
- [ ] DataCite fetch for research entries
- [ ] Nightly scheduled rebuild
- [ ] Landing releases strip and posts strip
- [ ] JSON-LD for all four content types
- [ ] OG image generation

Gate: cutting a cpomdp release updates the apex within 24 hours with no commit to the site repo, and the snippet on the page runs against that release.

### P4. Writing and learn

- [ ] Blog plumbing per the ADR-001 outcome, with RSS
- [ ] D1 resolved: back catalogue migrated from dj-elliott.com or linked canonically
- [ ] Learn section with one active inference primer
- [ ] Workshop material ("Build a curious rocket") under `/learn/`
- [ ] `llms.txt` published
- [ ] Conditional: gates tables rendered from warrantlib `CheckReport` JSON
- [ ] Lighthouse 95 or above on landing, a project page, a programme page, a post

Gate: all quality bars in §8 pass on production.

### P5. Later

- [ ] warrantlib docs subdomain importing `tokens.css`
- [ ] Changelog aggregator across projects

## 10. Open decisions

| # | Decision | Default if undecided |
| --- | --- | --- |
| D1 | Does writing live on the apex or stay on dj-elliott.com? | Technical posts move to the apex. Personal site keeps CV and links. Canonical URLs change once, at migration. |
| D2 | Analytics | None. Search Console only. |
| D3 | Licence for site content | CC BY 4.0 for prose, MIT for site code |
| D4 | Does the SN programme page go public before its work starts? | Yes, every item inside the roadmap callout |
| D5 | Gates tables: hand-written or generated | Hand-written until warrantlib's generator ships |
| D6 | Default theme | Dark |
| D7 | What "SN programme" names | Assumed to be the seam / blanket networks work. Confirm before the page is written. |

## 11. Risks

- **Time.** The symposium presenter deadline is 31 October and the site competes with the workshop, Paper 2 and the warrantlib promotion. P2 is cut to what the deck needs. If P1 slips past mid October, P2 ships on the P0 placeholder styling and P1 finishes afterwards.
- **Scope creep into docs.** The project layout has no slot for API detail. That constraint is deliberate.
- **Stale claims.** A gates table can drift from the ledger. Generated tables are the structural fix. Until then the "as of" date is mandatory in the schema.
- **Override debt.** Whichever branch ADR-001 picks, upgrades of the docs theme or Astro major can break custom layouts. The site pins majors and upgrades on a scheduled task, never as a side effect of a content commit.
- **Cross-repo coupling.** The site build depends on `examples/site_snippet.py` existing at every release tag it resolves. cpomdp's release checklist gains a line for it.
