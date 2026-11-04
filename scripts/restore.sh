#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/lib.sh"
[[ ! -e "$ROOT/.env" && ! -L "$ROOT/.env" ]] || die 'В каталоге уже есть .env. Восстановление выполняется в свежую распакованную копию без .env; работающий проект не перезаписывается.'
(($# == 1)) || die 'Использование: bash scripts/restore.sh /путь/backup.tar.gz'
[[ -f $1 ]] || die 'Архив резервной копии не найден.'
archive=$(cd -- "$(dirname -- "$1")" && pwd)/$(basename -- "$1")
require_docker
maintenance_lock
umask 077
stage=$(mktemp -d "$ROOT/.restore.XXXXXX")
trap 'rm -rf -- "$stage"' EXIT
# Read only explicitly named files; never extract arbitrary outer archive paths.
for file in .env database.dump uploads.tar.gz manifest.txt; do
    tar -xOzf "$archive" "$file" > "$stage/$file"
done
[[ $(head -n 1 "$stage/manifest.txt") == confhub-backup-v1 ]] || die 'Неподдерживаемый формат резервной копии.'
while IFS= read -r member; do
    [[ $member == ./ || $member =~ ^\./[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || die 'Недопустимое имя в архиве uploads.'
done < <(tar -tzf "$stage/uploads.tar.gz")
# Reject symlinks and hardlinks before extracting uploads as root.
types=$(tar -tvzf "$stage/uploads.tar.gz" | cut -c1 | sort -u)
[[ $types != *[!d$'\n'-]* ]] || die 'Архив uploads содержит ссылки или специальные файлы.'
export CONFHUB_ENV_FILE="$stage/.env"
if tar -tzf "$archive" | grep -qx sources.env; then
    tar -xOzf "$archive" sources.env > "$stage/sources.env"
    revision=$(sed -n 's/^REPOSITORY=//p' "$stage/sources.env")
    if [[ -n $revision ]]; then
        [[ $revision =~ ^[a-f0-9]{40,64}$ ]] || die 'Неверный commit в backup.'
        [[ -d $ROOT/.git ]] || die 'Для этого backup нужен клон общего Git-репозитория.'
        [[ $(git rev-parse HEAD) == "$revision" ]] || die "Сначала выберите версию backup: git checkout --detach $revision; затем повторите restore.sh"
    fi
fi
compose config --quiet
compose up -d db
wait_db
tables=$(db_psql -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
[[ $tables == 0 ]] || die 'База на целевом сервере не пустая. Данные не перезаписаны.'
compose build app
compose run --rm --no-deps -T --user 0 --entrypoint sh app -ec 'entries=$(find /app/uploads -mindepth 1 -print -quit) || exit 1; test -z "$entries"' || die 'Каталог uploads не пустой или недоступен для проверки. Данные не перезаписаны.'
cp -- "$stage/.env" "$ROOT/.env"
chmod 600 "$ROOT/.env"
unset CONFHUB_ENV_FILE
compose exec -T db sh -ec 'exec pg_restore --exit-on-error --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$stage/database.dump"
compose run --rm --no-deps -T --user 0 --entrypoint sh app -ec 'tar -xzf - --no-same-owner -C /app/uploads && chown -R 1000:1000 /app/uploads' < "$stage/uploads.tar.gz"
printf 'База и uploads восстановлены. Конфигурация .env перенесена.\n'
printf 'При смене адреса отредактируйте SITE_ADDRESS и PUBLIC_URL в .env.\n'
printf 'Затем: sudo bash scripts/start.sh\n'
