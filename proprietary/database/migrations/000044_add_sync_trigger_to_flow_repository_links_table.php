<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flow_repository_links', function (Blueprint $table) {
            $table->string('sync_trigger', 20)->default('push')->after('file_path');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('flow_repository_links', 'sync_trigger')) {
            return;
        }

        Schema::table('flow_repository_links', function (Blueprint $table) {
            $table->dropColumn('sync_trigger');
        });
    }
};
