package auth

import (
	"context"
	"errors"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
	"p2p-transfer/pkg/hash"
	"p2p-transfer/pkg/jwt"
	"time"
)

type AuthService struct {
	userRepo   ports.UserRepository
	walletRepo ports.WalletRepository
	auditRepo  ports.AuditRepository
	txManager  ports.TxManager
	jwtManager *jwt.JWTManager
}

func NewAuthService(
	userRepo ports.UserRepository,
	walletRepo ports.WalletRepository,
	auditRepo ports.AuditRepository,
	txManager ports.TxManager,
	jwtManager *jwt.JWTManager,
) ports.AuthService {
	return &AuthService{
		userRepo:   userRepo,
		walletRepo: walletRepo,
		auditRepo:  auditRepo,
		txManager:  txManager,
		jwtManager: jwtManager,
	}
}

func (s *AuthService) Register(ctx context.Context, firstName, lastName, email, phone, password string) (*domain.User, error) {
	var user *domain.User

	err := s.txManager.WithTransaction(ctx, func(txCtx context.Context) error {
		// 1. Check if email exists
		existingUser, err := s.userRepo.FindByEmail(txCtx, email)
		if err == nil && existingUser != nil {
			return domain.ErrDuplicateEmail
		}
		if err != nil && !errors.Is(err, domain.ErrUserNotFound) {
			return err
		}

		// 2. Check if phone exists
		existingUserPhone, err := s.userRepo.FindByPhone(txCtx, phone)
		if err == nil && existingUserPhone != nil {
			return domain.ErrDuplicatePhone
		}
		if err != nil && !errors.Is(err, domain.ErrUserNotFound) {
			return err
		}

		// 3. Hash password
		hashedPassword, err := hash.HashPassword(password)
		if err != nil {
			return err
		}

		// 4. Create User entity
		now := time.Now()
		user = &domain.User{
			FirstName:    firstName,
			LastName:     lastName,
			Email:        email,
			PhoneNumber:  phone,
			PasswordHash: hashedPassword,
			IsActive:     true,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		err = s.userRepo.Create(txCtx, user)
		if err != nil {
			return err
		}

		// 5. Create Wallet entity
		wallet := &domain.Wallet{
			UserID:    user.ID,
			Balance:   0.00,
			Currency:  "XAF",
			IsActive:  true,
			CreatedAt: now,
			UpdatedAt: now,
		}

		err = s.walletRepo.Create(txCtx, wallet)
		if err != nil {
			return err
		}

		// 6. Write Audit Log
		audit := &domain.AuditLog{
			ActorID:   &user.ID,
			Action:    "USER_REGISTERED",
			IPAddress: "127.0.0.1", // In handlers we will extract actual IP
			UserAgent: "Internal",
			Metadata: map[string]interface{}{
				"email":        email,
				"phone_number": phone,
			},
			CreatedAt: now,
		}
		_ = s.auditRepo.Create(txCtx, audit) // Non-blocking audit create

		return nil
	})

	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*domain.User, string, string, error) {
	// 1. Fetch user by email
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, "", "", domain.ErrInvalidCredentials
		}
		return nil, "", "", err
	}

	// 2. Verify password
	if !hash.CheckPasswordHash(password, user.PasswordHash) {
		return nil, "", "", domain.ErrInvalidCredentials
	}

	// 3. Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return nil, "", "", err
	}

	// 4. Log login audit
	audit := &domain.AuditLog{
		ActorID:   &user.ID,
		Action:    "USER_LOGIN_SUCCESSFUL",
		IPAddress: "127.0.0.1",
		UserAgent: "Internal",
		CreatedAt: time.Now(),
	}
	_ = s.auditRepo.Create(ctx, audit)

	return user, accessToken, refreshToken, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	// 1. Verify token
	claims, err := s.jwtManager.VerifyRefreshToken(refreshToken)
	if err != nil {
		return "", "", domain.ErrTokenExpired
	}

	// 2. Fetch user to confirm active state
	user, err := s.userRepo.FindByID(ctx, claims.UserID)
	if err != nil {
		return "", "", domain.ErrUserNotFound
	}

	// 3. Generate new tokens
	newAccessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return "", "", err
	}

	newRefreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return "", "", err
	}

	return newAccessToken, newRefreshToken, nil
}

func (s *AuthService) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
	return s.userRepo.FindByID(ctx, userID)
}
