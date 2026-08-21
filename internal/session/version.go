package session

import (
	"context"
	"fmt"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/connection"
)

const (
	build41BanIPResponse = "Unknown command banip"
	build42BanIPResponse = "Ban IP. Use /banip IP"
)

// detectGameVersion uses an argument-less command that is harmless on both
// supported builds: B41 does not recognize banip, while B42 prints its usage.
func detectGameVersion(ctx context.Context, channel connection.Channel) (string, error) {
	executor, ok := channel.(connection.CommandExecutor)
	if !ok {
		return "", fmt.Errorf("detect game version: channel cannot execute commands")
	}

	response, err := executor.ExecuteCommand(ctx, "banip")
	if err != nil {
		return "", fmt.Errorf("detect game version: %w", err)
	}
	switch strings.TrimSpace(response) {
	case build41BanIPResponse:
		return "41", nil
	case build42BanIPResponse:
		return "42", nil
	default:
		return "", fmt.Errorf("detect game version: unrecognized banip response")
	}
}
