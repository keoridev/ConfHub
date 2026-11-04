#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/scripts/lib.sh"
require_env
require_docker
maintenance_lock
[[ -d .git ]] || die 'Запускайте update.sh из клона общего репозитория ConfHub.'
[[ ! -e .deployment-pending ]] || die 'Предыдущий запуск не завершён. Проверьте логи и выполните sudo bash scripts/start.sh'
[[ -z $(git status --porcelain) ]] || die 'На VPS есть локальные изменения. Сохраните их в Git перед обновлением.'
branch=${DEPLOY_BRANCH:-main}
[[ $(git branch --show-current) == "$branch" ]] || die "Нужна ветка $branch."
git fetch origin "$branch"
git merge-base --is-ancestor HEAD FETCH_HEAD || die 'История разошлась с GitHub; принудительный reset не выполняется.'
running=$(compose ps --status running --services)
if [[ $'\n'$running$'\n' == *$'\ndb\n'* ]]; then bash "$ROOT/scripts/backup.sh"; fi
git merge --ff-only FETCH_HEAD
bash "$ROOT/scripts/start.sh"
printf 'Общий репозиторий обновлён. Проверка: sudo bash scripts/check.sh\n'
