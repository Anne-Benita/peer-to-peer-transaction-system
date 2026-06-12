package middleware

import (
	"errors"
	"net/http"
	"p2p-transfer/pkg/jwt"
	"p2p-transfer/pkg/response"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtManager *jwt.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "Authorization header is missing")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "Authorization header format must be Bearer {token}")
			c.Abort()
			return
		}

		tokenStr := parts[1]
		claims, err := jwtManager.VerifyAccessToken(tokenStr)
		if err != nil {
			if errors.Is(err, jwt.ErrExpiredToken) {
				response.Error(c, http.StatusUnauthorized, "TOKEN_EXPIRED", "Access token has expired")
			} else {
				response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid access token")
			}
			c.Abort()
			return
		}

		// Inject claims into context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)

		c.Next()
	}
}
