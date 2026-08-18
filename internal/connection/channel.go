// Package connection defines transport-neutral server connection lifecycle,
// retry behavior, and errors.
package connection

import "context"

// Type identifies the transport configured by a server profile.
type Type string

const (
	TypeRCON Type = "rcon"
)

// Channel is the lifecycle shared by every active server transport.
// Implementations are created already open. Close must be idempotent and safe
// to call concurrently with supported capability operations.
type Channel interface {
	State() State
	Close()
}

// CommandExecutor is implemented by channels that can execute server commands.
type CommandExecutor interface {
	ExecuteCommand(ctx context.Context, command string) (string, error)
}
