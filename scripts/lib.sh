#!/usr/bin/env bash
# Shared helpers. Never source .env as shell code.
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd -- "$ROOT"
die() { printf 'Ошибка: %s\n' "$*" >&2; exit 1; }
compose() { docker compose --project-directory "$ROOT" --env-file "${CONFHUB_ENV_FILE:-$ROOT/.env}" -f "$ROOT/compose.yaml" "$@"; }
require_docker() {
    command -v docker >/dev/null || die 'Docker не установлен. На Ubuntu/Debian: sudo bash scripts/install-docker.sh'
    docker compose version >/dev/null 2>&1 || die 'Нужен Docker Compose plugin v2.24 или новее.'
    docker info >/dev/null 2>&1 || die 'Нет доступа к Docker. Запустите команду через sudo или проверьте docker.service.'
}
require_env() { [[ -f ${CONFHUB_ENV_FILE:-$ROOT/.env} ]] || die 'Нет .env. Сначала выполните bash setup.sh --host ВАШ_ДОМЕН'; }
maintenance_lock() {
    command -v flock >/dev/null || die 'Нужен flock: apt-get install util-linux'
    if [[ ${CONFHUB_LOCK_ROOT:-} == "$ROOT" ]] && { : >&9; } 2>/dev/null; then
        flock -n 9 || die 'Не удалось продолжить операцию с блокировкой.'
        return
    fi
    exec 9> "$ROOT/.maintenance.lock"
    flock -n 9 || die 'Уже выполняется запуск, резервное копирование или восстановление.'
    export CONFHUB_LOCK_ROOT="$ROOT"
}
env_value() { sed -n "s/^$1=//p" "${CONFHUB_ENV_FILE:-$ROOT/.env}"; }
db_psql() { compose exec -T db sh -ec 'exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' sh "$@"; }
wait_db() {
    local attempt
    for attempt in {1..60}; do
        if compose exec -T db sh -ec 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then return 0; fi
        sleep 2
    done
    die 'PostgreSQL не запустился. Проверьте docker compose logs db'
}
