<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->boolean('export_artifacts_recording')->default(true)->after('export_artifacts_downloads');
        });

        Schema::table('flow_actions', function (Blueprint $table) {
            $table->boolean('export_artifacts_recording')->nullable()->after('export_artifacts_downloads');
        });
    }

    public function down(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn('export_artifacts_recording');
        });

        Schema::table('flow_actions', function (Blueprint $table) {
            $table->dropColumn('export_artifacts_recording');
        });
    }
};
