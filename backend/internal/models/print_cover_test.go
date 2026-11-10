package models

import (
	"strings"
	"testing"
)

func TestPrintCoverNormalizeTrims(t *testing.T) {
	c := SectionPrintCover{Organization: "  РКИАУБ \n", Heading: "КРУГЛЫЙ СТОЛ"}
	has, err := c.Normalize()
	if err != nil || !has {
		t.Fatalf("has=%v err=%v", has, err)
	}
	if c.Organization != "РКИАУБ" {
		t.Errorf("organization = %q", c.Organization)
	}
}

func TestPrintCoverNormalizeEmpty(t *testing.T) {
	c := SectionPrintCover{Heading: "   ", Details: "\n"}
	has, err := c.Normalize()
	if err != nil || has {
		t.Errorf("blank cover: has=%v err=%v", has, err)
	}
}

func TestPrintCoverNormalizeTooLong(t *testing.T) {
	// Length is counted in characters, so 300 Cyrillic letters fit
	ok := SectionPrintCover{Organization: strings.Repeat("Ж", 300)}
	if _, err := ok.Normalize(); err != nil {
		t.Errorf("300 characters should fit: %v", err)
	}
	long := SectionPrintCover{Organization: strings.Repeat("Ж", 301)}
	if _, err := long.Normalize(); err == nil {
		t.Error("expected a length error")
	}
}
