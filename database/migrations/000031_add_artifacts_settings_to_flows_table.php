<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->boolean('export_artifacts_screenshots')->default(true)->after('include_raw_output');
            $table->boolean('export_artifacts_downloads')->default(true)->after('export_artifacts_screenshots');
        });
    }

    public function down(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn(['export_artifacts_screenshots', 'export_artifacts_downloads']);
        });
    }
};
