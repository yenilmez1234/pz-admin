package session

import (
	"context"
	"fmt"
	"net"
	"strconv"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/rcon"
)

func openChannel(
	ctx context.Context,
	p profile.Profile,
	password string,
	onDisconnect func(),
) (connection.Channel, error) {
	switch p.ConnectionType {
	case connection.TypeRCON:
		return rcon.Connect(ctx, rcon.Config{
			Addr:         channelAddr(p),
			Password:     password,
			OnDisconnect: onDisconnect,
		})
	default:
		return nil, fmt.Errorf("unsupported connection type %q", p.ConnectionType)
	}
}

// channelAddr formats the profile's host and port for dialing. IPv6
// literal hosts are bracketed by net.JoinHostPort.
func channelAddr(p profile.Profile) string {
	return net.JoinHostPort(p.Host, strconv.Itoa(p.Port))
}
