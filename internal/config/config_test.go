package config

import (
	"errors"
	"strings"
	"testing"
)

func TestValidate(t *testing.T) {
	tests := []struct {
		name            string
		cfg             Config
		wantErr         error
		wantMsgContains string
	}{
		{"valid defaults", defaults(), nil, ""},
		{"valid non-defaults", Config{Theme: ThemeDark, Language: LanguageTrTR}, nil, ""},
		{"invalid theme", Config{Theme: "blue", Language: LanguageEnUS}, ErrInvalidTheme, "blue"},
		{"invalid language", Config{Theme: ThemeSystem, Language: "xx-YY"}, ErrInvalidLanguage, "xx-YY"},
		{"both fields invalid", Config{Theme: "blue", Language: "xx-YY"}, ErrInvalidTheme, "blue"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.cfg.Validate()
			if tt.wantErr == nil {
				if err != nil {
					t.Fatalf("Validate() = %v, want nil", err)
				}
				return
			}
			if err == nil {
				t.Fatalf("Validate() = nil, want error matching %v", tt.wantErr)
			}
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("errors.Is(err, %v) = false, got err = %v", tt.wantErr, err)
			}
			if !strings.Contains(err.Error(), tt.wantMsgContains) {
				t.Errorf("error message %q does not contain %q", err.Error(), tt.wantMsgContains)
			}
		})
	}
}
