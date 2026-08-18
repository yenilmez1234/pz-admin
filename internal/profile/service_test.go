package profile

import (
	"errors"
	"fmt"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/connection"
)

type fakePlayerDataStore struct {
	deletedID string
	err       error
}

func (s *fakePlayerDataStore) DeleteByProfile(profileID string) error {
	s.deletedID = profileID
	return s.err
}

func TestServiceSaveRequiresPasswordWhenCreating(t *testing.T) {
	service := &Service{store: openEmpty(t)}

	_, err := service.Save(Profile{ConnectionType: connection.TypeRCON, Name: "test", Host: "localhost", Port: 27015}, "")
	if err == nil {
		t.Fatal("Save() succeeded without a password")
	}
	if got := len(service.store.List()); got != 0 {
		t.Fatalf("Save() persisted %d profiles after validation failure, want 0", got)
	}
}

func TestServiceSavePreservesPasswordWhenUpdatingWithBlankPassword(t *testing.T) {
	store := openEmpty(t)
	existing, err := store.Save(Profile{ConnectionType: connection.TypeRCON, Name: "before", Host: "localhost", Port: 27015})
	if err != nil {
		t.Fatal(err)
	}
	service := &Service{store: store}

	existing.Name = "after"
	updated, err := service.Save(existing, "")
	if err != nil {
		t.Fatal(err)
	}
	if updated.Name != "after" {
		t.Fatalf("Save().Name = %q, want %q", updated.Name, "after")
	}
}

func TestServiceSaveRejectsUnknownProfileUpdate(t *testing.T) {
	service := &Service{store: openEmpty(t)}

	_, err := service.Save(
		Profile{ConnectionType: connection.TypeRCON, ID: "missing", Name: "test", Host: "localhost", Port: 27015},
		"",
	)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("Save() error = %v, want ErrNotFound", err)
	}
}

func TestServiceDeleteRemovesPlayerData(t *testing.T) {
	store := openEmpty(t)
	profile, err := store.Save(Profile{ConnectionType: connection.TypeRCON, Name: "test", Host: "localhost", Port: 27015})
	if err != nil {
		t.Fatal(err)
	}
	playerData := &fakePlayerDataStore{}
	service := &Service{store: store, playerData: playerData}

	if err := service.Delete(profile.ID); err != nil {
		t.Fatal(err)
	}
	if playerData.deletedID != profile.ID {
		t.Fatalf("DeleteByProfile() ID = %q, want %q", playerData.deletedID, profile.ID)
	}
}

func TestServiceDeleteKeepsProfileDeletedWhenPlayerCleanupFails(t *testing.T) {
	store := openEmpty(t)
	profile, err := store.Save(Profile{ConnectionType: connection.TypeRCON, Name: "test", Host: "localhost", Port: 27015})
	if err != nil {
		t.Fatal(err)
	}
	playerData := &fakePlayerDataStore{err: fmt.Errorf("disk failure")}
	service := &Service{store: store, playerData: playerData}

	if err := service.Delete(profile.ID); err == nil {
		t.Fatal("Delete() succeeded after player cleanup failure")
	}
	if got := len(store.List()); got != 0 {
		t.Fatalf("Delete() retained profile after cleanup failure; List() length = %d", got)
	}
}
