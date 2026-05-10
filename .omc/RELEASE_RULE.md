# Release Rules
<!-- last-analyzed: 2026-05-11T00:00:00Z -->

## Version Sources

| File | Field | Pattern |
|------|-------|---------|
| `package.json` | `version` | `"version": "X.Y.Z"` |

Single version source. No monorepo, no workspace packages.

## Release Trigger

No CI release workflow exists. Releases are **manual**:
1. Bump `package.json` version
2. Commit + annotated tag (`vX.Y.Z`)
3. Push branch + tag
4. Create GitHub Release via `gh release create`

## Test Gate

No test suite configured. No `test` script in `package.json`.
**Gap:** Add tests and a CI gate before promoting to stable.

## Registry / Distribution

- **No npm publish** — `package.json` has no `publishConfig`; this is a self-hosted app, not a library.
- **No Docker image** — no `Dockerfile` present.
- **Distribution:** GitHub Releases (source tarball + release notes).

## Release Notes Strategy

No `CHANGELOG.md`. No Conventional Commits enforced, but all recent commits follow the `fix:` / `chore:` / `feat:` prefix pattern.
Draft changelog from `git log <prev-tag>..HEAD --no-merges --format="%s"`.

## CI Workflow Files

None — no `.github/workflows/` directory exists.

## First-Time Setup Gaps

- No `.github/workflows/` — no CI at all (no tests, no lint, no release automation)
- No git tags — this will be the first tagged release
- No test script — `npm test` is undefined
- `package-lock.json` added to `.gitignore` (intentional per project preference)
