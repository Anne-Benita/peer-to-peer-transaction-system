package ports

import (
	"context"
	"p2p-transfer/internal/domain"
)

type AuthService interface {
	Register(ctx context.Context, firstName, lastName, email, phone, password string) (*domain.User, error)
	Login(ctx context.Context, email, password string) (*domain.User, string, string, error)
	RefreshToken(ctx context.Context, refreshToken string) (string, string, error)
	GetProfile(ctx context.Context, userID string) (*domain.User, error)
}

type WalletService interface {
	GetBalance(ctx context.Context, userID string) (*domain.Wallet, error)
	GetWalletByID(ctx context.Context, walletID, userID string) (*domain.Wallet, error)
	CashIn(ctx context.Context, userID string, amount float64) (*domain.Transaction, error)
	CashOut(ctx context.Context, userID string, amount float64) (*domain.Transaction, error)
}

type TransferService interface {
	Transfer(ctx context.Context, senderUserID string, recipientEmailOrPhone string, amount float64, description string) (*domain.Transaction, error)
	GetTransactionHistory(ctx context.Context, userID string, limit, offset int, txType, txStatus string) ([]*domain.Transaction, int, error)
	GetTransactionByID(ctx context.Context, txID, userID string) (*domain.Transaction, error)
}
