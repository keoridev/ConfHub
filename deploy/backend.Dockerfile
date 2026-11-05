# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY . .
# BuildKit caches keep downloaded modules and compiled packages between rebuilds.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/app

FROM alpine:3.23
RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -u 1000 appuser \
    && mkdir -p /app/uploads && chown appuser:appuser /app/uploads
WORKDIR /app
COPY --from=builder /out/app /usr/local/bin/app
COPY --from=builder /build/migrations /app/migrations
COPY --from=builder /build/openapi.yaml /app/openapi.yaml
USER appuser
EXPOSE 8080
ENTRYPOINT ["app"]
