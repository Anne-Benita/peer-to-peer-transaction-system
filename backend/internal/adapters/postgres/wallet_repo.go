package postgres

import (
	"context"
	"database/sql"
	"errors"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
)

type WalletRepo struct {
	db *DB
}

func NewWalletRepo(db *DB) ports.WalletRepository {
	return &WalletRepo{db: db}
}

func (r *WalletRepo) Create(ctx context.Context, wallet *domain.Wallet) error {
	query := `
		INSERT INTO wallets (user_id, balance, currency, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	conn := r.db.GetConn(ctx)
	err := conn.QueryRowContext(ctx, query,
		wallet.UserID,
		wallet.Balance,
		wallet.Currency,
		wallet.IsActive,
		wallet.CreatedAt,
		wallet.UpdatedAt,
	).Scan(&wallet.ID)

	return err
}

func (r *WalletRepo) FindByID(ctx context.Context, id string) (*domain.Wallet, error) {
	query := `
		SELECT id, user_id, balance, currency, is_active, created_at, updated_at
		FROM wallets
		WHERE id = $1`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, id)

	var w domain.Wallet
	err := row.Scan(&w.ID, &w.UserID, &w.Balance, &w.Currency, &w.IsActive, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrWalletNotFound
		}
		return nil, err
	}

	return &w, nil
}

func (r *WalletRepo) FindByUserID(ctx context.Context, userID string) (*domain.Wallet, error) {
	query := `
		SELECT id, user_id, balance, currency, is_active, created_at, updated_at
		FROM wallets
		WHERE user_id = $1`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, userID)

	var w domain.Wallet
	err := row.Scan(&w.ID, &w.UserID, &w.Balance, &w.Currency, &w.IsActive, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrWalletNotFound
		}
		return nil, err
	}

	return &w, nil
}

func (r *WalletRepo) Update(ctx context.Context, wallet *domain.Wallet) error {
	query := `
		UPDATE wallets
		SET balance = $1, is_active = $2, updated_at = NOW()
		WHERE id = $3`

	conn := r.db.GetConn(ctx)
	_, err := conn.ExecContext(ctx, query, wallet.Balance, wallet.IsActive, wallet.ID)
	return err
}

func (r *WalletRepo) FindByIDWithLock(ctx context.Context, id string) (*domain.Wallet, error) {
	query := `
		SELECT id, user_id, balance, currency, is_active, created_at, updated_at
		FROM wallets
		WHERE id = $1
		FOR UPDATE`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, id)

	var w domain.Wallet
	err := row.Scan(&w.ID, &w.UserID, &w.Balance, &w.Currency, &w.IsActive, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrWalletNotFound
		}
		return nil, err
	}

	return &w, nil
}

func (r *WalletRepo) FindByUserIDWithLock(ctx context.Context, userID string) (*domain.Wallet, error) {
	query := `
		SELECT id, user_id, balance, currency, is_active, created_at, updated_at
		FROM wallets
		WHERE user_id = $1
		FOR UPDATE`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, userID)

	var w domain.Wallet
	err := row.Scan(&w.ID, &w.UserID, &w.Balance, &w.Currency, &w.IsActive, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrWalletNotFound
		}
		return nil, err
	}

	return &w, nil
}
