# ── Build stage ────────────────────────────────
FROM golang:alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/app ./cmd/app

# ── Runtime stage ─────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata
RUN adduser -D -u 1000 appuser

COPY --from=builder /build/app /usr/local/bin/app
COPY --from=builder /build/migrations /migrations
COPY openapi.yaml /openapi.yaml
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    mkdir -p /app/uploads && chown appuser:appuser /app/uploads
USER appuser

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
    