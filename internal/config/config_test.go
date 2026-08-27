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
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.cfg.Validate()
			if test.wantErr == nil {
				if err != nil {
					t.Fatalf("Validate() = %v, want nil", err)
				}
				return
			}
			if err == nil {
				t.Fatalf("Validate() = nil, want error matching %v", test.wantErr)
			}
			if !errors.Is(err, test.wantErr) {
				t.Errorf("errors.Is(err, %v) = false, got err = %v", test.wantErr, err)
			}
			if !strings.Contains(err.Error(), test.wantMsgContains) {
				t.Errorf("error message %q does not contain %q", err.Error(), test.wantMsgContains)
			}
		})
	}
}
