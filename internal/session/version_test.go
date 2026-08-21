package session

import (
	"context"
	"errors"
	"testing"
)

type versionTestChannel struct {
	response string
	err      error
}

func (*versionTestChannel) Close() {}

func (c *versionTestChannel) ExecuteCommand(context.Context, string) (string, error) {
	return c.response, c.err
}

func TestDetectGameVersion(t *testing.T) {
	for _, test := range []struct {
		name     string
		response string
		want     string
	}{
		{name: "build 41", response: "Unknown command banip", want: "41"},
		{name: "build 42", response: "Ban IP. Use /banip IP", want: "42"},
		{name: "surrounding whitespace", response: "\r\nBan IP. Use /banip IP\r\n", want: "42"},
	} {
		t.Run(test.name, func(t *testing.T) {
			got, err := detectGameVersion(context.Background(), &versionTestChannel{response: test.response})
			if err != nil {
				t.Fatal(err)
			}
			if got != test.want {
				t.Errorf("detectGameVersion() = %q, want %q", got, test.want)
			}
		})
	}
}

func TestDetectGameVersionRejectsUnknownResponse(t *testing.T) {
	_, err := detectGameVersion(context.Background(), &versionTestChannel{response: "unexpected"})
	if err == nil {
		t.Fatal("detectGameVersion() succeeded for an unknown response")
	}
}

func TestDetectGameVersionReturnsCommandError(t *testing.T) {
	want := errors.New("command failed")
	_, err := detectGameVersion(context.Background(), &versionTestChannel{err: want})
	if !errors.Is(err, want) {
		t.Fatalf("detectGameVersion() error = %v, want wrapped %v", err, want)
	}
}
