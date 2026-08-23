package console

import (
	"context"
	"errors"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
)

type commandChannel struct {
	command string
	result  string
	err     error
}

type recordedCommand struct {
	profile profile.Profile
	input   string
	output  string
}

func (r *recordedCommand) ObserveConsoleCommand(p profile.Profile, input, output string) error {
	r.profile = p
	r.input = input
	r.output = output
	return nil
}

func (c *commandChannel) Close() {}

func (c *commandChannel) ExecuteCommand(_ context.Context, command string) (string, error) {
	c.command = command
	return c.result, c.err
}

func TestExecuteUsesConnectedCommandChannel(t *testing.T) {
	channel := &commandChannel{result: "response"}
	recorded := &recordedCommand{}
	p := profile.Profile{ID: "profile-id", Version: "42"}
	service := NewService(recorded.ObserveConsoleCommand)
	service.SessionChanged(session.NewState(p, channel))

	result, err := service.Execute(context.Background(), "  players  ")
	if err != nil {
		t.Fatal(err)
	}
	if channel.command != "players" {
		t.Fatalf("command = %q, want players", channel.command)
	}
	if result != "response" {
		t.Fatalf("result = %q, want response", result)
	}
	if recorded.profile != p || recorded.input != "players" || recorded.output != result {
		t.Fatalf("recorded command = %#v", recorded)
	}
}

func TestExecuteRequiresCommandCapability(t *testing.T) {
	service := NewService(nil)
	_, err := service.Execute(context.Background(), "players")
	if err == nil {
		t.Fatal("Execute() error = nil, want disconnected error")
	}
}

func TestExecuteReturnsChannelError(t *testing.T) {
	want := errors.New("command failed")
	channel := &commandChannel{err: want}
	service := NewService(nil)
	service.SessionChanged(session.NewState(profile.Profile{}, channel))

	_, err := service.Execute(context.Background(), "players")
	if !errors.Is(err, want) {
		t.Fatalf("Execute() error = %v, want wrapped %v", err, want)
	}
}

func TestDisconnectedSessionClearsCommandChannel(t *testing.T) {
	service := NewService(nil)
	service.SessionChanged(session.NewState(profile.Profile{}, &commandChannel{}))
	service.SessionChanged(session.State{})

	_, err := service.Execute(context.Background(), "players")
	if err == nil {
		t.Fatal("Execute() error = nil after disconnect")
	}
}
