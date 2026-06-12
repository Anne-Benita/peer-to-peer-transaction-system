package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
)

type TransactionRepo struct {
	db *DB
}

func NewTransactionRepo(db *DB) ports.TransactionRepository {
	return &TransactionRepo{db: db}
}

func (r *TransactionRepo) Create(ctx context.Context, tx *domain.Transaction) error {
	query := `
		INSERT INTO transactions (reference, sender_wallet_id, receiver_wallet_id, amount, type, status, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`

	conn := r.db.GetConn(ctx)
	err := conn.QueryRowContext(ctx, query,
		tx.Reference,
		tx.SenderWalletID,
		tx.ReceiverWalletID,
		tx.Amount,
		string(tx.Type),
		string(tx.Status),
		tx.Description,
		tx.CreatedAt,
	).Scan(&tx.ID)

	return err
}

func (r *TransactionRepo) FindByID(ctx context.Context, id string) (*domain.Transaction, error) {
	query := `
		SELECT id, reference, sender_wallet_id, receiver_wallet_id, amount, type, status, description, created_at
		FROM transactions
		WHERE id = $1`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, id)

	var tx domain.Transaction
	var sType, sStatus string
	err := row.Scan(&tx.ID, &tx.Reference, &tx.SenderWalletID, &tx.ReceiverWalletID, &tx.Amount, &sType, &sStatus, &tx.Description, &tx.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("transaction not found")
		}
		return nil, err
	}

	tx.Type = domain.TransactionType(sType)
	tx.Status = domain.TransactionStatus(sStatus)
	return &tx, nil
}

func (r *TransactionRepo) FindAllByWalletID(ctx context.Context, walletID string, limit, offset int, txType, txStatus string) ([]*domain.Transaction, int, error) {
	baseQuery := `
		FROM transactions
		WHERE (sender_wallet_id = $1 OR receiver_wallet_id = $1)`

	args := []interface{}{walletID}
	argCount := 1

	if txType != "" {
		argCount++
		baseQuery += fmt.Sprintf(" AND type = $%d", argCount)
		args = append(args, txType)
	}

	if txStatus != "" {
		argCount++
		baseQuery += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, txStatus)
	}

	// Count Query
	countQuery := "SELECT COUNT(*)" + baseQuery
	var total int
	conn := r.db.GetConn(ctx)
	err := conn.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Fetch Query with Pagination and ordering
	fetchQuery := "SELECT id, reference, sender_wallet_id, receiver_wallet_id, amount, type, status, description, created_at" +
		baseQuery +
		fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argCount+1, argCount+2)

	args = append(args, limit, offset)

	rows, err := conn.QueryContext(ctx, fetchQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	transactions := []*domain.Transaction{}
	for rows.Next() {
		var tx domain.Transaction
		var sType, sStatus string
		err := rows.Scan(&tx.ID, &tx.Reference, &tx.SenderWalletID, &tx.ReceiverWalletID, &tx.Amount, &sType, &sStatus, &tx.Description, &tx.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		tx.Type = domain.TransactionType(sType)
		tx.Status = domain.TransactionStatus(sStatus)
		transactions = append(transactions, &tx)
	}

	return transactions, total, nil
}
