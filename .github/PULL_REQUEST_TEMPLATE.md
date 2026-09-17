# Summary

<!-- What does this change do, and why? One or two paragraphs is plenty. -->

## Type of change

<!-- Tick all that apply. The PR title follows Conventional Commits
(feat:, fix:, docs:, test:, chore:, ...). -->

- [ ] `fix`: bug fix (no visible change to content or layout)
- [ ] `feat`: new page, component or build-time data
- [ ] `content`: page copy only
- [ ] `docs`: repo documentation only
- [ ] `test`: tests only
- [ ] `refactor` / `chore`: no visible change
- [ ] Breaking change (a URL, a token name or a schema field changes)

## Plan and decisions

<!-- The BUILD_PLAN.md checkbox this closes, by section. Any section 10 open
decision this builds to, and which default it took. -->

- Plan item (section 9):
- Open decision and default taken (section 10):
- ADR (`DECISIONS.md`):

## Approach

<!-- The reasoning behind the implementation: alternatives weighed, trade-offs
made, anything a reviewer would otherwise have to reconstruct from the diff. -->

## Validation

<!-- How do we know this is right? Paste the relevant output. -->

- [ ] `uvx pre-commit run --all-files` is clean
- [ ] `pnpm build` is clean (once the scaffold has landed)
- [ ] axe passes on every touched template
- [ ] Every internal link on a touched page resolves

```text
# Paste the relevant output here.
```

## Claims and data

<!-- Every number, version or claim a visitor sees has a source the build can
name (section 6). Warrant attaches to claims on programme pages only. Roadmap
items sit inside the roadmap callout. Write "none" if no page copy changed. -->

- Source for each new number or version:
- Warrant labels touched:

## Client JS

<!-- Zero client JS is the default. A new `client:*` directive is a decision.
Say what it costs against the section 8 budget. Write "none" if untouched. -->

- Bundle impact:
