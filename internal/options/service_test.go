package options

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

type testChannel struct {
	execute func(string) (string, error)
}

func (c *testChannel) Close() {}

func (c *testChannel) ExecuteCommand(_ context.Context, input string) (string, error) {
	return c.execute(input)
}

func TestUpdateReportsPartialFailures(t *testing.T) {
	service := NewService()
	service.SessionChanged(profile.Profile{Version: "41"}, &testChannel{
		execute: func(input string) (string, error) {
			if strings.Contains(input, `"Rejected"`) {
				return "", errors.New("rejected by server")
			}
			if strings.Contains(input, `"Accepted"`) {
				return "Option : Accepted is now : true", nil
			}
			return "", errors.New("unexpected command")
		},
	})

	result, err := service.Update(context.Background(), map[string]string{
		"Accepted": "true",
		"Rejected": "false",
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Updated) != 1 || result.Updated[0] != "Accepted" {
		t.Fatalf("Updated = %v, want [Accepted]", result.Updated)
	}
	if !strings.Contains(result.Failed["Rejected"], "rejected by server") {
		t.Fatalf("Failed = %v, want Rejected failure", result.Failed)
	}
}

var _ connection.Channel = (*testChannel)(nil)
var _ connection.CommandExecutor = (*testChannel)(nil)
