// Package config loads, validates, and persists the application user
// configuration (theme and language).
package config

import (
	"errors"
	"fmt"
	"slices"
	"strings"
)

// Config holds all user-facing application settings.
type Config struct {
	Theme    string `json:"theme"`
	Language string `json:"language"`
}

// Theme values.
const (
	ThemeSystem = "system"
	ThemeDark   = "dark"
	ThemeLight  = "light"
)

// Language values.
const (
	LanguageEnUS = "en-US"
	LanguageTrTR = "tr-TR"
)

var (
	themeNames    = []string{ThemeSystem, ThemeDark, ThemeLight}
	languageNames = []string{LanguageEnUS, LanguageTrTR}

	// Sentinel errors allow callers to distinguish validation failures
	// from I/O errors using errors.Is.
	ErrInvalidTheme    = errors.New("config: invalid theme")
	ErrInvalidLanguage = errors.New("config: invalid language")
)

// defaults is the baseline configuration used at startup
// and whenever the config file must be recreated from scratch.
func defaults() Config {
	return Config{
		Theme:    ThemeSystem,
		Language: LanguageEnUS,
	}
}

// Validate checks that all fields contain acceptable values.
// Returns nil if the config is valid, or an error wrapping the
// appropriate sentinel for the first problem found.
func (c Config) Validate() error {
	if !slices.Contains(themeNames, c.Theme) {
		return fmt.Errorf("%w: %q must be one of [%s]",
			ErrInvalidTheme, c.Theme, strings.Join(themeNames, ", "))
	}
	if !slices.Contains(languageNames, c.Language) {
		return fmt.Errorf("%w: %q must be one of [%s]",
			ErrInvalidLanguage, c.Language, strings.Join(languageNames, ", "))
	}
	return nil
}
