package session

import (
	"github.com/beyenilmez/pz-admin/internal/command"
	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
	"github.com/beyenilmez/pz-admin/internal/profile"
)

// Snapshot is the serializable public state of the active session.
type Snapshot struct {
	Profile   profile.Profile `json:"profile"`
	Features  []string        `json:"features"`
	Connected bool            `json:"connected"`
}

// State is the immutable command context for the active server session.
// The zero value represents a disconnected session.
type State struct {
	Snapshot
	Channel  connection.Channel
	CommandClient *command.Client
}

// NewState derives the command capabilities once for a session change.
func NewState(p profile.Profile, channel connection.Channel) State {
	state := State{
		Snapshot: Snapshot{
			Profile:  p,
			Features: featureNames(resolveFeatures(p, channel)),
		},
		Channel: channel,
	}
	if channel == nil {
		return State{}
	}
	executor, ok := channel.(connection.CommandExecutor)
	if ok {
		state.CommandClient = command.NewClient(executor, p.Version)
		state.Connected = true
	}
	return state
}

func featureNames(features feature.Set) []string {
	ids := features.Values()
	names := make([]string, len(ids))
	for i, id := range ids {
		names[i] = string(id)
	}
	return names
}

// IsConnected reports whether the snapshot has an executable server session.
func (s State) IsConnected() bool {
	return s.Connected && s.CommandClient != nil
}
