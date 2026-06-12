package domain

import (
	"time"
)

type Wallet struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Balance   float64   `json:"balance"`
	Currency  string    `json:"currency"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (w *Wallet) HasSufficientBalance(amount float64) bool {
	return w.Balance >= amount
}

func (w *Wallet) Debit(amount float64) error {
	if amount <= 0 {
		return ErrInvalidAmount
	}
	if !w.HasSufficientBalance(amount) {
		return ErrInsufficientBalance
	}
	w.Balance -= amount
	return nil
}

func (w *Wallet) Credit(amount float64) error {
	if amount <= 0 {
		return ErrInvalidAmount
	}
	w.Balance += amount
	return nil
}
