package rcon

import (
	"context"
	"errors"
	"fmt"
	"net"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/connection"
	gorcon "github.com/gorcon/rcon"
	"github.com/gorcon/rcon/rcontest"
)

const testPassword = "test-password"

func newTestServer(t *testing.T, opts ...rcontest.Option) *rcontest.Server {
	t.Helper()
	opts = append([]rcontest.Option{
		rcontest.SetSettings(rcontest.Settings{Password: testPassword}),
	}, opts...)
	server := rcontest.NewServer(opts...)
	t.Cleanup(func() { server.Close() })
	return server
}

func newTestClient(t *testing.T, server *rcontest.Server, opts Options) *Client {
	t.Helper()
	if opts.Addr == "" {
		opts.Addr = server.Addr()
	}
	if opts.Password == "" {
		opts.Password = testPassword
	}
	if opts.DialTimeout == 0 {
		opts.DialTimeout = 2 * time.Second
	}
	if opts.InteractionTimeout == 0 {
		opts.InteractionTimeout = 2 * time.Second
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	client, err := Connect(ctx, opts)
	if err != nil {
		t.Fatalf("Connect(%s) error = %v", opts.Addr, err)
	}
	t.Cleanup(client.Close)
	return client
}

func echoHandler(c *rcontest.Context) {
	_, _ = gorcon.NewPacket(
		gorcon.SERVERDATA_RESPONSE_VALUE,
		c.Request().ID,
		"echo:"+c.Request().Body(),
	).WriteTo(c.Conn())
}

// rcontest panics when a handler closes its connection outright. Closing the
// write half makes the client observe EOF while allowing the server to exit
// cleanly.
func closeWriteHalf(c *rcontest.Context) {
	tcpConn, ok := c.Conn().(*net.TCPConn)
	if !ok {
		panic(fmt.Sprintf("rcontest connection is %T, want *net.TCPConn", c.Conn()))
	}
	if err := tcpConn.CloseWrite(); err != nil {
		panic(fmt.Sprintf("rcontest CloseWrite: %v", err))
	}
}

func TestConnectAndExecute(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(echoHandler))
	client := newTestClient(t, server, Options{})

	if client.State() != connection.StateConnected {
		t.Fatal("State() != Connected after Connect")
	}
	for _, command := range []string{"say hello", "players", "quit"} {
		response, err := client.ExecuteCommand(context.Background(), command)
		if err != nil {
			t.Fatalf("ExecuteCommand(%q) error = %v", command, err)
		}
		if want := "echo:" + command; response != want {
			t.Errorf("ExecuteCommand(%q) = %q, want %q", command, response, want)
		}
	}
}

func TestConnectAuthFailure(t *testing.T) {
	server := newTestServer(t)
	_, err := Connect(context.Background(), Options{
		Addr:     server.Addr(),
		Password: "wrong-password",
	})
	if !errors.Is(err, gorcon.ErrAuthFailed) {
		t.Errorf("Connect() error = %v, want gorcon.ErrAuthFailed", err)
	}
}

func TestConnectWithCancelledContext(t *testing.T) {
	server := newTestServer(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := Connect(ctx, Options{Addr: server.Addr(), Password: testPassword})
	if !errors.Is(err, context.Canceled) {
		t.Errorf("Connect() error = %v, want context.Canceled", err)
	}
}

func TestConnectSingleAttempt(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = listener.Close() })

	var attempts atomic.Int64
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			attempts.Add(1)
			_ = conn.Close()
		}
	}()

	_, err = Connect(context.Background(), Options{
		Addr:               listener.Addr().String(),
		Password:           testPassword,
		DialTimeout:        time.Second,
		InteractionTimeout: time.Second,
	})
	if err == nil {
		t.Fatal("Connect() succeeded, want error")
	}
	_ = listener.Close()
	<-done
	if got := attempts.Load(); got != 1 {
		t.Errorf("dial attempts = %d, want 1", got)
	}
}

func TestWithDefaults(t *testing.T) {
	opts := (Options{}).withDefaults()
	if opts.DialTimeout != defaultDialTimeout {
		t.Errorf("DialTimeout = %v, want %v", opts.DialTimeout, defaultDialTimeout)
	}
	if opts.InteractionTimeout != defaultInteractionTimeout {
		t.Errorf("InteractionTimeout = %v, want %v", opts.InteractionTimeout, defaultInteractionTimeout)
	}
}

func TestExecuteAfterClose(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(echoHandler))
	client := newTestClient(t, server, Options{})
	client.Close()

	_, err := client.ExecuteCommand(context.Background(), "anything")
	if !errors.Is(err, connection.ErrDisconnected) {
		t.Errorf("ExecuteCommand() error = %v, want connection.ErrDisconnected", err)
	}
}

func TestExecuteCommandValidation(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(echoHandler))
	client := newTestClient(t, server, Options{})

	_, err := client.ExecuteCommand(context.Background(), "")
	if !errors.Is(err, gorcon.ErrCommandEmpty) {
		t.Errorf("empty command error = %v, want gorcon.ErrCommandEmpty", err)
	}
	_, err = client.ExecuteCommand(
		context.Background(),
		strings.Repeat("x", gorcon.MaxCommandLen+1),
	)
	if !errors.Is(err, gorcon.ErrCommandTooLong) {
		t.Errorf("long command error = %v, want gorcon.ErrCommandTooLong", err)
	}
	if client.State() != connection.StateConnected {
		t.Error("validation errors changed the connection state")
	}
}

func TestExecuteWithCancelledContext(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(echoHandler))
	client := newTestClient(t, server, Options{})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := client.ExecuteCommand(ctx, "anything")
	if !errors.Is(err, context.Canceled) {
		t.Errorf("ExecuteCommand() error = %v, want context.Canceled", err)
	}
	if client.State() != connection.StateConnected {
		t.Error("a cancelled command changed the connection state")
	}
}

func TestTransportFailureDisconnectsPermanently(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(func(c *rcontest.Context) {
		if c.Request().Body() == "break" {
			closeWriteHalf(c)
			return
		}
		echoHandler(c)
	}))
	client := newTestClient(t, server, Options{})

	if _, err := client.ExecuteCommand(context.Background(), "break"); err == nil {
		t.Fatal("ExecuteCommand(break) succeeded, want transport error")
	}
	if client.State() != connection.StateDisconnected {
		t.Error("State() != Disconnected after transport failure")
	}
	_, err := client.ExecuteCommand(context.Background(), "after")
	if !errors.Is(err, connection.ErrDisconnected) {
		t.Errorf("next ExecuteCommand() error = %v, want connection.ErrDisconnected", err)
	}
}

func TestConcurrentExecute(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(echoHandler))
	client := newTestClient(t, server, Options{})

	const count = 20
	var wg sync.WaitGroup
	errs := make(chan error, count)
	for i := range count {
		wg.Add(1)
		go func() {
			defer wg.Done()
			command := fmt.Sprintf("command-%d", i)
			response, err := client.ExecuteCommand(context.Background(), command)
			if err != nil {
				errs <- err
				return
			}
			if response != "echo:"+command {
				errs <- fmt.Errorf("response = %q", response)
			}
		}()
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Error(err)
	}
}

func TestInteractionTimeoutDisconnects(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(func(c *rcontest.Context) {
		if c.Request().Body() == "slow" {
			return
		}
		echoHandler(c)
	}))
	client := newTestClient(t, server, Options{InteractionTimeout: 50 * time.Millisecond})

	_, err := client.ExecuteCommand(context.Background(), "slow")
	if !errors.Is(err, connection.ErrCommandTimeout) {
		t.Errorf("ExecuteCommand(slow) error = %v, want connection.ErrCommandTimeout", err)
	}
	if client.State() != connection.StateDisconnected {
		t.Error("State() != Disconnected after command timeout")
	}
}

func TestCloseIsIdempotent(t *testing.T) {
	server := newTestServer(t, rcontest.SetCommandHandler(echoHandler))
	client := newTestClient(t, server, Options{})

	client.Close()
	client.Close()
	if client.State() != connection.StateDisconnected {
		t.Error("State() != Disconnected after Close")
	}
}

func TestOnStateChange(t *testing.T) {
	events := make(chan connection.State, 2)
	server := newTestServer(t, rcontest.SetCommandHandler(func(c *rcontest.Context) {
		closeWriteHalf(c)
	}))
	client := newTestClient(t, server, Options{
		OnStateChange: func(state connection.State) { events <- state },
	})

	if got := awaitState(t, events); got != connection.StateConnected {
		t.Fatalf("initial event = %v, want Connected", got)
	}
	if _, err := client.ExecuteCommand(context.Background(), "break"); err == nil {
		t.Fatal("ExecuteCommand() succeeded, want transport error")
	}
	if got := awaitState(t, events); got != connection.StateDisconnected {
		t.Fatalf("failure event = %v, want Disconnected", got)
	}
}

func awaitState(t *testing.T, events <-chan connection.State) connection.State {
	t.Helper()
	select {
	case state := <-events:
		return state
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for state event")
		return connection.StateDisconnected
	}
}
