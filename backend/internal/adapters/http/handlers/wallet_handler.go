package handlers

import (
	"errors"
	"net/http"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
	"p2p-transfer/pkg/response"

	"github.com/gin-gonic/gin"
)

type WalletHandler struct {
	walletService ports.WalletService
}

func NewWalletHandler(walletService ports.WalletService) *WalletHandler {
	return &WalletHandler{walletService: walletService}
}

func (h *WalletHandler) GetMyWallet(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "User context not found")
		return
	}

	wallet, err := h.walletService.GetBalance(c.Request.Context(), userID.(string))
	if err != nil {
		response.Error(c, http.StatusNotFound, "WALLET_NOT_FOUND", "Wallet not found")
		return
	}

	response.Success(c, http.StatusOK, "Wallet retrieved successfully", wallet)
}

type CashTransactionRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

func (h *WalletHandler) CashIn(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "User context not found")
		return
	}

	var req CashTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	tx, err := h.walletService.CashIn(c.Request.Context(), userID.(string), req.Amount)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidAmount) {
			response.Error(c, http.StatusUnprocessableEntity, "INVALID_AMOUNT", err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Cash In failed")
		return
	}

	response.Success(c, http.StatusCreated, "Cash In successful", tx)
}

func (h *WalletHandler) CashOut(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "User context not found")
		return
	}

	var req CashTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	tx, err := h.walletService.CashOut(c.Request.Context(), userID.(string), req.Amount)
	if err != nil {
		if errors.Is(err, domain.ErrInsufficientBalance) {
			response.Error(c, http.StatusUnprocessableEntity, "INSUFFICIENT_BALANCE", err.Error())
			return
		}
		if errors.Is(err, domain.ErrInvalidAmount) {
			response.Error(c, http.StatusUnprocessableEntity, "INVALID_AMOUNT", err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Cash Out failed")
		return
	}

	response.Success(c, http.StatusCreated, "Cash Out successful", tx)
}
