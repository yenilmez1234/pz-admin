package session

import (
	"context"
	"fmt"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/connection"
)

var buildByBanIPResponse = map[string]string{
	"Unknown command banip":      "41",
	"Ban IP. Use /banip IP":      "42",
}

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
	if build, ok := buildByBanIPResponse[strings.TrimSpace(response)]; ok {
		return build, nil
	}
	return "", fmt.Errorf("detect game version: unrecognized banip response")
}
