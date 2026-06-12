package ports

import (
	"context"
	"p2p-transfer/internal/domain"
)

type TxManager interface {
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByID(ctx context.Context, id string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByPhone(ctx context.Context, phone string) (*domain.User, error)
}

type WalletRepository interface {
	Create(ctx context.Context, wallet *domain.Wallet) error
	FindByID(ctx context.Context, id string) (*domain.Wallet, error)
	FindByUserID(ctx context.Context, userID string) (*domain.Wallet, error)
	Update(ctx context.Context, wallet *domain.Wallet) error
	FindByIDWithLock(ctx context.Context, id string) (*domain.Wallet, error)
	FindByUserIDWithLock(ctx context.Context, userID string) (*domain.Wallet, error)
}

type TransactionRepository interface {
	Create(ctx context.Context, tx *domain.Transaction) error
	FindByID(ctx context.Context, id string) (*domain.Transaction, error)
	FindAllByWalletID(ctx context.Context, walletID string, limit, offset int, txType, txStatus string) ([]*domain.Transaction, int, error)
}

type AuditRepository interface {
	Create(ctx context.Context, log *domain.AuditLog) error
}
