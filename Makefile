.PHONY: dev dev-down dev-logs dev-shell dev-migrate dev-seed dev-fresh \
       prod prod-down prod-logs prod-shell prod-migrate prod-pull \
       prod-sqlite prod-sqlite-down prod-sqlite-logs \
       down logs

# ── Development ──────────────────────────────────────────

dev:
	@rm -f bootstrap/cache/config.php bootstrap/cache/routes*.php bootstrap/cache/views.php
	docker compose up --build

dev-down:
	docker compose down

dev-logs:
	docker compose logs -f

dev-shell:
	docker exec -it puppetflow-app bash

dev-migrate:
	docker exec -it puppetflow-app php artisan migrate

dev-seed:
	docker exec -it puppetflow-app php artisan db:seed

dev-fresh:
	docker exec -it puppetflow-app php artisan migrate:fresh --seed

# ── Production ───────────────────────────────────────────

prod:
	docker compose -f docker-compose.prod-pgsql.yml up --build

prod-pull:
	docker compose -f docker-compose.prod-pgsql.yml pull

prod-down:
	docker compose -f docker-compose.prod-pgsql.yml down

prod-logs:
	docker compose -f docker-compose.prod-pgsql.yml logs -f

prod-shell:
	docker exec -it puppetflow-app bash

prod-migrate:
	docker exec -it puppetflow-app php artisan migrate --force

prod-sqlite:
	docker compose -f docker-compose.prod-sqlite.yml up --build

prod-sqlite-down:
	docker compose -f docker-compose.prod-sqlite.yml down

prod-sqlite-logs:
	docker compose -f docker-compose.prod-sqlite.yml logs -f

# ── Shared ───────────────────────────────────────────────

down:
	docker compose down
	docker compose -f docker-compose.prod-pgsql.yml down 2>/dev/null || true
	docker compose -f docker-compose.prod-sqlite.yml down 2>/dev/null || true

logs:
	docker compose logs -f
