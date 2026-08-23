package player

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/google/uuid"
)

type commandChannel struct {
	response string
	calls    atomic.Int32
}

func (c *commandChannel) Close() {}
func (c *commandChannel) ExecuteCommand(context.Context, string) (string, error) {
	c.calls.Add(1)
	return c.response, nil
}

func TestConnectedSessionPollsAndMergesImmediately(t *testing.T) {
	store := openStore(t)
	service := &Service{store: store}
	t.Cleanup(func() {
		if err := service.ServiceShutdown(); err != nil {
			t.Errorf("ServiceShutdown() = %v", err)
		}
	})

	p := profile.Profile{ID: uuid.NewString(), Version: "42"}
	channel := &commandChannel{response: "Players connected (2):\n-Alice\n-Bob"}
	service.SessionChanged(session.NewState(p, channel))

	deadline := time.Now().Add(time.Second)
	for {
		players, err := store.List(p.ID)
		if err != nil {
			t.Fatal(err)
		}
		if len(players) == 2 {
			if players[0].Username != "Alice" || players[1].Username != "Bob" {
				t.Fatalf("stored players = %#v", players)
			}
			if players[0].LastSeenOnlineAt.IsZero() || players[1].LastSeenOnlineAt.IsZero() {
				t.Fatalf("stored players missing online timestamps: %#v", players)
			}
			if players[0].Banned == nil || *players[0].Banned ||
				players[1].Banned == nil || *players[1].Banned {
				t.Fatalf("stored online players are not marked unbanned: %#v", players)
			}
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("immediate poll did not merge players; got %#v", players)
		}
		time.Sleep(time.Millisecond)
	}
}
