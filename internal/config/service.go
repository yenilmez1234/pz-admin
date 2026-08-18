package config

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"github.com/beyenilmez/pz-admin/internal/third_party/tailscale.com/atomicfile"
	"github.com/wailsapp/wails/v3/pkg/application"
)

const (
	configFileName = "config.json"
	configBakExt   = ".bak"
)

// Service is the Wails v3 service for application configuration.
// It loads config from disk on startup, provides typed setters
// for the frontend, and saves atomically on every write.
type Service struct {
	mu  sync.RWMutex
	cfg Config
	dir string
}

// NewService returns a config service ready to be registered with Wails.
func NewService() *Service {
	return &Service{}
}

// newService creates a service with an explicit config directory.
func newService(dir string) *Service {
	return &Service{dir: dir}
}

// Config returns a copy of the current configuration.
func (s *Service) Config() Config {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cfg
}

// SetTheme sets the theme. Accepted values: ThemeSystem, ThemeDark, ThemeLight.
func (s *Service) SetTheme(theme string) error {
	return s.update(func(c *Config) { c.Theme = theme })
}

// SetLanguage sets the language. Accepted values: LanguageEnUS, LanguageTrTR.
func (s *Service) SetLanguage(language string) error {
	return s.update(func(c *Config) { c.Language = language })
}

// update validates a candidate config on a copy and, on success,
// commits it to memory and persists to disk. If the disk write
// fails the in-memory state is rolled back so Config() never lies.
func (s *Service) update(mutate func(*Config)) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.dir == "" {
		return fmt.Errorf("config: service not started")
	}
	next := s.cfg
	mutate(&next)
	if err := next.Validate(); err != nil {
		return err
	}
	prev := s.cfg
	s.cfg = next
	if err := s.save(); err != nil {
		s.cfg = prev
		return err
	}
	return nil
}

// ServiceStartup loads the config file, creating it with defaults when
// missing. Corrupt JSON, invalid values, or unreadable files are backed
// up (when possible) before the file is replaced with defaults.
func (s *Service) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.dir = s.resolveDir()

	s.cfg = defaults()
	data, err := os.ReadFile(filepath.Join(s.dir, configFileName))
	if errors.Is(err, os.ErrNotExist) {
		slog.Info("config not found, writing defaults")
		return s.save()
	}
	if err != nil {
		slog.Warn("config unreadable, using defaults", "err", err)
		return nil
	}
	if err := json.Unmarshal(data, &s.cfg); err != nil {
		return s.recoverBadConfig(data, err, "config unparseable, wrote defaults")
	}
	if err := s.cfg.Validate(); err != nil {
		return s.recoverBadConfig(data, err, "config invalid, wrote defaults")
	}
	slog.Info("config loaded", "theme", s.cfg.Theme, "language", s.cfg.Language)
	return nil
}

// recoverBadConfig backs up data and replaces the config file with
// defaults. When data is nil there was no readable file to back up.
// Backup failure is fatal — the original must be preserved.
func (s *Service) recoverBadConfig(data []byte, cause error, msg string) error {
	path := filepath.Join(s.dir, configFileName)
	bak := path + configBakExt
	if data != nil {
		if err := atomicfile.WriteFile(bak, data, 0o600); err != nil {
			return fmt.Errorf("config: backup: %w", err)
		}
		slog.Warn(msg, "err", cause, "backup", bak)
	} else {
		slog.Warn(msg, "err", cause)
	}
	s.cfg = defaults()
	return s.save()
}

// resolveDir returns the application config directory. When s.dir is set
// (e.g. in tests) it is used directly; otherwise the XDG config dir is used.
func (s *Service) resolveDir() string {
	if s.dir != "" {
		return s.dir
	}
	return appdata.ConfigDir()
}

// save writes the current config to disk atomically.
// Caller must hold s.mu.
func (s *Service) save() error {
	data, err := json.MarshalIndent(s.cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("config: marshal: %w", err)
	}
	data = append(data, '\n')
	return atomicfile.WriteFile(filepath.Join(s.dir, configFileName), data, 0o600)
}
