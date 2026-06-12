package domain

import "errors"

var (
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrInsufficientBalance = errors.New("insufficient wallet balance")
	ErrSelfTransfer        = errors.New("self-transfer is not allowed")
	ErrDuplicateEmail      = errors.New("email address is already registered")
	ErrDuplicatePhone      = errors.New("phone number is already registered")
	ErrTokenExpired        = errors.New("authentication token has expired")
	ErrWalletNotFound      = errors.New("wallet not found")
	ErrInvalidAmount       = errors.New("amount must be positive and above the minimum limit")
	ErrInternalServer      = errors.New("an internal server error occurred")
)
