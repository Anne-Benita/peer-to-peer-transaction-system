package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"p2p-transfer/config"
	"p2p-transfer/internal/ports"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type txKey struct{}

type DB struct {
	pool *sql.DB
}

func NewDB(cfg *config.Config) (*DB, error) {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBSSLMode,
	)

	pool, err := sql.Open("pgx", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Ping database to verify connection
	if err := pool.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{pool: pool}, nil
}

func (db *DB) Close() error {
	return db.pool.Close()
}

// GetConn returns the active transaction from context if it exists, otherwise the main connection pool
func (db *DB) GetConn(ctx context.Context) Queryer {
	if tx, ok := ctx.Value(txKey{}).(*sql.Tx); ok {
		return tx
	}
	return db.pool
}

// Queryer is an interface representing common database operations for sql.DB and sql.Tx
type Queryer interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
}

// Ensure DB implements ports.TxManager
var _ ports.TxManager = (*DB)(nil)

func (db *DB) WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	tx, err := db.pool.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelReadCommitted,
	})
	if err != nil {
		return fmt.Errorf("failed to begin database transaction: %w", err)
	}

	// Inject transaction into a new context
	txCtx := context.WithValue(ctx, txKey{}, tx)

	err = fn(txCtx)
	if err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("error rollback transaction (original error: %v): %w", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
