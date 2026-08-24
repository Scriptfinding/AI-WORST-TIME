<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->unsignedInteger('queue_index')->nullable()->after('status');
            $table->index(['status', 'queue_index']);
        });
    }

    public function down(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->dropIndex(['status', 'queue_index']);
            $table->dropColumn('queue_index');
        });
    }
};
