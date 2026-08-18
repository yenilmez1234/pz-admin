// Package session manages the active server connection. It resolves saved
// profiles and credentials and selects the channel used by the frontend.
package session

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func init() {
	application.RegisterEvent[profile.Profile]("session:connected")
	application.RegisterEvent[application.Void]("session:disconnected")
}

// Service is the Wails v3 boundary for the active server session.
type Service struct {
	profiles  *profile.Service
	observers []Observer

	mu       sync.Mutex
	channel  connection.Channel
	current  profile.Profile
	features feature.Set
}

// Observer receives backend session lifecycle changes. Implementations must
// return quickly because channel state callbacks are delivered serially.
type Observer interface {
	SessionChanged(profile.Profile, connection.Channel, connection.State)
}

// NewService creates a session service wired to the given profile service and
// session lifecycle observers.
func NewService(profiles *profile.Service, observers ...Observer) *Service {
	return &Service{profiles: profiles, observers: observers}
}

// ServiceStartup is a no-op: the connection is established later via
// Connect, not at application startup.
func (s *Service) ServiceStartup(ctx context.Context, opts application.ServiceOptions) error {
	return nil
}

// ServiceShutdown closes the active channel when the application quits.
func (s *Service) ServiceShutdown() error {
	return s.Disconnect()
}

// Connect looks up the profile and credentials, then opens its configured
// channel. Connect holds the lock for the entire operation; the frontend shows
// a spinner so no other methods are called concurrently.
func (s *Service) Connect(ctx context.Context, profileID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.channel != nil && s.channel.State() == connection.StateConnected {
		return errors.New("session: already connected")
	}

	// Close a stale channel before opening a new session.
	if s.channel != nil {
		s.channel.Close()
		s.channel = nil
		s.current = profile.Profile{}
		s.features = nil
	}

	p, password, err := s.profiles.Credentials(profileID)
	if err != nil {
		return fmt.Errorf("session: %w", err)
	}

	s.current = p

	channel, err := openChannel(ctx, p, password, func(state connection.State) {
		s.handleState(p, state)
	})
	if err != nil {
		s.current = profile.Profile{}
		s.features = nil
		return fmt.Errorf("session: %w", err)
	}

	s.channel = channel
	s.features = resolveFeatures(p, channel)
	return nil
}

// Disconnect closes the active channel. Idempotent.
func (s *Service) Disconnect() error {
	s.mu.Lock()
	if s.channel == nil {
		s.current = profile.Profile{}
		s.features = nil
		s.mu.Unlock()
		return nil
	}
	s.channel.Close()
	s.channel = nil
	s.current = profile.Profile{}
	s.features = nil
	s.mu.Unlock()
	s.notify(profile.Profile{}, nil, connection.StateDisconnected)
	return nil
}

// State returns the current connection state.
func (s *Service) State() connection.State {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.channel == nil {
		return connection.StateDisconnected
	}
	return s.channel.State()
}

// Profile returns the profile associated with the active connection.
func (s *Service) Profile() (profile.Profile, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.channel == nil || s.channel.State() != connection.StateConnected {
		return profile.Profile{}, false
	}
	return s.current, true
}

// Features returns the application features available through the active
// connection. It returns an empty array while disconnected.
func (s *Service) Features() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.channel == nil || s.channel.State() != connection.StateConnected {
		return []string{}
	}

	ids := s.features.Values()
	features := make([]string, len(ids))
	for i, id := range ids {
		features[i] = string(id)
	}
	return features
}

func (s *Service) handleState(p profile.Profile, state connection.State) {
	s.mu.Lock()
	if s.channel == nil || s.current.ID != p.ID {
		s.mu.Unlock()
		return
	}
	channel := s.channel
	if state == connection.StateDisconnected {
		s.features = nil
	}
	s.mu.Unlock()
	s.notify(p, channel, state)
}

func (s *Service) notify(p profile.Profile, channel connection.Channel, state connection.State) {
	for _, observer := range s.observers {
		if observer != nil {
			observer.SessionChanged(p, channel, state)
		}
	}

	app := application.Get()
	switch state {
	case connection.StateConnected:
		app.Event.Emit("session:connected", p)
	case connection.StateDisconnected:
		app.Event.Emit("session:disconnected")
	}
}
