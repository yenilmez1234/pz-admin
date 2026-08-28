# Logging

The application uses Go's `log/slog` package. Log records are written to
stderr and to the rotating application log. Source locations are rendered as
`package/file.go` and provide package context automatically.

## Levels

- `Debug` records routine diagnostic details such as command names, durations,
  and batch counts.
- `Info` records meaningful application and session lifecycle transitions.
- `Warn` records recoverable failures, degraded behavior, and errors consumed
  by background work.
- `Error` is reserved for unrecoverable failures that cannot be returned to a
  caller.

An error that is returned should normally be logged only where it is consumed.
Lower layers should wrap it with useful context instead of logging it again.

## Messages and attributes

Messages are concise, lowercase descriptions without package prefixes or final
punctuation. Prefer stable structured attributes such as `profile_id`, `build`,
`command`, `count`, `duration`, `reason`, and `err`.

Never log passwords, tokens, webhook addresses, raw command arguments, raw
command responses, server messages, or complete option values. Command
diagnostics may include only the command name.

Unexpected frontend errors are forwarded to the same rotating log through the
logger service. The frontend reports global errors, unhandled rejections, and
React root errors. Expected failures already handled by the interface are not
reported. Both sides bound diagnostic fields and redact common secret patterns.

Frontend catalog scripts use `console.*` for command-line output. That output
is separate from application logging and does not follow these runtime rules.
