# inferogenesis.com

Source for the Inferogenesis organisation site: the entry point for cpomdp, warrantlib
and the research programmes, with a link out to each project's docs subdomain. Static
Astro, built and deployed to GitHub Pages by Actions.

`BUILD_PLAN.md` is the build plan and the contract for the repo. Architecture decisions
go in `DECISIONS.md` as append-only ADRs, starting with the P0 spike.

## Status

P0 in progress (plan section 9). The scaffold, the CI pipeline and a placeholder page
are in. The spike, DNS and Search Console are next.

## Working on it

Node is pinned in `.node-version` and pnpm in the `packageManager` field of
`package.json`. A version manager that reads those files keeps every machine on the
same pair. With fnm:

```sh
curl -fsSL https://fnm.vercel.app/install | bash   # then open a new shell
fnm install          # reads .node-version
fnm use
corepack enable      # ships with Node
corepack install     # reads packageManager, installs the pinned pnpm
pnpm install
pnpm dev
```

`fnm env --use-on-cd` in the shell profile switches Node on entering the repo.

A local build reads release lists from the snapshots in `data/releases/`. With a token it
reads them live from GitHub, as CI does:

```sh
GITHUB_TOKEN="$(gh auth token)" pnpm build
```

The checks CI runs, in order:

```sh
uvx pre-commit run --all-files   # markdownlint, cspell, prose gate, whitespace
pnpm lint                        # eslint
pnpm format:check                # prettier
pnpm check                       # astro check
pnpm build
sudo pnpm exec playwright install --with-deps chromium   # once, for the browser and its libraries
pnpm test                        # playwright with axe, against the built site
```

Other scripts:

```sh
pnpm fonts                       # rebuild public/fonts and src/styles/fonts.css from upstream
pnpm link-check                  # every internal link and #fragment in dist resolves
pnpm icons                       # rasterise public/favicon.svg into the touch icons
pnpm bundle-check                # per-page gzipped JS and CSS against bundle-budget.json
pnpm tokens:freeze               # copy src/styles/tokens.css to public/tokens/<version>.css
```

One-time setup for the commit hooks:

```sh
uvx pre-commit install --hook-type pre-commit --hook-type commit-msg
```

Commit messages are one line in Conventional Commit shape. Each unit of work is one
PR on a fresh branch from `main`.

## Design tokens

`src/styles/tokens.css` is the single source of colour for the site and for the docs
subdomains. The build serves it at `https://inferogenesis.com/tokens.css`. A frozen copy
per site version lives at `https://inferogenesis.com/tokens/<version>.css`, made by
`pnpm tokens:freeze` from the version in `package.json`. Importers pin a frozen URL.
Bumping the version, freezing and tagging the release as `v<version>` go together.

## Licence

Site code is MIT (`LICENSE`). Page copy, posts, primers, figures and other content are
CC BY 4.0 (`LICENSE-CONTENT`), attributed to Inferogenesis with a link to the page. The
Inferogenesis mark and wordmark are excluded from both and stay all rights reserved.
Self-hosted fonts carry their own SIL Open Font Licence files. Quoted third-party
material keeps its own terms, stated where it appears.
