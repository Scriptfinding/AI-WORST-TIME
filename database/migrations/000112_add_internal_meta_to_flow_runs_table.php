<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->jsonb('internal_meta')->nullable()->after('meta');
        });
    }

    public function down(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->dropColumn('internal_meta');
        });
    }
};
