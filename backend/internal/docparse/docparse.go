package docparse

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"strings"

	"github.com/ledongthuc/pdf"
)

const maxDecompressedSize = 50 * 1024 * 1024 // 50 MB zip bomb protection

// DetectType checks magic bytes and returns the MIME type.
// Returns empty string if the file type is not supported.
func DetectType(data []byte) string {
	if len(data) >= 5 && string(data[:5]) == "%PDF-" {
		return "application/pdf"
	}
	if len(data) >= 8 && bytes.Equal(data[:8], []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}) {
		return "application/vnd.ms-powerpoint"
	}
	if len(data) >= 4 && data[0] == 'P' && data[1] == 'K' && data[2] == 0x03 && data[3] == 0x04 {
		// Could be DOCX — verify it contains word/document.xml
		if isDocx(data) {
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		}
		// Could be PPTX — verify it contains ppt/presentation.xml
		if isPptx(data) {
			return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
		}
	}
	return ""
}

// isDocx checks if a ZIP archive contains word/document.xml.
func isDocx(data []byte) bool {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return false
	}
	for _, f := range r.File {
		if strings.EqualFold(f.Name, "word/document.xml") {
			return true
		}
	}
	return false
}

// isPptx checks if a ZIP archive contains ppt/presentation.xml.
func isPptx(data []byte) bool {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return false
	}
	for _, f := range r.File {
		if strings.EqualFold(f.Name, "ppt/presentation.xml") {
			return true
		}
	}
	return false
}

// ExtractText extracts text from PDF, DOCX, or PPTX data.
// Returns the extracted text and whether text was found.
func ExtractText(data []byte, mime string) (string, bool, error) {
	switch mime {
	case "application/pdf":
		return extractPDFText(data)
	case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return extractDocxText(data)
	case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
		return extractPptxText(data)
	case "application/vnd.ms-powerpoint":
		return "", false, nil
	default:
		return "", false, fmt.Errorf("unsupported mime: %s", mime)
	}
}

func extractPDFText(data []byte) (string, bool, error) {
	r, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", false, fmt.Errorf("open pdf: %w", err)
	}

	var sb strings.Builder
	numPages := r.NumPage()
	for i := 1; i <= numPages; i++ {
		page := r.Page(i)
		if page.V.IsNull() {
			continue
		}
		text, err := page.GetPlainText(nil)
		if err != nil {
			continue
		}
		sb.WriteString(text)
		sb.WriteRune('\n')
	}

	result := strings.TrimSpace(sb.String())
	if len(result) < 10 {
		// Likely a scanned document with no text layer
		return "", false, nil
	}

	// Trim to ~30000 chars
	if len(result) > 30000 {
		result = result[:30000]
	}
	return result, true, nil
}

func extractDocxText(data []byte) (string, bool, error) {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", false, fmt.Errorf("open zip: %w", err)
	}

	for _, f := range r.File {
		if !strings.EqualFold(f.Name, "word/document.xml") {
			continue
		}

		// Zip bomb protection
		if f.UncompressedSize64 > uint64(maxDecompressedSize) {
			return "", false, fmt.Errorf("file too large when decompressed")
		}

		rc, err := f.Open()
		if err != nil {
			return "", false, err
		}
		defer rc.Close()

		limited := io.LimitReader(rc, int64(maxDecompressedSize))
		content, err := io.ReadAll(limited)
		if err != nil {
			return "", false, err
		}

		text := extractXMLText(content)
		text = strings.TrimSpace(text)
		if len(text) < 10 {
			return "", false, nil
		}
		if len(text) > 30000 {
			text = text[:30000]
		}
		return text, true, nil
	}

	return "", false, fmt.Errorf("word/document.xml not found in archive")
}

// extractXMLText pulls text content from Word XML.
func extractXMLText(xmlData []byte) string {
	decoder := xml.NewDecoder(bytes.NewReader(xmlData))
	var sb strings.Builder
	inText := false

	for {
		tok, err := decoder.Token()
		if err != nil {
			break
		}
		switch t := tok.(type) {
		case xml.StartElement:
			// <w:t> elements contain the actual text
			if t.Name.Local == "t" {
				inText = true
			}
			// <w:p> = paragraph break
			if t.Name.Local == "p" {
				sb.WriteRune('\n')
			}
		case xml.EndElement:
			if t.Name.Local == "t" {
				inText = false
			}
		case xml.CharData:
			if inText {
				sb.Write(t)
			}
		}
	}
	return sb.String()
}

func extractPptxText(data []byte) (string, bool, error) {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", false, fmt.Errorf("open zip: %w", err)
	}

	var sb strings.Builder
	totalDecompressed := int64(0)

	for _, f := range r.File {
		nameLower := strings.ToLower(f.Name)
		if strings.HasPrefix(nameLower, "ppt/slides/slide") && strings.HasSuffix(nameLower, ".xml") {
			totalDecompressed += int64(f.UncompressedSize64)
			if totalDecompressed > maxDecompressedSize {
				return "", false, fmt.Errorf("file too large when decompressed")
			}

			rc, err := f.Open()
			if err != nil {
				return "", false, err
			}

			limited := io.LimitReader(rc, int64(maxDecompressedSize))
			content, err := io.ReadAll(limited)
			rc.Close()
			if err != nil {
				return "", false, err
			}

			text := extractXMLText(content)
			text = strings.TrimSpace(text)
			if text != "" {
				sb.WriteString(text)
				sb.WriteRune('\n')
			}
		}
	}

	result := strings.TrimSpace(sb.String())
	if len(result) < 10 {
		return "", false, nil
	}
	if len(result) > 30000 {
		result = result[:30000]
	}
	return result, true, nil
}
