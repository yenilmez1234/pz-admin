# Project scripts

- `licenses/`: Combines generated frontend/backend license reports with application
  and platform notices into `.generated/licenses/THIRD-PARTY-NOTICES.json`.

Run from the repository root:

- `wails3 task licenses` — collect and combine license reports.
- `wails3 task licenses:combine` — recombine existing reports without collecting them again.
