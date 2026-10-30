# Contributing to inferogenesis.com

This is the source of the Inferogenesis organisation site. It's a static Astro build
deployed to GitHub Pages. Fixes to the site are welcome. So are accessibility
improvements and better tests.

## Finding something to work on

Start from the [`good first issue`](https://github.com/inferogenesis/inferogenesis.com/labels/good%20first%20issue)
label. Each one fits a single small pull request, has no design question left open and
can be checked with the commands below. [`help wanted`](https://github.com/inferogenesis/inferogenesis.com/labels/help%20wanted)
issues are bigger. Their design is settled and they are open to anyone.

Every triaged issue also carries an `area:*` label for the part of the site it touches
and a `difficulty:*` label. `easy` needs no Astro knowledge. `medium` means reading a
component and its schema, or adding a Playwright test. `hard` crosses the build pipeline
or needs a decision from `BUILD_PLAN.md`.

Comment on an issue before you start, so two people don't build the same thing.

Issues labelled `claude-proposed` were filed by a weekly automated upkeep run. Its scope
is a first draft. Ask in the issue and I'll confirm it or narrow it before you start.
The same run labels new issues and opens small fix, docs and test pull requests. It
never merges anything, and every pull request it opens gets the same review as yours.

Problems with the cpomdp library itself belong in the
[cpomdp repository](https://github.com/inferogenesis/cpomdp/issues).

## The rules the site keeps

`BUILD_PLAN.md` is the contract for the repository. Its section 10 lists decisions that
are still open. A pull request that needs one settled should say so and stop there.

- Every number, version or claim a visitor sees has a source the build can name.
- Zero client JavaScript is the default. A new `client:*` directive is a decision with a
  cost against the bundle budget.
- Architecture decisions go in `DECISIONS.md` as append-only ADRs.
- Commit messages and pull request titles follow
  [Conventional Commits](https://www.conventionalcommits.org).

## Setup and checks

`README.md` has the setup under "Working on it", with the pinned Node and pnpm. The
checks CI runs are listed there in order. Run them before you open a pull request. The
pre-commit hooks cover markdownlint, cspell and a prose gate on every markdown file.
`uvx pre-commit install --hook-type pre-commit --hook-type commit-msg` wires them up.
