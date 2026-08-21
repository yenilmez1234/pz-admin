package rcon

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/connection"
	source "gitlab.com/nyxi/go-source-rcon/v2"
)

const testPassword = "test-password"

func newTestClient(t *testing.T, server *testServer, opts Config) *Client {
	t.Helper()
	if opts.Addr == "" {
		opts.Addr = server.Addr()
	}
	if opts.Password == "" {
		opts.Password = testPassword
	}
	if opts.Timeout == 0 {
		opts.Timeout = 2 * time.Second
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

func echoHandler(command string) testReply {
	return testReply{body: "echo:" + command, respond: true}
}

func TestConnectAndExecute(t *testing.T) {
	server := newTestServer(t, echoHandler)
	client := newTestClient(t, server, Config{})

	for _, command := range []string{"servermsg hello", "players", "quit"} {
		response, err := client.ExecuteCommand(context.Background(), command)
		if err != nil {
			t.Fatalf("ExecuteCommand(%q) error = %v", command, err)
		}
		if want := "echo:" + command; response != want {
			t.Errorf("ExecuteCommand(%q) = %q, want %q", command, response, want)
		}
	}
}

func TestExecuteAcceptsLargeProjectZomboidResponse(t *testing.T) {
	want := strings.Repeat("x", 4208) // 4218-byte packet including the RCON envelope.
	server := newTestServer(t, func(string) testReply {
		return testReply{body: want, respond: true}
	})
	client := newTestClient(t, server, Config{})

	response, err := client.ExecuteCommand(context.Background(), "help")
	if err != nil {
		t.Fatal(err)
	}
	if response != want {
		t.Errorf("response length = %d, want %d", len(response), len(want))
	}
}

func TestConnectAuthFailure(t *testing.T) {
	server := newTestServer(t)
	_, err := Connect(context.Background(), Config{
		Addr:     server.Addr(),
		Password: "wrong-password",
	})
	if !errors.Is(err, source.ErrAuthentication) {
		t.Errorf("Connect() error = %v, want source.ErrAuthentication", err)
	}
}

func TestConnectWithCancelledContext(t *testing.T) {
	server := newTestServer(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := Connect(ctx, Config{Addr: server.Addr(), Password: testPassword})
	if !errors.Is(err, context.Canceled) {
		t.Errorf("Connect() error = %v, want context.Canceled", err)
	}
}

func TestExecuteAfterClose(t *testing.T) {
	server := newTestServer(t, echoHandler)
	client := newTestClient(t, server, Config{})
	client.Close()

	_, err := client.ExecuteCommand(context.Background(), "anything")
	if !errors.Is(err, connection.ErrDisconnected) {
		t.Errorf("ExecuteCommand() error = %v, want connection.ErrDisconnected", err)
	}
}

func TestExecuteCommandValidation(t *testing.T) {
	server := newTestServer(t, echoHandler)
	client := newTestClient(t, server, Config{})

	_, err := client.ExecuteCommand(context.Background(), "")
	if err == nil {
		t.Error("empty command succeeded")
	}
	_, err = client.ExecuteCommand(
		context.Background(),
		strings.Repeat("x", 5000),
	)
	if !errors.Is(err, source.ErrBodyTooLarge) {
		t.Errorf("long command error = %v, want source.ErrBodyTooLarge", err)
	}
	if _, err := client.ExecuteCommand(context.Background(), "players"); err != nil {
		t.Errorf("validation error made connection unusable: %v", err)
	}
}

func TestExecuteWithCancelledContext(t *testing.T) {
	server := newTestServer(t, echoHandler)
	client := newTestClient(t, server, Config{})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := client.ExecuteCommand(ctx, "anything")
	if !errors.Is(err, context.Canceled) {
		t.Errorf("ExecuteCommand() error = %v, want context.Canceled", err)
	}
	if _, err := client.ExecuteCommand(context.Background(), "players"); err != nil {
		t.Errorf("cancelled command made connection unusable: %v", err)
	}
}

func TestTransportFailureDisconnectsPermanently(t *testing.T) {
	server := newTestServer(t, func(command string) testReply {
		if command == "break" {
			return testReply{closeWrite: true}
		}
		return echoHandler(command)
	})
	client := newTestClient(t, server, Config{})

	if _, err := client.ExecuteCommand(context.Background(), "break"); err == nil {
		t.Fatal("ExecuteCommand(break) succeeded, want transport error")
	}
	_, err := client.ExecuteCommand(context.Background(), "after")
	if !errors.Is(err, connection.ErrDisconnected) {
		t.Errorf("next ExecuteCommand() error = %v, want connection.ErrDisconnected", err)
	}
}

func TestConcurrentExecute(t *testing.T) {
	server := newTestServer(t, echoHandler)
	client := newTestClient(t, server, Config{})

	const count = 20
	var wg sync.WaitGroup
	errs := make(chan error, count)
	for i := range count {
		wg.Go(func() {
			command := fmt.Sprintf("command-%d", i)
			response, err := client.ExecuteCommand(context.Background(), command)
			if err != nil {
				errs <- err
				return
			}
			if response != "echo:"+command {
				errs <- fmt.Errorf("response = %q", response)
			}
		})
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Error(err)
	}
}

func TestTimeoutDisconnects(t *testing.T) {
	server := newTestServer(t, func(command string) testReply {
		if command == "slow" {
			return testReply{}
		}
		return echoHandler(command)
	})
	client := newTestClient(t, server, Config{Timeout: 50 * time.Millisecond})

	_, err := client.ExecuteCommand(context.Background(), "slow")
	if !errors.Is(err, connection.ErrCommandTimeout) {
		t.Errorf("ExecuteCommand(slow) error = %v, want connection.ErrCommandTimeout", err)
	}
	_, nextErr := client.ExecuteCommand(context.Background(), "after")
	if !errors.Is(nextErr, connection.ErrDisconnected) {
		t.Errorf("next ExecuteCommand() error = %v, want connection.ErrDisconnected", nextErr)
	}
}

func TestCloseIsIdempotent(t *testing.T) {
	server := newTestServer(t, echoHandler)
	client := newTestClient(t, server, Config{})

	client.Close()
	client.Close()
}

func TestUnexpectedDisconnectCallback(t *testing.T) {
	disconnected := make(chan struct{}, 1)
	server := newTestServer(t, func(string) testReply {
		return testReply{closeWrite: true}
	})
	client := newTestClient(t, server, Config{
		OnDisconnect: func() { disconnected <- struct{}{} },
	})

	if _, err := client.ExecuteCommand(context.Background(), "break"); err == nil {
		t.Fatal("ExecuteCommand() succeeded, want transport error")
	}
	select {
	case <-disconnected:
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for disconnect callback")
	}
}
