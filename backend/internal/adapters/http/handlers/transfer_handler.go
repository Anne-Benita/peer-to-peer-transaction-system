package handlers

import (
	"errors"
	"net/http"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
	"p2p-transfer/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

type TransferHandler struct {
	transferService ports.TransferService
}

func NewTransferHandler(transferService ports.TransferService) *TransferHandler {
	return &TransferHandler{transferService: transferService}
}

type TransferRequest struct {
	Recipient   string  `json:"recipient" binding:"required"` // email or phone number
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description"`
}

func (h *TransferHandler) InitiateTransfer(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "User context not found")
		return
	}

	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
		return
	}

	tx, err := h.transferService.Transfer(c.Request.Context(), userID.(string), req.Recipient, req.Amount, req.Description)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "RECIPIENT_NOT_FOUND", "Recipient user not found")
			return
		}
		if errors.Is(err, domain.ErrSelfTransfer) {
			response.Error(c, http.StatusBadRequest, "SELF_TRANSFER", err.Error())
			return
		}
		if errors.Is(err, domain.ErrInsufficientBalance) {
			response.Error(c, http.StatusUnprocessableEntity, "INSUFFICIENT_BALANCE", err.Error())
			return
		}
		if errors.Is(err, domain.ErrInvalidAmount) {
			response.Error(c, http.StatusUnprocessableEntity, "INVALID_AMOUNT", err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Transfer failed")
		return
	}

	response.Success(c, http.StatusCreated, "Transfer completed successfully", tx)
}

func (h *TransferHandler) GetHistory(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "User context not found")
		return
	}

	// Parsing pagination params
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Filters
	txType := c.Query("type")     // TRANSFER, CASH_IN, CASH_OUT
	txStatus := c.Query("status") // PENDING, COMPLETED, FAILED

	txs, total, err := h.transferService.GetTransactionHistory(c.Request.Context(), userID.(string), limit, offset, txType, txStatus)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve transaction history")
		return
	}

	response.SuccessPaginated(c, http.StatusOK, "Transactions retrieved successfully", txs, page, limit, total)
}

func (h *TransferHandler) GetTransactionDetails(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "User context not found")
		return
	}

	txID := c.Param("txId")
	tx, err := h.transferService.GetTransactionByID(c.Request.Context(), txID, userID.(string))
	if err != nil {
		response.Error(c, http.StatusNotFound, "TRANSACTION_NOT_FOUND", err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Transaction details retrieved", tx)
}
