package handlers

import (
	"errors"
	"net/http"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
	"p2p-transfer/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService ports.AuthService
}

func NewAuthHandler(authService ports.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type RegisterRequest struct {
	FirstName   string `json:"first_name" binding:"required,min=2,max=100"`
	LastName    string `json:"last_name" binding:"required,min=2,max=100"`
	Email       string `json:"email" binding:"required,email"`
	PhoneNumber string `json:"phone_number" binding:"required,min=8,max=20"`
	Password    string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	user, err := h.authService.Register(c.Request.Context(), req.FirstName, req.LastName, req.Email, req.PhoneNumber, req.Password)
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateEmail) {
			response.Error(c, http.StatusConflict, "DUPLICATE_EMAIL", err.Error())
			return
		}
		if errors.Is(err, domain.ErrDuplicatePhone) {
			response.Error(c, http.StatusConflict, "DUPLICATE_PHONE", err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Registration failed")
		return
	}

	response.Success(c, http.StatusCreated, "Registration successful", user)
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	user, accessToken, refreshToken, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			response.Error(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Login failed")
		return
	}

	response.Success(c, http.StatusOK, "Login successful", gin.H{
		"user":          user,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	accessToken, refreshToken, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, "INVALID_TOKEN", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Token refreshed successfully", gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "User context not found")
		return
	}

	user, err := h.authService.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		response.Error(c, http.StatusNotFound, "USER_NOT_FOUND", "Profile not found")
		return
	}

	response.Success(c, http.StatusOK, "Profile retrieved successfully", user)
}
