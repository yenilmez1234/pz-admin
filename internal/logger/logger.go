// Package logger provides a two-sink application logger: human-readable
// text to stderr at Debug level for development, and a rotating file log
// at the configured level (default Info) under the XDG state directory
// for bug reports.
package logger

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync/atomic"

	"github.com/beyenilmez/pz-admin/internal/appdata"
	"gopkg.in/natefinch/lumberjack.v2"
)

const (
	logFileName = "latest.log"
	maxSizeMB   = 10 // rotate at 10 MB
	maxBackups  = 3  // keep 3 rotated files
	maxAgeDays  = 30 // delete rotated files older than 30 days
)

// Options configures the application logger.
type Options struct {
	// FileLevel is the minimum level written to the rotating file log.
	// Stderr is fixed at Debug regardless of this value.
	// Defaults to Info when nil.
	FileLevel slog.Leveler
}

// Bundle holds the application logger together with its runtime
// level control. Pass Bundle.Logger to application.Options.Logger.
type Bundle struct {
	Logger   *slog.Logger
	LevelVar *slog.LevelVar

	closer io.Closer
}

// New creates the application logger.
//
// Two sinks are configured:
//   - stderr: all levels, short text lines (for development)
//   - rotating file under the XDG state directory (for bug reports)
//
// The returned LevelVar changes the file log level at runtime.
func New(options Options) (*Bundle, error) {
	return newLogger(os.Stderr, appdata.StateDir(), options)
}

// newLogger creates the logger with explicit sinks. stderr receives
// all output (fixed at Debug); the rotating file lives under stateDir.
func newLogger(stderr io.Writer, stateDir string, options Options) (*Bundle, error) {
	if options.FileLevel == nil {
		options.FileLevel = slog.LevelInfo
	}

	if err := os.MkdirAll(stateDir, 0o700); err != nil {
		return nil, fmt.Errorf("logger: create state dir: %w", err)
	}

	levelVar := new(slog.LevelVar)
	levelVar.Set(options.FileLevel.Level())

	logPath := filepath.Join(stateDir, logFileName)
	lj := &lumberjack.Logger{
		Filename:   logPath,
		MaxSize:    maxSizeMB,
		MaxBackups: maxBackups,
		MaxAge:     maxAgeDays,
		Compress:   true,
	}

	ew := &errorWriter{w: lj, path: logPath, errw: stderr}

	logger := slog.New(slog.NewMultiHandler(
		slog.NewTextHandler(stderr, handlerOpts(slog.LevelDebug)),
		slog.NewTextHandler(ew, handlerOpts(levelVar)),
	))

	return &Bundle{
		Logger:   logger,
		LevelVar: levelVar,
		closer:   lj,
	}, nil
}

// Close flushes and closes the rotating file log.
// It is safe to call even if the file was never opened.
func (b *Bundle) Close() error {
	if b.closer != nil {
		return b.closer.Close()
	}
	return nil
}

// handlerOpts returns HandlerOptions with source location and
// filename-only path shortening.
func handlerOpts(level slog.Leveler) *slog.HandlerOptions {
	return &slog.HandlerOptions{
		Level:       level,
		AddSource:   true,
		ReplaceAttr: shortSource,
	}
}

// shortSource keeps only the source file's base name in log output.
// It allocates a new Source so handlers never share mutable state.
func shortSource(_ []string, a slog.Attr) slog.Attr {
	if a.Key != slog.SourceKey {
		return a
	}
	if src, ok := a.Value.Any().(*slog.Source); ok && src != nil {
		return slog.Any(slog.SourceKey, &slog.Source{
			Function: src.Function,
			File:     filepath.Base(src.File),
			Line:     src.Line,
		})
	}
	return a
}

// errorWriter surfaces the first write error from the underlying
// writer to errw so file-sink failures are never completely silent.
type errorWriter struct {
	w     io.Writer
	path  string
	errw  io.Writer
	first atomic.Bool
}

func (ew *errorWriter) Write(p []byte) (int, error) {
	n, err := ew.w.Write(p)
	if err != nil && ew.first.CompareAndSwap(false, true) {
		fmt.Fprintf(ew.errw, "logger: file sink error (%s): %v\n", ew.path, err)
	}
	return n, err
}
