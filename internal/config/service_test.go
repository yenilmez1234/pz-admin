package config

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func configPath(svc *Service) string {
	return filepath.Join(svc.dir, configFileName)
}

func startService(t *testing.T, svc *Service) {
	t.Helper()
	if err := svc.ServiceStartup(context.Background(), application.ServiceOptions{}); err != nil {
		t.Fatalf("ServiceStartup: %v", err)
	}
}

func newStartedService(t *testing.T) *Service {
	t.Helper()
	svc := newService(t.TempDir())
	startService(t, svc)
	return svc
}

func newServiceWithConfig(t *testing.T, content []byte) *Service {
	t.Helper()
	dir := t.TempDir()
	svc := newService(dir)
	path := filepath.Join(dir, configFileName)
	if err := os.WriteFile(path, content, 0o600); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	return svc
}

func readDiskConfig(t *testing.T, path string) Config {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile(%q): %v", path, err)
	}
	var disk Config
	if err := json.Unmarshal(data, &disk); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return disk
}

func TestServiceStartupCreatesDefaults(t *testing.T) {
	svc := newStartedService(t)

	want := defaults()
	if got := svc.Config(); got != want {
		t.Errorf("Config() = %+v, want %+v", got, want)
	}
	if disk := readDiskConfig(t, configPath(svc)); disk != want {
		t.Errorf("file = %+v, want %+v", disk, want)
	}
}

func TestServiceStartupLoadsValidFile(t *testing.T) {
	want := Config{Theme: ThemeDark, Language: LanguageTrTR}
	raw, err := json.Marshal(want)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	svc := newServiceWithConfig(t, raw)
	startService(t, svc)

	if got := svc.Config(); got != want {
		t.Errorf("Config() = %+v, want %+v", got, want)
	}
}

func TestServiceStartupReplacesBadConfig(t *testing.T) {
	tests := []struct {
		name    string
		content []byte
	}{
		{"corrupt JSON", []byte("not json")},
		{"invalid values", []byte(`{"theme":"blue","language":"en-US"}`)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			svc := newServiceWithConfig(t, test.content)
			startService(t, svc)

			want := defaults()
			if got := svc.Config(); got != want {
				t.Errorf("Config() = %+v, want defaults %+v", got, want)
			}

			bak, err := os.ReadFile(configPath(svc) + configBakExt)
			if err != nil {
				t.Fatalf("backup file: %v", err)
			}
			if !bytes.Equal(bak, test.content) {
				t.Errorf("backup = %q, want %q", string(bak), string(test.content))
			}

			if disk := readDiskConfig(t, configPath(svc)); disk != want {
				t.Errorf("disk = %+v, want defaults %+v", disk, want)
			}
		})
	}
}

func TestSettersSaveToDisk(t *testing.T) {
	tests := []struct {
		name   string
		set    func(svc *Service) error
		wantFn func(Config) Config
	}{
		{
			"SetTheme", func(s *Service) error { return s.SetTheme(ThemeDark) },
			func(c Config) Config { c.Theme = ThemeDark; return c },
		},
		{
			"SetLanguage", func(s *Service) error { return s.SetLanguage(LanguageTrTR) },
			func(c Config) Config { c.Language = LanguageTrTR; return c },
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			svc := newStartedService(t)
			if err := test.set(svc); err != nil {
				t.Fatalf("%s: %v", test.name, err)
			}
			want := test.wantFn(defaults())
			if disk := readDiskConfig(t, configPath(svc)); disk != want {
				t.Errorf("disk = %+v, want %+v", disk, want)
			}
			if got := svc.Config(); got != want {
				t.Errorf("Config() = %+v, want %+v", got, want)
			}
		})
	}
}

func TestSettersRejectInvalidValues(t *testing.T) {
	tests := []struct {
		name         string
		set          func(svc *Service) error
		wantSentinel error
	}{
		{"SetTheme", func(s *Service) error { return s.SetTheme("blue") }, ErrInvalidTheme},
		{"SetLanguage", func(s *Service) error { return s.SetLanguage("xx-YY") }, ErrInvalidLanguage},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			svc := newStartedService(t)
			want := svc.Config()
			origData, err := os.ReadFile(configPath(svc))
			if err != nil {
				t.Fatalf("ReadFile: %v", err)
			}

			if err := test.set(svc); !errors.Is(err, test.wantSentinel) {
				t.Fatalf("%s = %v, want %v", test.name, err, test.wantSentinel)
			}
			if got := svc.Config(); got != want {
				t.Errorf("Config() = %+v, want %+v (unchanged)", got, want)
			}
			after, err := os.ReadFile(configPath(svc))
			if err != nil {
				t.Fatalf("ReadFile: %v", err)
			}
			if !bytes.Equal(origData, after) {
				t.Error("config file was modified after validation rejection")
			}
		})
	}
}

func TestSetLanguageRollsBackOnWriteFailure(t *testing.T) {
	svc := newStartedService(t)
	want := svc.Config()
	origPath := configPath(svc)

	data, err := os.ReadFile(origPath)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}

	// Point dir at a file — MkdirAll will fail because a regular file
	// already exists at that path.
	svc.dir = filepath.Join(t.TempDir(), "blocker")
	if err := os.WriteFile(svc.dir, nil, 0o600); err != nil {
		t.Fatal(err)
	}

	if err := svc.SetLanguage(LanguageTrTR); err == nil {
		t.Fatal("SetLanguage: want error, got nil")
	}
	if got := svc.Config(); got != want {
		t.Errorf("Config() = %+v, want %+v (rollback failed)", got, want)
	}

	unchanged, err := os.ReadFile(origPath)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	if !bytes.Equal(data, unchanged) {
		t.Error("config file was modified after write failure")
	}
}

func TestServiceStartupUnreadableFile(t *testing.T) {
	dir := t.TempDir()
	// Create a directory where the config file would be, so os.ReadFile
	// fails (a dir is not a regular file).
	if err := os.MkdirAll(filepath.Join(dir, configFileName), 0o700); err != nil {
		t.Fatalf("MkdirAll: %v", err)
	}
	svc := newService(dir)
	startService(t, svc)

	want := defaults()
	if got := svc.Config(); got != want {
		t.Errorf("Config() = %+v, want %+v", got, want)
	}
	// Unreadable file has no data to back up; no .bak should be created.
	if _, err := os.Stat(configPath(svc) + configBakExt); !os.IsNotExist(err) {
		t.Errorf("backup file created when it should not be: %v", err)
	}
}

func TestSaveLockedRenameFailureRollsBack(t *testing.T) {
	svc := newStartedService(t)
	want := svc.Config()
	origPath := configPath(svc)

	if err := os.Remove(origPath); err != nil {
		t.Fatalf("Remove: %v", err)
	}
	if err := os.Mkdir(origPath, 0o700); err != nil {
		t.Fatalf("Mkdir: %v", err)
	}

	if err := svc.SetTheme(ThemeDark); err == nil {
		t.Fatal("SetTheme: want error, got nil")
	}
	if got := svc.Config(); got != want {
		t.Errorf("Config() = %+v, want %+v (rollback failed)", got, want)
	}

	matches, _ := filepath.Glob(filepath.Join(filepath.Dir(origPath), ".jsonfile-*.json"))
	if len(matches) > 0 {
		t.Errorf("leftover temp files: %v", matches)
	}
}

func TestConcurrentUpdates(t *testing.T) {
	svc := newStartedService(t)

	var wg sync.WaitGroup
	var errs [20]error
	for i := range 20 {
		id := i
		wg.Go(func() {
			if id%2 == 0 {
				errs[id] = svc.SetTheme(ThemeDark)
			} else {
				errs[id] = svc.SetLanguage(LanguageTrTR)
			}
		})
	}
	wg.Wait()
	for i, err := range errs {
		if err != nil {
			t.Errorf("goroutine %d: %v", i, err)
		}
	}

	cfg := svc.Config()
	want := Config{Theme: ThemeDark, Language: LanguageTrTR}
	if cfg != want {
		t.Errorf("Config() = %+v, want %+v", cfg, want)
	}

	disk := readDiskConfig(t, configPath(svc))
	if disk != cfg {
		t.Errorf("disk = %+v, Config() = %+v (should match)", disk, cfg)
	}
}
