#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/lib.sh"
require_env
require_docker
command -v curl >/dev/null || die 'Нужен curl.'
compose config --quiet
compose ps -a
url=$(env_value PUBLIC_URL)
[[ $url == http://* || $url == https://* ]] || die 'PUBLIC_URL должен начинаться с http:// или https://'
temp=$(mktemp -d)
trap 'rm -rf -- "$temp"' EXIT
curl --fail --silent --show-error --retry 5 --retry-delay 3 --connect-timeout 10 --max-time 30 "$url/api/health" > "$temp/health"
grep -q '"status":"ok"' "$temp/health" || die 'API health вернул неожиданный ответ.'
curl --fail --silent --show-error --max-time 30 "$url/" > "$temp/index"
grep -q 'id="root"' "$temp/index" || die 'Фронтенд не отдается.'
curl --fail --silent --show-error --max-time 30 "$url/submission" > "$temp/spa"
cmp -s "$temp/index" "$temp/spa" || die 'SPA-маршрут /submission не вернул index.html.'
curl --fail --silent --show-error --max-time 30 "$url/api/conferences/current" > "$temp/conference"
curl --fail --silent --show-error --max-time 30 "$url/api/sections" > "$temp/sections"
[[ $(db_psql -Atc 'SELECT COUNT(*) FROM schema_migrations') -ge 3 ]] || die 'Миграции не завершены.'
# Check configured admin is present; this does not assume an unchanged seed password.
compose exec -T db sh -ec 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT COUNT(*) FROM users WHERE role = '\''admin'\'' AND is_active"' | grep -Eq '^[1-9][0-9]*$' || die 'Нет активного администратора.'
printf '\nПроверены frontend, SPA, API, база, миграции, конференция и администратор: %s\n' "$url"
printf 'Для первого входа используйте SEED_ADMIN_LOGIN / SEED_ADMIN_PASSWORD из .env.\n'
