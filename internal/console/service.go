// Package console executes raw commands on the active server channel.
package console

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

// Service is the Wails boundary for raw server command execution.
type Service struct {
	mu       sync.Mutex
	executor connection.CommandExecutor
}

// NewService creates a console service.
func NewService() *Service {
	return &Service{}
}

// SessionChanged follows the command capability of the active session.
//
//wails:ignore
func (s *Service) SessionChanged(_ profile.Profile, channel connection.Channel, state connection.State) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.executor = nil
	if state != connection.StateConnected || channel == nil {
		return
	}
	s.executor, _ = channel.(connection.CommandExecutor)
}

// Execute runs one raw command through the active server channel.
func (s *Service) Execute(ctx context.Context, command string) (string, error) {
	command = strings.TrimSpace(command)
	if command == "" {
		return "", errors.New("console: command is required")
	}

	s.mu.Lock()
	executor := s.executor
	s.mu.Unlock()
	if executor == nil {
		return "", errors.New("console: connection does not support executing commands")
	}

	result, err := executor.ExecuteCommand(ctx, command)
	if err != nil {
		return "", fmt.Errorf("console: execute command: %w", err)
	}
	return result, nil
}
