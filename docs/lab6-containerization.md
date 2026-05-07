# Лабораторная работа №6

## Архитектура контейнеризации

Сервисы:

- `proxy` — публичная точка входа на базе Caddy. Принимает HTTP-трафик, проксирует `/api`, `/ws`, `robots.txt`, `sitemap.xml` в `backend`, остальное отправляет во `frontend`.
- `frontend` — production-сборка React/Vite, обслуживаемая Nginx.
- `backend` — FastAPI-приложение с health endpoints и ожиданием готовности зависимостей перед стартом.
- `db` — PostgreSQL для основной бизнес-логики.
- `minio` — объектное хранилище для обложек книг.
- `minio-init` — одноразовый служебный контейнер, создающий bucket при развертывании.

Сетевая схема:

1. Браузер обращается к `proxy` по `PUBLIC_SITE_URL`.
2. `proxy` отдаёт SPA из `frontend`.
3. API-запросы `/api/*`, websocket-запросы `/ws/*`, а также `robots.txt` и `sitemap.xml` идут через `proxy` в `backend`.
4. `backend` работает с `db` по внутренней Docker-сети и хранит/читает обложки из `minio`.
5. Публичные ссылки на обложки строятся через `MINIO_PUBLIC_BASE_URL`.

## Что добавлено

- `backend/Dockerfile` и `frontend/Dockerfile`.
- `docker-compose.yml` с healthcheck, `depends_on`, томами и переменными окружения.
- `deploy/Caddyfile` для reverse proxy.
- `.dockerignore` для backend и frontend.
- `.env.example`, `backend/.env.example`, `frontend/.env.example`.
- GitHub Actions workflow `.github/workflows/ci-cd.yml`.

## Локальный запуск

1. Скопировать `.env.example` в `.env`.
2. Скопировать `backend/.env.example` в `backend/.env`.
3. При необходимости поправить `SECRET_KEY`, `PUBLIC_SITE_URL`, `MINIO_PUBLIC_BASE_URL`.
4. Выполнить:

```bash
docker compose up -d --build
```

После старта:

- приложение доступно на `http://localhost:3000` по умолчанию;
- MinIO API — `http://localhost:9000`;
- MinIO Console — `http://localhost:9001`.

## Проверки устойчивости

- `backend/scripts/wait_for_dependencies.py` удерживает backend до готовности БД и MinIO.
- health endpoints:
  - `/health/live` — liveness;
  - `/health/ready` — readiness с проверкой БД и MinIO.
- `minio-init` создаёт bucket автоматически, чтобы повторный деплой был воспроизводимым.

## CI/CD

Workflow `CI/CD` делает следующее:

1. Поднимает PostgreSQL в GitHub Actions.
2. Устанавливает backend/frontend зависимости.
3. Запускает `ruff`, `pytest`, `npm run test`, `npm run build`.
4. Проверяет корректность `docker compose config`.
5. Собирает контейнерные образы `frontend` и `backend`.
6. При push в `main` или `master` выполняет автоматический deploy по SSH, если заданы secrets:
   - `DEPLOY_HOST`
   - `DEPLOY_USER`
   - `DEPLOY_SSH_KEY`
   - `DEPLOY_PATH`
