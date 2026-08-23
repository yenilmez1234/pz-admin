package player

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/google/uuid"
)

type actionExecutor func(string) (string, error)

func (e actionExecutor) ExecuteCommand(_ context.Context, command string) (string, error) {
	return e(command)
}

func (e actionExecutor) Close() {}

func newActionService(t *testing.T, execute actionExecutor) (*Service, profile.Profile, Player) {
	t.Helper()
	store := openStore(t)
	p := profile.Profile{ID: uuid.NewString(), Version: "41"}
	players, err := store.Merge(p.ID, []Observation{{Username: "Alice"}}, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	return &Service{store: store, active: session.NewState(p, execute)}, p, players[0]
}

func setBuild(service *Service, version string) {
	state := service.active
	state.Profile.Version = version
	executor, ok := state.Channel.(connection.CommandExecutor)
	if !ok {
		panic("test action service has no command executor")
	}
	state.CommandClient = command.NewClient(executor, version)
	service.active = state
}

func TestSetAccessLevelDoesNotInferGodMode(t *testing.T) {
	service, p, player := newActionService(t, func(string) (string, error) {
		return "User Alice is now moderator", nil
	})
	disabled := false
	if err := service.Observe(p.ID, Observation{ID: player.ID, GodMode: &disabled}); err != nil {
		t.Fatal(err)
	}

	if _, err := service.SetAccessLevel(context.Background(), []string{player.ID}, "moderator"); err != nil {
		t.Fatal(err)
	}
	updated := getPlayer(t, service, p.ID)
	if updated.AccessLevel == nil || *updated.AccessLevel != "moderator" {
		t.Fatalf("AccessLevel = %v, want moderator", updated.AccessLevel)
	}
	if updated.GodMode == nil || *updated.GodMode {
		t.Fatalf("GodMode = %v, want unchanged false", updated.GodMode)
	}
}

func getPlayer(t *testing.T, service *Service, profileID string) Player {
	t.Helper()
	players, err := service.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 {
		t.Fatalf("players = %#v, want one player", players)
	}
	return players[0]
}

func TestKickUsesStoredUsername(t *testing.T) {
	service, p, player := newActionService(t, func(string) (string, error) {
		return "User Alice kicked.", nil
	})

	result, err := service.Kick(context.Background(), []string{player.ID}, "griefing")
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Succeeded) != 1 || result.Succeeded[0] != player.ID || len(result.Failed) != 0 {
		t.Fatalf("result = %#v", result)
	}
	if getPlayer(t, service, p.ID).LastKnownOfflineAt.IsZero() {
		t.Fatal("LastKnownOfflineAt is zero after kick")
	}
}

func TestAddLocalUserCreatesPlayerWithUnknownState(t *testing.T) {
	called := false
	service, p, _ := newActionService(t, func(string) (string, error) {
		called = true
		return "", nil
	})

	if err := service.AddLocalUser(" Bob "); err != nil {
		t.Fatal(err)
	}
	if called {
		t.Fatal("AddLocalUser() executed a remote command")
	}
	players, err := service.List(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	index := findByUsername(players, "Bob")
	if index == -1 {
		t.Fatal("local user was not stored")
	}
	created := players[index]
	if created.ID == "" || created.FirstSeenAt.IsZero() {
		t.Fatalf("created player identity = %#v", created)
	}
	if !created.LastSeenOnlineAt.IsZero() {
		t.Errorf("LastSeenOnlineAt = %v, want zero", created.LastSeenOnlineAt)
	}
	if created.AccessLevel != nil ||
		created.GodMode != nil ||
		created.Invisible != nil ||
		created.NoClip != nil ||
		created.Banned != nil ||
		created.VoiceBanned != nil ||
		created.Whitelisted != nil {
		t.Fatalf("local user has known server state: %#v", created)
	}
}

func TestAddLocalUserValidatesUsername(t *testing.T) {
	service, _, player := newActionService(t, func(string) (string, error) {
		return "", nil
	})
	if err := service.AddLocalUser("  "); err == nil {
		t.Fatal("AddLocalUser() accepted an empty username")
	}
	if err := service.AddLocalUser(strings.ToLower(player.Username)); err == nil {
		t.Fatal("AddLocalUser() accepted a case-insensitive duplicate username")
	}
}

func TestAddUserCreatesWhitelistedPlayerWithKnownDefaults(t *testing.T) {
	for _, test := range []struct {
		build       string
		accessLevel string
	}{{"41", "none"}, {"42", "user"}} {
		t.Run("Build "+test.build, func(t *testing.T) {
			service, p, _ := newActionService(t, func(string) (string, error) {
				if test.build == "42" {
					return "User Bob created with password", nil
				}
				return "User Bob created with the password secret", nil
			})
			setBuild(service, test.build)

			if err := service.AddUser(context.Background(), "Bob", "secret"); err != nil {
				t.Fatal(err)
			}
			players, err := service.List(p.ID)
			if err != nil {
				t.Fatal(err)
			}
			index := findByUsername(players, "Bob")
			if index == -1 {
				t.Fatal("created user was not stored")
			}
			created := players[index]
			if created.ID == "" || created.FirstSeenAt.IsZero() {
				t.Fatalf("created player identity = %#v", created)
			}
			if !created.LastSeenOnlineAt.IsZero() {
				t.Errorf("LastSeenOnlineAt = %v, want zero", created.LastSeenOnlineAt)
			}
			if created.AccessLevel == nil || *created.AccessLevel != test.accessLevel {
				t.Errorf("AccessLevel = %v, want %s", created.AccessLevel, test.accessLevel)
			}
			for name, value := range map[string]*bool{
				"GodMode":     created.GodMode,
				"Invisible":   created.Invisible,
				"NoClip":      created.NoClip,
				"Banned":      created.Banned,
				"VoiceBanned": created.VoiceBanned,
			} {
				if value == nil || *value {
					t.Errorf("%s = %v, want false", name, value)
				}
			}
			if created.Whitelisted == nil || !*created.Whitelisted {
				t.Errorf("Whitelisted = %v, want true", created.Whitelisted)
			}
		})
	}
}

func TestAddUserRecreatesKnownServerAccount(t *testing.T) {
	service, p, player := newActionService(t, func(string) (string, error) {
		return "User Alice created with the password secret", nil
	})

	if err := service.AddUser(context.Background(), player.Username, "secret"); err != nil {
		t.Fatal(err)
	}
	players, err := service.List(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 {
		t.Fatalf("player count = %d, want 1", len(players))
	}
	if players[0].ID != player.ID {
		t.Fatalf("player ID = %q, want existing ID %q", players[0].ID, player.ID)
	}
	if players[0].Whitelisted == nil || !*players[0].Whitelisted {
		t.Fatalf("Whitelisted = %v, want true", players[0].Whitelisted)
	}
}

func TestTeleportResolvesBothPlayerIDs(t *testing.T) {
	service, p, player := newActionService(t, func(command string) (string, error) {
		if command != `teleport "Alice" "Bob"` {
			t.Fatalf("command = %q", command)
		}
		return "teleported Alice to Bob", nil
	})
	players, err := service.store.Merge(p.ID, []Observation{{Username: "Bob"}}, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	target := players[findByUsername(players, "Bob")]

	if _, err := service.Teleport(context.Background(), []string{player.ID}, target.ID); err != nil {
		t.Fatal(err)
	}
}

func TestBuild42TeleportUsesTeleportPlayer(t *testing.T) {
	service, p, player := newActionService(t, func(command string) (string, error) {
		if command != `teleportplayer "Alice" "Bob"` {
			t.Fatalf("command = %q", command)
		}
		return "teleported Alice to Bob", nil
	})
	setBuild(service, "42")
	players, err := service.store.Merge(p.ID, []Observation{{Username: "Bob"}}, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	target := players[findByUsername(players, "Bob")]

	if _, err := service.Teleport(context.Background(), []string{player.ID}, target.ID); err != nil {
		t.Fatal(err)
	}
}

func TestBatchActionReportsPartialSuccess(t *testing.T) {
	commandError := errors.New("command failed")
	service, p, alice := newActionService(t, func(command string) (string, error) {
		if strings.Contains(command, `"Bob"`) {
			return "", commandError
		}
		return "User Alice kicked.", nil
	})
	players, err := service.store.Merge(p.ID, []Observation{{Username: "Bob"}}, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	bob := players[findByUsername(players, "Bob")]

	result, err := service.Kick(context.Background(), []string{alice.ID, bob.ID}, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Succeeded) != 1 || result.Succeeded[0] != alice.ID {
		t.Fatalf("Succeeded = %#v, want Alice", result.Succeeded)
	}
	if len(result.Failed) != 1 || result.Failed[0].PlayerID != bob.ID ||
		!strings.Contains(result.Failed[0].Message, commandError.Error()) {
		t.Fatalf("Failed = %#v, want Bob command failure", result.Failed)
	}
}

func TestAddXPExecutesEveryGrantAfterFailure(t *testing.T) {
	commandError := errors.New("command failed")
	responses := []struct {
		response string
		err      error
	}{
		{response: "Added 25 Woodwork xp's to Alice"},
		{err: commandError},
		{response: "Added 5 Aiming xp's to Alice"},
	}
	service, _, player := newActionService(t, func(string) (string, error) {
		response := responses[0]
		responses = responses[1:]
		return response.response, response.err
	})

	result, err := service.AddXP(context.Background(), []string{player.ID}, []XPGrant{
		{Perk: "Woodwork", Amount: 25},
		{Perk: "Fitness", Amount: 10},
		{Perk: "Aiming", Amount: 5},
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(responses) != 0 {
		t.Fatalf("%d XP grants were not executed", len(responses))
	}
	if len(result.Succeeded) != 0 || len(result.Failed) != 1 ||
		!strings.Contains(result.Failed[0].Message, "Fitness") {
		t.Fatalf("result = %#v, want one player failure for Fitness", result)
	}
}

func TestModerationActionsRecordKnownState(t *testing.T) {
	responses := []string{
		"User Alice is now banned",
		"User Alice is now un-banned",
		"User Alice voice is banned.",
		"User Alice is now moderator",
		"User Alice no longer has access level",
		"User Alice is now moderator",
		"User Alice removed from white list",
	}
	service, p, player := newActionService(t, func(string) (string, error) {
		response := responses[0]
		responses = responses[1:]
		return response, nil
	})

	if _, err := service.Ban(context.Background(), []string{player.ID}, "", false); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).Banned; got == nil || !*got {
		t.Fatalf("Banned = %v, want true", got)
	}
	if got := getPlayer(t, service, p.ID).AccessLevel; got == nil || *got != "none" {
		t.Fatalf("AccessLevel = %v, want none", got)
	}
	bannedPlayer := getPlayer(t, service, p.ID)
	if bannedPlayer.GodMode == nil || *bannedPlayer.GodMode ||
		bannedPlayer.NoClip == nil || *bannedPlayer.NoClip ||
		bannedPlayer.Invisible == nil || *bannedPlayer.Invisible {
		t.Fatalf(
			"after ban: GodMode=%v NoClip=%v Invisible=%v, want false",
			bannedPlayer.GodMode,
			bannedPlayer.NoClip,
			bannedPlayer.Invisible,
		)
	}
	if _, err := service.Unban(context.Background(), []string{player.ID}); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).Banned; got == nil || *got {
		t.Fatalf("Banned = %v, want false", got)
	}
	if _, err := service.SetVoiceBanned(context.Background(), []string{player.ID}, true); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).VoiceBanned; got == nil || !*got {
		t.Fatalf("VoiceBanned = %v, want true", got)
	}
	if _, err := service.SetAccessLevel(context.Background(), []string{player.ID}, "moderator"); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).AccessLevel; got == nil || *got != "moderator" {
		t.Fatalf("AccessLevel = %v, want moderator", got)
	}
	if got := getPlayer(t, service, p.ID).GodMode; got == nil || *got {
		t.Fatalf("GodMode = %v, want false", got)
	}
	if _, err := service.SetAccessLevel(context.Background(), []string{player.ID}, "none"); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).AccessLevel; got == nil || *got != "none" {
		t.Fatalf("AccessLevel = %v, want none", got)
	}
	if got := getPlayer(t, service, p.ID).GodMode; got == nil || *got {
		t.Fatalf("GodMode = %v, want false", got)
	}
	if _, err := service.SetAccessLevel(context.Background(), []string{player.ID}, "moderator"); err != nil {
		t.Fatal(err)
	}
	if _, err := service.RemoveFromWhitelist(context.Background(), []string{player.ID}, false); err != nil {
		t.Fatal(err)
	}
	removed := getPlayer(t, service, p.ID)
	if got := removed.Whitelisted; got == nil || *got {
		t.Fatalf("Whitelisted = %v, want false", got)
	}
	if got := removed.AccessLevel; got == nil || *got != "moderator" {
		t.Fatalf("AccessLevel = %v, want unchanged moderator", got)
	}
	if got := removed.GodMode; got == nil || *got {
		t.Fatalf("GodMode = %v, want unchanged false", got)
	}
}

func TestBuild42BanAndRoleTransitions(t *testing.T) {
	responses := []string{
		"System banned user Alice",
		"System unbanned user Alice",
		"User Alice is now banned",
		"User Alice is now moderator",
	}
	service, p, player := newActionService(t, func(string) (string, error) {
		response := responses[0]
		responses = responses[1:]
		return response, nil
	})
	setBuild(service, "42")

	if _, err := service.Ban(context.Background(), []string{player.ID}, "", false); err != nil {
		t.Fatal(err)
	}
	banned := getPlayer(t, service, p.ID)
	if banned.Banned == nil || !*banned.Banned || banned.AccessLevel == nil || *banned.AccessLevel != "banned" {
		t.Fatalf("after ban: Banned=%v AccessLevel=%v", banned.Banned, banned.AccessLevel)
	}
	if banned.GodMode == nil || *banned.GodMode ||
		banned.NoClip == nil || *banned.NoClip ||
		banned.Invisible == nil || *banned.Invisible {
		t.Fatalf(
			"after ban: GodMode=%v NoClip=%v Invisible=%v, want false",
			banned.GodMode,
			banned.NoClip,
			banned.Invisible,
		)
	}

	if _, err := service.Unban(context.Background(), []string{player.ID}); err != nil {
		t.Fatal(err)
	}
	unbanned := getPlayer(t, service, p.ID)
	if unbanned.Banned == nil || *unbanned.Banned || unbanned.AccessLevel == nil || *unbanned.AccessLevel != "user" {
		t.Fatalf("after unban: Banned=%v AccessLevel=%v", unbanned.Banned, unbanned.AccessLevel)
	}

	if _, err := service.SetAccessLevel(context.Background(), []string{player.ID}, "banned"); err != nil {
		t.Fatal(err)
	}
	bannedByRole := getPlayer(t, service, p.ID)
	if bannedByRole.Banned == nil || !*bannedByRole.Banned || bannedByRole.AccessLevel == nil || *bannedByRole.AccessLevel != "banned" {
		t.Fatalf("after banned role: Banned=%v AccessLevel=%v", bannedByRole.Banned, bannedByRole.AccessLevel)
	}
	if _, err := service.SetAccessLevel(context.Background(), []string{player.ID}, "moderator"); err != nil {
		t.Fatal(err)
	}
	moderator := getPlayer(t, service, p.ID)
	if moderator.Banned == nil || *moderator.Banned || moderator.AccessLevel == nil || *moderator.AccessLevel != "moderator" {
		t.Fatalf("after role change: Banned=%v AccessLevel=%v", moderator.Banned, moderator.AccessLevel)
	}
}

func TestRemoveFromWhitelistCanDeleteLocalPlayer(t *testing.T) {
	service, p, player := newActionService(t, func(string) (string, error) {
		return "User Alice removed from white list", nil
	})

	if _, err := service.RemoveFromWhitelist(context.Background(), []string{player.ID}, true); err != nil {
		t.Fatal(err)
	}
	players, err := service.List(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 0 {
		t.Fatalf("List() = %#v, want no players", players)
	}
}

func TestGodModeOnlyRecordsGodMode(t *testing.T) {
	responses := []string{
		"User Alice is now invincible.",
		"User Alice is no more invincible.",
	}
	service, p, player := newActionService(t, func(string) (string, error) {
		response := responses[0]
		responses = responses[1:]
		return response, nil
	})

	if _, err := service.SetGodMode(context.Background(), []string{player.ID}, true); err != nil {
		t.Fatal(err)
	}
	got := getPlayer(t, service, p.ID)
	if got.GodMode == nil || !*got.GodMode || got.Invisible != nil {
		t.Fatalf("after enable: GodMode=%v Invisible=%v", got.GodMode, got.Invisible)
	}

	if _, err := service.SetGodMode(context.Background(), []string{player.ID}, false); err != nil {
		t.Fatal(err)
	}
	got = getPlayer(t, service, p.ID)
	if got.GodMode == nil || *got.GodMode {
		t.Fatalf("GodMode = %v, want false", got.GodMode)
	}
	if got.Invisible != nil {
		t.Fatalf("Invisible = %v, want unchanged unknown", got.Invisible)
	}
}

func TestBuild42GodModeUsesGodModePlayer(t *testing.T) {
	service, p, player := newActionService(t, func(command string) (string, error) {
		if command != `godmodeplayer "Alice" -true` {
			t.Fatalf("command = %q", command)
		}
		return "User Alice is now invincible.", nil
	})
	setBuild(service, "42")

	if _, err := service.SetGodMode(context.Background(), []string{player.ID}, true); err != nil {
		t.Fatal(err)
	}
	got := getPlayer(t, service, p.ID)
	if got.GodMode == nil || !*got.GodMode {
		t.Fatalf("GodMode = %v, want true", got.GodMode)
	}
}

func TestBuild42SetNoClipRecordsState(t *testing.T) {
	responses := []string{
		"User Alice won't collide.",
		"User Alice will collide.",
	}
	service, p, player := newActionService(t, func(command string) (string, error) {
		want := `noclip "Alice" -true`
		if len(responses) == 1 {
			want = `noclip "Alice" -false`
		}
		if command != want {
			t.Fatalf("command = %q, want %q", command, want)
		}
		response := responses[0]
		responses = responses[1:]
		return response, nil
	})
	setBuild(service, "42")

	if _, err := service.SetNoClip(context.Background(), []string{player.ID}, true); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).NoClip; got == nil || !*got {
		t.Fatalf("NoClip = %v, want true", got)
	}

	if _, err := service.SetNoClip(context.Background(), []string{player.ID}, false); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).NoClip; got == nil || *got {
		t.Fatalf("NoClip = %v, want false", got)
	}
}

func TestBuild42SetInvisibleRecordsState(t *testing.T) {
	responses := []string{
		"User Alice is now invisible.",
		"User Alice is no longer invisible.",
	}
	service, p, player := newActionService(t, func(command string) (string, error) {
		want := `invisibleplayer "Alice" -true`
		if len(responses) == 1 {
			want = `invisibleplayer "Alice" -false`
		}
		if command != want {
			t.Fatalf("command = %q, want %q", command, want)
		}
		response := responses[0]
		responses = responses[1:]
		return response, nil
	})
	setBuild(service, "42")

	if _, err := service.SetInvisible(context.Background(), []string{player.ID}, true); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).Invisible; got == nil || !*got {
		t.Fatalf("Invisible = %v, want true", got)
	}

	if _, err := service.SetInvisible(context.Background(), []string{player.ID}, false); err != nil {
		t.Fatal(err)
	}
	if got := getPlayer(t, service, p.ID).Invisible; got == nil || *got {
		t.Fatalf("Invisible = %v, want false", got)
	}
}

func TestFailedActionDoesNotChangeStoredState(t *testing.T) {
	commandError := errors.New("command failed")
	service, p, player := newActionService(t, func(string) (string, error) {
		return "", commandError
	})

	result, err := service.Ban(context.Background(), []string{player.ID}, "", false)
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Succeeded) != 0 || len(result.Failed) != 1 || !strings.Contains(result.Failed[0].Message, commandError.Error()) {
		t.Fatalf("result = %#v, want one command failure", result)
	}
	if got := getPlayer(t, service, p.ID).Banned; got != nil {
		t.Fatalf("Banned = %v, want unknown", got)
	}
}

func TestActionRequiresConnectedServerAndKnownPlayer(t *testing.T) {
	service := &Service{store: openStore(t)}
	if _, err := service.Kick(context.Background(), []string{uuid.NewString()}, ""); err == nil {
		t.Fatal("Kick() succeeded without a connected server")
	}

	connected, _, _ := newActionService(t, func(string) (string, error) {
		return "", nil
	})
	result, err := connected.Kick(context.Background(), []string{uuid.NewString()}, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Succeeded) != 0 || len(result.Failed) != 1 {
		t.Fatalf("result = %#v, want one unknown-player failure", result)
	}
}
