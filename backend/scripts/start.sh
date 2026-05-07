#!/bin/sh
set -eu

python /app/scripts/wait_for_dependencies.py
alembic upgrade head || echo "Alembic migration step skipped or failed; continuing with application startup."
exec uvicorn app.main:app --host "${APP_HOST:-0.0.0.0}" --port "${APP_PORT:-8000}"
