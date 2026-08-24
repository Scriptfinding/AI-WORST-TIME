#!/bin/bash
set -e

echo "[entrypoint-dev] Clearing bootstrap cache..."
php artisan package:discover --ansi
php artisan config:clear 2>/dev/null || true

if [[ "$*" == *"artisan serve"* ]]; then
    if [[ "${APP_AUTO_MIGRATE:-false}" == "true" ]]; then
        echo "[entrypoint-dev] Running migrations..."
        php artisan migrate --force
    fi

    if [[ ! -e public/storage ]]; then
        echo "[entrypoint-dev] Linking public storage..."
        php artisan storage:link
    fi

    echo "[entrypoint-dev] Bootstrapping environment license..."
    php artisan license:bootstrap-env

    echo "[entrypoint-dev] Synchronizing entitlements..."
    php artisan entitlements:sync-stale
fi

exec "$@"
