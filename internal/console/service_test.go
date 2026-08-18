package console

import (
	"context"
	"errors"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

type commandChannel struct {
	command string
	result  string
	err     error
}

func (c *commandChannel) State() connection.State {
	return connection.StateConnected
}

func (c *commandChannel) Close() {}

func (c *commandChannel) ExecuteCommand(_ context.Context, command string) (string, error) {
	c.command = command
	return c.result, c.err
}

func TestExecuteUsesConnectedCommandChannel(t *testing.T) {
	channel := &commandChannel{result: "response"}
	service := NewService()
	service.SessionChanged(profile.Profile{}, channel, connection.StateConnected)

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
}

func TestExecuteRequiresCommandCapability(t *testing.T) {
	service := NewService()
	_, err := service.Execute(context.Background(), "players")
	if err == nil {
		t.Fatal("Execute() error = nil, want disconnected error")
	}
}

func TestExecuteReturnsChannelError(t *testing.T) {
	want := errors.New("command failed")
	channel := &commandChannel{err: want}
	service := NewService()
	service.SessionChanged(profile.Profile{}, channel, connection.StateConnected)

	_, err := service.Execute(context.Background(), "players")
	if !errors.Is(err, want) {
		t.Fatalf("Execute() error = %v, want wrapped %v", err, want)
	}
}

func TestDisconnectedSessionClearsCommandChannel(t *testing.T) {
	service := NewService()
	service.SessionChanged(profile.Profile{}, &commandChannel{}, connection.StateConnected)
	service.SessionChanged(profile.Profile{}, nil, connection.StateDisconnected)

	_, err := service.Execute(context.Background(), "players")
	if err == nil {
		t.Fatal("Execute() error = nil after disconnect")
	}
}
