# Player Observation Reference

This document records player-state behavior verified against the locally
installed Project Zomboid Build 41 and Build 42 server classes on 2026-08-27.
It distinguishes persistent account state from transient live-player state so
the application does not present an inference as a directly observed fact.

## Sources inspected

- Build 41 loose classes from the `pz41_pz41-server` Podman volume.
- Build 42 `projectzomboid.jar` from the local Steam installation.
- Server command implementations under
  `zombie.commands.serverCommands`.
- Delegated methods in `GameServer`, `BanSystem`, and
  `ServerWorldDatabase`.
- Live setters on `IsoPlayer` and role/capability definitions in B42.

## State categories

Persistent account state:

- Access level or role.
- Ban state. B41 stores a separate `banned` column; B42 represents this with
  the `banned` role.
- Account existence in the whitelist database.

Transient live-player state:

- God Mode.
- Invisible/Ghost Mode.
- No Clip.
- Voice ban.

The game may change persistent and transient state through the same command,
but only when the target has a live `IsoPlayer`. Offline targets generally
receive database changes only.

## Account creation

### Build 41

`adduser` inserts a whitelist row with the regular empty access level. The row
is not banned.

### Build 42

`adduser` inserts a whitelist row using `Roles.getDefaultForNewUser()`, which
is the built-in `user` role.

### Safe observations

- The account exists after a confirmed successful response.
- B41 access level is `none` in the application's normalized representation.
- B42 role is `user`.
- The account is not banned.

The command is creation-only: it fails rather than modifying an existing
account. A successful response therefore identifies a genuinely new player,
for which initializing God Mode, Invisible, No Clip, and Voice Banned to false
is the correct application behavior. This question is resolved.

## Whitelist removal

In both builds, `removeuserfromwhitelist` deletes the complete whitelist row;
it does not toggle a whitelist boolean.

B42 also calls `WorldMapVisitedServer.deleteUser`, deleting visited-map data
for the username.

The application models whitelist membership only as an observation signal.
`Whitelisted=false` deletes the matching local player during store merge. The
persisted `Player` model intentionally has no `Whitelisted` field. Typed player
actions and recognized raw-console responses use the same observation path.

## Ban and unban

### Build 41 `banuser`

- Sets the whitelist row's `banned` column to true.
- Disconnects an online target.
- Preserves the database access level.
- Does not explicitly set God Mode, Invisible, or No Clip.

It is incorrect to infer `AccessLevel=none` or set live feature fields to false
from this command.

### Build 41 `unbanuser`

- Sets the `banned` column to false.
- Preserves the database access level.
- Also removes the related IP ban where applicable.

The role the account had before the ban remains its role after unban.

### Build 42 `banuser`

- Replaces the persistent role with `Roles.getDefaultForBanned()`, the built-in
  `banned` role.
- Disconnects an online target.
- Discards the previous role.
- Does not explicitly toggle God Mode, Invisible, or No Clip before the
  disconnect.

`AccessLevel=banned` and `Banned=true` are safe persistent observations. The
live feature fields should not be synthesized as false from this command.

### Build 42 `unbanuser`

- Replaces the persistent role with `Roles.getDefaultForUser()`, the built-in
  `user` role.
- Does not restore the role held before the ban.

`AccessLevel=user` and `Banned=false` are safe observations.

### Build 42 live-feature persistence

A live-server test confirmed that God Mode, Invisible/Ghost Mode, and No Clip
remain enabled after the player is banned, unbanned, and reconnects. Ban and
unban observations must therefore preserve these feature values rather than
setting them to false.

## Explicit live-player toggles

### God Mode

B41 `godmode` and B42 `godmodeplayer` call only the corresponding God Mode
setter and send updated player extra information. They do not change the
separate Invisible or No Clip flags.

An explicit successful state-setting command safely observes the requested
God Mode value.

### Invisible

`IsoPlayer.isGhostMode()` delegates to `isInvisible()`, and
`setGhostMode(value)` delegates to `setInvisible(value)` in both builds. Ghost
Mode is therefore an alias for the same underlying state, not an independently
controllable feature. Some commands and network paths still refer to or set
both names redundantly. A successful explicit command safely observes the
application's stored `Invisible` value. This distinction is resolved.

### No Clip

The explicit No Clip command changes only `IsoPlayer.NoClip` and sends updated
player extra information. A successful explicit state-setting command safely
observes the requested value.

### Voice ban

`voiceban` calls `VoiceManager.VMServerBan` with the live player's online ID.
The result is a safe observation for the current live player session. It is
not a demonstrated persistent account property, so retaining it across
disconnect/reconnect requires further verification.

## Role changes in Build 41

`setaccesslevel`, `grantadmin`, and `removeadmin` share the same update method.

For an online player, assigning any B41 staff access level forcibly sets:

- God Mode to true.
- Invisible to true.
- Ghost Mode to true.

Returning from a staff access level to `none` forcibly sets:

- God Mode to false.
- Invisible to false.
- Ghost Mode to false.
- No Clip to false.

Changing between staff access levels forces God Mode and Invisible on while
preserving No Clip. Assigning `none` while the previous level is already
`none` does not necessarily reset No Clip through the staff-to-user branch.

For an offline account, only the database access level changes. There is no
live `IsoPlayer` to mutate.

Consequences for observations:

- Access level can be recorded from a confirmed response.
- Fixed feature values cannot be inferred safely without reliable online and
  previous-role knowledge.
- Previously known God Mode, Invisible, and No Clip values may become stale
  after a role command and should be invalidated when exact consequences are
  unavailable.

The old concern that the direct B41 God Mode command might alter invisibility
was misplaced. It is the B41 role-change path that changes invisibility.

## Role changes in Build 42

B42 roles contain capabilities. Custom roles can be added and their
capabilities edited, so a role name is not a stable substitute for its
capability set.

For an online player, `GameServer.changeRole` compares the old and new roles:

- Gaining `ToggleGodModHimself` enables God Mode.
- Losing `ToggleGodModHimself` disables God Mode.
- Gaining `ToggleNoclipHimself` enables No Clip.
- Losing `ToggleNoclipHimself` disables No Clip.
- Gaining `ToggleInvisibleHimself` enables Invisible/Ghost Mode.
- Losing `ToggleInvisibleHimself` disables Invisible/Ghost Mode.
- If both roles have a capability, the corresponding live state is preserved.

Although the role-change path calls the Ghost Mode setter, that setter changes
the same state exposed as Invisible. B42 role changes can therefore affect the
application's stored `Invisible` value.

The method also updates the live player's role, connection role, admin-chat
membership, and Steam user-list visibility where the relevant capabilities
change. For an offline account, only the database role changes.

Consequences for observations:

- The role can be recorded from a confirmed response.
- `Banned` can be derived from whether the resulting role is `banned` because
  B42 uses that role as its ban representation.
- God Mode, Invisible, and No Clip may need invalidation after a role change
  unless the actual old/new capabilities and online state are known.

## Grant and remove admin aliases

In both builds, `grantadmin` and `removeadmin` delegate to the same role/access
update path as `setaccesslevel`. They have the same persistent and live-player
side effects described above.

## Kick and disconnect

`kick` disconnects the player without explicitly changing God Mode,
Invisible, or No Clip first. Those values should not be synthesized as false
as direct command effects.

Build 42 preserves God Mode, Invisible/Ghost Mode, and No Clip across the
disconnect caused by banning and the subsequent reconnect. Equivalent B41
behavior and other lifecycle transitions have not yet been established.

## Current polling limitations

The player refresh loop runs the `players` command. For each listed username it
records:

- Online at the observation time.
- Not banned, because a currently connected player cannot be using a banned
  account/role.

It does not currently:

- Mark previously online players absent from a successful complete response
  as offline.
- Observe access level or role.
- Observe God Mode, Invisible, No Clip, or Voice Banned.
- Repair or invalidate stale transient values.

As a result, command-derived live values can remain persisted indefinitely
unless another recognized command overwrites them.

## Observation model limitation

Most nullable observation fields currently mean:

- `nil`: leave the stored value unchanged.
- non-nil: replace the stored value.

This cannot express "the previous value is no longer known." Whitelist removal
is handled separately as an observation-driven deletion, but role changes and
disconnects still need a general invalidation mechanism if transient fields
remain persisted.

A future observation patch should distinguish:

- Unchanged.
- Set to a known value.
- Clear to unknown.

An explicit invalidation mask is an equivalent design.

## Recommended follow-up

1. Correct B41 ban observation so it preserves access level and does not set
   live features to false.
2. Stop setting B42 live feature fields to false as a ban side effect.
3. Add observation invalidation for role changes and lifecycle transitions.
4. Decide whether successful complete `players` responses should establish
   offline state for known players omitted from the response.
5. Verify B41 feature persistence and whether either build behaves differently
   across ordinary disconnects, character save/load, death, or server restart.
6. Verify VoiceManager cleanup/reassignment behavior across reconnects.
