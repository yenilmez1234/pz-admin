package command

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/feature"
)

func TestBuildPositionalArgs(t *testing.T) {
	d := Definition{
		Name: "kick",
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "reason", Type: TypeString, Prefix: "-r ", Required: false},
		},
	}

	t.Run("all args", func(t *testing.T) {
		got, err := Build(d, map[string]string{"username": "rj", "reason": "griefing"})
		if err != nil {
			t.Fatal(err)
		}
		want := `kick "rj" -r "griefing"`
		if got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	})

	t.Run("only required", func(t *testing.T) {
		got, err := Build(d, map[string]string{"username": "rj"})
		if err != nil {
			t.Fatal(err)
		}
		want := `kick "rj"`
		if got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	})

	t.Run("missing required", func(t *testing.T) {
		_, err := Build(d, map[string]string{"reason": "griefing"})
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}

func TestBuildFlag(t *testing.T) {
	d := Definition{
		Name: "voiceban",
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeFlag, Prefix: "-true", Required: false},
		},
	}

	t.Run("flag present", func(t *testing.T) {
		got, err := Build(d, map[string]string{"username": "rj", "state": "true"})
		if err != nil {
			t.Fatal(err)
		}
		want := `voiceban "rj" -true`
		if got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	})

	t.Run("flag absent", func(t *testing.T) {
		got, err := Build(d, map[string]string{"username": "rj", "state": "false"})
		if err != nil {
			t.Fatal(err)
		}
		want := `voiceban "rj"`
		if got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	})
}

func TestBuildChoiceFlag(t *testing.T) {
	d := Definition{
		Name: "godmode",
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "state", Type: TypeChoice, Prefix: "-", Required: true},
		},
	}

	got, err := Build(d, map[string]string{"username": "rj", "state": "true"})
	if err != nil {
		t.Fatal(err)
	}
	want := `godmode "rj" -true`
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestBuildIntOptional(t *testing.T) {
	d := Definition{
		Name: "additem",
		Params: []Param{
			{Name: "username", Type: TypeString, Required: true},
			{Name: "item", Type: TypeString, Required: true},
			{Name: "count", Type: TypeInt, Required: false},
		},
	}

	t.Run("with count", func(t *testing.T) {
		got, err := Build(d, map[string]string{"username": "rj", "item": "Base.Axe", "count": "5"})
		if err != nil {
			t.Fatal(err)
		}
		want := `additem "rj" "Base.Axe" 5`
		if got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	})

	t.Run("without count", func(t *testing.T) {
		got, err := Build(d, map[string]string{"username": "rj", "item": "Base.Axe"})
		if err != nil {
			t.Fatal(err)
		}
		want := `additem "rj" "Base.Axe"`
		if got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	})
}

func TestBuildNoArgs(t *testing.T) {
	d := Definition{Name: "save"}
	got, err := Build(d, nil)
	if err != nil {
		t.Fatal(err)
	}
	if got != "save" {
		t.Errorf("got %q, want %q", got, "save")
	}
}

func TestBuildQuoting(t *testing.T) {
	d := Definition{
		Name: "servermsg",
		Params: []Param{
			{Name: "message", Type: TypeString, Required: true},
		},
	}

	tests := []struct {
		name string
		msg  string
		want string
	}{
		{"single word", "Restart", `servermsg "Restart"`},
		{"multi word", "Server restarting soon", `servermsg "Server restarting soon"`},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := Build(d, map[string]string{"message": test.msg})
			if err != nil {
				t.Fatal(err)
			}
			if got != test.want {
				t.Errorf("got %q, want %q", got, test.want)
			}
		})
	}
}

func TestRegistryLookup(t *testing.T) {
	r := &Registry{}
	r.Register(Definition{Name: "save", MinVersion: "41", MaxVersion: "42"})
	r.Register(Definition{Name: "newsave", MinVersion: "42", MaxVersion: "42"})

	t.Run("exact name", func(t *testing.T) {
		_, ok := r.Lookup("save", "41")
		if !ok {
			t.Error("save not found")
		}
	})

	t.Run("unknown", func(t *testing.T) {
		_, ok := r.Lookup("nope", "41")
		if ok {
			t.Error("nope should not exist")
		}
	})

	t.Run("version too low", func(t *testing.T) {
		_, ok := r.Lookup("newsave", "41")
		if ok {
			t.Error("newsave requires >= 42")
		}
	})

	t.Run("version in range", func(t *testing.T) {
		_, ok := r.Lookup("newsave", "42")
		if !ok {
			t.Error("newsave should match 42")
		}
	})

	t.Run("version at boundary", func(t *testing.T) {
		r.Register(Definition{Name: "oldcmd", MinVersion: "41", MaxVersion: "42"})
		_, ok42 := r.Lookup("oldcmd", "42")
		if !ok42 {
			t.Error("oldcmd should match version 42 (max is inclusive)")
		}
		_, ok43 := r.Lookup("oldcmd", "43")
		if ok43 {
			t.Error("oldcmd should not match version 43")
		}
	})
}

func TestRegistryFeatures(t *testing.T) {
	r := &Registry{}
	r.Register(Definition{Name: "old", MinVersion: "41", MaxVersion: "41", Feature: feature.PlayerSetGodMode})
	r.Register(Definition{Name: "new", MinVersion: "42", MaxVersion: "42", Feature: feature.PlayerSetGodMode})
	r.Register(Definition{Name: "shared", MinVersion: "41", MaxVersion: "42", Feature: feature.PlayerKick})
	r.Register(Definition{Name: "console-only", MinVersion: "41", MaxVersion: "42"})

	for _, version := range []string{"41", "42"} {
		features := r.Features(version)
		if !features.Has(feature.PlayerSetGodMode) {
			t.Errorf("Features(%q) does not contain PlayerSetGodMode", version)
		}
		if !features.Has(feature.PlayerKick) {
			t.Errorf("Features(%q) does not contain PlayerKick", version)
		}
		if len(features) != 2 {
			t.Errorf("Features(%q) = %v, want 2 features", version, features.Values())
		}
	}
}

func TestRegistryRequiresVersionBounds(t *testing.T) {
	tests := []Definition{
		{Name: "missing-minimum", MaxVersion: "42"},
		{Name: "missing-maximum", MinVersion: "41"},
		{Name: "reversed", MinVersion: "42", MaxVersion: "41"},
	}
	for _, definition := range tests {
		t.Run(definition.Name, func(t *testing.T) {
			defer func() {
				if recover() == nil {
					t.Fatal("Register() did not reject invalid version bounds")
				}
			}()
			new(Registry).Register(definition)
		})
	}
}

type stubExecutor struct {
	response string
	err      error
}

func (s *stubExecutor) ExecuteCommand(_ context.Context, _ string) (string, error) {
	return s.response, s.err
}

func TestRegistryExecute(t *testing.T) {
	t.Run("success with parse", func(t *testing.T) {
		r := &Registry{}
		r.Register(Definition{
			Name:       "test",
			MinVersion: "41",
			MaxVersion: "41",
			Params: []Param{
				{Name: "x", Type: TypeString, Required: true},
			},
			Parse: func(raw string, _ map[string]string) (any, error) {
				return strings.ToUpper(raw), nil
			},
		})
		exec := &stubExecutor{response: "ok"}
		got, err := r.Execute(context.Background(), exec, "test", "41", map[string]string{"x": "hello"})
		if err != nil {
			t.Fatal(err)
		}
		if got != "OK" {
			t.Errorf("got %q, want %q", got, "OK")
		}
	})

	t.Run("success without parse", func(t *testing.T) {
		r := &Registry{}
		r.Register(Definition{Name: "save", MinVersion: "41", MaxVersion: "41"})
		exec := &stubExecutor{response: "World saved"}
		got, err := r.Execute(context.Background(), exec, "save", "41", nil)
		if err != nil {
			t.Fatal(err)
		}
		if got != "World saved" {
			t.Errorf("got %q, want %q", got, "World saved")
		}
	})

	t.Run("unknown command", func(t *testing.T) {
		r := &Registry{}
		exec := &stubExecutor{}
		_, err := r.Execute(context.Background(), exec, "nope", "", nil)
		if !errors.Is(err, ErrUnknownCommand) {
			t.Errorf("got %v, want ErrUnknownCommand", err)
		}
	})

	t.Run("executor error propagated", func(t *testing.T) {
		r := &Registry{}
		r.Register(Definition{Name: "fail", MinVersion: "41", MaxVersion: "41"})
		want := errors.New("boom")
		exec := &stubExecutor{err: want}
		_, err := r.Execute(context.Background(), exec, "fail", "41", nil)
		if !errors.Is(err, want) {
			t.Errorf("got %v, want %v", err, want)
		}
	})

	t.Run("build error propagated", func(t *testing.T) {
		r := &Registry{}
		r.Register(Definition{
			Name:       "kick",
			MinVersion: "41",
			MaxVersion: "41",
			Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
			},
		})
		exec := &stubExecutor{}
		_, err := r.Execute(context.Background(), exec, "kick", "41", map[string]string{})
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("nil executor", func(t *testing.T) {
		r := &Registry{}
		r.Register(Definition{Name: "save", MinVersion: "41", MaxVersion: "41"})
		_, err := r.Execute(context.Background(), nil, "save", "41", nil)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}

func TestBuildValidation(t *testing.T) {
	t.Run("TypeInt rejects non-numeric", func(t *testing.T) {
		d := Definition{
			Name: "createhorde",
			Params: []Param{
				{Name: "count", Type: TypeInt, Required: true},
				{Name: "username", Type: TypeString, Required: true},
			},
		}
		_, err := Build(d, map[string]string{"count": "abc", "username": "rj"})
		if err == nil {
			t.Fatal("expected error for non-numeric int, got nil")
		}
	})

	t.Run("TypeFlag rejects non-bool", func(t *testing.T) {
		d := Definition{
			Name: "banuser",
			Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "banip", Type: TypeFlag, Prefix: "-ip", Required: false},
			},
		}
		_, err := Build(d, map[string]string{"username": "rj", "banip": "yes"})
		if err == nil {
			t.Fatal("expected error for non-bool flag, got nil")
		}
	})

	t.Run("TypeFlag accepts 1 and 0", func(t *testing.T) {
		d := Definition{
			Name: "banuser",
			Params: []Param{
				{Name: "username", Type: TypeString, Required: true},
				{Name: "banip", Type: TypeFlag, Prefix: "-ip", Required: false},
			},
		}
		got1, err1 := Build(d, map[string]string{"username": "rj", "banip": "1"})
		if err1 != nil {
			t.Fatal(err1)
		}
		want1 := `banuser "rj" -ip`
		if got1 != want1 {
			t.Errorf("got %q, want %q", got1, want1)
		}

		got0, err0 := Build(d, map[string]string{"username": "rj", "banip": "0"})
		if err0 != nil {
			t.Fatal(err0)
		}
		want0 := `banuser "rj"`
		if got0 != want0 {
			t.Errorf("got %q, want %q", got0, want0)
		}
	})

	t.Run("TypeString rejects quote", func(t *testing.T) {
		d := Definition{
			Name: "servermsg",
			Params: []Param{
				{Name: "message", Type: TypeString, Required: true},
			},
		}
		_, err := Build(d, map[string]string{"message": `say "hi"`})
		if err == nil {
			t.Fatal("expected error for quote in string, got nil")
		}
	})
}
