package player

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

// AddLocalUser records a player in local history without changing the server.
// All server-managed fields remain unknown until observed or changed by a
// successful action.
func (s *Service) AddLocalUser(username string) error {
	p, err := s.currentProfile()
	if err != nil {
		return err
	}
	username = strings.TrimSpace(username)
	if username == "" {
		return errors.New("player: username is required")
	}
	players, err := s.List(p.ID)
	if err != nil {
		return err
	}
	if findByUsername(players, username) != -1 {
		return fmt.Errorf("player: username %q already exists", username)
	}
	if _, err := s.merge(p.ID, []Observation{{Username: username}}, time.Now().UTC()); err != nil {
		return fmt.Errorf("player: record local user: %w", err)
	}
	return nil
}

// AddUser creates a new whitelisted server account and records its known
// initial state. The password is sent to the server and is not persisted.
func (s *Service) AddUser(ctx context.Context, username, password string) error {
	p, executor, err := s.activeConnection()
	if err != nil {
		return err
	}
	if _, err := command.NewClient(executor, p.Version).AddUser(ctx, username, password); err != nil {
		return fmt.Errorf("player: add user: %w", err)
	}

	accessLevel := "none"
	if p.Version == "42" {
		accessLevel = "user"
	}
	disabled := false
	whitelisted := true
	_, err = s.merge(p.ID, []Observation{{
		Username:    username,
		AccessLevel: &accessLevel,
		GodMode:     &disabled,
		Invisible:   &disabled,
		NoClip:      &disabled,
		Banned:      &disabled,
		VoiceBanned: &disabled,
		Whitelisted: &whitelisted,
	}}, time.Now().UTC())
	if err != nil {
		return fmt.Errorf("player: record added user: %w", err)
	}
	return nil
}

// AddItems gives each requested item to every player. A non-positive count
// uses the server command's default count.
func (s *Service) AddItems(ctx context.Context, playerIDs []string, items []ItemGrant) (ActionResult, error) {
	if len(items) == 0 {
		return ActionResult{}, errors.New("player: at least one item is required")
	}
	return s.runPlayerAction(ctx, playerIDs, "add items", func(commands *command.Client, player Player) (*Observation, error) {
		err := executeAll(items, func(item ItemGrant) error {
			_, err := commands.AddItem(ctx, player.Username, item.Item, item.Count)
			if err != nil {
				return fmt.Errorf("%s: %w", item.Item, err)
			}
			return nil
		})
		return nil, err
	})
}

// AddXP gives each requested perk amount to every player.
func (s *Service) AddXP(ctx context.Context, playerIDs []string, grants []XPGrant) (ActionResult, error) {
	if len(grants) == 0 {
		return ActionResult{}, errors.New("player: at least one XP grant is required")
	}
	return s.runPlayerAction(ctx, playerIDs, "add XP", func(commands *command.Client, player Player) (*Observation, error) {
		err := executeAll(grants, func(grant XPGrant) error {
			_, err := commands.AddXP(ctx, player.Username, grant.Perk, grant.Amount)
			if err != nil {
				return fmt.Errorf("%s: %w", grant.Perk, err)
			}
			return nil
		})
		return nil, err
	})
}

// AddVehicle spawns a vehicle next to each player.
func (s *Service) AddVehicle(ctx context.Context, playerIDs []string, script string) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "add vehicle", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.AddVehicle(ctx, script, player.Username)
		return nil, err
	})
}

// CreateHorde spawns zombies near each player.
func (s *Service) CreateHorde(ctx context.Context, playerIDs []string, count int) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "create horde", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.CreateHorde(ctx, count, player.Username)
		return nil, err
	})
}

// Teleport moves each player to the target player.
func (s *Service) Teleport(ctx context.Context, playerIDs []string, targetPlayerID string) (ActionResult, error) {
	p, _, err := s.activeConnection()
	if err != nil {
		return ActionResult{}, err
	}
	target, err := s.findPlayer(p.ID, targetPlayerID)
	if err != nil {
		return ActionResult{}, err
	}
	return s.runPlayerAction(ctx, playerIDs, "teleport", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.TeleportToPlayer(ctx, player.Username, target.Username)
		return nil, err
	})
}

// TeleportToCoordinates moves each player to x,y,z coordinates.
func (s *Service) TeleportToCoordinates(ctx context.Context, playerIDs []string, coordinates string) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "teleport to coordinates", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.TeleportToCoordinates(ctx, player.Username, coordinates)
		return nil, err
	})
}

// Lightning triggers a lightning strike on each player.
func (s *Service) Lightning(ctx context.Context, playerIDs []string) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "lightning", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.Lightning(ctx, player.Username)
		return nil, err
	})
}

// Thunder triggers thunder on each player.
func (s *Service) Thunder(ctx context.Context, playerIDs []string) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "thunder", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.Thunder(ctx, player.Username)
		return nil, err
	})
}

// Kick disconnects each player from the server. Reason is optional.
func (s *Service) Kick(ctx context.Context, playerIDs []string, reason string) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "kick", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.Kick(ctx, player.Username, reason)
		if err != nil {
			return nil, err
		}
		online := false
		return &Observation{Online: &online}, nil
	})
}

// Ban bans each player by username. Reason is optional; banIP also bans each
// player's current IP address.
func (s *Service) Ban(ctx context.Context, playerIDs []string, reason string, banIP bool) (ActionResult, error) {
	p, err := s.currentProfile()
	if err != nil {
		return ActionResult{}, err
	}
	return s.runPlayerAction(ctx, playerIDs, "ban", func(commands *command.Client, player Player) (*Observation, error) {
		if _, err := commands.BanUser(ctx, player.Username, reason, banIP); err != nil {
			return nil, err
		}
		banned := true
		disabled := false
		online := false
		role := "banned"
		observation := &Observation{
			Online:      &online,
			AccessLevel: &role,
			GodMode:     &disabled,
			Invisible:   &disabled,
			NoClip:      &disabled,
			Banned:      &banned,
		}
		if p.Version == "41" {
			role = "none"
			observation.AccessLevel = &role
		}
		return observation, nil
	})
}

// Unban removes each player's username ban.
func (s *Service) Unban(ctx context.Context, playerIDs []string) (ActionResult, error) {
	p, err := s.currentProfile()
	if err != nil {
		return ActionResult{}, err
	}
	return s.runPlayerAction(ctx, playerIDs, "unban", func(commands *command.Client, player Player) (*Observation, error) {
		if _, err := commands.UnbanUser(ctx, player.Username); err != nil {
			return nil, err
		}
		banned := false
		observation := &Observation{Banned: &banned}
		if p.Version != "41" {
			role := "user"
			observation.AccessLevel = &role
		}
		return observation, nil
	})
}

// SetGodMode enables or disables god mode for each player.
// TODO: Verify whether Build 41 also changes invisibility before recording it.
func (s *Service) SetGodMode(ctx context.Context, playerIDs []string, enabled bool) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "set god mode", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.SetGodMode(ctx, player.Username, enabled)
		if err != nil {
			return nil, err
		}
		return &Observation{GodMode: &enabled}, nil
	})
}

// SetInvisible makes each player visible or invisible to zombies.
func (s *Service) SetInvisible(ctx context.Context, playerIDs []string, enabled bool) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "set invisibility", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.SetInvisible(ctx, player.Username, enabled)
		if err != nil {
			return nil, err
		}
		return &Observation{Invisible: &enabled}, nil
	})
}

// SetNoClip enables or disables no-clip mode for each player.
func (s *Service) SetNoClip(ctx context.Context, playerIDs []string, enabled bool) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "set no-clip", func(commands *command.Client, player Player) (*Observation, error) {
		_, err := commands.SetNoClip(ctx, player.Username, enabled)
		if err != nil {
			return nil, err
		}
		return &Observation{NoClip: &enabled}, nil
	})
}

// SetVoiceBanned blocks or restores voice communication for each player.
func (s *Service) SetVoiceBanned(ctx context.Context, playerIDs []string, banned bool) (ActionResult, error) {
	return s.runPlayerAction(ctx, playerIDs, "set voice ban", func(commands *command.Client, player Player) (*Observation, error) {
		if _, err := commands.VoiceBan(ctx, player.Username, banned); err != nil {
			return nil, err
		}
		return &Observation{VoiceBanned: &banned}, nil
	})
}

// SetAccessLevel changes the server access level of each player. Access-level
// permissions are configurable, so no other player state is inferred.
func (s *Service) SetAccessLevel(ctx context.Context, playerIDs []string, level string) (ActionResult, error) {
	p, err := s.currentProfile()
	if err != nil {
		return ActionResult{}, err
	}
	return s.runPlayerAction(ctx, playerIDs, "set access level", func(commands *command.Client, player Player) (*Observation, error) {
		if _, err := commands.SetAccessLevel(ctx, player.Username, level); err != nil {
			return nil, err
		}
		observation := &Observation{AccessLevel: &level}
		if p.Version != "41" {
			banned := strings.EqualFold(level, "banned")
			observation.Banned = &banned
		}
		return observation, nil
	})
}

// RemoveFromWhitelist removes each player's account from the whitelist. When
// deleteLocal is true, successfully removed players are also deleted from the
// local player history.
func (s *Service) RemoveFromWhitelist(ctx context.Context, playerIDs []string, deleteLocal bool) (ActionResult, error) {
	p, err := s.currentProfile()
	if err != nil {
		return ActionResult{}, err
	}
	result, err := s.runPlayerAction(ctx, playerIDs, "remove from whitelist", func(commands *command.Client, player Player) (*Observation, error) {
		if _, err := commands.RemoveUserFromWhitelist(ctx, player.Username); err != nil {
			return nil, err
		}
		whitelisted := false
		return &Observation{Whitelisted: &whitelisted}, nil
	})
	if err != nil || !deleteLocal || len(result.Succeeded) == 0 {
		return result, err
	}
	players, err := s.store.DeletePlayers(p.ID, result.Succeeded)
	if err != nil {
		return result, fmt.Errorf("player: delete local records: %w", err)
	}
	s.emitUpdate(p.ID, players)
	return result, nil
}

type playerAction func(*command.Client, Player) (*Observation, error)

func (s *Service) runPlayerAction(
	ctx context.Context,
	playerIDs []string,
	actionName string,
	action playerAction,
) (ActionResult, error) {
	if len(playerIDs) == 0 {
		return ActionResult{}, errors.New("player: at least one player is required")
	}
	p, executor, err := s.activeConnection()
	if err != nil {
		return ActionResult{}, err
	}
	players, err := s.List(p.ID)
	if err != nil {
		return ActionResult{}, err
	}
	commands := command.NewClient(executor, p.Version)
	result := ActionResult{
		Succeeded: make([]string, 0, len(playerIDs)),
		Failed:    make([]ActionFailure, 0),
	}
	for _, playerID := range playerIDs {
		if err := ctx.Err(); err != nil {
			result.fail(playerID, err)
			continue
		}
		index := findByID(players, playerID)
		if index == -1 {
			result.fail(playerID, fmt.Errorf("player %q not found", playerID))
			continue
		}
		observation, err := action(commands, players[index])
		if err != nil {
			result.fail(playerID, fmt.Errorf("%s: %w", actionName, err))
			continue
		}
		if observation != nil {
			observation.ID = playerID
			if err := s.Observe(p.ID, *observation); err != nil {
				result.fail(playerID, fmt.Errorf("%s: %w", actionName, err))
				continue
			}
		}
		result.Succeeded = append(result.Succeeded, playerID)
	}
	return result, nil
}

func (r *ActionResult) fail(playerID string, err error) {
	r.Failed = append(r.Failed, ActionFailure{
		PlayerID: playerID,
		Message:  err.Error(),
	})
}

func executeAll[T any](values []T, execute func(T) error) error {
	var failures []error
	for _, value := range values {
		if err := execute(value); err != nil {
			failures = append(failures, err)
		}
	}
	return errors.Join(failures...)
}

func (s *Service) findPlayer(profileID, playerID string) (Player, error) {
	players, err := s.List(profileID)
	if err != nil {
		return Player{}, err
	}
	index := findByID(players, playerID)
	if index == -1 {
		return Player{}, fmt.Errorf("player: player %q not found", playerID)
	}
	return players[index], nil
}

func (s *Service) activeConnection() (profile.Profile, connection.CommandExecutor, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.executor == nil || s.activeProfile.ID == "" {
		return profile.Profile{}, nil, errors.New("player: no connected server")
	}
	return s.activeProfile, s.executor, nil
}

func (s *Service) currentProfile() (profile.Profile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.activeProfile.ID == "" {
		return profile.Profile{}, errors.New("player: no connected server")
	}
	return s.activeProfile, nil
}
