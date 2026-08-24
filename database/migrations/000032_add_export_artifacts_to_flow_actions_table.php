<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flow_actions', function (Blueprint $table) {
            $table->boolean('export_artifacts_screenshots')->nullable()->after('fire_on_error');
            $table->boolean('export_artifacts_downloads')->nullable()->after('export_artifacts_screenshots');
        });
    }

    public function down(): void
    {
        Schema::table('flow_actions', function (Blueprint $table) {
            $table->dropColumn(['export_artifacts_screenshots', 'export_artifacts_downloads']);
        });
    }
};
