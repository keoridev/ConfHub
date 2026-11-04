#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/lib.sh"
require_env
require_docker
maintenance_lock
compose config --quiet
if [[ -d $ROOT/.git ]]; then
    umask 077
    revision=$(git rev-parse HEAD)
    printf 'REPOSITORY=%s\n' "$revision" > .deployment-pending
fi
compose up -d --build --wait --wait-timeout 180
if [[ -d $ROOT/.git ]]; then
    umask 077
    mv -f -- .deployment-pending .deployed-revisions
fi
printf '\nСайт: %s\n' "$(env_value PUBLIC_URL)"
printf 'Вход: /login. Логин и первоначальный пароль находятся в .env.\n'
printf 'Проверка: sudo bash scripts/check.sh\n'
