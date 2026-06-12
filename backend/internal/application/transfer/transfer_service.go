package transfer

import (
	"context"
	"errors"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
	"p2p-transfer/pkg/ref"
	"strings"
	"time"
)

type TransferService struct {
	userRepo        ports.UserRepository
	walletRepo      ports.WalletRepository
	transactionRepo ports.TransactionRepository
	auditRepo       ports.AuditRepository
	txManager       ports.TxManager
	minAmount       float64
}

func NewTransferService(
	userRepo ports.UserRepository,
	walletRepo ports.WalletRepository,
	transactionRepo ports.TransactionRepository,
	auditRepo ports.AuditRepository,
	txManager ports.TxManager,
	minAmount float64,
) ports.TransferService {
	return &TransferService{
		userRepo:        userRepo,
		walletRepo:      walletRepo,
		transactionRepo: transactionRepo,
		auditRepo:       auditRepo,
		txManager:       txManager,
		minAmount:       minAmount,
	}
}

func (s *TransferService) Transfer(ctx context.Context, senderUserID string, recipientEmailOrPhone string, amount float64, description string) (*domain.Transaction, error) {
	if amount < s.minAmount {
		return nil, domain.ErrInvalidAmount
	}

	var tx *domain.Transaction

	err := s.txManager.WithTransaction(ctx, func(txCtx context.Context) error {
		// 1. Fetch Sender User
		senderUser, err := s.userRepo.FindByID(txCtx, senderUserID)
		if err != nil {
			return err
		}

		// 2. Resolve Recipient User (by email or phone number)
		var recipientUser *domain.User
		recipientEmailOrPhone = strings.TrimSpace(recipientEmailOrPhone)

		if strings.Contains(recipientEmailOrPhone, "@") {
			recipientUser, err = s.userRepo.FindByEmail(txCtx, recipientEmailOrPhone)
		} else {
			recipientUser, err = s.userRepo.FindByPhone(txCtx, recipientEmailOrPhone)
		}

		if err != nil {
			if errors.Is(err, domain.ErrUserNotFound) {
				return domain.ErrUserNotFound
			}
			return err
		}

		// 3. Prevent Self-Transfer
		if senderUser.ID == recipientUser.ID {
			return domain.ErrSelfTransfer
		}

		// 4. Fetch Sender Wallet with Lock
		senderWallet, err := s.walletRepo.FindByUserIDWithLock(txCtx, senderUser.ID)
		if err != nil {
			return err
		}

		// 5. Fetch Recipient Wallet with Lock
		recipientWallet, err := s.walletRepo.FindByUserIDWithLock(txCtx, recipientUser.ID)
		if err != nil {
			return err
		}

		// 6. Perform Debit & Credit operations
		err = senderWallet.Debit(amount)
		if err != nil {
			return err
		}

		err = recipientWallet.Credit(amount)
		if err != nil {
			return err
		}

		// 7. Persist Wallet Updates
		err = s.walletRepo.Update(txCtx, senderWallet)
		if err != nil {
			return err
		}

		err = s.walletRepo.Update(txCtx, recipientWallet)
		if err != nil {
			return err
		}

		// 8. Generate reference and Transaction Record
		now := time.Now()
		reference := ref.GenerateReference()
		if description == "" {
			description = "Transfer to " + recipientUser.FullName()
		}

		tx = &domain.Transaction{
			Reference:        reference,
			SenderWalletID:   &senderWallet.ID,
			ReceiverWalletID: &recipientWallet.ID,
			Amount:           amount,
			Type:             domain.TransactionTypeTransfer,
			Status:           domain.TransactionStatusCompleted,
			Description:      description,
			CreatedAt:        now,
		}

		err = s.transactionRepo.Create(txCtx, tx)
		if err != nil {
			return err
		}

		// 9. Write Audit Log
		audit := &domain.AuditLog{
			ActorID:   &senderUser.ID,
			Action:    "TRANSFER_SENT",
			IPAddress: "127.0.0.1",
			UserAgent: "Internal",
			Metadata: map[string]interface{}{
				"sender_wallet_id":    senderWallet.ID,
				"recipient_wallet_id": recipientWallet.ID,
				"amount":              amount,
				"transaction_id":      tx.ID,
				"reference":           reference,
				"recipient_name":      recipientUser.FullName(),
				"recipient_phone":     recipientUser.PhoneNumber,
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

func (s *TransferService) GetTransactionHistory(ctx context.Context, userID string, limit, offset int, txType, txStatus string) ([]*domain.Transaction, int, error) {
	// 1. Fetch user's wallet
	wallet, err := s.walletRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, 0, err
	}

	// 2. Fetch history
	return s.transactionRepo.FindAllByWalletID(ctx, wallet.ID, limit, offset, txType, txStatus)
}

func (s *TransferService) GetTransactionByID(ctx context.Context, txID, userID string) (*domain.Transaction, error) {
	// 1. Fetch transaction
	tx, err := s.transactionRepo.FindByID(ctx, txID)
	if err != nil {
		return nil, err
	}

	// 2. Fetch user's wallet
	wallet, err := s.walletRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 3. Verify user wallet participates in this transaction (IDOR check)
	isSender := tx.SenderWalletID != nil && *tx.SenderWalletID == wallet.ID
	isReceiver := tx.ReceiverWalletID != nil && *tx.ReceiverWalletID == wallet.ID

	if !isSender && !isReceiver {
		return nil, errors.New("unauthorized to view this transaction")
	}

	return tx, nil
}
