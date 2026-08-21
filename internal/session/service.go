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

// Observer receives initialized-session changes. A nil channel means the
// session disconnected. Implementations must return quickly.
type Observer interface {
	SessionChanged(profile.Profile, connection.Channel)
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

	if s.channel != nil {
		return errors.New("session: already connected")
	}

	p, password, err := s.profiles.Credentials(profileID)
	if err != nil {
		return fmt.Errorf("session: %w", err)
	}

	var channel connection.Channel
	channel, err = openChannel(ctx, p, password, func() {
		s.handleDisconnect(p.ID, channel)
	})
	if err != nil {
		return fmt.Errorf("session: %w", err)
	}

	s.channel = channel
	s.current = p
	s.features = resolveFeatures(p, channel)
	s.notify(p, channel)
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
	s.notify(profile.Profile{}, nil)
	return nil
}

// Profile returns the profile associated with the active connection.
func (s *Service) Profile() (profile.Profile, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.channel == nil {
		return profile.Profile{}, false
	}
	return s.current, true
}

// Features returns the application features available through the active
// connection. It returns an empty array while disconnected.
func (s *Service) Features() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.channel == nil {
		return []string{}
	}

	ids := s.features.Values()
	features := make([]string, len(ids))
	for i, id := range ids {
		features[i] = string(id)
	}
	return features
}

func (s *Service) handleDisconnect(profileID string, channel connection.Channel) {
	s.mu.Lock()
	if s.channel == nil || s.channel != channel || s.current.ID != profileID {
		s.mu.Unlock()
		return
	}
	s.channel = nil
	s.current = profile.Profile{}
	s.features = nil
	s.mu.Unlock()
	s.notify(profile.Profile{}, nil)
}

func (s *Service) notify(p profile.Profile, channel connection.Channel) {
	for _, observer := range s.observers {
		if observer != nil {
			observer.SessionChanged(p, channel)
		}
	}

	app := application.Get()
	if channel != nil {
		app.Event.Emit("session:connected", p)
	} else {
		app.Event.Emit("session:disconnected")
	}
}
