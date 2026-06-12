package main

import (
	"context"
	"net/http"
	"os"
	"p2p-transfer/config"
	"p2p-transfer/internal/adapters/http/handlers"
	p2phttp "p2p-transfer/internal/adapters/http"
	"p2p-transfer/internal/adapters/postgres"
	"p2p-transfer/internal/application/auth"
	"p2p-transfer/internal/application/transfer"
	"p2p-transfer/internal/application/wallet"
	"p2p-transfer/pkg/jwt"
	"p2p-transfer/pkg/logger"

	"github.com/rs/zerolog/log"
)

func main() {
	// 1. Load config
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// 2. Init structured logger
	logger.InitLogger(cfg.Env)
	log.Info().Msg("Logger initialized successfully")

	// 3. Connect to Database
	db, err := postgres.NewDB(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Database connection failed")
	}
	defer db.Close()
	log.Info().Msg("Connected to PostgreSQL database")

	// 4. Run Schema Migrations
	runMigrations(db)

	// 5. Instantiate Adapters & Utilities
	userRepo := postgres.NewUserRepo(db)
	walletRepo := postgres.NewWalletRepo(db)
	transactionRepo := postgres.NewTransactionRepo(db)
	auditRepo := postgres.NewAuditRepo(db)

	jwtManager := jwt.NewJWTManager(cfg.JWTSecret, cfg.JWTRefreshSecret)

	// 6. Instantiate Core Services (Use Cases)
	authService := auth.NewAuthService(userRepo, walletRepo, auditRepo, db, jwtManager)
	walletService := wallet.NewWalletService(userRepo, walletRepo, transactionRepo, auditRepo, db)
	transferService := transfer.NewTransferService(userRepo, walletRepo, transactionRepo, auditRepo, db, cfg.MinTransferAmount)

	// 7. Instantiate HTTP Handlers
	authHandler := handlers.NewAuthHandler(authService)
	walletHandler := handlers.NewWalletHandler(walletService)
	transferHandler := handlers.NewTransferHandler(transferService)

	// DB Health check helper
	dbHealthCheck := func(ctx context.Context) error {
		// Ping database connection pool
		conn := db.GetConn(ctx)
		_, err := conn.ExecContext(ctx, "SELECT 1")
		return err
	}

	// 8. Setup HTTP Router
	router := p2phttp.NewRouter(
		authHandler,
		walletHandler,
		transferHandler,
		jwtManager,
		dbHealthCheck,
	)

	// 9. Start Server
	serverAddr := ":" + cfg.Port
	log.Info().Msgf("Starting P2P Money Transfer API server on %s", serverAddr)
	if err := http.ListenAndServe(serverAddr, router); err != nil {
		log.Fatal().Err(err).Msg("Server failed to start")
	}
}

func runMigrations(db *postgres.DB) {
	log.Info().Msg("Running database migrations...")

	// Attempt to find schema file in migrations folder
	migrationPaths := []string{
		"migrations/001_init_schema.up.sql",
		"../migrations/001_init_schema.up.sql",
		"../../migrations/001_init_schema.up.sql",
		"backend/migrations/001_init_schema.up.sql",
	}

	var schemaBytes []byte
	var err error
	for _, path := range migrationPaths {
		schemaBytes, err = os.ReadFile(path)
		if err == nil {
			log.Info().Msgf("Loaded migration schema from: %s", path)
			break
		}
	}

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to read database migration schema file")
	}

	// Execute migrations
	conn := db.GetConn(context.Background())
	_, err = conn.ExecContext(context.Background(), string(schemaBytes))
	if err != nil {
		log.Fatal().Err(err).Msg("Database migration execution failed")
	}

	log.Info().Msg("Database migrations completed successfully!")
}
