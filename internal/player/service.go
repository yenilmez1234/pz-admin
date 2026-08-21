package player

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"path/filepath"
	"sync"
	"time"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/wailsapp/wails/v3/pkg/application"
)

const pollInterval = 15 * time.Second

func init() {
	application.RegisterEvent[Update]("player:updated")
}

// Service exposes stored player data and owns the player store lifecycle.
type Service struct {
	store *Store
	dir   string

	mu            sync.Mutex
	pollCancel    context.CancelFunc
	pollWG        sync.WaitGroup
	activeProfile profile.Profile
	executor      connection.CommandExecutor
	closed        bool
}

// NewService creates a player service ready to be registered with Wails.
func NewService() *Service {
	return &Service{}
}

// newService creates a service with an explicit application data directory.
func newService(dir string) *Service {
	return &Service{dir: dir}
}

// ServiceStartup opens the player store.
func (s *Service) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	store, err := Open(filepath.Join(s.resolveDir(), "players"))
	if err != nil {
		return err
	}
	s.store = store
	return nil
}

// ServiceShutdown stops active player polling.
func (s *Service) ServiceShutdown() error {
	s.mu.Lock()
	s.closed = true
	s.stopPollingLocked()
	s.activeProfile = profile.Profile{}
	s.executor = nil
	s.mu.Unlock()
	s.pollWG.Wait()
	return nil
}

// SessionChanged starts or stops polling to match the active session.
//
//wails:ignore
func (s *Service) SessionChanged(p profile.Profile, channel connection.Channel) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stopPollingLocked()
	s.activeProfile = profile.Profile{}
	s.executor = nil
	if s.closed || channel == nil {
		return
	}
	s.activeProfile = p
	executor, ok := channel.(connection.CommandExecutor)
	if !ok {
		slog.Warn("player: active channel cannot execute commands", "profile", p.ID)
		return
	}
	s.executor = executor

	ctx, cancel := context.WithCancel(context.Background())
	s.pollCancel = cancel
	s.pollWG.Add(1)
	go s.poll(ctx, p, channel)
}

// List returns all known players for a server profile.
func (s *Service) List(profileID string) ([]Player, error) {
	if s.store == nil {
		return nil, fmt.Errorf("player: service not started")
	}
	return s.store.List(profileID)
}

// Observe records one confirmed player observation from another backend
// feature, such as the console.
//
//wails:ignore
func (s *Service) Observe(profileID string, observation Observation) error {
	if s.store == nil {
		return fmt.Errorf("player: service not started")
	}
	if _, err := s.merge(profileID, []Observation{observation}, time.Now().UTC()); err != nil {
		return fmt.Errorf("player: record observation: %w", err)
	}
	return nil
}

// DeleteByProfile removes the player data owned by a server profile.
//
//wails:ignore
func (s *Service) DeleteByProfile(profileID string) error {
	if s.store == nil {
		return fmt.Errorf("player: service not started")
	}
	if err := s.store.DeleteByProfile(profileID); err != nil {
		return err
	}
	s.emitUpdate(profileID, []Player{})
	return nil
}

func (s *Service) resolveDir() string {
	if s.dir != "" {
		return s.dir
	}
	return appdata.DataDir()
}

func (s *Service) stopPollingLocked() {
	if s.pollCancel != nil {
		s.pollCancel()
		s.pollCancel = nil
	}
}

func (s *Service) poll(ctx context.Context, p profile.Profile, channel connection.Channel) {
	defer s.pollWG.Done()

	s.refresh(ctx, p, channel)
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.refresh(ctx, p, channel)
		}
	}
}

func (s *Service) refresh(ctx context.Context, p profile.Profile, channel connection.Channel) {
	observations, err := observePlayers(ctx, p, channel)
	if err != nil {
		if !errors.Is(err, context.Canceled) {
			slog.Warn("player refresh failed", "profile", p.ID, "err", err)
		}
		return
	}
	if ctx.Err() != nil {
		return
	}
	if _, err := s.merge(p.ID, observations, time.Now().UTC()); err != nil {
		slog.Warn("player merge failed", "profile", p.ID, "err", err)
	}
}

func (s *Service) merge(profileID string, observations []Observation, observedAt time.Time) ([]Player, error) {
	players, err := s.store.Merge(profileID, observations, observedAt)
	if err != nil {
		return nil, err
	}
	s.emitUpdate(profileID, players)
	return players, nil
}

func (s *Service) emitUpdate(profileID string, players []Player) {
	if app := application.Get(); app != nil {
		app.Event.Emit("player:updated", Update{ProfileID: profileID, Players: players})
	}
}

func observePlayers(ctx context.Context, p profile.Profile, channel connection.Channel) ([]Observation, error) {
	executor, ok := channel.(connection.CommandExecutor)
	if !ok {
		return nil, errors.New("player: active channel cannot provide players")
	}

	names, err := command.NewClient(executor, p.Version).Players(ctx)
	if err != nil {
		return nil, err
	}
	online := true
	banned := false
	observations := make([]Observation, 0, len(names))
	for _, username := range names {
		observations = append(observations, Observation{
			Username: username,
			Online:   &online,
			Banned:   &banned,
		})
	}
	return observations, nil
}
