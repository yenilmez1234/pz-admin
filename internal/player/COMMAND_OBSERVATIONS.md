# Planned Player Command Observations

This is the concise implementation reference for player observations. Apply an
observation only after a recognized successful command response.

## Terms

- **Set**: replace the stored value with a confirmed value.
- **Preserve**: leave the stored value unchanged.
- **Invalidate**: clear the stored value to unknown; do not replace it with
  `false`.
- **Delete**: remove the local player record.
- **Powers**: God Mode, Invisible/Ghost Mode, and No Clip.

B41 powers are live-session state. Staff access reapplies God Mode and
Invisible at login, but never enables No Clip. B42 powers are serialized with
the character and survive reconnects, bans, and server restarts.

## `adduser`

### B41

- Set `Online=false`, `AccessLevel=none`, and `Banned=false`.
- Invalidate powers and Voice Ban. The command creates no live player.

### B42

- Set `Online=false`, `AccessLevel=user`, and `Banned=false`.
- Invalidate powers and Voice Ban. A newly created account may reconnect to an
  existing character save, so powers must not default to false.

## `removeuserfromwhitelist`

### Both builds

- Delete the local player record.
- Do not infer `Online=false`; removing an online account does not disconnect
  it.
- Do not infer power changes.
- After a typed batch with at least one success, run one immediate `players`
  refresh. A still-online target then returns as a fresh local record.
- Raw console removal relies on periodic polling.

On an open server, the username can reconnect without manual recreation. Its
role/access resets to the build's regular default. Character data remains, but
B41 login derives powers from access while B42 retains serialized powers.

## `banuser`

### B41

- Set `Online=false` and `Banned=true`.
- Preserve `AccessLevel`; B41 updates only the separate database ban flag.
- Invalidate powers and Voice Ban because the command disconnects the live
  session. Do not synthesize power values from the preserved access level until
  the player reconnects.

### B42

- Set `Online=false`, `AccessLevel=banned`, and `Banned=true`.
- Preserve all powers; runtime tests confirmed ban/unban do not change them.
- Invalidate Voice Ban because its native online-ID state is not durable.

The optional IP-ban part adds no player-field observation.

## `unbanuser`

### B41

- Set `Banned=false`.
- Preserve `AccessLevel` and powers.

### B42

- Set `AccessLevel=user` and `Banned=false`.
- Preserve powers. The previous role is not restored.

## `kick`

### B41

- Set `Online=false`.
- Invalidate powers and Voice Ban because the live session ends.
- Preserve account access and ban state.

### B42

- Set `Online=false`.
- Preserve powers, which are serialized character state.
- Invalidate Voice Ban.
- Preserve role and account ban state.

## God Mode commands

Commands: B41 `godmode`; B42 `godmodeplayer`.

### Both builds

- Set `GodMode` from the successful response.
- Preserve Invisible and No Clip.
- Argumentless and explicit boolean forms are both recognized; derive the final
  value from the response, not the command argument.

The B41 value lasts only for the current session unless staff access reapplies
it at login. The B42 value is serialized.

## Invisible command

Command: B42 `invisibleplayer`.

### B42

- Set `Invisible` from the successful response.
- Preserve God Mode and No Clip.
- Ghost Mode is an alias of the same underlying state.

B41 has no working RCON form for this operation in the tested server.

## No Clip command

Command: B42 `noclip`.

### B42

- Set `NoClip` from the successful response.
- Preserve God Mode and Invisible.

B41 does not expose No Clip through RCON in the tested server.

## `voiceban`

### Both builds

- Set `VoiceBanned` from the successful response.
- `voiceban user` and `voiceban user -true` ban; `-false` unbans. The
  argumentless form is not a toggle.
- The command requires a live player and delegates to native voice state keyed
  by online ID.
- Invalidate the value when the player disconnects. Native persistence across
  channel recreation is unverified, and there is no account or character-save
  persistence path.

## `setaccesslevel`

Always set `AccessLevel` to the confirmed resulting level. B42 also sets
`Banned` according to whether the resulting role is `banned`; B41 preserves
the separate ban flag.

### B41 online target

- Assigning any staff level sets `GodMode=true` and `Invisible=true` on every
  successful assignment, including same-level and staff-to-staff assignments.
- Staff assignment preserves No Clip.
- Changing from staff to `none` sets all powers to false.
- A `none`-to-`none` assignment has no proven No Clip cleanup side effect.

### B41 offline target

- Preserve/invalidate live powers; only database access changes immediately.
- On next login, staff access enables God Mode and Invisible but not No Clip;
  regular access starts without those role-provided powers.

### B42 online target

- Compare old and new role capabilities for each power.
- Capability gained: set the associated power to true.
- Capability lost: set the associated power to false.
- Capability present in both roles, or absent from both: preserve the power.
- Custom roles require their actual capability sets; role names alone are not
  sufficient.
- Assigning `banned` directly was runtime-tested to disable all powers and
  disconnect immediately. This differs from `banuser`, which preserves powers.

### B42 offline target

- Preserve all powers; only the persisted role changes.
- Reconnect does not reconcile powers with role capabilities. Offline
  `banned -> admin` does not enable powers, and offline `observer -> user` can
  leave all powers enabled.

## `grantadmin` and `removeadmin`

Apply the same observations as their equivalent `setaccesslevel` operations:

- `grantadmin`: resulting level/role is `admin`.
- `removeadmin`: resulting regular level is B41 `none` or B42 `user`.
- Use the same online/offline power rules above.

## `players` refresh

For every listed username:

- Set `Online=true` and `Banned=false`.
- Preserve access/role and powers because the response does not report them.

For known usernames omitted from a successful complete response:

- Set `Online=false`.
- B41: invalidate powers and Voice Ban.
- B42: preserve powers and invalidate Voice Ban.

An unsuccessful or ambiguous response produces no observations.

## Commands with no additional player-field effects

Password changes and optional ban reasons/IP bans do not alter the modeled
role, power, online, or Voice Ban fields beyond the primary command behavior
documented above.
