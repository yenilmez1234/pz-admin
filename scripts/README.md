# Project scripts

- `sync-version.mjs`: Copies `VERSION` to `build/config.yml`, optionally setting a
  new version. Version tasks also regenerate Wails build metadata.
- `licenses/`: Combines generated frontend/backend license reports with application
  and platform notices into `.generated/licenses/THIRD-PARTY-NOTICES.json`.

Run from the repository root:

- `wails3 task version:set VERSION=2.0.0` — set the version and regenerate platform metadata.
- `wails3 task version:sync` — regenerate metadata from the current `VERSION`.
- `wails3 task licenses` — collect and combine license reports.
- `wails3 task licenses:combine` — recombine existing reports without collecting them again.
