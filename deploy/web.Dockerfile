# syntax=docker/dockerfile:1
FROM node:24-alpine AS frontend
ARG FRONTEND_DIR=frontend
WORKDIR /build
COPY ${FRONTEND_DIR}/package.json ${FRONTEND_DIR}/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY ${FRONTEND_DIR}/ ./
# This value is compiled into browser JavaScript, not read at container startup.
ENV VITE_API_URL=/api
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /build/dist /srv
