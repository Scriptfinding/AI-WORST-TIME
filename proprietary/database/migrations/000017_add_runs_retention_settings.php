<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->unsignedInteger('runs_retention_default')->default(0)->after('slug');
            $table->unsignedInteger('runs_retention_max')->default(0)->after('runs_retention_default');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->unsignedInteger('runs_retention_limit')->nullable()->after('include_raw_output');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['runs_retention_default', 'runs_retention_max']);
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn('runs_retention_limit');
        });
    }
};
