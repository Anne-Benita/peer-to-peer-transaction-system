package domain

import (
	"time"
)

type TransactionType string

const (
	TransactionTypeTransfer TransactionType = "TRANSFER"
	TransactionTypeCashIn   TransactionType = "CASH_IN"
	TransactionTypeCashOut  TransactionType = "CASH_OUT"
)

type TransactionStatus string

const (
	TransactionStatusPending   TransactionStatus = "PENDING"
	TransactionStatusCompleted TransactionStatus = "COMPLETED"
	TransactionStatusFailed    TransactionStatus = "FAILED"
	TransactionStatusReversed  TransactionStatus = "REVERSED"
)

type Transaction struct {
	ID               string            `json:"id"`
	Reference        string            `json:"reference"`
	SenderWalletID   *string           `json:"sender_wallet_id,omitempty"`
	ReceiverWalletID *string           `json:"receiver_wallet_id,omitempty"`
	Amount           float64           `json:"amount"`
	Type             TransactionType   `json:"type"`
	Status           TransactionStatus `json:"status"`
	Description      string            `json:"description"`
	CreatedAt        time.Time         `json:"created_at"`
}
