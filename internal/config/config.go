// Package config loads, validates, and persists the application's user
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

	// ErrInvalidTheme identifies an unsupported theme value.
	ErrInvalidTheme = errors.New("config: invalid theme")
	// ErrInvalidLanguage identifies an unsupported language value.
	ErrInvalidLanguage = errors.New("config: invalid language")
)

// defaults returns the baseline configuration used at startup and during
// recovery.
func defaults() Config {
	return Config{
		Theme:    ThemeSystem,
		Language: LanguageEnUS,
	}
}

// Validate checks that all fields contain supported values. It wraps the
// appropriate sentinel error for the first invalid field.
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
