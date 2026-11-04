package docparse

import (
	"archive/zip"
	"bytes"
	"testing"
)

func TestDetectType_PDF(t *testing.T) {
	pdfMagic := []byte("%PDF-1.4 fake pdf content")
	got := DetectType(pdfMagic)
	if got != "application/pdf" {
		t.Errorf("DetectType(PDF magic) = %q, want application/pdf", got)
	}
}

func TestDetectType_Unknown(t *testing.T) {
	got := DetectType([]byte("just some random text"))
	if got != "" {
		t.Errorf("DetectType(random) = %q, want empty", got)
	}
}

func TestDetectType_TooShort(t *testing.T) {
	got := DetectType([]byte("abc"))
	if got != "" {
		t.Errorf("DetectType(short) = %q, want empty", got)
	}
}

func TestDetectType_Empty(t *testing.T) {
	got := DetectType([]byte{})
	if got != "" {
		t.Errorf("DetectType(empty) = %q, want empty", got)
	}
}

func TestDetectType_ZipNotDocx(t *testing.T) {
	// PK header but not a valid DOCX (just PK magic + garbage)
	data := []byte{'P', 'K', 0x03, 0x04, 0x00, 0x00, 0x00, 0x00}
	got := DetectType(data)
	if got != "" {
		t.Errorf("DetectType(zip-not-docx) = %q, want empty", got)
	}
}

func TestExtractXMLText(t *testing.T) {
	xml := `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Hello</w:t></w:r></w:p>
    <w:p><w:r><w:t>World</w:t></w:r></w:p>
  </w:body>
</w:document>`
	result := extractXMLText([]byte(xml))
	if result == "" {
		t.Error("extractXMLText returned empty string")
	}
	if !contains(result, "Hello") || !contains(result, "World") {
		t.Errorf("extractXMLText missing expected text, got: %q", result)
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func TestDetectType_PPT(t *testing.T) {
	data := []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0x00, 0x00}
	got := DetectType(data)
	if got != "application/vnd.ms-powerpoint" {
		t.Errorf("DetectType(PPT magic) = %q, want application/vnd.ms-powerpoint", got)
	}
}

func TestDetectType_PPTX_and_Extract(t *testing.T) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	// Add ppt/presentation.xml
	pw, err := zw.Create("ppt/presentation.xml")
	if err != nil {
		t.Fatalf("failed to create ppt/presentation.xml: %v", err)
	}
	pw.Write([]byte("<p:presentation></p:presentation>"))

	// Add ppt/slides/slide1.xml
	sw, err := zw.Create("ppt/slides/slide1.xml")
	if err != nil {
		t.Fatalf("failed to create slide1.xml: %v", err)
	}
	sw.Write([]byte(`<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Artificial Intelligence in Ecology</a:t></a:r></a:p>
          <a:p><a:r><a:t>Results and Conclusions</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`))

	if err := zw.Close(); err != nil {
		t.Fatalf("failed to close zip writer: %v", err)
	}

	data := buf.Bytes()
	mime := DetectType(data)
	if mime != "application/vnd.openxmlformats-officedocument.presentationml.presentation" {
		t.Errorf("DetectType(pptx) = %q, want pptx mime", mime)
	}

	text, hasText, err := ExtractText(data, mime)
	if err != nil {
		t.Fatalf("ExtractText(pptx) error: %v", err)
	}
	if !hasText {
		t.Errorf("ExtractText(pptx) hasText = false, want true")
	}
	if !contains(text, "Artificial Intelligence") || !contains(text, "Results and Conclusions") {
		t.Errorf("ExtractText(pptx) unexpected text: %q", text)
	}
}
