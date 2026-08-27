# PZ Admin

PZ Admin is a desktop administration client for Project Zomboid dedicated
servers. It connects to a server over RCON and provides focused interfaces for
routine administration instead of requiring commands to be entered manually.

The application currently supports Project Zomboid Build 41 and Build 42.

## Features

- Save, stop, and manage a server through common administrative actions.
- Inspect and edit server options with build-specific metadata and validation.
- Manage players, access levels, bans, permissions, items, skills, and vehicles.
- Compose game-formatted server messages with a visual editor.
- Use an RCON console with command suggestions.
- Switch between English and Turkish interfaces.

## Development

The project uses Go and Wails for the application backend, and React,
TypeScript, Vite, and Mantine for the frontend. Frontend dependencies are
managed with pnpm.

Install the required tools and frontend dependencies, then start the development
environment:

```sh
pnpm --dir frontend install
wails3 dev
```

Build the application with:

```sh
wails3 build
```

The root `Taskfile.yml` also exposes the development, build, packaging, server,
container, and version synchronization workflows used by the project:

```sh
task --list
```

Run the frontend consistency checks with:

```sh
pnpm --dir frontend check
```

## Repository layout

- `internal/` contains backend domain packages and integrations.
- `frontend/src/` contains the React application and handwritten translations.
- `frontend/scripts/` contains game-data and translation generation tools.
- `build/` contains Wails build, packaging, and platform configuration.
- `scripts/` contains repository-level maintenance tools.

See [frontend/src/README.md](frontend/src/README.md) for frontend ownership and
structure conventions. Generated bindings, translations, and game catalogs
should be updated through their corresponding generators rather than edited by
hand.

## Game-version data

Project Zomboid builds differ in their commands, option metadata, and runtime
behavior. Build-specific definitions are intentionally kept explicit where
behavior must be verified independently. Scripts under `frontend/scripts/`
extract or assemble reference data from locally installed game files.

Do not assume a new game build behaves like the latest supported build. Command
availability, option metadata, and inferred player-state changes should be
verified against that build before support is declared.

## Translations

Handwritten UI translations live under
`frontend/src/i18n/resources/<locale>/`. English is the source locale for key
parity. Game-derived item and skill translations are generated separately and
must not be edited manually.

After changing handwritten translations, run:

```sh
pnpm --dir frontend check:translations
```
