#!/bin/bash
set -e

# Cache Laravel config with runtime env vars (always, for all containers)
php artisan config:cache

# Web container init
if [[ "$1" == *"supervisord"* ]]; then
    mkdir -p storage/app/public

    if [[ ! -e public/storage && ! -L public/storage ]]; then
        php artisan storage:link
    fi

    php artisan route:cache
    php artisan view:cache

    if [[ "${APP_AUTO_MIGRATE:-false}" == "true" ]]; then
        echo "[entrypoint] Running migrations..."
        php artisan migrate --force
    fi

    echo "[entrypoint] Cleaning up disabled Safe Mode identity..."
    php artisan safe-mode:cleanup

    echo "[entrypoint] Bootstrapping environment license..."
    php artisan license:bootstrap-env

    echo "[entrypoint] Synchronizing entitlements..."
    php artisan entitlements:sync-stale
fi

exec "$@"
