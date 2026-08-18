package connection

import (
	"fmt"
	"sync"
	"sync/atomic"
)

// State represents the lifecycle state of a server connection.
type State int

const (
	// StateDisconnected is the zero value: no connection is established.
	StateDisconnected State = iota
	// StateConnected means the channel is ready for operations.
	StateConnected
)

// String returns the state as a human-readable string.
func (s State) String() string {
	switch s {
	case StateDisconnected:
		return "disconnected"
	case StateConnected:
		return "connected"
	default:
		return fmt.Sprintf("State(%d)", s)
	}
}

// StateTracker stores a channel state and delivers state changes in order.
type StateTracker struct {
	state atomic.Int32

	mu     sync.Mutex
	notify chan State
	closed bool
}

// NewStateTracker creates a tracker with the given initial state. When
// onChange is nil, transitions are stored without starting a dispatcher.
func NewStateTracker(initial State, onChange func(State)) *StateTracker {
	t := &StateTracker{}
	t.state.Store(int32(initial))
	if onChange != nil {
		t.notify = make(chan State, 16)
		go t.dispatch(onChange)
	}
	return t
}

// State returns the current state without blocking on a callback.
func (t *StateTracker) State() State {
	return State(t.state.Load())
}

// Set stores state and schedules a callback unless the state is unchanged.
func (t *StateTracker) Set(state State) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.State() == state {
		return
	}
	t.state.Store(int32(state))
	if !t.closed && t.notify != nil {
		t.notify <- state
	}
}

// Close stops callback delivery after draining already scheduled changes.
// It is idempotent and does not change the stored state.
func (t *StateTracker) Close() {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.closed {
		return
	}
	t.closed = true
	if t.notify != nil {
		close(t.notify)
	}
}

func (t *StateTracker) dispatch(onChange func(State)) {
	for state := range t.notify {
		func() {
			defer func() { recover() }()
			onChange(state)
		}()
	}
}
