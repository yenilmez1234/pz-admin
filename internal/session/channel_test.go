package session

import (
	"testing"

	"github.com/beyenilmez/pz-admin/internal/profile"
)

func TestChannelAddr(t *testing.T) {
	tests := []struct {
		name, host string
		port       int
		want       string
	}{
		{name: "hostname", host: "example.com", port: 27015, want: "example.com:27015"},
		{name: "ipv4", host: "192.168.1.10", port: 27015, want: "192.168.1.10:27015"},
		{name: "ipv6 loopback", host: "::1", port: 27015, want: "[::1]:27015"},
		{name: "ipv6", host: "2001:db8::7", port: 16261, want: "[2001:db8::7]:16261"},
	}
	for _, test := range tests {
		got := channelAddr(profile.Profile{Host: test.host, Port: test.port})
		if got != test.want {
			t.Errorf("%s: channelAddr() = %q, want %q", test.name, got, test.want)
		}
	}
}
