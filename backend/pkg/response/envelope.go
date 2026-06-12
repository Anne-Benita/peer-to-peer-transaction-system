package response

import (
	"github.com/gin-gonic/gin"
)

type Envelope struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   *AppError   `json:"error,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
}

type AppError struct {
	Code    string      `json:"code"`
	Details interface{} `json:"details,omitempty"`
}

// Success returns a standard 200/201 success response
func Success(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, Envelope{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// SuccessPaginated returns a success response with pagination metadata
func SuccessPaginated(c *gin.Context, status int, message string, data interface{}, page, limit, total int) {
	c.JSON(status, Envelope{
		Success: true,
		Message: message,
		Data:    data,
		Meta: map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// Error returns a standardized error response envelope
func Error(c *gin.Context, status int, errCode string, details interface{}) {
	var message string
	if msgStr, ok := details.(string); ok {
		message = msgStr
	} else if errVal, ok := details.(error); ok {
		message = errVal.Error()
	} else {
		message = "An error occurred"
	}

	c.JSON(status, Envelope{
		Success: false,
		Message: message,
		Error: &AppError{
			Code:    errCode,
			Details: details,
		},
	})
}
