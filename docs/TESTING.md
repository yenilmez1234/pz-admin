# Testing

The default backend suite contains deterministic unit and local integration
tests and runs with:

```sh
go test ./...
```

## Conventions

- Test observable behavior rather than implementation details.
- Prefer table-driven tests for parsers, validation, and build-specific rules.
- Mirror production files with test files. Keep tests in production declaration
  order, followed by helpers and test doubles. A helper-only test file is
  acceptable when it supports several tests and has no production counterpart.
- Name top-level tests after the unit, such as `TestService_Update`, and express
  all cohesive conditions as descriptive `t.Run` subtests instead of adding
  behavior suffixes to top-level names.
- Use `t.Context()`, `t.TempDir()`, `t.Setenv()`, and `t.Cleanup()` for test-owned resources.
- Use `errors.Is` for wrapped errors and exact strings only when text is a contract.
- Keep setup helpers small, call `t.Helper`, and register cleanup inside the helper.
- Use `stub` for fixed behavior, `recording` for captured calls or state, and
  `fake` only for a functional substitute. Keep test doubles at the narrow
  dependency boundary they replace.
- Reuse `testutil.RecordingChannel` and its command assertion for command-based
  service tests instead of defining package-local equivalents.
- Do not parallelize tests that modify process globals, environment, logging, keyrings, or persistent state.

Tests under `internal/third_party` retain the conventions of their upstream
projects.

## Real-server integration tests

Tests against installed Project Zomboid Build 41 and Build 42 servers are
planned separately. They will be opt-in integration tests because they require
licensed game files, containers, credentials, ports, and external processes.
The default suite must remain runnable without either game server.
