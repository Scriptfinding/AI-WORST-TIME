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
            'user_variables',
            'mailbox_domains',
            'mailboxes',
            'mailbox_watchers',
        ];
    }
};
