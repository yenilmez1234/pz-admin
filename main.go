package main

import (
	"embed"
	"fmt"
	"log/slog"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/beyenilmez/pz-admin/internal/config"
	"github.com/beyenilmez/pz-admin/internal/console"
	"github.com/beyenilmez/pz-admin/internal/logger"
	"github.com/beyenilmez/pz-admin/internal/player"
	"github.com/beyenilmez/pz-admin/internal/profile"
	"github.com/beyenilmez/pz-admin/internal/session"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed VERSION
var rawVersion string

// buildVersion returns the application version from the VERSION file
// at the repo root. The file contains a single line like "2.0.0".
func buildVersion() string {
	v := strings.TrimSpace(rawVersion)
	if v == "" {
		return "dev"
	}
	return v
}

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	// Register a custom event whose associated data type is string.
	// This is not required, but the binding generator will pick up registered events
	// and provide a strongly typed JS/TS API for them.
	application.RegisterEvent[string]("time")
}

// main function serves as the application's entry point. It initializes the application, creates a window,
// and starts a goroutine that emits a time-based event every second. It subsequently runs the application and
// logs any error that might occur.
func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "pz-admin exited with error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	lg, err := logger.New(logger.Options{})
	if err != nil {
		return fmt.Errorf("initialize logger: %w", err)
	}
	defer lg.Close()
	slog.SetDefault(lg.Logger)

	if lvl := os.Getenv("PZ_ADMIN_LOG"); lvl != "" {
		var level slog.Level
		if err := level.UnmarshalText([]byte(lvl)); err != nil {
			lg.Logger.Warn("PZ_ADMIN_LOG has invalid level, ignoring", "env", lvl, "err", err)
		} else {
			lg.LevelVar.Set(level)
			lg.Logger.Info("log level overridden", "level", lvl)
		}
	}

	lg.Logger.Info("pz-admin starting",
		"version", buildVersion(),
		"os", runtime.GOOS,
		"arch", runtime.GOARCH,
	)

	// Create a new Wails application by providing the necessary options.
	// Variables 'Name' and 'Description' are for application metadata.
	// 'Assets' configures the asset server with the 'FS' variable pointing to the frontend files.
	// 'Bind' is a list of Go struct instances. The frontend has access to the methods of these instances.
	// 'Mac' options tailor the application when running an macOS.
	playerSvc := player.NewService()
	profileSvc := profile.NewService(playerSvc)
	consoleSvc := console.NewService(playerSvc.ObserveConsoleCommand)
	sessionSvc := session.NewService(profileSvc, playerSvc, consoleSvc)

	app := application.New(application.Options{
		Name:        "pz-admin",
		Description: "A demo of using raw HTML & CSS",
		Logger:      lg.Logger,
		Services: []application.Service{
			application.NewService(config.NewService()),
			application.NewService(consoleSvc),
			application.NewService(playerSvc),
			application.NewService(profileSvc),
			application.NewService(sessionSvc),
		},
		Assets: application.AssetOptions{
			Handler:        application.AssetFileServerFS(assets),
			DisableLogging: true,
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Create a new window with the necessary options.
	// 'Title' is the title of the window.
	// 'Mac' options tailor the window when running on macOS.
	// 'BackgroundColour' is the background colour of the window.
	// 'URL' is the URL that will be loaded into the webview.
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "Window 1",
		// Window sized to the golden ratio (1000 / 618 ≈ 1.618).
		Width:  1000,
		Height: 618,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(6, 7, 15),
		URL:              "/",
	})

	// Create a goroutine that emits an event containing the current time every second.
	// The frontend can listen to this event and update the UI accordingly.
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// Run the application. This blocks until the application has been exited.
	if err := app.Run(); err != nil {
		return fmt.Errorf("app run: %w", err)
	}
	lg.Logger.Info("pz-admin stopped")
	return nil
}
