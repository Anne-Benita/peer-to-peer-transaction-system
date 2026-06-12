package ref

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

// GenerateReference returns a transaction reference like: TXN-20260612-A1B2C3D4
func GenerateReference() string {
	bytes := make([]byte, 4)
	_, _ = rand.Read(bytes)
	hexStr := strings.ToUpper(hex.EncodeToString(bytes))
	date := time.Now().UTC().Format("20060102")
	return fmt.Sprintf("TXN-%s-%s", date, hexStr)
}
