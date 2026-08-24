# ============================================================
# BASE: PHP 8.4 FPM + Node 20 + system deps (shared by dev & prod)
# ============================================================

FROM php:8.4-fpm AS base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git unzip zip libpq-dev libsqlite3-dev libzip-dev libpng-dev libldap2-dev \
    libjpeg62-turbo-dev libfreetype6-dev libonig-dev libxml2-dev libcurl4-openssl-dev \
    chromium fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libdrm2 libgbm1 libgtk-3-0 libnss3 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxrandr2 xdg-utils \
    ffmpeg \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-configure ldap \
    && docker-php-ext-install -j$(nproc) pdo pdo_pgsql pdo_sqlite mbstring zip gd bcmath pcntl opcache ldap \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer/composer:2-bin /composer /usr/local/bin/composer

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# ============================================================
# COMPOSER DEPS (cached layer)
# ============================================================
FROM base AS composer-deps

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# ============================================================
# NODE DEPS (cached layer)
# ============================================================
FROM base AS node-deps

COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# FRONTEND BUILD (prod assets)
# ============================================================
FROM node-deps AS frontend-build

COPY --from=composer-deps /app/vendor ./vendor
COPY . .
RUN npm run build

# ============================================================
# DEV: full dev environment with HMR + artisan serve
# ============================================================
FROM base AS dev

COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN composer dump-autoload --optimize

RUN php artisan config:clear 2>/dev/null || true

COPY docker/entrypoint-dev.sh /entrypoint-dev.sh
RUN chmod +x /entrypoint-dev.sh

EXPOSE 8000 5173

ENTRYPOINT ["/entrypoint-dev.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

# ============================================================
# PROD: nginx + php-fpm + supervisor (runs as www-data)
# ============================================================
FROM base AS prod

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

# Configure nginx for non-root operation
RUN rm -f /etc/nginx/sites-enabled/default && \
    sed -i '/^user /d' /etc/nginx/nginx.conf && \
    sed -i 's|pid /run/nginx.pid|pid /tmp/nginx.pid|' /etc/nginx/nginx.conf
COPY docker/nginx.conf /etc/nginx/conf.d/puppetflow.conf

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php-fpm-pool.conf /usr/local/etc/php-fpm.d/zzz-puppetflow.conf
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache-prod.ini

# Executable application code remains root-owned and read-only to the runtime user.
COPY . .
COPY --from=composer-deps /app/vendor ./vendor
COPY --from=node-deps /app/node_modules ./node_modules
COPY --from=frontend-build /app/public/build ./public/build

# Regenerate the runtime header from src/runtime/ fragments so the image never
# ships a stale committed artifact (safety net if build:runtime was forgotten).
RUN npm run build:runtime

RUN composer dump-autoload --optimize --classmap-authoritative

# Writable dirs for Laravel, nginx, php-fpm, and supervisor
RUN mkdir -p storage/app/public storage/framework/{cache,sessions,views} storage/logs data && \
    ln -s /app/storage/app/public public/storage && \
    chown -R www-data:www-data storage bootstrap/cache data && \
    chmod -R 775 storage bootstrap/cache data && \
    mkdir -p /run/nginx /tmp/nginx && \
    chown -R www-data:www-data \
        /var/lib/nginx /var/log/nginx /run/nginx /tmp/nginx \
        /usr/local/var/run /usr/local/var/log

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

USER www-data

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
