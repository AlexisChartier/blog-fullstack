#!/bin/sh
set -e

echo "Waiting for database..."
max_retries=30
retry=0
while ! php -r "new PDO('pgsql:host=db;port=5432;dbname=${DB_DATABASE:-blogging}', '${DB_USERNAME:-blog}', '${DB_PASSWORD:-secret}');" 2>/dev/null; do
  retry=$((retry + 1))
  if [ $retry -ge $max_retries ]; then
    echo "Database not reachable after $max_retries attempts. Starting without migrations."
    break
  fi
  echo "Database not ready, retrying ($retry/$max_retries)..."
  sleep 2
done

if [ $retry -lt $max_retries ]; then
  echo "Running migrations..."
  php artisan migrate --force
fi

echo "Clearing caches..."
php artisan config:clear
php artisan route:clear

exec "$@"
