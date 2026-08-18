package command

import (
	"context"
	"strconv"

	"github.com/beyenilmez/pz-admin/internal/connection"
)

// Client is a typed command runner. It bundles a command executor and game
// version so callers don't repeat them on every call.
type Client struct {
	exec    connection.CommandExecutor
	version string
}

// NewClient returns a Client ready to execute typed commands.
func NewClient(exec connection.CommandExecutor, version string) *Client {
	return &Client{exec: exec, version: version}
}

// AddItem gives items to a player. Count is optional; 0 means omit.
func (c *Client) AddItem(ctx context.Context, username, item string, count int) (string, error) {
	args := map[string]string{"username": username, "item": item}
	if count > 0 {
		args["count"] = strconv.Itoa(count)
	}
	res, err := Execute(ctx, c.exec, "additem", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// AddUser creates a new user account on a whitelisted server.
func (c *Client) AddUser(ctx context.Context, username, password string) (string, error) {
	res, err := Execute(ctx, c.exec, "adduser", c.version, map[string]string{
		"username": username,
		"password": password,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// AddVehicle spawns a vehicle. Target is a username or "x,y,z" coordinates.
func (c *Client) AddVehicle(ctx context.Context, script, target string) (string, error) {
	res, err := Execute(ctx, c.exec, "addvehicle", c.version, map[string]string{
		"script": script,
		"target": target,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// AddXP gives XP to a player.
func (c *Client) AddXP(ctx context.Context, username, perk string, amount int) (string, error) {
	res, err := Execute(ctx, c.exec, "addxp", c.version, map[string]string{
		"username": username,
		"perk":     perk + "=" + strconv.Itoa(amount),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// BanID bans a Steam ID.
func (c *Client) BanID(ctx context.Context, steamid string) (string, error) {
	res, err := Execute(ctx, c.exec, "banid", c.version, map[string]string{
		"steamid": steamid,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// UnbanID unbans a Steam ID.
func (c *Client) UnbanID(ctx context.Context, steamid string) (string, error) {
	res, err := Execute(ctx, c.exec, "unbanid", c.version, map[string]string{
		"steamid": steamid,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// BanUser bans a user. banIP also bans the IP. reason is optional.
func (c *Client) BanUser(ctx context.Context, username, reason string, banIP bool) (string, error) {
	args := map[string]string{"username": username}
	if banIP {
		args["banip"] = "true"
	}
	if reason != "" {
		args["reason"] = reason
	}
	res, err := Execute(ctx, c.exec, "banuser", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// UnbanUser unbans a player.
func (c *Client) UnbanUser(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "unbanuser", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ChangeOption changes a server option.
func (c *Client) ChangeOption(ctx context.Context, option, value string) (string, error) {
	res, err := Execute(ctx, c.exec, "changeoption", c.version, map[string]string{
		"option": option,
		"value":  value,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Chopper places a helicopter event on a random player.
func (c *Client) Chopper(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "chopper", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// CreateHorde spawns a horde near a player.
func (c *Client) CreateHorde(ctx context.Context, count int, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "createhorde", c.version, map[string]string{
		"count":    strconv.Itoa(count),
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetGodMode enables or disables god mode for a player.
func (c *Client) SetGodMode(ctx context.Context, username string, enabled bool) (string, error) {
	name := "godmode"
	if c.version != "41" {
		name = "godmodeplayer"
	}
	res, err := Execute(ctx, c.exec, name, c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(enabled),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetInvisible makes a player visible or invisible to zombies.
func (c *Client) SetInvisible(ctx context.Context, username string, enabled bool) (string, error) {
	res, err := Execute(ctx, c.exec, "invisibleplayer", c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(enabled),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetNoClip enables or disables collision for a player.
func (c *Client) SetNoClip(ctx context.Context, username string, enabled bool) (string, error) {
	res, err := Execute(ctx, c.exec, "noclip", c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(enabled),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Gunshot places a gunshot sound on a random player.
func (c *Client) Gunshot(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "gunshot", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Kick kicks a user. reason is optional.
func (c *Client) Kick(ctx context.Context, username, reason string) (string, error) {
	args := map[string]string{"username": username}
	if reason != "" {
		args["reason"] = reason
	}
	res, err := Execute(ctx, c.exec, "kick", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Lightning strikes lightning on a player.
func (c *Client) Lightning(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "lightning", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Thunder strikes thunder on a player.
func (c *Client) Thunder(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "thunder", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Players lists all connected players. Returns their names.
func (c *Client) Players(ctx context.Context) ([]string, error) {
	res, err := Execute(ctx, c.exec, "players", c.version, nil)
	if err != nil {
		return nil, err
	}
	return res.([]string), nil
}

// Quit saves and quits the server.
func (c *Client) Quit(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "quit", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ReloadOptions reloads server options from ServerOptions.ini.
func (c *Client) ReloadOptions(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "reloadoptions", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// RemoveUserFromWhitelist removes a user from the whitelist.
func (c *Client) RemoveUserFromWhitelist(ctx context.Context, username string) (string, error) {
	res, err := Execute(ctx, c.exec, "removeuserfromwhitelist", c.version, map[string]string{
		"username": username,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// Save saves the current world.
func (c *Client) Save(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "save", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ServerMsg broadcasts a message to all connected players.
func (c *Client) ServerMsg(ctx context.Context, message string) (string, error) {
	res, err := Execute(ctx, c.exec, "servermsg", c.version, map[string]string{
		"message": message,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// SetAccessLevel sets a player's access level.
func (c *Client) SetAccessLevel(ctx context.Context, username, level string) (string, error) {
	res, err := Execute(ctx, c.exec, "setaccesslevel", c.version, map[string]string{
		"username": username,
		"level":    level,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// ShowOptions lists current server options and values as a map.
func (c *Client) ShowOptions(ctx context.Context) (map[string]string, error) {
	res, err := Execute(ctx, c.exec, "showoptions", c.version, nil)
	if err != nil {
		return nil, err
	}
	return res.(map[string]string), nil
}

// StartRain starts rain. Intensity is optional; 0 means omit.
func (c *Client) StartRain(ctx context.Context, intensity int) (string, error) {
	args := map[string]string{}
	if intensity > 0 {
		args["intensity"] = strconv.Itoa(intensity)
	}
	res, err := Execute(ctx, c.exec, "startrain", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// StartStorm starts a storm. Duration is optional; 0 means omit.
func (c *Client) StartStorm(ctx context.Context, duration int) (string, error) {
	args := map[string]string{}
	if duration > 0 {
		args["duration"] = strconv.Itoa(duration)
	}
	res, err := Execute(ctx, c.exec, "startstorm", c.version, args)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// StopRain stops rain on the server.
func (c *Client) StopRain(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "stoprain", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// StopWeather stops weather on the server.
func (c *Client) StopWeather(ctx context.Context) (string, error) {
	res, err := Execute(ctx, c.exec, "stopweather", c.version, nil)
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// TeleportToPlayer teleports player1 to player2.
func (c *Client) TeleportToPlayer(ctx context.Context, player1, player2 string) (string, error) {
	name := "teleport"
	if c.version != "41" {
		name = "teleportplayer"
	}
	res, err := Execute(ctx, c.exec, name, c.version, map[string]string{
		"player1": player1,
		"player2": player2,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// TeleportToCoordinates teleports a player to coordinates.
func (c *Client) TeleportToCoordinates(ctx context.Context, username, coordinates string) (string, error) {
	res, err := Execute(ctx, c.exec, "teleportto", c.version, map[string]string{
		"username":    username,
		"coordinates": coordinates,
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}

// VoiceBan blocks or unblocks voice from a user.
func (c *Client) VoiceBan(ctx context.Context, username string, block bool) (string, error) {
	res, err := Execute(ctx, c.exec, "voiceban", c.version, map[string]string{
		"username": username,
		"state":    strconv.FormatBool(block),
	})
	if err != nil {
		return "", err
	}
	return res.(string), nil
}
