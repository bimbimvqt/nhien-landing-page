package config

import (
	"errors"
	"os"
)

type Config struct {
	Addr          string
	DatabaseURL   string
	MigrationsDir string
	AdminAPIKey   string
	CORSOrigin    string
}

func Load() (Config, error) {
	cfg := Config{
		Addr:          env("API_ADDR", ":8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		MigrationsDir: env("MIGRATIONS_DIR", "migrations"),
		AdminAPIKey:   os.Getenv("ADMIN_API_KEY"),
		CORSOrigin:    env("CORS_ORIGIN", "*"),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}

	return cfg, nil
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
