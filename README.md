# PZ Admin

PZ Admin is a desktop application for managing Project Zomboid servers.
Manage players, edit server options, and run console commands from one interface.

[Website](https://beyenilmez.github.io/pz-admin/) ·
[Releases](https://github.com/beyenilmez/pz-admin/releases) ·
[Report an issue](https://github.com/beyenilmez/pz-admin/issues)

> **Release status:** TODO — add the v2 release status and download destination.

> **Screenshot:** TODO — add a screenshot of the current application.

## Features

- Manage players: assign roles, grant XP, teleport, and perform moderation actions.
- Give items to players and spawn vehicles using searchable catalogs.
- Edit server options and run console commands.
- Compose messages with a rich text editor that supports Project Zomboid formatting.
- Control the weather, trigger server events, and save the world.
- Connect to your servers through RCON and save connection profiles.

The item browser, vehicle browser, and message editor can also be used without
connecting to a server. PZ Admin includes catalogs and options for Builds 41 and 42.

## Download

Choose the download for your operating system and processor.

<table>
  <thead>
    <tr>
      <th scope="col">Platform</th>
      <th scope="col">Package</th>
      <th scope="col">x64 (amd64)</th>
      <th scope="col">ARM64</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="rowgroup" rowspan="2">Windows</th>
      <td>Installer (.exe)</td>
      <td>TODO</td>
      <td>TODO</td>
    </tr>
    <tr>
      <td>Portable (.exe)</td>
      <td>TODO</td>
      <td>TODO</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <th scope="row">macOS</th>
      <td>DMG</td>
      <td>TODO</td>
      <td>TODO</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <th scope="rowgroup" rowspan="3">Linux</th>
      <td>DEB</td>
      <td>TODO</td>
      <td>TODO</td>
    </tr>
    <tr>
      <td>RPM</td>
      <td>TODO</td>
      <td>TODO</td>
    </tr>
    <tr>
      <td>Arch</td>
      <td>TODO</td>
      <td>TODO</td>
    </tr>
  </tbody>
</table>

### Windows

Run the installer, or use the portable executable without installing it.
Windows releases are unsigned. If SmartScreen shows **Windows protected your PC**,
choose **More info → Run anyway**, if available, only if you trust the download
from this project's GitHub Releases.

### macOS

Open the DMG and drag PZ Admin into **Applications**.
The app is not signed with an Apple Developer ID or notarized. If macOS blocks
it because the developer cannot be verified, try opening it once, then go to
**System Settings → Privacy & Security → Open Anyway**. Only approve a download
you trust; see [Apple's instructions](https://support.apple.com/en-us/102445).

### Linux

Install the package for your distribution using its package manager so required
dependencies are installed too. PZ Admin uses GTK4 and WebKitGTK 6.0.
Packages are downloaded directly from GitHub Releases; a package repository
and Flatpak are not currently available.

## Connect to a server

You need a running Project Zomboid server with RCON enabled.

Choose **Add server**, select the game build, and enter the server's address,
RCON port, and RCON password. Save the profile and connect.

The RCON port and password are separate from those used to join the game.
For hosted servers, check your provider's control panel for these details.

## Contributing

Code, documentation, and translation contributions are welcome. Please discuss
larger changes in an [issue](https://github.com/beyenilmez/pz-admin/issues) first.

### Pull requests

1. Fork the repository and create a branch for your change.
2. Set up the project using the [development instructions](#development).
3. Make your changes and run `wails3 task check`.
4. Open a focused pull request describing the change. Link relevant issues and
   include screenshots for UI changes.

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
for pull request titles, such as `fix: correct vehicle sorting` or
`feat: add player filtering`. Pull requests are squash merged, so individual
commits do not need to follow this format.

## Development

PZ Admin uses Go and Wails v3, with a React, TypeScript, and Mantine frontend.

### Setup

Install and activate [mise](https://mise.jdx.dev/) for the project's tools,
including the matching Wails CLI. Install your platform's native dependencies
using the [Wails prerequisites](https://v3.wails.io/getting-started/installation/).

From the repository root:

```sh
mise trust
mise install
wails3 doctor
wails3 dev
```

### Common commands

```sh
wails3 dev                 # Run in development mode
wails3 build               # Build for the current platform
wails3 package             # Create platform packages
wails3 task check          # Run checks and tests
wails3 task test           # Run tests only
wails3 task format         # Format source files
wails3 task licenses       # Generate license notices
pnpm --dir frontend test   # Run frontend tests in watch mode
```

The `check`, `test`, and `format` tasks also have `:frontend` and `:backend`
variants, such as `wails3 task check:frontend`.

## License and acknowledgments

Original application code is licensed under [GPL-3.0-or-later](LICENSE).
The original app icon is licensed under
[CC BY-SA 4.0](LICENSES/CC-BY-SA-4.0.txt).
Third-party code, wiki material, and game assets retain their respective terms;
see [REUSE.toml](REUSE.toml) for file-level licensing.
Dependency notices are available under
**Settings → About → Licenses and notices** in the application.

Thanks to [PZwiki](https://pzwiki.net/) contributors for the catalog material.
See [catalog sources and changes](frontend/src/data/README.md) and
[game asset attribution](frontend/public/README.md) for details.

Thanks to The Indie Stone for creating Project Zomboid (https://projectzomboid.com/),
which made this possible. This is an unofficial fan production for non-commercial
purposes made under the [Indie Stone Terms](https://projectzomboid.com/blog/support/terms-conditions/).
