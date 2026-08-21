// Package rcon provides a thread-safe Source RCON client suitable for game
// server administration.
package rcon

import (
	"context"
	"errors"
	"fmt"
	"net"
	"sync/atomic"
	"time"

	"github.com/beyenilmez/pz-admin/internal/connection"
	source "gitlab.com/nyxi/go-source-rcon/v2"
)

const defaultTimeout = 5 * time.Second

// Config configures an RCON client connection.
type Config struct {
	// Addr is the server address in "host:port" form.
	Addr string

	// Password is the RCON password.
	Password string

	// Timeout bounds connection, authentication, queueing, and command
	// execution. Zero uses the default of 5s.
	Timeout time.Duration

	// OnDisconnect is called after an unexpected transport failure. Explicitly
	// closing the client does not call it. Optional.
	OnDisconnect func()
}

// withDefaults fills in zero-valued options with their defaults.
func (c Config) withDefaults() Config {
	if c.Timeout <= 0 {
		c.Timeout = defaultTimeout
	}
	return c
}

// Client is a managed RCON connection. Safe for concurrent use. A Client is
// created via Connect and must be closed via Close to release resources.
type Client struct {
	conn         *source.Client
	closed       atomic.Bool
	onDisconnect func()
}

// Ensure Client implements the shared connection contracts.
var (
	_ connection.Channel         = (*Client)(nil)
	_ connection.CommandExecutor = (*Client)(nil)
)

// Connect dials the RCON server once, no retry — the caller retries
// by calling Connect again. Authentication failures are permanent and
// reported as source.ErrAuthentication (wrapped in "rcon: connect").
// ctx bounds only the initial dial; the Client's lifetime is
// independent of it — use Close to shut the client down.
func Connect(ctx context.Context, config Config) (*Client, error) {
	config = config.withDefaults()
	// PZ returns one complete packet per command and can exceed Source's
	// standard 4096-byte packet limit (B42's `help` packet is 4218 bytes).
	conn, err := source.Dial(
		ctx,
		config.Addr,
		source.WithPassword(config.Password),
		source.WithTimeout(config.Timeout),
		source.WithSinglePacketResponses(),
		source.WithMaxPacketSize(source.MaxPacketSizeLimit),
		source.WithUTF8(),
	)
	if err != nil {
		return nil, fmt.Errorf("rcon: connect: %w", err)
	}

	return &Client{conn: conn, onDisconnect: config.OnDisconnect}, nil
}

// ExecuteCommand runs a command on the established connection. The underlying
// client serializes concurrent commands. Any transport failure closes the
// connection permanently; callers must create a new Client to connect again.
//
// Empty commands are rejected before any I/O. The round-trip is bounded by
// Timeout; a timeout is reported as ErrCommandTimeout. Cancelling
// ctx aborts a pending Execute, although the command may already have reached
// the server.
//
// Cancelling ctx before the command is sent returns the context error
// unwrapped (without the "rcon: execute:" prefix) so callers can
// distinguish user cancellation from transport failures via errors.Is.
func (c *Client) ExecuteCommand(ctx context.Context, cmd string) (string, error) {
	if c.closed.Load() {
		return "", fmt.Errorf("rcon: execute: %w", connection.ErrDisconnected)
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}

	// Reject invalid commands before touching the connection.
	if cmd == "" {
		return "", fmt.Errorf("rcon: execute: command is empty")
	}

	response, err := c.conn.Exec(ctx, cmd)
	if err != nil {
		if isCommandValidationError(err) {
			return "", fmt.Errorf("rcon: execute: %w", err)
		}

		// Any transaction failure may have left the stream ambiguous. Keep the
		// application's explicit reconnect lifecycle instead of reusing it.
		c.close(true)
		var netErr net.Error
		if errors.Is(err, context.DeadlineExceeded) ||
			(errors.As(err, &netErr) && netErr.Timeout()) {
			return "", fmt.Errorf("rcon: execute: %w", connection.ErrCommandTimeout)
		}
		return "", fmt.Errorf("rcon: execute: %w", err)
	}
	return response, nil
}

func isCommandValidationError(err error) bool {
	return errors.Is(err, source.ErrBodyTooLarge) ||
		errors.Is(err, source.ErrBodyContainsNUL) ||
		errors.Is(err, source.ErrNonASCII) ||
		errors.Is(err, source.ErrInvalidUTF8)
}

// Close shuts down the client. Idempotent.
func (c *Client) Close() {
	c.close(false)
}

func (c *Client) close(notify bool) {
	if !c.closed.CompareAndSwap(false, true) {
		return
	}
	_ = c.conn.Close()
	if notify && c.onDisconnect != nil {
		c.onDisconnect()
	}
}
