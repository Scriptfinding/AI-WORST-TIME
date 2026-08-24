<?php

namespace App\Providers;

use App\Database\DatabaseDialect;
use App\Database\PostgresDatabaseDialect;
use App\Database\SqliteDatabaseDialect;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\ServiceProvider;
use LogicException;

class DatabaseServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(DatabaseDialect::class, function ($app): DatabaseDialect {
            $connection = $app->make(DatabaseManager::class)->connection();

            return match ($connection->getDriverName()) {
                'pgsql' => new PostgresDatabaseDialect($connection),
                'sqlite' => new SqliteDatabaseDialect($connection),
                default => throw new LogicException(
                    "Unsupported database driver [{$connection->getDriverName()}]. Use PostgreSQL or SQLite.",
                ),
            };
        });
    }

    public function boot(): void
    {
        $connectionName = config('database.default');
        if (! is_string($connectionName) || $connectionName === '') {
            throw new LogicException('The default database connection must be configured.');
        }

        $driver = config("database.connections.{$connectionName}.driver");

        if (! in_array($driver, ['pgsql', 'sqlite'], true)) {
            $name = is_scalar($driver) ? (string) $driver : 'unknown';

            throw new LogicException("Unsupported database driver [{$name}]. Use PostgreSQL or SQLite.");
        }

        if ($driver === 'sqlite' && PHP_VERSION_ID < 80400) {
            throw new LogicException(
                'SQLite requires PHP 8.4 or newer so Laravel can start IMMEDIATE transactions.',
            );
        }

        if ($driver === 'sqlite' && config("database.connections.{$connectionName}.transaction_mode") !== 'IMMEDIATE') {
            throw new LogicException('SQLite requires DB_SQLITE_TRANSACTION_MODE=IMMEDIATE.');
        }
    }
}
