#!/usr/bin/env bash
set -Eeuo pipefail
[[ $EUID == 0 ]] || { echo 'Запустите: sudo bash scripts/install-docker.sh' >&2; exit 1; }
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
    echo 'Docker и Compose уже установлены.'
    exit 0
fi
source /etc/os-release
case "$ID" in ubuntu|debian) ;; *) echo 'Автоустановка поддерживает Ubuntu и Debian. Для другой ОС установите Docker Engine + Compose plugin по docs.docker.com.' >&2; exit 1 ;; esac
conflicts=()
for package in docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc; do
    if dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q 'install ok installed'; then conflicts+=("$package"); fi
done
if ((${#conflicts[@]})); then
    printf 'Уже установлены конфликтующие пакеты: %s\n' "${conflicts[*]}" >&2
    echo 'Автоматическое удаление отключено. Сначала настройте Docker Engine + Compose plugin по официальной инструкции.' >&2
    exit 1
fi
apt-get update
apt-get install -y ca-certificates curl openssl util-linux git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
codename=${UBUNTU_CODENAME:-$VERSION_CODENAME}
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/$ID
Suites: $codename
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker compose version
echo 'Docker установлен. Дальнейшие команды выполняйте через sudo.'
