# inferogenesis.com

Source for the Inferogenesis organisation site: the entry point for cpomdp, warrantlib
and the research programmes, with a link out to each project's docs subdomain. Static
Astro, built and deployed to GitHub Pages by Actions.

`BUILD_PLAN.md` is the build plan and the contract for the repo. Architecture decisions
go in `DECISIONS.md` as append-only ADRs, starting with the P0 spike.

## Status

Scoped. The tooling is in place and the Astro scaffold is next (plan section 9, P0).

## Working on it

One-time setup after cloning:

```sh
uvx pre-commit install --hook-type pre-commit --hook-type commit-msg
```

The whole gate, which CI's `lint` job also runs:

```sh
uvx pre-commit run --all-files
```

It runs markdownlint, cspell, the prose gate in `scripts/prose-gate.sh` and the
whitespace hooks. pre-commit provisions its own Node for the markdown hooks, so the
system Node version does not matter for the gate. The site build needs the LTS pinned
in `.node-version` once the scaffold lands.

Commit messages are one line in Conventional Commit shape. Each unit of work is one
PR on a fresh branch from `main`.

## Licence

Site code is MIT (`LICENSE`). Page copy, posts, primers, figures and other content are
CC BY 4.0 (`LICENSE-CONTENT`), attributed to Inferogenesis with a link to the page. The
Inferogenesis mark and wordmark are excluded from both and stay all rights reserved.
Self-hosted fonts carry their own SIL Open Font Licence files. Quoted third-party
material keeps its own terms, stated where it appears.
