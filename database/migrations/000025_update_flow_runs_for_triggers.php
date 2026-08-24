<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->string('trigger_id', 32)->nullable()->after('triggered_by');
            $table->foreign('trigger_id')->references('id')->on('flow_triggers')->nullOnDelete();
            $table->json('action_results')->nullable()->after('webhook_info');
        });
    }

    public function down(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('trigger_id');
            $table->dropColumn('action_results');
        });
    }
};
