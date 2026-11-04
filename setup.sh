#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

die() { printf 'Ошибка: %s\n' "$*" >&2; exit 1; }
host=''
http=0
configure_only=0
while (($#)); do
    case "$1" in
        --host) (($# >= 2)) || die 'После --host нужен домен или IPv4.'; host=$2; shift 2 ;;
        --http) http=1; shift ;;
        --configure-only) configure_only=1; shift ;;
        -h|--help) printf 'bash setup.sh [--host domain-or-IPv4] [--http] [--configure-only]\n'; exit 0 ;;
        *) die "Неизвестный аргумент: $1" ;;
    esac
done

if [[ ! -e .env && ! -L .env && -z $host ]]; then
    [[ -t 0 ]] || die 'Укажите --host example.com или --host IP_СЕРВЕРА.'
    read -r -p 'Домен без https:// или IPv4 сервера: ' host
fi
if [[ -n $host ]]; then
    [[ ${#host} -le 253 ]] || die 'Слишком длинное имя сервера.'
    host=${host,,}
    if [[ $host =~ ^[0-9.]+$ ]]; then
        [[ $host =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || die 'Неверный IPv4.'
        IFS=. read -r -a octets <<< "$host"
        for octet in "${octets[@]}"; do ((10#$octet <= 255)) || die 'Неверный IPv4.'; done
        http=1
    else
        [[ $host =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ && $host != *..* ]] || die 'Неверный домен. Укажите только имя без протокола, порта и пути.'
        IFS=. read -r -a labels <<< "$host"
        for label in "${labels[@]}"; do
            [[ ${#label} -le 63 && $label != -* && $label != *- ]] || die 'Неверная часть доменного имени.'
        done
        [[ $host == localhost ]] && http=1
    fi
    if ((http)); then site_address="http://$host"; public_url=$site_address
    else site_address=$host; public_url="https://$host"
    fi
fi

if [[ -e .env || -L .env ]]; then
    [[ -f .env ]] || die '.env должен быть обычным файлом.'
    if [[ -n $host ]]; then
        old_address=$(sed -n 's/^SITE_ADDRESS=//p' .env)
        [[ $old_address == "$site_address" ]] || die 'В .env уже настроен другой адрес. Отредактируйте SITE_ADDRESS и PUBLIC_URL вручную; секреты сохраняются.'
    fi
    printf 'Использую существующий .env; настройки и пароли сохранены.\n'
else
    command -v openssl >/dev/null || die 'Нужен openssl: apt-get install openssl'
    umask 077
    db_password=$(openssl rand -hex 32)
    jwt_secret=$(openssl rand -hex 48)
    admin_password=$(openssl rand -hex 24)
    temporary=$(mktemp .env.XXXXXX)
    trap 'rm -f -- "$temporary"' EXIT
    cat > "$temporary" <<EOF
SITE_ADDRESS=$site_address
PUBLIC_URL=$public_url
POSTGRES_USER=confhub
POSTGRES_DB=confhub
POSTGRES_PASSWORD=$db_password
JWT_SECRET=$jwt_secret
SEED_ADMIN_LOGIN=admin
SEED_ADMIN_PASSWORD=$admin_password
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
MAX_TALKS_PER_STUDENT=10
AI_DAILY_LIMIT=20
EOF
    mv -- "$temporary" .env
    trap - EXIT
    printf 'Создан .env. Логин: admin\nПароль администратора: %s\n' "$admin_password"
    if ((http)); then printf 'Выбран HTTP. Для публичного HTTPS используйте домен.\n'; fi
fi

if ((configure_only)); then exit 0; fi
exec bash scripts/start.sh
