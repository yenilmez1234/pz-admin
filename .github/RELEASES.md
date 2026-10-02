# Releases

- **Setup:** Add `RELEASE_PLEASE_TOKEN` as a repository Actions secret: a fine-grained
  PAT restricted to this repository with **Contents**, **Issues**, and **Pull requests**
  read/write access. Renew before expiry. It enables automatic release-PR checks;
  packaging and publishing use `GITHUB_TOKEN`.
- **Release:** Release Please prepares a PR from Conventional Commits on `main`,
  starting at **2.0.0**. Review the version and changelog, then squash merge to approve
  publication. A tag and draft release are created; all six targets must build and
  upload successfully before automatic publication. On failure, rerun failed jobs.
- **Versions:** Release Please updates `VERSION` and desktop metadata via
  `release-please-config.json`. Preserve `x-release-please-version` markers when
  regenerating Wails assets.
- **AppStream:** Linux packaging takes release versions, dates, and notes from `CHANGELOG.md`.
- **Manual builds:** Run the **Package** workflow to build without releasing.
