# Install Puppetflow

This guide installs Puppetflow on a self-hosted server with Docker Compose. For a development environment, see [Contributing](CONTRIBUTING.md#development-setup).

## Requirements

- Git
- Docker with Docker Compose
- At least 4 GB of available memory

Puppetflow Core expects the `pinokio` repository beside it:

```text
puppetflow/
├── pinokio/
└── puppetflow-core/
```

## 1. Get the source

```bash
mkdir puppetflow
cd puppetflow
git clone https://github.com/puppetflow/pinokio.git
git clone https://github.com/puppetflow/puppetflow.git puppetflow-core
cd puppetflow-core
```

## 2. Configure the installation

Start with the minimal environment file:

```bash
cp .env.minimal.example .env
```

Set these required values:

- `APP_KEY`: generate it with `echo "base64:$(openssl rand -base64 32)"`
- `DB_PASSWORD`: use a strong, unique password
- `BROWSER_STREAM_SECRET`: generate it with `openssl rand -hex 32`

For a remote server, replace the localhost values in `APP_URL`, `BROWSER_STREAM_PUBLIC_URL`, and `BROWSER_STREAM_ALLOWED_ORIGINS` with the public URLs used by your installation.

`REDIS_PASSWORD` is optional. An empty value leaves the bundled Redis instance without authentication, so Redis must remain private to the Compose network.

Use `.env.full.example` as a reference for advanced settings. Do not copy it over the minimal file unless you intend to review every option.

## 3. Start Puppetflow

Build the production images, run the database migrations, then start the stack:

```bash
docker compose -f docker-compose.prod-pgsql.yml build
docker compose -f docker-compose.prod-pgsql.yml run --rm --entrypoint php app artisan migrate --force
docker compose -f docker-compose.prod-pgsql.yml up -d
```

Check the containers or follow the application logs:

```bash
docker compose -f docker-compose.prod-pgsql.yml ps
docker compose -f docker-compose.prod-pgsql.yml logs -f app
```

## 4. Create the administrator

Open the URL configured in `APP_URL`. Complete license activation if it is shown. When the users table is empty, Puppetflow redirects to the onboarding screen.

Create the administrator account there. The account is logged in immediately and receives its first workspace. Additional accounts require either a direct workspace invitation or an invitation request enabled by an administrator. Requests remain pending until an administrator approves them and assigns at least one workspace.

## Network and backups

Put the application and browser stream endpoint behind HTTPS before exposing them to the internet. If a reverse proxy runs on the same host, set `BROWSER_STREAM_BIND_ADDRESS=127.0.0.1`.

Keep PostgreSQL and Redis private. Back up the `puppetflow-db`, `puppetflow-framework`, `puppetflow-uploads`, and `puppetflow-execution` volumes.

The Compose file provides application defaults, not a firewall or backup policy.

## Common commands

```bash
# Stop
docker compose -f docker-compose.prod-pgsql.yml down

# Start or apply configuration changes
docker compose -f docker-compose.prod-pgsql.yml up -d

# Check status
docker compose -f docker-compose.prod-pgsql.yml ps

# Follow logs
docker compose -f docker-compose.prod-pgsql.yml logs -f app
```

## Update Puppetflow

Back up the database and persistent volumes first. Then update the source, rebuild the images, run migrations with the new image, and restart the stack:

```bash
git pull
docker compose -f docker-compose.prod-pgsql.yml build
docker compose -f docker-compose.prod-pgsql.yml run --rm --entrypoint php app artisan migrate --force
docker compose -f docker-compose.prod-pgsql.yml up -d
```

Before restarting, compare `.env.minimal.example` and `.env.full.example` with your `.env` for new or renamed settings.
