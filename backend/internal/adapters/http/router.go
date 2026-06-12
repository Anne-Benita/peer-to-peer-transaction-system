package http

import (
	"context"
	"net/http"
	"p2p-transfer/internal/adapters/http/handlers"
	"p2p-transfer/internal/adapters/http/middleware"
	"p2p-transfer/pkg/jwt"
	"p2p-transfer/pkg/response"
	"time"

	"github.com/gin-gonic/gin"
)

type Router struct {
	engine          *gin.Engine
	authHandler     *handlers.AuthHandler
	walletHandler   *handlers.WalletHandler
	transferHandler *handlers.TransferHandler
	jwtManager      *jwt.JWTManager
	startTime       time.Time
	dbHealthCheck   func(ctx context.Context) error
}

func NewRouter(
	authHandler *handlers.AuthHandler,
	walletHandler *handlers.WalletHandler,
	transferHandler *handlers.TransferHandler,
	jwtManager *jwt.JWTManager,
	dbHealthCheck func(ctx context.Context) error,
) *Router {
	engine := gin.New()

	// Use custom recovery to catch panics and format standard error envelopes
	engine.Use(gin.Recovery())

	// Custom CORS middleware
	engine.Use(corsMiddleware())

	r := &Router{
		engine:          engine,
		authHandler:     authHandler,
		walletHandler:   walletHandler,
		transferHandler: transferHandler,
		jwtManager:      jwtManager,
		startTime:       time.Now(),
		dbHealthCheck:   dbHealthCheck,
	}

	r.setupRoutes()
	return r
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.engine.ServeHTTP(w, req)
}

func (r *Router) setupRoutes() {
	// Public Health check
	r.engine.GET("/health", r.handleHealth)

	api := r.engine.Group("/api/v1")
	{
		// Public Auth endpoints
		auth := api.Group("/auth")
		{
			auth.POST("/register", r.authHandler.Register)
			auth.POST("/login", r.authHandler.Login)
			auth.POST("/refresh", r.authHandler.RefreshToken)
		}

		// Protected endpoints
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(r.jwtManager))
		{
			protected.GET("/auth/me", r.authHandler.GetMe)

			protected.GET("/wallets/me", r.walletHandler.GetMyWallet)
			protected.POST("/wallets/cash-in", r.walletHandler.CashIn)
			protected.POST("/wallets/cash-out", r.walletHandler.CashOut)

			protected.POST("/transfers", r.transferHandler.InitiateTransfer)
			protected.GET("/transfers", r.transferHandler.GetHistory)
			protected.GET("/transfers/:txId", r.transferHandler.GetTransactionDetails)
		}
	}
}

func (r *Router) handleHealth(c *gin.Context) {
	dbStatus := "connected"
	if err := r.dbHealthCheck(c.Request.Context()); err != nil {
		dbStatus = "disconnected"
	}

	uptime := time.Since(r.startTime).Round(time.Second).String()

	c.JSON(http.StatusOK, gin.H{
		"status":   "healthy",
		"version":  "1.0.0",
		"database": dbStatus,
		"uptime":   uptime,
	})
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // For development; configure properly in production
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
