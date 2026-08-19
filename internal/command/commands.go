package command

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/feature"
)

// usernameEchoes returns the exact forms Project Zomboid may use when it
// repeats a username in an RCON response. Some server responses replace each
// non-ASCII UTF-8 byte with '?', while the command itself still succeeds.
func usernameEchoes(username string) []string {
	mangled := []byte(username)
	changed := false
	for i, b := range mangled {
		if b > 0x7f {
			mangled[i] = '?'
			changed = true
		}
	}
	if !changed {
		return []string{username}
	}
	return []string{username, string(mangled)}
}

func optionValueMatches(requested, actual string) bool {
	if requested == actual {
		return true
	}

	requestedBoolean, requestedIsBoolean := optionBoolean(requested)
	actualBoolean, actualIsBoolean := optionBoolean(actual)
	if requestedIsBoolean && actualIsBoolean {
		return requestedBoolean == actualBoolean
	}

	requestedNumber, err := strconv.ParseFloat(requested, 64)
	if err != nil {
		return false
	}
	actualNumber, err := strconv.ParseFloat(actual, 64)
	return err == nil && requestedNumber == actualNumber
}

func optionBoolean(value string) (bool, bool) {
	switch strings.ToLower(value) {
	case "true", "1":
		return true, true
	case "false", "0":
		return false, true
	default:
		return false, false
	}
}

func matchesUsernameResponse(raw, username string, response func(string) string) bool {
	for _, echo := range usernameEchoes(username) {
		if raw == response(echo) {
			return true
		}
	}
	return false
}

func matchesNumericXPResponse(raw, username, perk, amount string) bool {
	wantAmount, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return false
	}
	for _, echo := range usernameEchoes(username) {
		value, ok := strings.CutPrefix(raw, "Added ")
		if !ok {
			continue
		}
		value, ok = strings.CutSuffix(value, fmt.Sprintf(" %s xp's to %s", perk, echo))
		if !ok {
			continue
		}
		gotAmount, err := strconv.ParseFloat(value, 64)
		if err == nil && gotAmount == wantAmount {
			return true
		}
	}
	return false
}

// definitions is the canonical list of every command definition. Add new
// definitions here to register them automatically.
var definitions = []Definition{

	// ---------------------------------------------------------------------------
	// B41, B41+ Commands
	// ---------------------------------------------------------------------------

	// addItem is the command definition for giving items to a player.
	// Count is optional and defaults to 1 when omitted.
	//
	// Usage: /additem "username" "module.item" [count]
	// Example: /additem "rj" Base.Axe 5
	{
		Name:       "additem",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerAddItems,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "item", Type: TypeString, Required: true},
			{Name: "count", Type: TypeInt, Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("Item %s Added in %s's inventory.", args["item"], username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// addUser is the command definition for creating a new user account on a
	// whitelisted server.
	//
	// Usage: /adduser "username" "password"
	// Example: /adduser "rj" hunter2
	{
		Name:       "adduser",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerAddUser,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "password", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			for _, username := range usernameEchoes(args["username"]) {
				if strings.Contains(raw, fmt.Sprintf("User %s created with the password ", username)) {
					return raw, nil
				}
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},
	// addVehicle spawns a vehicle. The target is either a username or
	// "x,y,z" coordinates.
	//
	// Usage: /addvehicle "script" "user or x,y,z"
	// Example: /addvehicle "Base.VanAmbulance" "rj"
	{
		Name:       "addvehicle",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerSpawnVehicle,
		Params: []Param{
			{Name: "script", Type: TypeString, Required: true},
			{Name: "target", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Vehicle spawned" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// addXP gives XP to a player. The perk argument is in "perkname=xp"
	// format, e.g. "Woodwork=2".
	//
	// Usage: /addxp "playername" perkname=xp
	// Example: /addxp "rj" Woodwork=2
	{
		Name:       "addxp",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerAddXP,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "perk", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			perk, amount, ok := strings.Cut(args["perk"], "=")
			if !ok {
				return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
			}
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("Added %s %s xp's to %s", amount, perk, username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// addToSafehouse invites a player to a safehouse.
	//
	// Usage: /addtosafehouse "safehouse" "username"
	// Example: /addtosafehouse "Rosewood Base" "rj"
	{
		Name:       "addtosafehouse",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "safehouse", Type: TypeString, Required: true},
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("Player %s invited to safehouse %s", username, args["safehouse"])
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// banID bans a Steam ID.
	//
	// Usage: /banid SteamID
	// Example: /banid 00000000000000000
	{
		Name:       "banid",
		MinVersion: "41",
		MaxVersion: "41",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			want := fmt.Sprintf("SteamID %s is now banned", args["steamid"])
			if strings.TrimSpace(raw) == want {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// unbanID unbans a Steam ID.
	//
	// Usage: /unbanid SteamID
	// Example: /unbanid 00000000000000000
	{
		Name:       "unbanid",
		MinVersion: "41",
		MaxVersion: "42",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			want := fmt.Sprintf("SteamID %s is now unbanned", args["steamid"])
			if strings.TrimSpace(raw) == want {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// banUser bans a user. Add -ip to also ban the IP, -r "reason" to specify
	// a reason.
	//
	// Usage: /banuser "username" -ip -r "reason"
	// Example: /banuser "rj" -ip -r "spawn kill"
	{
		Name:       "banuser",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerBan,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "banip", Type: TypeFlag, Prefix: "-ip", Required: false},
			{Name: "reason", Type: TypeString, Prefix: "-r ", Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("User %s is now banned", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// unbanUser unbans a player.
	//
	// Usage: /unbanuser "username"
	// Example: /unbanuser "rj"
	{
		Name:       "unbanuser",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerUnban,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("User %s is now un-banned", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// changeOption changes a server option.
	//
	// Usage: /changeoption optionName "newValue"
	// Example: /changeoption SleepAllowed false
	{
		Name:       "changeoption",
		MinVersion: "41",
		MaxVersion: "42",
		Params: []Param{
			{Name: "option", Type: TypeString, Required: true},
			{Name: "value", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			prefix := fmt.Sprintf("Option : %s is now : ", args["option"])
			if returned, ok := strings.CutPrefix(raw, prefix); ok &&
				optionValueMatches(args["value"], returned) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// chopper places a helicopter event on a random player.
	//
	// Usage: /chopper
	{
		Name:       "chopper",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Chopper launched" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// createHorde spawns a horde near a player. Count is the number of
	// zombies. Username is required from RCON.
	//
	// Usage: /createhorde count "username"
	// Example: /createhorde 150 "rj"
	{
		Name:       "createhorde",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerCreateHorde,
		Params: []Param{
			{Name: "count", Type: TypeInt, Required: true},
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Horde spawned." {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// godMode makes a player invincible.
	//
	// Usage: /godmode "username" -value
	// Example: /godmode "rj" -true (or -false)
	{
		Name:       "godmode",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerSetGodMode,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				if args["state"] == "true" {
					return fmt.Sprintf("User %s is now invincible.", username)
				}
				return fmt.Sprintf("User %s is no more invincible.", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// gunshot places a gunshot sound on a random player.
	//
	// Usage: /gunshot
	{
		Name:       "gunshot",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Gunshot fired" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// kick kicks a user. Add -r "reason" to specify a reason.
	//
	// Usage: /kick "username" -r "reason"
	// Example: /kick "rj" -r "spam"
	{
		Name:       "kick",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerKick,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "reason", Type: TypeString, Prefix: "-r ", Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("User %s kicked.", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// lightning strikes lightning on a player.
	//
	// Usage: /lightning "username"
	// Example: /lightning "rj"
	{
		Name:       "lightning",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerTriggerLightning,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Lightning triggered" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// thunder strikes thunder on a player.
	//
	// Usage: /thunder "username"
	// Example: /thunder "rj"
	{
		Name:       "thunder",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerTriggerThunder,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Thunder triggered" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// players lists all connected players. Parse extracts player names from
	// the response. Parse returns a slice of player names.
	//
	// Usage: /players
	{
		Name:       "players",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerList,
		Parse: func(raw string, _ map[string]string) (any, error) {
			first, rest, _ := strings.Cut(raw, "\n")
			first = strings.TrimSpace(first)
			if !strings.HasPrefix(first, "Players connected (") {
				return nil, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
			}
			var names []string
			for line := range strings.SplitSeq(rest, "\n") {
				if name, ok := strings.CutPrefix(strings.TrimSpace(line), "-"); ok {
					names = append(names, name)
				}
			}
			return names, nil
		},
	},

	// quit saves and quits the server.
	//
	// Usage: /quit
	{
		Name:       "quit",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Quit" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// reloadOptions reloads server options (ServerOptions.ini) and sends them
	// to clients.
	//
	// Usage: /reloadoptions
	{
		Name:       "reloadoptions",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Options reloaded" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// removeUserFromWhitelist removes a user from the whitelist.
	//
	// Usage: /removeuserfromwhitelist "username"
	// Example: /removeuserfromwhitelist "rj"
	{
		Name:       "removeuserfromwhitelist",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerRemoveFromWhitelist,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("User %s removed from white list", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// save saves the current world.
	//
	// Usage: /save
	{
		Name:       "save",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "World saved" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// serverMsg broadcasts a message to all connected players.
	//
	// Usage: /servermsg "My Message"
	{
		Name:       "servermsg",
		MinVersion: "41",
		MaxVersion: "42",
		Params: []Param{
			{Name: "message", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Message sent." {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// setAccessLevel sets a player's access level. Valid levels: Admin,
	// Moderator, Overseer, GM, Observer, none.
	//
	// Usage: /setaccesslevel "username" "accesslevel"
	// Example: /setaccesslevel "rj" "moderator"
	{
		Name:       "setaccesslevel",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerSetAccessLevel,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "level", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("User %s is now %s", username, args["level"])
			}) || matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("User %s no longer has access level", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// showOptions lists current server options and values. Parse returns
	// a map[string]string.
	//
	// Usage: /showoptions
	{
		Name:       "showoptions",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			first, rest, _ := strings.Cut(raw, "\n")
			if strings.TrimSpace(first) != "List of Server Options:" {
				return nil, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
			}
			opts := make(map[string]string)
			for line := range strings.SplitSeq(rest, "\n") {
				line = strings.TrimSpace(line)
				if name, val, ok := strings.Cut(strings.TrimPrefix(line, "* "), "="); ok {
					opts[name] = val
				}
			}
			return opts, nil
		},
	},

	// startRain starts raining on the server. Intensity is optional, from
	// 1 to 100.
	//
	// Usage: /startrain "intensity"
	// Example: /startrain 100
	{
		Name:       "startrain",
		MinVersion: "41",
		MaxVersion: "42",
		Params: []Param{
			{Name: "intensity", Type: TypeInt, Required: false},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Rain started" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// startStorm starts a storm on the server. Duration is optional, in game
	// hours.
	//
	// Usage: /startstorm "duration"
	// Example: /startstorm 1
	{
		Name:       "startstorm",
		MinVersion: "41",
		MaxVersion: "42",
		Params: []Param{
			{Name: "duration", Type: TypeInt, Required: false},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Thunderstorm started" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// stopRain stops rain on the server.
	//
	// Usage: /stoprain
	{
		Name:       "stoprain",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Rain stopped" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// stopWeather stops weather on the server.
	//
	// Usage: /stopweather
	{
		Name:       "stopweather",
		MinVersion: "41",
		MaxVersion: "42",
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.TrimSpace(raw) == "Weather stopped" {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// teleport teleports a player to another player. Both players are
	// required from RCON.
	//
	// Usage: /teleport "player1" "player2"
	// Example: /teleport "rj" "steve"
	{
		Name:       "teleport",
		MinVersion: "41",
		MaxVersion: "41",
		Feature:    feature.PlayerTeleportToPlayer,
		Params: []Param{
			{Name: "player1", Type: TypeString, Required: true},
			{Name: "player2", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			for _, player1 := range usernameEchoes(args["player1"]) {
				for _, player2 := range usernameEchoes(args["player2"]) {
					if raw == fmt.Sprintf("teleported %s to %s", player1, player2) {
						return raw, nil
					}
				}
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// teleportTo teleports a player to coordinates.
	//
	// Usage: /teleportto "username" x,y,z
	// Example: /teleportto "rj" 10000,11000,0
	{
		Name:       "teleportto",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerTeleportToCoordinates,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "coordinates", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("%s teleported to %s please wait two seconds to show the map around you.", username, args["coordinates"])
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// voiceBan blocks or unblocks voice from a user.
	//
	// Usage: /voiceban "username" -value
	// Example: /voiceban "rj" -true (or -false)
	{
		Name:       "voiceban",
		MinVersion: "41",
		MaxVersion: "42",
		Feature:    feature.PlayerSetVoiceBanned,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				if args["state"] == "true" {
					return fmt.Sprintf("User %s voice is banned.", username)
				}
				return fmt.Sprintf("User %s voice is unbanned.", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// ---------------------------------------------------------------------------
	// B42 Commands
	// ---------------------------------------------------------------------------

	// addUser creates a new account on a whitelisted server.
	//
	// Usage: /adduser "username" "password"
	// Example: /adduser "rj" hunter2
	{
		Name:       "adduser",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerAddUser,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "password", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("User %s created with password", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// addXP gives XP to a player. Build 42 formats integral XP amounts with a
	// decimal suffix in successful responses.
	//
	// Usage: /addxp "playername" perkname=xp
	// Example: /addxp "rj" Fitness=90000
	{
		Name:       "addxp",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerAddXP,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "perk", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			perk, amount, ok := strings.Cut(args["perk"], "=")
			raw = strings.TrimSpace(raw)
			if ok && matchesNumericXPResponse(raw, args["username"], perk, amount) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// banID bans a Steam ID. The ban system may include details for a connected
	// account inside the response's parentheses.
	//
	// Usage: /banid SteamID
	// Example: /banid 00000000000000000
	{
		Name:       "banid",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "steamid", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			prefix := fmt.Sprintf("System banned SteamID %s(", args["steamid"])
			if strings.HasPrefix(raw, prefix) && strings.HasSuffix(raw, ")") {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// banUser bans a user. Add -ip to also ban the IP, -r "reason" to specify
	// a reason.
	//
	// Usage: /banuser "username" -ip -r "reason"
	// Example: /banuser "rj" -ip -r "spawn kill"
	{
		Name:       "banuser",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerBan,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "banip", Type: TypeFlag, Prefix: "-ip", Required: false},
			{Name: "reason", Type: TypeString, Prefix: "-r ", Required: false},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("System banned user %s", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// unbanUser unbans a user.
	//
	// Usage: /unbanuser "username"
	// Example: /unbanuser "rj"
	{
		Name:       "unbanuser",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerUnban,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("System unbanned user %s", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// godModePlayer makes a player invincible.
	//
	// Usage: /godmodeplayer "username" -value
	// Example: /godmodeplayer "rj" -true (or -false)
	{
		Name:       "godmodeplayer",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetGodMode,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				if args["state"] == "true" {
					return fmt.Sprintf("User %s is now invincible.", username)
				}
				return fmt.Sprintf("User %s is no longer invincible.", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// invisiblePlayer makes a player invisible to zombies.
	//
	// Usage: /invisibleplayer "username" -value
	// Example: /invisibleplayer "rj" -true (or -false)
	{
		Name:       "invisibleplayer",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetInvisible,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				if args["state"] == "true" {
					return fmt.Sprintf("User %s is now invisible.", username)
				}
				return fmt.Sprintf("User %s is no longer invisible.", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// kickFromSafehouse removes a player directly from a safehouse.
	//
	// Usage: /kickfromsafehouse "safehouse" "username"
	// Example: /kickfromsafehouse "Rosewood Base" "rj"
	{
		Name:       "kickfromsafehouse",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "safehouse", Type: TypeString, Required: true},
			{Name: "username", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				return fmt.Sprintf("Player %s kicked from a safehouse %s", username, args["safehouse"])
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// noClip makes a player pass through walls and structures.
	//
	// Usage: /noclip "username" -value
	// Example: /noclip "rj" -true (or -false)
	{
		Name:       "noclip",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetNoClip,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if matchesUsernameResponse(raw, args["username"], func(username string) string {
				if args["state"] == "true" {
					return fmt.Sprintf("User %s won't collide.", username)
				}
				return fmt.Sprintf("User %s will collide.", username)
			}) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// releaseSafehouse releases the named safehouse.
	//
	// Usage: /releasesafehouse "safehouse"
	// Example: /releasesafehouse "Rosewood Base"
	{
		Name:       "releasesafehouse",
		MinVersion: "42",
		MaxVersion: "42",
		Params: []Param{
			{Name: "safehouse", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			if raw == fmt.Sprintf("Safehouse %s released", args["safehouse"]) {
				return raw, nil
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// setPassword changes a user's password. The server returns the new password
	// hash, which is never exposed by the typed wrapper.
	//
	// Usage: /setpassword "username" "newpassword"
	// Example: /setpassword "rj" hunter2
	{
		Name:       "setpassword",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerSetPassword,
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "password", Type: TypeString, Required: true},
		},
		Parse: func(raw string, _ map[string]string) (any, error) {
			if strings.HasPrefix(strings.TrimSpace(raw), "Your new password is ") {
				return struct{}{}, nil
			}
			return nil, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},

	// teleportPlayer teleports a player to another player.
	//
	// Usage: /teleportplayer "player1" "player2"
	// Example: /teleportplayer "rj" "steve"
	{
		Name:       "teleportplayer",
		MinVersion: "42",
		MaxVersion: "42",
		Feature:    feature.PlayerTeleportToPlayer,
		Params: []Param{
			{Name: "player1", Type: TypeString, Required: true},
			{Name: "player2", Type: TypeString, Required: true},
		},
		Parse: func(raw string, args map[string]string) (any, error) {
			raw = strings.TrimSpace(raw)
			for _, player1 := range usernameEchoes(args["player1"]) {
				for _, player2 := range usernameEchoes(args["player2"]) {
					if raw == fmt.Sprintf("teleported %s to %s", player1, player2) {
						return raw, nil
					}
				}
			}
			return raw, fmt.Errorf("%w: %s", ErrCommandFailed, raw)
		},
	},
}

func init() {
	for _, d := range definitions {
		Register(d)
	}
}
