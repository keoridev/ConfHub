package ai

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"time"
)

var httpClient = &http.Client{
	Timeout: 65 * time.Second,
}

func newHTTPRequest(ctx context.Context, url string, body []byte) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	return req, nil
}

func readBody(resp *http.Response) ([]byte, error) {
	limited := io.LimitReader(resp.Body, 10*1024*1024) // 10 MB max response
	data, err := io.ReadAll(limited)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	return data, nil
}

// Compile-time interface checks.
var _ Client = (*GeminiClient)(nil)
var _ Client = (*MockClient)(nil)
