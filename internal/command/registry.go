package command

import (
	"context"
	"fmt"

	"github.com/beyenilmez/pz-admin/internal/connection"
	"github.com/beyenilmez/pz-admin/internal/feature"
)

// Registry is a version-aware collection of command definitions.
// The zero value is ready to use.
type Registry struct {
	defs []Definition
}

// Default is the global command registry. All commands registered via
// Register are added to Default. Callers that need isolation (e.g.
// tests) can create their own Registry.
var Default = &Registry{}

// Register adds d to the global Default registry.
func Register(d Definition) {
	Default.Register(d)
}

// Lookup returns the first definition from the global registry whose
// name and version range match.
func Lookup(name, version string) (Definition, bool) {
	return Default.Lookup(name, version)
}

// Features returns the application features provided by commands available
// for version.
func Features(version string) feature.Set {
	return Default.Features(version)
}

// Execute runs the named command through the global registry: lookup,
// build, send via exec, parse. It accepts the server's game version
// so the registry can pick version-appropriate definitions.
func Execute(ctx context.Context, exec connection.CommandExecutor, name, version string, args map[string]string) (any, error) {
	return Default.Execute(ctx, exec, name, version, args)
}

// Register adds a command definition.
func (r *Registry) Register(d Definition) {
	if d.MinVersion == "" || d.MaxVersion == "" {
		panic(fmt.Sprintf("command: %q requires minimum and maximum versions", d.Name))
	}
	if d.MinVersion > d.MaxVersion {
		panic(fmt.Sprintf("command: %q has an invalid version range %s-%s", d.Name, d.MinVersion, d.MaxVersion))
	}
	r.defs = append(r.defs, d)
}

// Lookup returns the first definition whose name and version
// range match. The boolean is false when no definition matches.
func (r *Registry) Lookup(name, version string) (Definition, bool) {
	for _, d := range r.defs {
		if d.Name == name && d.matchesVersion(version) {
			return d, true
		}
	}
	return Definition{}, false
}

// Features returns the unique application features provided by definitions
// available for version.
func (r *Registry) Features(version string) feature.Set {
	features := feature.NewSet()
	for _, d := range r.defs {
		if d.Feature != "" && d.matchesVersion(version) {
			features.Add(d.Feature)
		}
	}
	return features
}

// Execute looks up the command, builds the RCON string from args,
// sends it via exec, and parses the response. When the definition has
// no Parse function the raw response is returned with a nil error.
func (r *Registry) Execute(ctx context.Context, exec connection.CommandExecutor, name, version string, args map[string]string) (any, error) {
	if exec == nil {
		return nil, fmt.Errorf("command: Execute: executor is nil")
	}
	d, ok := r.Lookup(name, version)
	if !ok {
		return nil, fmt.Errorf("%w: %q for version %q", ErrUnknownCommand, name, version)
	}
	cmd, err := Build(d, args)
	if err != nil {
		return nil, err
	}
	raw, err := exec.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}
	if d.Parse != nil {
		return d.Parse(raw, args)
	}
	return raw, nil
}
