package rcon

import (
	"context"
	"net"

	gorcon "github.com/gorcon/rcon"
)

// dial establishes an RCON connection to opts.Addr. The TCP dial is
// context-aware: cancellation — a caller's deadline or Close() — stops
// an in-flight dial immediately instead of waiting out DialTimeout.
// The auth handshake is not ctx-aware, but SetDeadline bounds it to
// InteractionTimeout; a context that expires during the handshake fails
// the attempt as soon as Open returns, so the cap is actually honored.
func dial(ctx context.Context, opts Options) (*gorcon.Conn, error) {
	var d net.Dialer
	d.Timeout = opts.DialTimeout
	tcpConn, err := d.DialContext(ctx, "tcp", opts.Addr)
	if err != nil {
		return nil, err
	}
	conn, err := gorcon.Open(tcpConn, opts.Password, gorcon.SetDeadline(opts.InteractionTimeout))
	if err != nil {
		return nil, err
	}
	if ctx.Err() != nil {
		conn.Close()
		return nil, ctx.Err()
	}
	return conn, nil
}
