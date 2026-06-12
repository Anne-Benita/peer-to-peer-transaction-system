package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// InitLogger configures the global zerolog settings
func InitLogger(env string) {
	// Set log level based on environment
	if env == "production" {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	// In development, make logs pretty and readable
	if env != "production" {
		log.Logger = log.Output(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		})
	} else {
		// In production, log structured JSON for aggregation (e.g. Datadog, ELK)
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	}
}
