package session

import (
	"context"
	"testing"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

type featureTestChannel struct{}

func (featureTestChannel) State() connection.State { return connection.StateConnected }
func (featureTestChannel) Close()                  {}

type featureTestCommandChannel struct{ featureTestChannel }

func (featureTestCommandChannel) ExecuteCommand(context.Context, string) (string, error) {
	return "", nil
}

func TestResolveFeatures(t *testing.T) {
	p := profile.Profile{Version: "42"}

	withoutCommands := resolveFeatures(p, featureTestChannel{})
	if len(withoutCommands) != 0 {
		t.Fatalf("features without CommandExecutor = %v, want empty", withoutCommands.Values())
	}

	withCommands := resolveFeatures(p, featureTestCommandChannel{})
	for _, expected := range []feature.ID{
		feature.ConsoleExecuteCommand,
		feature.PlayerList,
		feature.PlayerSetGodMode,
		feature.PlayerSetInvisible,
		feature.PlayerSetNoClip,
		feature.PlayerTeleportToPlayer,
	} {
		if !withCommands.Has(expected) {
			t.Errorf("features with CommandExecutor does not contain %q", expected)
		}
	}

	p.Version = "41"
	build41 := resolveFeatures(p, featureTestCommandChannel{})
	if build41.Has(feature.PlayerSetNoClip) {
		t.Error("Build 41 features contain PlayerSetNoClip")
	}
	if build41.Has(feature.PlayerSetInvisible) {
		t.Error("Build 41 features contain PlayerSetInvisible")
	}
}
