<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach ($this->tables() as $table) {
            if (Schema::hasColumn($table, 'stale')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->boolean('stale')->default(false)->index();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables() as $table) {
            if (! Schema::hasColumn($table, 'stale')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropIndex(['stale']);
                $blueprint->dropColumn('stale');
            });
        }
    }

    /** @return list<string> */
    private function tables(): array
    {
        return [
            'snippets',
            'integrations',
            'notification_channels',
            'workspace_mcp_settings',
            'mcp_access_tokens',
            'mcp_oauth_clients',
            'mcp_oauth_connections',
        ];
    }
};
