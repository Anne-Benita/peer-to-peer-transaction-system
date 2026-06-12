package domain

import (
	"errors"
	"testing"
)

func TestWallet_Debit(t *testing.T) {
	w := &Wallet{
		Balance: 500.00,
	}

	// 1. Success Debit
	err := w.Debit(200.00)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if w.Balance != 300.00 {
		t.Errorf("Expected balance 300.00, got %v", w.Balance)
	}

	// 2. Insufficient Balance
	err = w.Debit(400.00)
	if !errors.Is(err, ErrInsufficientBalance) {
		t.Errorf("Expected ErrInsufficientBalance, got %v", err)
	}

	// 3. Negative Debit
	err = w.Debit(-10.00)
	if !errors.Is(err, ErrInvalidAmount) {
		t.Errorf("Expected ErrInvalidAmount, got %v", err)
	}
}

func TestWallet_Credit(t *testing.T) {
	w := &Wallet{
		Balance: 100.00,
	}

	// 1. Success Credit
	err := w.Credit(150.00)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if w.Balance != 250.00 {
		t.Errorf("Expected balance 250.00, got %v", w.Balance)
	}

	// 2. Negative Credit
	err = w.Credit(-5.00)
	if !errors.Is(err, ErrInvalidAmount) {
		t.Errorf("Expected ErrInvalidAmount, got %v", err)
	}
}
