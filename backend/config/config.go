package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

type Config struct {
	Port               string
	Env                string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	JWTSecret          string
	JWTRefreshSecret   string
	MinTransferAmount  float64
	Currency           string
}

func LoadConfig() (*Config, error) {
	// Try to load .env file, ignore error if it doesn't exist (e.g. in docker/prod)
	_ = godotenv.Load("../.env") // In main.go we'll run from cmd/api, so ../.env or .env
	_ = godotenv.Load(".env")

	port := getEnv("PORT", "8080")
	env := getEnv("ENV", "development")

	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "p2p_admin")
	dbPassword := getEnv("DB_PASSWORD", "p2p_secure_pass")
	dbName := getEnv("DB_NAME", "p2p_wallet")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	jwtSecret := getEnv("JWT_SECRET", "super_secret_jwt_access_token_key_for_development_purposes_only_12345")
	jwtRefreshSecret := getEnv("JWT_REFRESH_SECRET", "super_secret_jwt_refresh_token_key_for_development_purposes_only_12345")

	minAmtStr := getEnv("MIN_TRANSFER_AMOUNT", "100.00")
	minAmt, err := strconv.ParseFloat(minAmtStr, 64)
	if err != nil {
		log.Warn().Msgf("Invalid MIN_TRANSFER_AMOUNT '%s', using default 100.00", minAmtStr)
		minAmt = 100.00
	}

	currency := getEnv("CURRENCY", "XAF")

	return &Config{
		Port:               port,
		Env:                env,
		DBHost:             dbHost,
		DBPort:             dbPort,
		DBUser:             dbUser,
		DBPassword:         dbPassword,
		DBName:             dbName,
		DBSSLMode:          dbSSLMode,
		JWTSecret:          jwtSecret,
		JWTRefreshSecret:   jwtRefreshSecret,
		MinTransferAmount:  minAmt,
		Currency:           currency,
	}, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
