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
whitelist account. However, a successful response does not prove that the
username has no existing character save. A B42 live-server test confirmed that
removing a username from the whitelist and adding it again preserved both the
old character and its enabled God Mode, Invisible/Ghost Mode, and No Clip.

Consequently, `adduser` may safely observe the newly created account's role and
ban state, but it must not initialize character powers to false unless the
application independently knows that no prior character exists.

## Whitelist removal

In both builds, `removeuserfromwhitelist` deletes the complete whitelist row;
it does not toggle a whitelist boolean.

B42 also calls `WorldMapVisitedServer.deleteUser`, deleting visited-map data
for the username.

B42 does not delete the serialized character from `players.db`. A live-server
test confirmed that re-adding the same username restored the existing
character with its powers intact.

Further B42 tests with an open server established that removing an online
player from the whitelist does not disconnect them. Removing an offline player
behaves equivalently. In both cases the username could reconnect without a
manual `adduser`, the existing character and powers were retained, and the
account role was reset to the default user role.

The open-server setting is relevant to the ability to reconnect without manual
account recreation; it does not change the observed fact that whitelist
removal itself neither disconnects the live player nor deletes character data.
A closed server should be tested separately only if its login/account-creation
behavior matters to the application.

The application models whitelist membership only as an observation signal.
`Whitelisted=false` deletes the matching local player during store merge. The
persisted `Player` model intentionally has no `Whitelisted` field. Typed player
actions and recognized raw-console responses use the same observation path.

Hard local deletion is an accepted simplicity tradeoff even though the game
retains the character save. It can lose cached powers and history if the same
username is later re-added, but it does not affect game data. To avoid replacing
that lost knowledge with incorrect values, `adduser` must leave character-power
fields unknown rather than initializing them to false. An archive/tombstone
model could preserve the cache later if this edge case becomes important.

For an online removal, hard deletion means the next successful `players` poll
recreates the still-connected username as a fresh local record with a new ID
and without the deleted cached metadata. This behavior is accepted instead of
adding tombstones. To avoid waiting for the normal 15-second poll, the typed
removal action should invoke the service's existing `refresh(ctx, state)` once
after the whole batch when at least one removal succeeded. It must not refresh
once per player. Raw console removals will continue to rely on normal polling.

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

Live-server tests confirmed that God Mode, Invisible/Ghost Mode, and No Clip
remain enabled after the player is banned, unbanned, and reconnects, and also
survive a full server restart. They are durable saved-player state in B42, not
merely live-session flags. Ban and unban observations must therefore preserve
these feature values rather than setting them to false.

Directly assigning the B42 `banned` role with `setaccesslevel` was tested
separately and did not preserve the three powers: God Mode,
Invisible/Ghost Mode, and No Clip were disabled. This differs from `banuser`,
which preserves them. Observations must follow the command path used rather
than deriving all effects solely from the resulting `banned` role.
The command also disconnects the online player immediately.

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
`VMServerBan` immediately delegates to the native
`RakVoice.SetVoiceBan(onlineId, value)`. There is no Java-side account field,
database write, or player-save serialization for the voice ban. Closing a
voice connection delegates to native `RakVoice.CloseVoiceChannel`.

The result is a safe observation for the current live player session and must
not be treated as durable account or character state. A server restart cannot
restore it from the game's Java/database persistence paths. Whether the native
voice layer retains a ban across a disconnect and channel recreation cannot be
proved from Java bytecode alone.

## Character death and powers

B42 stores powers in `PlayerCheats`. Its `save` method writes every enabled
`CheatType` ordinal into the serialized character data, and `load` restores
that set. This explains the confirmed reconnect and server-restart
persistence of God Mode, Invisible/Ghost Mode, and No Clip for the same
character.

A newly constructed character initializes `PlayerCheats` with an empty
`EnumSet`. The multiplayer player database stores serialized data and an
`isDead` marker per username, world, and player index; a replacement character
is saved back with its own newly serialized data. The code therefore indicates
that powers belong to the character save rather than the account and should
start disabled on a genuinely new post-death character. This is a code-path
inference; an end-to-end death/respawn test remains useful if a reliable test
method becomes available.

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

A live-server test confirmed that changing an online player from the built-in
`user` role to `observer` enables God Mode, Invisible/Ghost Mode, and No Clip.
The built-in observer role therefore grants all three corresponding toggle
capabilities in the tested B42 version.

The reverse transition was also tested: changing the online player from
`observer` back to `user` disabled God Mode, Invisible/Ghost Mode, and No Clip.
This confirms that losing those capabilities forcibly disables the associated
saved-player powers.

A transition from `observer` to `gm` was tested after manually disabling only
Invisible. Invisible remained disabled while God Mode and No Clip remained
enabled. When both old and new roles possess a capability, B42 preserves the
associated power's current value rather than forcing it on.

Assigning `observer` while the player was offline was also tested. After
reconnecting, God Mode, Invisible/Ghost Mode, and No Clip all remained
disabled. Offline role changes update the persisted role only; login does not
apply the online role-transition power side effects.

The same held when assigning `admin` to a disconnected player whose current
role was `banned`: the account role changed, but none of the three powers were
enabled on reconnect. Offline capability gain does not apply power side
effects even for the built-in admin role.

The reverse offline transition was tested with all three powers enabled:
changing the disconnected player from `observer` to `user` preserved God Mode,
Invisible/Ghost Mode, and No Clip after reconnect. An offline demotion can
therefore leave a regular user with enabled powers that their role may not let
them toggle. Offline role-change observations must preserve all power fields.

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
disconnect caused by banning, the subsequent reconnect, and a full server
restart. Equivalent B41 behavior and other lifecycle transitions have not yet
been established.

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

Repeat the B42 live-server matrix on B41 when it is installed: ban/unban,
reconnect, server restart, online role/access-level gain and loss, transitions
between staff levels, and offline access-level changes. Do not generalize the
B42 lifecycle results to B41.

1. Stop assigning character-power defaults from `adduser`; a newly created
   account may reconnect to an existing character save.
2. Correct B41 ban observation so it preserves access level and does not set
   live features to false.
3. Stop setting B42 live feature fields to false as a ban side effect.
4. Add observation invalidation for role changes and lifecycle transitions.
5. Decide whether successful complete `players` responses should establish
   offline state for known players omitted from the response.
6. Verify B41 feature persistence and whether either build behaves differently
   across character death or respawn. B42 persistence across reconnect and
   server restart is confirmed.
7. Verify native VoiceManager cleanup/reassignment behavior across reconnects
   if a second voice client becomes available.
