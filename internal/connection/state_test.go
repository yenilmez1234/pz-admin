package connection

import (
	"reflect"
	"testing"
	"time"
)

func TestStateTracker(t *testing.T) {
	events := make(chan State, 2)
	tracker := NewStateTracker(StateDisconnected, func(state State) {
		events <- state
	})

	tracker.Set(StateConnected)
	tracker.Set(StateConnected)
	tracker.Set(StateDisconnected)
	tracker.Close()

	got := []State{<-events, <-events}
	want := []State{StateConnected, StateDisconnected}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("state changes = %v, want %v", got, want)
	}
	if got := tracker.State(); got != StateDisconnected {
		t.Errorf("State() = %v, want %v", got, StateDisconnected)
	}
}

func TestStateTrackerRecoversFromCallbackPanic(t *testing.T) {
	called := make(chan State, 1)
	tracker := NewStateTracker(StateDisconnected, func(state State) {
		if state == StateConnected {
			panic("callback failure")
		}
		called <- state
	})
	defer tracker.Close()

	tracker.Set(StateConnected)
	tracker.Set(StateDisconnected)

	select {
	case got := <-called:
		if got != StateDisconnected {
			t.Errorf("callback state = %v, want %v", got, StateDisconnected)
		}
	case <-time.After(time.Second):
		t.Fatal("callback dispatcher stopped after panic")
	}
}
