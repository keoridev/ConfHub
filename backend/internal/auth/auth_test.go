package auth

import (
	"strings"
	"testing"
)

func TestGeneratePassword(t *testing.T) {
	pwd, err := GeneratePassword(10)
	if err != nil {
		t.Fatalf("GeneratePassword: %v", err)
	}
	if len(pwd) != 10 {
		t.Errorf("expected 10 chars, got %d", len(pwd))
	}

	// Should not contain confusing characters
	confusing := "0Oo1lI"
	for _, c := range pwd {
		if strings.ContainsRune(confusing, c) {
			t.Errorf("password contains confusing char '%c': %s", c, pwd)
		}
	}

	// Two passwords should differ
	pwd2, _ := GeneratePassword(10)
	if pwd == pwd2 {
		t.Error("two generated passwords are identical")
	}
}

func TestHashAndCheckPassword(t *testing.T) {
	plain := "testPassword123"
	hash, err := HashPassword(plain)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if !CheckPassword(plain, hash) {
		t.Error("CheckPassword should return true for correct password")
	}
	if CheckPassword("wrongPassword", hash) {
		t.Error("CheckPassword should return false for wrong password")
	}
}

func TestGenerateAndParseToken(t *testing.T) {
	secret := "test-secret-key-12345"

	token, err := GenerateToken(secret, 42, "student", false, 0)
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	claims, err := ParseToken(token, secret)
	if err != nil {
		t.Fatalf("ParseToken: %v", err)
	}
	if claims.UserID != 42 {
		t.Errorf("expected userId 42, got %d", claims.UserID)
	}
	if claims.Role != "student" {
		t.Errorf("expected role student, got %s", claims.Role)
	}
	if claims.MustChangePassword {
		t.Error("expected mustChangePassword false")
	}
	if claims.TokenVersion != 0 {
		t.Errorf("expected tokenVersion 0, got %d", claims.TokenVersion)
	}
}

func TestParseTokenWrongSecret(t *testing.T) {
	token, _ := GenerateToken("secret1", 1, "admin", false, 0)
	_, err := ParseToken(token, "secret2")
	if err == nil {
		t.Error("expected error parsing token with wrong secret")
	}
}

func TestTransliterate(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Иванов", "ivanov"},
		{"Касымова", "kasymova"},
		{"Жунусов", "zhunusov"},
		{"Щербаков", "shcherbakov"},
		{"", ""},
		{"ABC", "abc"},
	}
	for _, tt := range tests {
		got := Transliterate(tt.input)
		if got != tt.expected {
			t.Errorf("Transliterate(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestGenerateLogin(t *testing.T) {
	tests := []struct {
		fullName string
		expected string
	}{
		{"Иванов Алексей Петрович", "ivanov.a"},
		{"Касымова Динара", "kasymova.d"},
		{"Петров", "petrov"},
		{"", "user"},
	}
	for _, tt := range tests {
		got := GenerateLogin(tt.fullName)
		if got != tt.expected {
			t.Errorf("GenerateLogin(%q) = %q, want %q", tt.fullName, got, tt.expected)
		}
	}
}

func TestValidateNewPassword(t *testing.T) {
	if err := ValidateNewPassword("12345678", "admin", "oldpass"); err != nil {
		t.Errorf("valid password rejected: %v", err)
	}
	if err := ValidateNewPassword("short", "admin", "oldpass"); err == nil {
		t.Error("short password should be rejected")
	}
	if err := ValidateNewPassword("admin", "admin", "oldpass"); err == nil {
		t.Error("password == login should be rejected")
	}
	if err := ValidateNewPassword("oldpass", "admin", "oldpass"); err == nil {
		t.Error("password == old password should be rejected")
	}
}
