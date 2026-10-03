# Releases

- **Setup:** Add `RELEASE_PLEASE_TOKEN` as a repository Actions secret: a fine-grained
  PAT restricted to this repository with **Contents**, **Issues**, and **Pull requests**
  read/write access. Renew before expiry. It enables automatic release-PR checks;
  packaging and publishing use `GITHUB_TOKEN`.
- **Update signing:** Add the PEM private key as the `UPDATER_PRIVATE_KEY` Actions
  secret. Its public key is embedded from `internal/update/updater.pub`.
  Keep a secure backup of the private key; never commit it or replace the pair
  casually, since installed versions trust the existing public key.
- **Release:** Release Please prepares a PR from Conventional Commits on `main`,
  starting at **2.0.0**. Release PRs build all six targets for validation without
  publishing. Review the version and changelog, then squash merge to approve
  publication. A tag and draft release are created; all six targets must build and
  upload again from the tag before automatic publication. On failure, rerun failed jobs.
- **Versions:** Release Please updates `VERSION` and desktop metadata via
  `release-please-config.json`. Preserve `x-release-please-version` markers when
  regenerating Wails assets.
- **AppStream:** Linux packaging takes release versions, dates, and notes from `CHANGELOG.md`.
- **Updates:** Wails generates and verifies `manifest.json` for the Windows/macOS
  `*-update.exe` / `*-update.zip` assets, including release notes and SHA-512 checksums.
  Windows/macOS check once at startup (enabled by default in Settings) and show
  Wails' update window when an update is available. Development builds and Linux
  do not check automatically.
  Artifacts are signed with Ed25519ph; the app rejects unsigned updates.
- **Manual builds:** Run the **Package** workflow to build without releasing.
