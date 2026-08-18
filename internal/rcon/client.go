// Package rcon provides a thread-safe Source RCON client suitable for game
// server administration.
package rcon

import (
	"context"
	"errors"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/beyenilmez/pz-admin/internal/connection"
	gorcon "github.com/gorcon/rcon"
)

const (
	defaultDialTimeout        = 5 * time.Second
	defaultInteractionTimeout = 5 * time.Second
)

// Options configures an RCON client connection.
type Options struct {
	// Addr is the server address in "host:port" form.
	Addr string

	// Password is the RCON password.
	Password string

	// DialTimeout bounds each dial attempt. Zero uses the default
	// of 5s.
	DialTimeout time.Duration

	// InteractionTimeout bounds each RCON interaction: the
	// authentication handshake during dials and every command
	// round-trip. Zero uses the default of 5s.
	InteractionTimeout time.Duration

	// OnStateChange is called from a single dispatcher goroutine
	// whenever the connection state transitions, including the
	// initial connect. Optional.
	OnStateChange func(state connection.State)
}

// withDefaults fills in zero-valued options with their defaults.
func (o Options) withDefaults() Options {
	if o.DialTimeout <= 0 {
		o.DialTimeout = defaultDialTimeout
	}
	if o.InteractionTimeout <= 0 {
		o.InteractionTimeout = defaultInteractionTimeout
	}
	return o
}

// Client is a managed RCON connection. Safe for concurrent use.
// A Client is created via Connect and must be closed via Close to
// release resources.
//
// Execute holds mu for the whole operation, so at most one command is ever in
// flight.
//
// Options.OnStateChange fires from a single dispatcher goroutine
// whenever the connection state transitions. Delivery order matches
// transition order. The callback must not block and must not call
// any Client method: a stalled callback delays all delivery and a
// re-entrant call can deadlock. The initial connect is reported
// asynchronously; Connect does not wait for the callback.
type Client struct {
	opts Options

	// mu serializes Execute, Close, and state transitions.
	mu sync.Mutex

	// conn describes the current connection. conn is only touched
	// under mu. Invariant: conn != nil iff state == StateConnected.
	conn *gorcon.Conn

	states *connection.StateTracker
}

// Ensure Client implements the shared connection contracts.
var (
	_ connection.Channel         = (*Client)(nil)
	_ connection.CommandExecutor = (*Client)(nil)
)

// Connect dials the RCON server once, no retry — the caller retries
// by calling Connect again. Authentication failures are permanent and
// reported as gorcon's ErrAuthFailed (wrapped in "rcon: connect").
// ctx bounds only the initial dial; the Client's lifetime is
// independent of it — use Close to shut the client down.
//
// If Options.OnStateChange is set, it fires for the initial connect
// with StateConnected asynchronously; Connect returns without
// waiting for the callback.
func Connect(ctx context.Context, opts Options) (*Client, error) {
	opts = opts.withDefaults()

	c := &Client{
		opts:   opts,
		states: connection.NewStateTracker(connection.StateDisconnected, opts.OnStateChange),
	}
	conn, err := dial(ctx, opts)
	if err != nil {
		c.states.Close()
		return nil, fmt.Errorf("rcon: connect: %w", err)
	}

	c.mu.Lock()
	c.conn = conn
	c.states.Set(connection.StateConnected)
	c.mu.Unlock()
	return c, nil
}

// State returns the current connection state. Lock-free; safe to call
// from any goroutine without blocking on an in-flight Execute or Close.
func (c *Client) State() connection.State {
	return c.states.State()
}

// ExecuteCommand runs a command on the established connection. Commands are
// serialized by mu. Any transport failure closes the connection permanently;
// callers must create a new Client to connect again.
//
// Empty commands and commands longer than gorcon.MaxCommandLen are
// rejected with gorcon.ErrCommandEmpty and gorcon.ErrCommandTooLong,
// respectively, before any I/O. Those errors are wrapped and preserved for
// errors.Is and leave the connection untouched. The round-trip is
// bounded by InteractionTimeout via the connection deadline; a
// timeout is reported as ErrCommandTimeout. Cancelling ctx aborts a
// pending Execute; a command already in flight still completes server-side.
//
// Cancelling ctx before the command is sent returns the context error
// unwrapped (without the "rcon: execute:" prefix) so callers can
// distinguish user cancellation from transport failures via errors.Is.
func (c *Client) ExecuteCommand(ctx context.Context, cmd string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.State() != connection.StateConnected || c.conn == nil {
		return "", fmt.Errorf("rcon: execute: %w", connection.ErrDisconnected)
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}

	// Reject invalid commands before touching the connection.
	if cmd == "" {
		return "", fmt.Errorf("rcon: execute: %w", gorcon.ErrCommandEmpty)
	}
	if len(cmd) > gorcon.MaxCommandLen {
		return "", fmt.Errorf("rcon: execute: %w", gorcon.ErrCommandTooLong)
	}

	// TODO: Support Source RCON multi-packet responses. gorcon currently reads
	// only the first packet, so a large response such as `help` leaves unread
	// packets that can be mistaken for replies to later commands.
	response, err := c.conn.Execute(cmd)
	if err != nil {
		// Local validation errors (empty or overlong command) happen
		// before any I/O: the stream is untouched, so the connection
		// stays up. Any other failure may have left the stream
		// desynced (partial reads, stale responses after a timeout);
		// drop the conn so the next Execute reconnects.
		if !errors.Is(err, gorcon.ErrCommandEmpty) && !errors.Is(err, gorcon.ErrCommandTooLong) {
			c.conn.Close()
			c.conn = nil
			c.states.Set(connection.StateDisconnected)
		}
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return "", fmt.Errorf("rcon: execute: %w", connection.ErrCommandTimeout)
		}
		return "", fmt.Errorf("rcon: execute: %w", err)
	}
	return response, nil
}

// Close shuts down the client. Idempotent.
func (c *Client) Close() {
	c.mu.Lock()
	if c.conn != nil {
		c.conn.Close()
		c.conn = nil
	}
	c.states.Set(connection.StateDisconnected)
	c.mu.Unlock()
	c.states.Close()
}
