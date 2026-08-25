package serveraction

import (
	"context"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
)

type commandExecutor func(string) (string, error)

func (e commandExecutor) ExecuteCommand(_ context.Context, command string) (string, error) {
	return e(command)
}

func (commandExecutor) Close() {}

func TestRandomPlayerEventsRequireOnlinePlayer(t *testing.T) {
	commands := 0
	service := &Service{
		active: session.NewState(profile.Profile{Version: "42"}, commandExecutor(func(command string) (string, error) {
			commands++
			if command != "players" {
				t.Fatalf("unexpected command %q", command)
			}
			return "Players connected (0)\n", nil
		})),
	}

	tests := []struct {
		name string
		run  func(context.Context) (EventResult, error)
	}{
		{name: "lightning", run: service.TriggerLightning},
		{name: "thunder", run: service.TriggerThunder},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			before := commands
			result, err := test.run(context.Background())
			if err == nil || err.Error() != "serveraction: no players are online" {
				t.Fatalf("error = %v, want no-online-players error", err)
			}
			if result != (EventResult{}) {
				t.Fatalf("result = %+v, want zero value", result)
			}
			if commands != before+1 {
				t.Fatalf("executed %d commands, want only players", commands-before)
			}
		})
	}
}
