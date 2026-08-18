// Package profile stores and manages saved server connection profiles.
// Profiles are persisted as JSON; passwords live in the OS keyring.
package profile

import (
	"errors"
	"fmt"
	"log/slog"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/third_party/tailscale.com/jsondb"
	"github.com/google/uuid"
	"github.com/zalando/go-keyring"
)

// Profile is a saved server connection.
type Profile struct {
	ID             string          `json:"id"`
	Name           string          `json:"name"`
	ConnectionType connection.Type `json:"connectionType"`
	Host           string          `json:"host"`
	Port           int             `json:"port"`
	Version        string          `json:"version"`
}

const keyringService = "com.bedirhanyenilmez.pzadmin"

// ErrNotFound is returned when a profile ID doesn't exist.
var ErrNotFound = errors.New("profile: not found")

// Store persists profiles to a JSON file and passwords to the OS keyring.
// Safe for concurrent use.
type Store struct {
	mu sync.RWMutex
	db *jsondb.DB[[]Profile]
}

// Open loads the profile store from the given path. If the file doesn't
// exist, an empty store is created. Corrupt JSON is backed up and replaced
// with an empty store.
func Open(path string) (*Store, error) {
	db, err := jsondb.OpenRecovering(path, []Profile{})
	if err != nil {
		return nil, fmt.Errorf("profile: %w", err)
	}
	return &Store{db: db}, nil
}

// List returns a copy of all profiles.
func (s *Store) List() []Profile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]Profile{}, *s.db.Data...)
}

// Save inserts or updates p. It generates an ID if one is missing
// and validates required fields.
func (s *Store) Save(p Profile) (Profile, error) {
	if p.Name == "" {
		return Profile{}, errors.New("profile: name is required")
	}
	if p.Host == "" {
		return Profile{}, errors.New("profile: host is required")
	}
	if p.Port < 1 || p.Port > 65535 {
		return Profile{}, errors.New("profile: port must be between 1 and 65535")
	}
	if p.ConnectionType != connection.TypeRCON {
		return Profile{}, fmt.Errorf("profile: unsupported connection type %q", p.ConnectionType)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	if p.ID == "" {
		p.ID = uuid.NewString()
	}
	// Work on a copy so a disk failure doesn't leave memory diverged.
	updated := append([]Profile{}, *s.db.Data...)
	for i, existing := range updated {
		if existing.ID == p.ID {
			updated[i] = p
			if err := s.saveSlice(updated); err != nil {
				return Profile{}, err
			}
			return p, nil
		}
	}
	updated = append(updated, p)
	if err := s.saveSlice(updated); err != nil {
		return Profile{}, err
	}
	return p, nil
}

// Delete removes the profile with the given ID.
func (s *Store) Delete(id string) error {
	s.mu.Lock()
	found := false
	updated := make([]Profile, 0, len(*s.db.Data))
	for _, p := range *s.db.Data {
		if p.ID == id {
			found = true
			continue
		}
		updated = append(updated, p)
	}
	if !found {
		s.mu.Unlock()
		return fmt.Errorf("%w: %s", ErrNotFound, id)
	}
	if err := s.saveSlice(updated); err != nil {
		s.mu.Unlock()
		return err
	}
	s.mu.Unlock()
	if err := keyring.Delete(keyringService, id); err != nil && !errors.Is(err, keyring.ErrNotFound) {
		slog.Warn("profile: keyring delete failed", "id", id, "err", err)
	}
	return nil
}

func (s *Store) saveSlice(data []Profile) error {
	prev := *s.db.Data
	*s.db.Data = data
	if err := s.db.Save(); err != nil {
		*s.db.Data = prev
		return err
	}
	return nil
}

// SetPassword stores a password for the given profile ID in the OS keyring.
func (s *Store) SetPassword(id, password string) error {
	s.mu.RLock()
	exists := false
	for _, p := range *s.db.Data {
		if p.ID == id {
			exists = true
			break
		}
	}
	s.mu.RUnlock()
	if !exists {
		return fmt.Errorf("%w: %s", ErrNotFound, id)
	}
	return keyring.Set(keyringService, id, password)
}

// Credentials returns the profile and its password from the keyring.
func (s *Store) Credentials(id string) (Profile, string, error) {
	s.mu.RLock()
	for _, p := range *s.db.Data {
		if p.ID == id {
			profile := p
			s.mu.RUnlock()
			pw, err := keyring.Get(keyringService, id)
			return profile, pw, err
		}
	}
	s.mu.RUnlock()
	return Profile{}, "", fmt.Errorf("%w: %s", ErrNotFound, id)
}
