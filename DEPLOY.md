# Запуск ConfHub на Ubuntu VPS

Один репозиторий: https://github.com/keoridev/ConfHub, ветка main. Frontend находится в frontend/, Go backend в backend/. Команды Docker выполняются из корня репозитория. Старый backend/docker-compose.yml запускает только прежнюю backend-конфигурацию; для всего сайта используется корневой compose.yaml.

## Первый запуск

В SSH-терминале Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates openssl util-linux
sudo git clone https://github.com/keoridev/ConfHub.git /opt/confhub
cd /opt/confhub
sudo bash scripts/install-docker.sh
sudo bash setup.sh
sudo bash scripts/check.sh
```

setup.sh спросит домен без https:// или IPv4 сервера, создаст .env со случайными паролями и соберёт приложения. Если репозиторий уже клонирован в /opt/confhub, выполните в нём sudo git pull --ff-only вместо повторного git clone. Для приватного репозитория нужен GitHub-доступ пользователя, запускающего Git; при sudo это root.

Сайт откроется по указанному адресу. На IPv4 используется HTTP. Для HTTPS создайте DNS-запись A домена на IP VPS и введите домен при настройке. В панели хостинга должны быть доступны TCP 80/443; TCP 22 нужен для SSH. Другой веб-сервер не должен занимать порты 80/443.

Пароль администратора показывается при первом создании .env. Страница входа: /login, логин admin. Посмотреть первоначальный пароль: sudo grep '^SEED_ADMIN_' .env. При смене пароля в приложении первоначальный пароль в .env перестаёт быть паролем входа.

При первом запуске создаются только администратор, конференция, 12 секций и 4 аудитории. Демонстрационные аккаунты и доклады не создаются. База и uploads находятся в постоянных Docker-томах. PostgreSQL и API не публикуются наружу; Caddy обслуживает frontend и направляет /api/* в Go, сохраняя префикс.

## Настройки Gemini

Без GEMINI_API_KEY приложение возвращает предусмотренный исходниками демонстрационный ответ AI. Для реальной проверки добавьте ключ в .env, при необходимости выберите доступный GEMINI_MODEL, затем sudo bash scripts/start.sh. Для настройки ключа перед первым запуском выполните sudo bash setup.sh --configure-only, отредактируйте .env и запустите scripts/start.sh.

## Обновления

На компьютере отправьте изменения в GitHub обычными commit/push. Затем на VPS:

```bash
cd /opt/confhub
sudo bash update.sh
sudo bash scripts/check.sh
```

update.sh проверяет чистоту рабочей копии, скачивает main, делает backup при работающей базе, выполняет fast-forward и пересобирает приложения. .env, база и документы сохраняются. Автоматического запуска после push нет: обновление инициируется командой по SSH.

Если запуск завершился ошибкой, посмотрите логи и завершите уже начатое развёртывание:

```bash
sudo docker compose logs --tail=100 init bootstrap app web db
sudo bash scripts/start.sh
```

До успешного завершения запуска маркер .deployment-pending блокирует новые update/backup, чтобы не записать неверную версию кода для изменившейся схемы базы. Не удаляйте этот маркер вручную. Резервная копия до обновления остаётся в backups/.

## Резервная копия и перенос

sudo bash scripts/backup.sh создаёт backups/confhub-ДАТА-ПРОЦЕСС.tar.gz с базой, uploads, .env и commit используемого кода. Копия содержит секреты, храните её с закрытым доступом вне VPS. На время копирования API останавливается и затем возобновляется; если он уже был остановлен, остаётся остановленным.

Для окончательного переноса остановите запись: sudo docker compose stop app, затем сделайте итоговый backup и скопируйте его на новый VPS. Это предотвращает появление новых заявок после резервной копии.

На новом VPS клонируйте репозиторий, установите Docker, но не запускайте setup.sh. Версию кода можно посмотреть командой tar -xOzf /путь/backup.tar.gz sources.env. Выберите этот commit командой git checkout --detach COMMIT_ИЗ_BACKUP, затем:

```bash
sudo bash scripts/restore.sh /путь/backup.tar.gz
# При смене адреса измените SITE_ADDRESS и PUBLIC_URL в .env.
sudo bash scripts/start.sh
sudo bash scripts/check.sh
```

Восстановление отказывается перезаписывать существующий .env, непустую базу или uploads. После проверки и переключения DNS для дальнейших обновлений переключитесь на main (sudo git switch main) и выполните update.sh. Не используйте старый и новый сервер одновременно для приёма заявок. Если main уже новее восстановленного backup, при следующем update выполнятся новые миграции.

## Проверки и ограничения

Конфигурация Compose и Caddy проверена локально; frontend и Go backend уже собирались отдельно. Скрипты проверены на временных Git-репозиториях с адаптером вместо внешнего Docker. Полный Docker Engine запуск и выдача сертификата проверяются на VPS командой scripts/check.sh и первым входом. Доступа к VPS в этом чате нет.

Исходный интерфейс местами использует конференцию ID 1 и даты, заданные в frontend; настройка запуска не добавляет редактор этих значений.

Официальные инструкции: https://docs.docker.com/engine/install/ubuntu/ и https://caddyserver.com/docs/caddyfile/patterns
