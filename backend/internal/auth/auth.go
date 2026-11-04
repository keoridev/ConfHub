package auth

import (
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Safe alphabet: no confusing chars (0, O, o, 1, l, I).
const safeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"

// GeneratePassword creates a cryptographically random password of given length.
func GeneratePassword(length int) (string, error) {
	if length <= 0 {
		length = 10
	}
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("crypto/rand: %w", err)
	}
	result := make([]byte, length)
	for i := range b {
		result[i] = safeAlphabet[int(b[i])%len(safeAlphabet)]
	}
	return string(result), nil
}

// HashPassword hashes a plaintext password with bcrypt.
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword compares a plaintext password with a bcrypt hash.
func CheckPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// ── JWT ──────────────────────────────────────

// Claims holds the JWT claims.
type Claims struct {
	UserID             int64  `json:"userId"`
	Role               string `json:"role"`
	MustChangePassword bool   `json:"mustChangePassword"`
	TokenVersion       int    `json:"tokenVersion"`
	jwt.RegisteredClaims
}

// GenerateToken creates a signed JWT token.
func GenerateToken(secret string, userID int64, role string, mustChange bool, tokenVersion int) (string, error) {
	claims := Claims{
		UserID:             userID,
		Role:               role,
		MustChangePassword: mustChange,
		TokenVersion:       tokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(12 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseToken validates and parses a JWT token.
func ParseToken(tokenStr, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// ── Login generation ─────────────────────────

// translitMap maps Cyrillic lowercase runes to Latin equivalents.
var translitMap = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "yo",
	'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
	'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
	'ф': "f", 'х': "kh", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "shch",
	'ъ': "", 'ы': "y", 'ь': "", 'э': "e", 'ю': "yu", 'я': "ya",
}

// Transliterate converts a Cyrillic string to Latin.
func Transliterate(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		if lat, ok := translitMap[r]; ok {
			b.WriteString(lat)
		} else if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// GenerateLogin creates a login from full name in format "surname.initial".
// fullName expected as "Фамилия Имя [Отчество]".
func GenerateLogin(fullName string) string {
	parts := strings.Fields(fullName)
	if len(parts) == 0 {
		return "user"
	}

	surname := Transliterate(parts[0])
	if surname == "" {
		surname = "user"
	}

	initial := ""
	if len(parts) > 1 {
		runes := []rune(parts[1])
		if len(runes) > 0 {
			initial = Transliterate(string(runes[0]))
		}
	}

	if initial == "" {
		return surname
	}
	return surname + "." + initial
}

// ValidateNewPassword checks password requirements.
func ValidateNewPassword(password, login, oldPassword string) error {
	if len(password) < 8 {
		return errors.New("пароль должен быть не менее 8 символов")
	}
	if password == login {
		return errors.New("пароль не должен совпадать с логином")
	}
	if password == oldPassword {
		return errors.New("новый пароль не должен совпадать со старым")
	}
	return nil
}
