package player

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestStoreReturnsEmptyCollectionForNewProfile(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()

	players, err := store.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if players == nil || len(players) != 0 {
		t.Fatalf("List() = %#v, want non-nil empty slice", players)
	}

	players, err = store.Merge(profileID, nil, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	if players == nil || len(players) != 0 {
		t.Fatalf("Merge() = %#v, want non-nil empty slice", players)
	}
}

func TestStoreMergeCreatesAndUpdatesPlayer(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	firstSeen := time.Date(2026, time.August, 14, 10, 0, 0, 0, time.UTC)
	accessLevel := "admin"
	godMode := true
	online := true

	players, err := store.Merge(profileID, []Observation{{
		Username:    "Alice",
		Online:      &online,
		AccessLevel: &accessLevel,
		GodMode:     &godMode,
	}}, firstSeen)
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 {
		t.Fatalf("Merge() returned %d players, want 1", len(players))
	}
	created := players[0]
	if created.ID == "" || created.Username != "Alice" {
		t.Fatalf("Merge() created %#v", created)
	}
	if !created.FirstSeenAt.Equal(firstSeen) || !created.LastSeenOnlineAt.Equal(firstSeen) {
		t.Fatalf("Merge() timestamps = %v, %v; want %v", created.FirstSeenAt, created.LastSeenOnlineAt, firstSeen)
	}

	lastOnline := firstSeen.Add(15 * time.Second)
	invisible := true
	noClip := true
	whitelisted := true
	players, err = store.Merge(profileID, []Observation{{
		Username:    "Alice",
		Online:      &online,
		Invisible:   &invisible,
		NoClip:      &noClip,
		Whitelisted: &whitelisted,
	}}, lastOnline)
	if err != nil {
		t.Fatal(err)
	}
	updated := players[0]
	if updated.ID != created.ID {
		t.Fatalf("Merge() changed ID from %q to %q", created.ID, updated.ID)
	}
	if !updated.FirstSeenAt.Equal(firstSeen) || !updated.LastSeenOnlineAt.Equal(lastOnline) {
		t.Fatalf("Merge() timestamps = %v, %v", updated.FirstSeenAt, updated.LastSeenOnlineAt)
	}
	if updated.AccessLevel == nil || *updated.AccessLevel != accessLevel {
		t.Fatalf("Merge() erased previously known access level: %#v", updated.AccessLevel)
	}
	if updated.GodMode == nil || !*updated.GodMode {
		t.Fatalf("Merge() erased previously known god mode: %#v", updated.GodMode)
	}
	if updated.Invisible == nil || !*updated.Invisible {
		t.Fatalf("Merge() invisible = %#v, want true", updated.Invisible)
	}
	if updated.NoClip == nil || !*updated.NoClip {
		t.Fatalf("Merge() no clip = %#v, want true", updated.NoClip)
	}
	if updated.Whitelisted == nil || !*updated.Whitelisted {
		t.Fatalf("Merge() whitelisted = %#v, want true", updated.Whitelisted)
	}

	reopened, err := Open(store.dir)
	if err != nil {
		t.Fatal(err)
	}
	persisted, err := reopened.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if len(persisted) != 1 || persisted[0].ID != created.ID {
		t.Fatalf("List() after reopen = %#v", persisted)
	}
}

func TestStoreMergeMatchesUsernameCaseInsensitively(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	firstSeen := time.Now().UTC()

	players, err := store.Merge(profileID, []Observation{{Username: "Alice"}}, firstSeen)
	if err != nil {
		t.Fatal(err)
	}
	originalID := players[0].ID

	players, err = store.Merge(profileID, []Observation{{Username: "alice"}}, firstSeen.Add(time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 {
		t.Fatalf("Merge() returned %d players, want 1", len(players))
	}
	if players[0].ID != originalID {
		t.Fatalf("Merge() changed ID from %q to %q", originalID, players[0].ID)
	}
}

func TestStoreMergesOfflinePlayerWithoutChangingLastOnline(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	firstSeen := time.Date(2026, time.August, 14, 10, 0, 0, 0, time.UTC)
	accessLevel := "admin"
	offline := false
	online := true

	players, err := store.Merge(profileID, []Observation{{
		Username:    "Alice",
		Online:      &offline,
		AccessLevel: &accessLevel,
	}}, firstSeen)
	if err != nil {
		t.Fatal(err)
	}
	if !players[0].LastSeenOnlineAt.IsZero() {
		t.Fatalf("offline player LastSeenOnlineAt = %v, want zero", players[0].LastSeenOnlineAt)
	}
	if !players[0].LastKnownOfflineAt.Equal(firstSeen) {
		t.Fatalf("LastKnownOfflineAt = %v, want %v", players[0].LastKnownOfflineAt, firstSeen)
	}

	lastOnline := firstSeen.Add(15 * time.Second)
	players, err = store.Merge(profileID, []Observation{{Username: "Alice", Online: &online}}, lastOnline)
	if err != nil {
		t.Fatal(err)
	}

	invisible := true
	players, err = store.Merge(profileID, []Observation{{
		Username:  "Alice",
		Online:    &offline,
		Invisible: &invisible,
	}}, lastOnline.Add(15*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if !players[0].LastSeenOnlineAt.Equal(lastOnline) {
		t.Fatalf("offline update LastSeenOnlineAt = %v, want %v", players[0].LastSeenOnlineAt, lastOnline)
	}
	wantOffline := lastOnline.Add(15 * time.Second)
	if !players[0].LastKnownOfflineAt.Equal(wantOffline) {
		t.Fatalf("LastKnownOfflineAt = %v, want %v", players[0].LastKnownOfflineAt, wantOffline)
	}
	if players[0].Invisible == nil || !*players[0].Invisible {
		t.Fatalf("offline update Invisible = %#v, want true", players[0].Invisible)
	}
}

func TestStoreUpdatesKnownPlayerByIDWithoutObservingPresence(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	observedAt := time.Now().UTC()
	online := true

	players, err := store.Merge(profileID, []Observation{{Username: "Alice", Online: &online}}, observedAt)
	if err != nil {
		t.Fatal(err)
	}
	whitelisted := true
	players, err = store.Merge(profileID, []Observation{{
		ID:          players[0].ID,
		Whitelisted: &whitelisted,
	}}, observedAt.Add(15*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if players[0].Whitelisted == nil || !*players[0].Whitelisted {
		t.Fatalf("ID update Whitelisted = %#v, want true", players[0].Whitelisted)
	}
	if !players[0].LastSeenOnlineAt.Equal(observedAt) {
		t.Fatalf("ID update LastSeenOnlineAt = %v, want %v", players[0].LastSeenOnlineAt, observedAt)
	}
}

func TestStoreUnknownObservationsDoNotAbortTheBatch(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	observedAt := time.Now().UTC()
	online := true

	if _, err := store.Merge(profileID, []Observation{{
		Username: "Alice",
		Online:   &online,
	}}, observedAt); err != nil {
		t.Fatal(err)
	}

	// Unknown observations no longer abort the batch: Alice's update,
	// Bob's provisional creation, and Charlie's direct creation with a
	// stable ID are all recorded; the empty observation and the
	// ID-only unknown are skipped.
	banned := true
	charlieID := uuid.NewString()
	players, err := store.Merge(profileID, []Observation{
		{},
		{ID: uuid.NewString()},
		{ID: charlieID, Username: "Charlie"},
		{Username: "Alice", Banned: &banned},
		{Username: "Bob"},
	}, observedAt.Add(15*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 3 {
		t.Fatalf("Merge() returned %d players, want 3", len(players))
	}
	if players[0].Banned == nil || !*players[0].Banned {
		t.Fatalf("Alice Banned = %#v, want true", players[0].Banned)
	}
	charlie := players[1]
	if charlie.ID != charlieID || charlie.Username != "Charlie" {
		t.Fatalf("Charlie = %#v, want ID %q", charlie, charlieID)
	}
	if players[2].Username != "Bob" || players[2].ID == "" {
		t.Fatalf("Bob = %#v", players[2])
	}

	reopened, err := Open(store.dir)
	if err != nil {
		t.Fatal(err)
	}
	persisted, err := reopened.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if len(persisted) != 3 {
		t.Fatalf("List() after reopen = %#v, want 3 players", persisted)
	}
}

func TestStorePropagatesRenameOnIDMatch(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	observedAt := time.Now().UTC()

	players, err := store.Merge(profileID, []Observation{{Username: "Alice"}}, observedAt)
	if err != nil {
		t.Fatal(err)
	}
	id := players[0].ID

	// The source reports the same player under a new username.
	players, err = store.Merge(profileID, []Observation{{
		ID:       id,
		Username: "Alicia",
	}}, observedAt.Add(15*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 {
		t.Fatalf("Merge() returned %d players, want 1", len(players))
	}
	if players[0].Username != "Alicia" {
		t.Fatalf("Username = %q, want %q", players[0].Username, "Alicia")
	}

	// A later username-only observation with the new name matches the
	// same record instead of minting a duplicate.
	online := true
	players, err = store.Merge(profileID, []Observation{{
		Username: "Alicia",
		Online:   &online,
	}}, observedAt.Add(30*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 {
		t.Fatalf("Merge() after rename returned %d players, want 1 (no duplicate)", len(players))
	}
	if !players[0].LastSeenOnlineAt.Equal(observedAt.Add(30 * time.Second)) {
		t.Fatalf("rename follow-up did not merge into the original record: %#v", players[0])
	}
}

func TestStoreAdoptsStableIDForProvisionallyCreatedPlayer(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	observedAt := time.Now().UTC()
	online := true

	players, err := store.Merge(profileID, []Observation{{
		Username: "Alice",
		Online:   &online,
	}}, observedAt)
	if err != nil {
		t.Fatal(err)
	}
	provisionalID := players[0].ID

	// The first observation carrying the stable identity claims the
	// provisional record by username.
	stableID := uuid.NewString()
	accessLevel := "admin"
	players, err = store.Merge(profileID, []Observation{{
		ID:          stableID,
		Username:    "Alice",
		AccessLevel: &accessLevel,
	}}, observedAt.Add(15*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 {
		t.Fatalf("Merge() returned %d players, want 1", len(players))
	}
	if players[0].ID != stableID {
		t.Fatalf("Merge() ID = %q, want adopted %q", players[0].ID, stableID)
	}
	if players[0].ID == provisionalID {
		t.Fatalf("Merge() kept provisional ID %q", provisionalID)
	}
	if players[0].AccessLevel == nil || *players[0].AccessLevel != accessLevel {
		t.Fatalf("Merge() AccessLevel = %#v, want %q", players[0].AccessLevel, accessLevel)
	}

	// Later observations by the stable ID match the same record.
	whitelisted := true
	players, err = store.Merge(profileID, []Observation{{
		ID:          stableID,
		Whitelisted: &whitelisted,
	}}, observedAt.Add(30*time.Second))
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 1 || players[0].Whitelisted == nil {
		t.Fatalf("Merge() after ID adoption = %#v", players)
	}
}

func TestStoreKeepsProfilesSeparate(t *testing.T) {
	store := openStore(t)
	firstProfile := uuid.NewString()
	secondProfile := uuid.NewString()
	observedAt := time.Now().UTC()

	if _, err := store.Merge(firstProfile, []Observation{{Username: "Alice"}}, observedAt); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Merge(secondProfile, []Observation{{Username: "Bob"}}, observedAt); err != nil {
		t.Fatal(err)
	}

	first, err := store.List(firstProfile)
	if err != nil {
		t.Fatal(err)
	}
	second, err := store.List(secondProfile)
	if err != nil {
		t.Fatal(err)
	}
	if len(first) != 1 || first[0].Username != "Alice" {
		t.Fatalf("first profile players = %#v", first)
	}
	if len(second) != 1 || second[0].Username != "Bob" {
		t.Fatalf("second profile players = %#v", second)
	}
}

func TestStoreDeleteByProfile(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	if _, err := store.Merge(profileID, []Observation{{Username: "Alice"}}, time.Now().UTC()); err != nil {
		t.Fatal(err)
	}

	path := filepath.Join(store.dir, profileID+".json")
	if err := store.DeleteByProfile(profileID); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatalf("player file still exists: %v", err)
	}
	if err := store.DeleteByProfile(profileID); err != nil {
		t.Fatalf("second DeleteByProfile() returned %v", err)
	}
}

func TestStoreRecoversCorruptProfile(t *testing.T) {
	store := openStore(t)
	profileID := uuid.NewString()
	path := filepath.Join(store.dir, profileID+".json")
	corrupt := []byte("not json")
	if err := os.WriteFile(path, corrupt, 0o600); err != nil {
		t.Fatal(err)
	}

	players, err := store.List(profileID)
	if err != nil {
		t.Fatal(err)
	}
	if len(players) != 0 {
		t.Fatalf("List() after recovery = %#v, want empty", players)
	}
	backup, err := os.ReadFile(path + ".bak")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(backup, corrupt) {
		t.Fatalf("backup = %q, want %q", backup, corrupt)
	}

	reopened, err := Open(store.dir)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := reopened.List(profileID); err != nil {
		t.Fatalf("reopen recovered profile: %v", err)
	}
}

func TestStoreRejectsInvalidProfileID(t *testing.T) {
	store := openStore(t)
	if _, err := store.List("../profiles"); err == nil {
		t.Fatal("List() accepted invalid profile ID")
	}
}

func openStore(t *testing.T) *Store {
	t.Helper()
	store, err := Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	return store
}
