package domain

import (
	"time"
)

type User struct {
	ID           string     `json:"id"`
	FirstName    string     `json:"first_name"`
	LastName     string     `json:"last_name"`
	Email        string     `json:"email"`
	PhoneNumber  string     `json:"phone_number"`
	PasswordHash string     `json:"-"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty"`
}

func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}
