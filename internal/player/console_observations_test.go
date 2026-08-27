package player

import (
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/google/uuid"
)

func TestObserveConsoleCommandRecordsOnlyConfirmedState(t *testing.T) {
	store := openStore(t)
	p := profile.Profile{ID: uuid.NewString(), Version: "42"}
	if _, err := store.Merge(p.ID, []Observation{{Username: "Alice"}}, time.Now().UTC()); err != nil {
		t.Fatal(err)
	}
	service := &Service{store: store}

	if err := service.ObserveConsoleCommand(
		p,
		`godmodeplayer "Alice" -true`,
		"User Alice is now invincible.",
	); err != nil {
		t.Fatal(err)
	}
	player := getPlayer(t, service, p.ID)
	if player.GodMode == nil || !*player.GodMode {
		t.Fatalf("GodMode = %v, want true", player.GodMode)
	}

	if err := service.ObserveConsoleCommand(
		p,
		`godmodeplayer "Alice" -false`,
		"User Alice was not found.",
	); err != nil {
		t.Fatal(err)
	}
	player = getPlayer(t, service, p.ID)
	if player.GodMode == nil || !*player.GodMode {
		t.Fatalf("GodMode = %v after unsuccessful response, want unchanged true", player.GodMode)
	}

	if err := service.ObserveConsoleCommand(
		p,
		`servermsg "godmodeplayer Alice"`,
		"User Alice is no longer invincible.",
	); err != nil {
		t.Fatal(err)
	}
	player = getPlayer(t, service, p.ID)
	if player.GodMode == nil || !*player.GodMode {
		t.Fatalf("GodMode = %v after unrelated command, want unchanged true", player.GodMode)
	}
}

func TestObserveConsoleUnbanUsesKnownBuildConsequences(t *testing.T) {
	store := openStore(t)
	p := profile.Profile{ID: uuid.NewString(), Version: "42"}
	banned := true
	accessLevel := "banned"
	if _, err := store.Merge(p.ID, []Observation{
		{Username: "Alice", Banned: Known(banned), AccessLevel: Known(accessLevel)},
	}, time.Now().UTC()); err != nil {
		t.Fatal(err)
	}
	service := &Service{store: store}

	if err := service.ObserveConsoleCommand(
		p,
		`unbanuser "Alice"`,
		"System unbanned user Alice",
	); err != nil {
		t.Fatal(err)
	}
	player := getPlayer(t, service, p.ID)
	if player.Banned == nil || *player.Banned {
		t.Fatalf("Banned = %v, want false", player.Banned)
	}
	if player.AccessLevel == nil || *player.AccessLevel != "user" {
		t.Fatalf("AccessLevel = %v, want user", player.AccessLevel)
	}
}

func TestObserveConsoleAdminAliases(t *testing.T) {
	store := openStore(t)
	p := profile.Profile{ID: uuid.NewString(), Version: "41"}
	if _, err := store.Merge(p.ID, []Observation{{Username: "Alice"}}, time.Now().UTC()); err != nil {
		t.Fatal(err)
	}
	service := &Service{store: store}

	if err := service.ObserveConsoleCommand(p, `grantadmin "Alice"`, "User Alice is now admin"); err != nil {
		t.Fatal(err)
	}
	player := getPlayer(t, service, p.ID)
	if player.AccessLevel == nil || *player.AccessLevel != "admin" {
		t.Fatalf("AccessLevel = %v, want admin", player.AccessLevel)
	}

	if err := service.ObserveConsoleCommand(p, `removeadmin "Alice"`, "User Alice no longer has access level"); err != nil {
		t.Fatal(err)
	}
	player = getPlayer(t, service, p.ID)
	if player.AccessLevel == nil || *player.AccessLevel != "none" {
		t.Fatalf("AccessLevel = %v, want none", player.AccessLevel)
	}
}
