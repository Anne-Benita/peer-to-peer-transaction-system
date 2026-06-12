package postgres

import (
	"context"
	"encoding/json"
	"p2p-transfer/internal/domain"
	"p2p-transfer/internal/ports"
)

type AuditRepo struct {
	db *DB
}

func NewAuditRepo(db *DB) ports.AuditRepository {
	return &AuditRepo{db: db}
}

func (r *AuditRepo) Create(ctx context.Context, log *domain.AuditLog) error {
	query := `
		INSERT INTO audit_logs (actor_id, action, ip_address, user_agent, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	var metadataJSON []byte
	var err error
	if log.Metadata != nil {
		metadataJSON, err = json.Marshal(log.Metadata)
		if err != nil {
			return err
		}
	}

	conn := r.db.GetConn(ctx)
	err = conn.QueryRowContext(ctx, query,
		log.ActorID,
		log.Action,
		log.IPAddress,
		log.UserAgent,
		metadataJSON,
		log.CreatedAt,
	).Scan(&log.ID)

	return err
}
