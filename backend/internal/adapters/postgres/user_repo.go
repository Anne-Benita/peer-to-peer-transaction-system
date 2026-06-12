package postgres

import (
	"context"
	"database/sql"
	"errors"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
)

type UserRepo struct {
	db *DB
}

func NewUserRepo(db *DB) ports.UserRepository {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (first_name, last_name, email, phone_number, password_hash, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`

	conn := r.db.GetConn(ctx)
	err := conn.QueryRowContext(ctx, query,
		user.FirstName,
		user.LastName,
		user.Email,
		user.PhoneNumber,
		user.PasswordHash,
		user.IsActive,
		user.CreatedAt,
		user.UpdatedAt,
	).Scan(&user.ID)

	if err != nil {
		// PostgreSQL unique constraint error handling (email or phone)
		// Usually error code "23505" represents unique_violation
		return err
	}

	return nil
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	query := `
		SELECT id, first_name, last_name, email, phone_number, password_hash, is_active, created_at, updated_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, id)

	var u domain.User
	err := row.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.PhoneNumber, &u.PasswordHash, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return &u, nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, first_name, last_name, email, phone_number, password_hash, is_active, created_at, updated_at
		FROM users
		WHERE email = $1 AND deleted_at IS NULL`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, email)

	var u domain.User
	err := row.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.PhoneNumber, &u.PasswordHash, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return &u, nil
}

func (r *UserRepo) FindByPhone(ctx context.Context, phone string) (*domain.User, error) {
	query := `
		SELECT id, first_name, last_name, email, phone_number, password_hash, is_active, created_at, updated_at
		FROM users
		WHERE phone_number = $1 AND deleted_at IS NULL`

	conn := r.db.GetConn(ctx)
	row := conn.QueryRowContext(ctx, query, phone)

	var u domain.User
	err := row.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.PhoneNumber, &u.PasswordHash, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return &u, nil
}
