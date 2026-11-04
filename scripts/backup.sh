#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/lib.sh"
require_env
require_docker
maintenance_lock
[[ ! -e .deployment-pending ]] || die 'Предыдущий запуск не завершён: версии кода и схемы могут отличаться. Сохранена копия до обновления. Сначала устраните ошибку и выполните scripts/start.sh; новая штатная копия не создана.'
umask 077
mkdir -p -- "$ROOT/backups"
archive="$ROOT/backups/confhub-$(date -u +%Y%m%dT%H%M%SZ)-$$.tar.gz"
stage=$(mktemp -d "$ROOT/.backup.XXXXXX")
was_running=0
cleanup() {
    local status=$?
    trap - EXIT INT TERM
    if ((was_running)); then
        if ! compose start app; then
            printf 'Не удалось возобновить API. Выполните sudo docker compose start app.\n' >&2
            status=1
        fi
    fi
    rm -rf -- "$stage"
    return "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
running=$(compose ps --status running --services)
if [[ $'\n'$running$'\n' == *$'\napp\n'* ]]; then
    was_running=1
    compose stop app
fi
# API writers stay stopped until both snapshots finish.
compose exec -T db sh -ec 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges' > "$stage/database.dump"
compose run --rm --no-deps -T --entrypoint tar app -C /app/uploads -czf - . > "$stage/uploads.tar.gz"
cp -- "${CONFHUB_ENV_FILE:-$ROOT/.env}" "$stage/.env"
printf 'confhub-backup-v1\nPostgreSQL: 16\nUTC: %s\n' "$(date -u +%FT%TZ)" > "$stage/manifest.txt"
: > "$stage/sources.env"
if [[ -d $ROOT/.git ]]; then
    if [[ -f .deployed-revisions ]]; then cp -- .deployed-revisions "$stage/sources.env"
    else printf 'REPOSITORY=%s\n' "$(git rev-parse HEAD)" > "$stage/sources.env"
    fi
fi
tar -C "$stage" -czf "$stage/complete.tar.gz" .env database.dump uploads.tar.gz manifest.txt sources.env
mv -- "$stage/complete.tar.gz" "$archive"
printf 'Резервная копия: %s\nВключает .env с секретами; храните файл с закрытым доступом.\n' "$archive"
