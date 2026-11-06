#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/lib.sh"
usage='Использование: sudo bash scripts/create-user.sh jury|admin|student "Фамилия Имя Отчество" [логин] [группа]'
(($# >= 2 && $# <= 4)) || die "$usage"
role=$1
name=$2
login=${3:-}
group=${4:-}
[[ $role == jury || $role == admin || $role == student ]] || die "$usage"
require_env
require_docker
[[ $'\n'$(compose ps --status running --services)$'\n' == *$'\napp\n'* ]] || die 'API не запущен. Выполните sudo bash scripts/start.sh'
compose exec -T app app -create-user -role "$role" -name "$name" -login "$login" -group "$group"
printf 'Вход: %s/login. При первом входе система попросит сменить пароль.\n' "$(env_value PUBLIC_URL)"
