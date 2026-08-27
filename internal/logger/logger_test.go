package logger

import (
	"bytes"
	"errors"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func newTestBundle(t *testing.T, options Options) (*Bundle, *bytes.Buffer, string) {
	t.Helper()
	var stderr bytes.Buffer
	dir := t.TempDir()
	b, err := newLogger(&stderr, dir, options)
	if err != nil {
		t.Fatalf("newLogger: %v", err)
	}
	t.Cleanup(func() { b.Close() })
	return b, &stderr, dir
}

func TestHandlerOpts(t *testing.T) {
	tests := []struct {
		name  string
		level slog.Leveler
	}{
		{"debug level", slog.LevelDebug},
		{"info level", slog.LevelInfo},
		{"error level", slog.LevelError},
		{"level var", new(slog.LevelVar)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			options := handlerOpts(test.level)
			if options == nil {
				t.Fatal("handlerOpts() = nil, want non-nil")
			}
			if options.Level != test.level {
				t.Errorf("Level = %v, want %v", options.Level, test.level)
			}
			if !options.AddSource {
				t.Error("AddSource = false, want true")
			}
			src := &slog.Source{Function: "f", File: "/x/y/z.go", Line: 1}
			result := options.ReplaceAttr(nil, slog.Any(slog.SourceKey, src))
			if got, ok := result.Value.Any().(*slog.Source); !ok || got.File != "z.go" {
				t.Error("ReplaceAttr is not shortSource or not shortening file paths")
			}
		})
	}
}

func TestShortSource(t *testing.T) {
	tests := []struct {
		name string
		attr slog.Attr
		want slog.Attr
	}{
		{"string attr passes through", slog.String("message", "hello"), slog.String("message", "hello")},
		{"int attr passes through", slog.Int("count", 3), slog.Int("count", 3)},
		{"source file shortened to base name",
			slog.Any(slog.SourceKey, &slog.Source{Function: "pkg.F", File: "/a/b/logger.go", Line: 99}),
			slog.Any(slog.SourceKey, &slog.Source{Function: "pkg.F", File: "logger.go", Line: 99})},
		{"source key with string value passes through",
			slog.String(slog.SourceKey, "not a *slog.Source"), slog.String(slog.SourceKey, "not a *slog.Source")},
		{"source key with nil passes through", slog.Any(slog.SourceKey, nil), slog.Any(slog.SourceKey, nil)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := shortSource(nil, test.attr)
			if !attrEqual(got, test.want) {
				t.Errorf("shortSource() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestShortSourceAllocatesNewSource(t *testing.T) {
	src := &slog.Source{Function: "pkg.Func", File: "/a/b/c/logger.go", Line: 12}
	got := shortSource(nil, slog.Any(slog.SourceKey, src))

	gotSrc, ok := got.Value.Any().(*slog.Source)
	if !ok {
		t.Fatalf("result value is %T, want *slog.Source", got.Value.Any())
	}
	if gotSrc == src {
		t.Error("shortSource returned the input pointer, want a fresh copy")
	}
}

func TestNewCreatesLogFile(t *testing.T) {
	b, _, dir := newTestBundle(t, Options{})
	b.Logger.Info("hello")

	logPath := filepath.Join(dir, logFileName)
	data, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	if !bytes.Contains(data, []byte("hello")) {
		t.Errorf("log file does not contain the message: %s", string(data))
	}
}

func TestDefaultFileLevel(t *testing.T) {
	b, _, _ := newTestBundle(t, Options{})
	if b.LevelVar.Level() != slog.LevelInfo {
		t.Errorf("LevelVar = %v, want %v", b.LevelVar.Level(), slog.LevelInfo)
	}
}

func TestCustomFileLevel(t *testing.T) {
	b, _, dir := newTestBundle(t, Options{FileLevel: slog.LevelError})
	b.Logger.Info("info msg")
	b.Logger.Error("error msg")

	logPath := filepath.Join(dir, logFileName)
	data, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}

	if bytes.Contains(data, []byte("info msg")) {
		t.Error("info msg leaked into file with FileLevel=Error")
	}
	if !bytes.Contains(data, []byte("error msg")) {
		t.Error("error msg missing from file with FileLevel=Error")
	}
}

func TestClose(t *testing.T) {
	b, _, _ := newTestBundle(t, Options{})
	if err := b.Close(); err != nil {
		t.Errorf("Close() = %v, want nil", err)
	}
	if err := b.Close(); err != nil {
		t.Errorf("second Close() = %v, want nil", err)
	}
}

func TestMkdirAllFailure(t *testing.T) {
	dir := t.TempDir()
	blocker := filepath.Join(dir, "blocker")
	if err := os.WriteFile(blocker, []byte("x"), 0o644); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	_, err := newLogger(&bytes.Buffer{}, filepath.Join(blocker, "sub"), Options{})
	if err == nil {
		t.Fatal("newLogger: want error, got nil")
	}
}

func TestFileSinkErrorSurfaced(t *testing.T) {
	wantErr := errors.New("disk full")
	ew := &errorWriter{
		w:    &failWriter{err: wantErr},
		path: "test.log",
		errw: io.Discard,
	}

	_, err := ew.Write([]byte("data"))
	if !errors.Is(err, wantErr) {
		t.Fatalf("Write() error = %v, want %v", err, wantErr)
	}
}

func TestFileSinkErrorSurfacedToStderr(t *testing.T) {
	wantErr := errors.New("disk full")
	var stderr bytes.Buffer
	ew := &errorWriter{
		w:    &failWriter{err: wantErr},
		path: "test.log",
		errw: &stderr,
	}

	ew.Write([]byte("data"))
	out := stderr.String()
	if !strings.Contains(out, "logger: file sink error") {
		t.Error("stderr missing sink-error message")
	}
	if !strings.Contains(out, "test.log") {
		t.Error("stderr missing file path")
	}
	if !strings.Contains(out, "disk full") {
		t.Error("stderr missing error text")
	}
}

func TestFileSinkSecondErrorSilent(t *testing.T) {
	wantErr := errors.New("boom")
	var stderr bytes.Buffer
	underlying := &failWriter{err: wantErr}
	ew := &errorWriter{
		w:    underlying,
		path: "test.log",
		errw: &stderr,
	}

	ew.Write([]byte("a"))
	ew.Write([]byte("b"))

	if underlying.writes != 2 {
		t.Errorf("underlying Write calls = %d, want 2", underlying.writes)
	}
	if got := strings.Count(stderr.String(), "logger: file sink error"); got > 1 {
		t.Errorf("stderr has %d sink-error lines, want at most 1", got)
	}
}

type failWriter struct {
	err    error
	n      int
	writes int
}

func (w *failWriter) Write(p []byte) (int, error) {
	w.writes++
	return w.n, w.err
}

func attrEqual(a, b slog.Attr) bool {
	if a.Key != b.Key {
		return false
	}
	if a.Key == slog.SourceKey {
		as, aok := a.Value.Any().(*slog.Source)
		bs, bok := b.Value.Any().(*slog.Source)
		if aok && bok {
			return *as == *bs
		}
	}
	return a.Equal(b)
}
