// Package session manages the active server connection. It resolves saved
// profiles and credentials and selects the channel used by the frontend.
package session

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func init() {
	application.RegisterEvent[Snapshot]("session:changed")
}

// Service is the Wails v3 boundary for the active server session.
type Service struct {
	profiles  *profile.Service
	observers []Observer

	mu     sync.Mutex
	active State
}

// Observer receives initialized-session changes. A nil channel means the
// session disconnected. Implementations must return quickly.
type Observer interface {
	SessionChanged(State)
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

	if s.active.Channel != nil {
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
	if p.Version == "auto" {
		version, detectErr := detectGameVersion(ctx, channel)
		if detectErr != nil {
			channel.Close()
			return fmt.Errorf("session: %w", detectErr)
		}
		p.Version = version
	}

	s.active = NewState(p, channel)
	s.notify(s.active)
	return nil
}

// Disconnect closes the active channel. Idempotent.
func (s *Service) Disconnect() error {
	s.mu.Lock()
	if s.active.Channel == nil {
		s.mu.Unlock()
		return nil
	}
	s.active.Channel.Close()
	s.active = State{}
	s.mu.Unlock()
	s.notify(State{})
	return nil
}

// Profile returns the profile associated with the active connection.
func (s *Service) Profile() (profile.Profile, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.active.Channel == nil {
		return profile.Profile{}, false
	}
	return s.active.Profile, true
}

// Features returns the application features available through the active
// connection. It returns an empty array while disconnected.
func (s *Service) Features() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.active.Channel == nil {
		return []string{}
	}

	return append([]string(nil), s.active.Features...)
}

// Snapshot returns the complete serializable state of the active session.
func (s *Service) Snapshot() Snapshot {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.active.Snapshot
}

func (s *Service) handleDisconnect(profileID string, channel connection.Channel) {
	s.mu.Lock()
	if s.active.Channel == nil || s.active.Channel != channel || s.active.Profile.ID != profileID {
		s.mu.Unlock()
		return
	}
	s.active = State{}
	s.mu.Unlock()
	s.notify(State{})
}

func (s *Service) notify(state State) {
	for _, observer := range s.observers {
		if observer != nil {
			observer.SessionChanged(state)
		}
	}

	app := application.Get()
	app.Event.Emit("session:changed", state.Snapshot)
}
