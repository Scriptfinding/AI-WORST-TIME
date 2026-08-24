<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->uuid('runtime_wait_id')->nullable()->unique();
            $table->timestamp('runtime_waiting_at')->nullable();
            $table->timestamp('runtime_continue_requested_at')->nullable();
            $table->uuid('runtime_consumed_wait_id')->nullable();
            $table->timestamp('runtime_consumed_at')->nullable();
            $table->timestamp('cancellation_requested_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('flow_runs', function (Blueprint $table) {
            $table->dropUnique(['runtime_wait_id']);
            $table->dropColumn([
                'runtime_wait_id',
                'runtime_waiting_at',
                'runtime_continue_requested_at',
                'runtime_consumed_wait_id',
                'runtime_consumed_at',
                'cancellation_requested_at',
            ]);
        });
    }
};
