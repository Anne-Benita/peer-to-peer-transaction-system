package wallet

import (
	"context"
	"errors"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
	"p2p-transfer/pkg/ref"
	"time"
)

type WalletService struct {
	userRepo        ports.UserRepository
	walletRepo      ports.WalletRepository
	transactionRepo ports.TransactionRepository
	auditRepo       ports.AuditRepository
	txManager       ports.TxManager
}

func NewWalletService(
	userRepo ports.UserRepository,
	walletRepo ports.WalletRepository,
	transactionRepo ports.TransactionRepository,
	auditRepo ports.AuditRepository,
	txManager ports.TxManager,
) ports.WalletService {
	return &WalletService{
		userRepo:        userRepo,
		walletRepo:      walletRepo,
		transactionRepo: transactionRepo,
		auditRepo:       auditRepo,
		txManager:       txManager,
	}
}

func (s *WalletService) GetBalance(ctx context.Context, userID string) (*domain.Wallet, error) {
	return s.walletRepo.FindByUserID(ctx, userID)
}

func (s *WalletService) GetWalletByID(ctx context.Context, walletID, userID string) (*domain.Wallet, error) {
	wallet, err := s.walletRepo.FindByID(ctx, walletID)
	if err != nil {
		return nil, err
	}

	// IDOR Protection: verify wallet owner matches requesting user
	if wallet.UserID != userID {
		return nil, errors.New("unauthorized wallet access")
	}

	return wallet, nil
}

func (s *WalletService) CashIn(ctx context.Context, userID string, amount float64) (*domain.Transaction, error) {
	if amount <= 0 {
		return nil, domain.ErrInvalidAmount
	}

	var tx *domain.Transaction

	err := s.txManager.WithTransaction(ctx, func(txCtx context.Context) error {
		// 1. Fetch user to verify active state
		user, err := s.userRepo.FindByID(txCtx, userID)
		if err != nil {
			return err
		}

		// 2. Fetch wallet with LOCK to prevent concurrency race conditions
		wallet, err := s.walletRepo.FindByUserIDWithLock(txCtx, userID)
		if err != nil {
			return err
		}

		// 3. Perform Deposit Credit
		err = wallet.Credit(amount)
		if err != nil {
			return err
		}

		// 4. Update Wallet Balance
		err = s.walletRepo.Update(txCtx, wallet)
		if err != nil {
			return err
		}

		// 5. Create Transaction entry
		now := time.Now()
		reference := ref.GenerateReference()
		tx = &domain.Transaction{
			Reference:        reference,
			SenderWalletID:   nil, // External MTN MoMo account deposit
			ReceiverWalletID: &wallet.ID,
			Amount:           amount,
			Type:             domain.TransactionTypeCashIn,
			Status:           domain.TransactionStatusCompleted,
			Description:      "Cash In from MTN MoMo number " + user.PhoneNumber,
			CreatedAt:        now,
		}

		err = s.transactionRepo.Create(txCtx, tx)
		if err != nil {
			return err
		}

		// 6. Write Audit Log
		audit := &domain.AuditLog{
			ActorID:   &user.ID,
			Action:    "WALLET_CASH_IN",
			IPAddress: "127.0.0.1",
			UserAgent: "MTN MoMo Gateway",
			Metadata: map[string]interface{}{
				"wallet_id":      wallet.ID,
				"amount":         amount,
				"transaction_id": tx.ID,
				"reference":      reference,
				"phone_number":   user.PhoneNumber,
			},
			CreatedAt: now,
		}
		_ = s.auditRepo.Create(txCtx, audit)

		return nil
	})

	if err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *WalletService) CashOut(ctx context.Context, userID string, amount float64) (*domain.Transaction, error) {
	if amount <= 0 {
		return nil, domain.ErrInvalidAmount
	}

	var tx *domain.Transaction

	err := s.txManager.WithTransaction(ctx, func(txCtx context.Context) error {
		// 1. Fetch user
		user, err := s.userRepo.FindByID(txCtx, userID)
		if err != nil {
			return err
		}

		// 2. Fetch wallet with LOCK to prevent double debit
		wallet, err := s.walletRepo.FindByUserIDWithLock(txCtx, userID)
		if err != nil {
			return err
		}

		// 3. Perform Withdraw Debit
		err = wallet.Debit(amount)
		if err != nil {
			return err
		}

		// 4. Update Wallet Balance
		err = s.walletRepo.Update(txCtx, wallet)
		if err != nil {
			return err
		}

		// 5. Create Transaction entry
		now := time.Now()
		reference := ref.GenerateReference()
		tx = &domain.Transaction{
			Reference:        reference,
			SenderWalletID:   &wallet.ID,
			ReceiverWalletID: nil, // Extracted to MTN MoMo account
			Amount:           amount,
			Type:             domain.TransactionTypeCashOut,
			Status:           domain.TransactionStatusCompleted,
			Description:      "Cash Out to MTN MoMo number " + user.PhoneNumber,
			CreatedAt:        now,
		}

		err = s.transactionRepo.Create(txCtx, tx)
		if err != nil {
			return err
		}

		// 6. Write Audit Log
		audit := &domain.AuditLog{
			ActorID:   &user.ID,
			Action:    "WALLET_CASH_OUT",
			IPAddress: "127.0.0.1",
			UserAgent: "MTN MoMo Gateway",
			Metadata: map[string]interface{}{
				"wallet_id":      wallet.ID,
				"amount":         amount,
				"transaction_id": tx.ID,
				"reference":      reference,
				"phone_number":   user.PhoneNumber,
			},
			CreatedAt: now,
		}
		_ = s.auditRepo.Create(txCtx, audit)

		return nil
	})

	if err != nil {
		return nil, err
	}

	return tx, nil
}
