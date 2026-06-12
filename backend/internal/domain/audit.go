package domain

import (
	"time"
)

type AuditLog struct {
	ID        string                 `json:"id"`
	ActorID   *string                `json:"actor_id,omitempty"` // Nullable for guest users
	Action    string                 `json:"action"`
	IPAddress string                 `json:"ip_address"`
	UserAgent string                 `json:"user_agent"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt time.Time              `json:"created_at"`
}
