<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('integrations', function (Blueprint $table): void {
            $table->string('webhook_id', 64)->nullable()->after('config');
        });

        DB::table('integrations')
            ->where('category', 'repository')
            ->whereNull('webhook_id')
            ->orderBy('id')
            ->chunkById(100, function ($integrations): void {
                foreach ($integrations as $integration) {
                    DB::table('integrations')
                        ->where('id', $integration->id)
                        ->update(['webhook_id' => bin2hex(random_bytes(32))]);
                }
            });

        Schema::table('integrations', function (Blueprint $table): void {
            $table->unique('webhook_id');
        });
    }

    public function down(): void
    {
        Schema::table('integrations', function (Blueprint $table): void {
            $table->dropUnique(['webhook_id']);
            $table->dropColumn('webhook_id');
        });
    }
};
