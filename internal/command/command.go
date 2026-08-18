// Package command provides a version-aware registry of Project Zomboid
// RCON commands. Each command is a Definition that describes how to build
// the RCON string from typed parameters and how to parse the response.
//
// Commands are registered once (typically in a register.go or init block)
// and looked up by name + game version at execution time. The package
// depends only on connection.CommandExecutor for the actual command round-trip,
// keeping it decoupled from the transport layer.
package command

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/beyenilmez/pz-admin/internal/feature"
)

// ParamType classifies a command parameter. It drives how the default
// builder formats the value into the RCON command string.
type ParamType string

const (
	TypeString ParamType = "string" // always quoted
	TypeInt    ParamType = "int"    // appended as-is after the prefix
	TypeChoice ParamType = "choice" // prefix+value, e.g. "-true"
	TypeFlag   ParamType = "flag"   // prefix only, no value
)

// Param describes one parameter of a command.
type Param struct {
	Name     string // "username", "reason", "count"
	Type     ParamType
	Prefix   string // for flags/choices, "" for positional
	Required bool
}

// Definition is a version-constrained game RCON command.
//
// MinVersion and MaxVersion are required and both inclusive.
//
// A definition with no Params is a no-argument command (like "save").
//
// Feature identifies application functionality provided by the command.
// Commands without a dedicated application feature leave it empty.
//
// Parse receives the raw server response and the args that were used to
// build the command. A nil Parse is equivalent to returning the raw
// string as-is — the caller gets the response text with a nil error.
type Definition struct {
	Name       string
	Params     []Param
	MinVersion string // inclusive
	MaxVersion string // inclusive
	Feature    feature.ID
	Parse      func(raw string, args map[string]string) (any, error)
}

// matchesVersion reports whether the given server version falls within
// d's version range.
func (d Definition) matchesVersion(version string) bool {
	if version < d.MinVersion {
		return false
	}
	if version > d.MaxVersion {
		return false
	}
	return true
}

// Build constructs the RCON command string from the definition and args.
// Required params must be present and non-empty. Optional params are
// included only when their value is provided. A definition with no params
// returns the bare command name.
func Build(d Definition, args map[string]string) (string, error) {
	if len(d.Params) == 0 {
		return d.Name, nil
	}

	var b strings.Builder
	b.WriteString(d.Name)

	for _, p := range d.Params {
		val, ok := args[p.Name]
		if p.Required && (!ok || val == "") {
			return "", fmt.Errorf("command: %s: missing required arg %q", d.Name, p.Name)
		}
		if !ok || val == "" {
			continue // optional, not provided
		}
		switch p.Type {
		case TypeFlag:
			v, err := strconv.ParseBool(val)
			if err != nil {
				return "", fmt.Errorf("command: %s: arg %q is not a valid boolean: %q", d.Name, p.Name, val)
			}
			if v {
				b.WriteByte(' ')
				b.WriteString(p.Prefix)
			}
		case TypeString:
			if strings.Contains(val, `"`) {
				return "", fmt.Errorf("command: %s: arg %q contains an invalid character: %q", d.Name, p.Name, `"`)
			}
			b.WriteByte(' ')
			if p.Prefix != "" {
				b.WriteString(p.Prefix)
			}
			b.WriteString(quote(val))
		case TypeInt:
			if _, err := strconv.Atoi(val); err != nil {
				return "", fmt.Errorf("command: %s: arg %q is not a valid integer: %q", d.Name, p.Name, val)
			}
			b.WriteByte(' ')
			if p.Prefix != "" {
				b.WriteString(p.Prefix)
			}
			b.WriteString(val)
		case TypeChoice:
			b.WriteByte(' ')
			if p.Prefix != "" {
				b.WriteString(p.Prefix)
			}
			b.WriteString(val)
		}
	}
	return b.String(), nil
}

func quote(s string) string {
	return `"` + s + `"`
}
