package command

import "errors"

// ErrUnknownCommand is returned when Lookup or Execute cannot find a
// matching command for the given (name, version) pair.
var ErrUnknownCommand = errors.New("unknown command")

// ErrCommandFailed is returned by a command's Parse function when the
// server's response indicates the command did not succeed. Wrapped with
// the server's response text via %w so callers can use errors.Is.
var ErrCommandFailed = errors.New("command failed")
