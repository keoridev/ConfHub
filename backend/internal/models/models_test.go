package models

import (
	"encoding/json"
	"testing"
)

func TestCalculateOverallVerdict(t *testing.T) {
	tests := []struct {
		name     string
		data     AIResultData
		expected string
	}{
		{
			name: "all good",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 85, Verdict: "fits"},
				AnnotationMatch: &AIScore{Score: 90, Verdict: "match"},
				Issues:          []AIIssue{},
			},
			expected: "ok",
		},
		{
			name: "low section score",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 30, Verdict: "not_fit"},
				AnnotationMatch: &AIScore{Score: 80, Verdict: "match"},
				Issues:          []AIIssue{},
			},
			expected: "problem",
		},
		{
			name: "high severity issue",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 85, Verdict: "fits"},
				AnnotationMatch: &AIScore{Score: 80, Verdict: "match"},
				Issues: []AIIssue{
					{Type: "missing_conclusion", Severity: "high", Description: "no conclusion"},
				},
			},
			expected: "problem",
		},
		{
			name: "medium score range",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 65, Verdict: "partial"},
				AnnotationMatch: &AIScore{Score: 80, Verdict: "match"},
				Issues:          []AIIssue{},
			},
			expected: "attention",
		},
		{
			name: "medium severity issue",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 85, Verdict: "fits"},
				AnnotationMatch: &AIScore{Score: 80, Verdict: "match"},
				Issues: []AIIssue{
					{Type: "other", Severity: "medium", Description: "minor issue"},
				},
			},
			expected: "attention",
		},
		{
			name: "annotation null, section ok",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 85, Verdict: "fits"},
				AnnotationMatch: nil,
				Issues:          []AIIssue{},
			},
			expected: "ok",
		},
		{
			name: "annotation null, section low",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 40, Verdict: "not_fit"},
				AnnotationMatch: nil,
				Issues:          []AIIssue{},
			},
			expected: "problem",
		},
		{
			name: "low annotation score",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 85, Verdict: "fits"},
				AnnotationMatch: &AIScore{Score: 25, Verdict: "mismatch"},
				Issues:          []AIIssue{},
			},
			expected: "problem",
		},
		{
			name: "both scores borderline (50)",
			data: AIResultData{
				SectionFit:      &AIScore{Score: 50, Verdict: "partial"},
				AnnotationMatch: &AIScore{Score: 50, Verdict: "partial"},
				Issues:          []AIIssue{},
			},
			expected: "attention",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateOverallVerdict(&tt.data)
			if got != tt.expected {
				t.Errorf("CalculateOverallVerdict() = %q, want %q", got, tt.expected)
			}
		})
	}
}

func TestCoAuthorUnmarshal(t *testing.T) {
	// 1. String format
	var ca1 CoAuthor
	if err := json.Unmarshal([]byte(`"Иванов А.А."`), &ca1); err != nil {
		t.Fatalf("unmarshal string failed: %v", err)
	}
	if ca1.Name != "Иванов А.А." {
		t.Errorf("got name %q, want 'Иванов А.А.'", ca1.Name)
	}

	// 2. Object format with group
	var ca2 CoAuthor
	if err := json.Unmarshal([]byte(`{"name":"Петров Б.Б.","university":"КГТУ","group":"ИС-21"}`), &ca2); err != nil {
		t.Fatalf("unmarshal object failed: %v", err)
	}
	if ca2.Name != "Петров Б.Б." || ca2.University == nil || *ca2.University != "КГТУ" || ca2.Group == nil || *ca2.Group != "ИС-21" {
		t.Errorf("unexpected ca2: %+v", ca2)
	}

	// 3. Object format with gradeOrGroup alias
	var ca3 CoAuthor
	if err := json.Unmarshal([]byte(`{"name":"Сидоров В.В.","gradeOrGroup":"ИС-22"}`), &ca3); err != nil {
		t.Fatalf("unmarshal gradeOrGroup alias failed: %v", err)
	}
	if ca3.Name != "Сидоров В.В." || ca3.Group == nil || *ca3.Group != "ИС-22" {
		t.Errorf("unexpected ca3: %+v", ca3)
	}

	// 4. Object format with all fields (fullName, email, phone, university, group)
	var ca4 CoAuthor
	if err := json.Unmarshal([]byte(`{
		"fullName": "Асанов А.А.",
		"email": "asanov@kstu.kg",
		"phone": "+996555123456",
		"university": "КГТУ им. И. Раззакова",
		"group": "ИС-21"
	}`), &ca4); err != nil {
		t.Fatalf("unmarshal full fields failed: %v", err)
	}
	if ca4.Name != "Асанов А.А." || ca4.FullName != "Асанов А.А." ||
		ca4.Email == nil || *ca4.Email != "asanov@kstu.kg" ||
		ca4.Phone == nil || *ca4.Phone != "+996555123456" ||
		ca4.University == nil || *ca4.University != "КГТУ им. И. Раззакова" ||
		ca4.Group == nil || *ca4.Group != "ИС-21" ||
		ca4.GradeOrGroup == nil || *ca4.GradeOrGroup != "ИС-21" {
		t.Errorf("unexpected ca4: %+v", ca4)
	}
}

