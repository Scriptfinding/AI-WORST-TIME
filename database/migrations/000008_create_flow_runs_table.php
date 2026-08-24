<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flow_runs', function (Blueprint $table) {
            $table->id();
            $table->string('flow_id', 32);
            $table->foreign('flow_id')->references('id')->on('flows')->cascadeOnDelete();
            $table->string('triggered_by', 32)->nullable();
            $table->foreign('triggered_by')->references('id')->on('users')->nullOnDelete();
            $table->enum('trigger_type', ['manual', 'webhook', 'schedule'])->default('manual');
            $table->enum('status', ['pending', 'running', 'success', 'error'])->default('pending');
            $table->json('input')->nullable();
            $table->json('output')->nullable();
            $table->text('error_message')->nullable();
            $table->json('console_logs')->nullable();
            $table->longText('code_snapshot')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->unsignedInteger('screenshots_count')->default(0);
            $table->unsignedInteger('downloads_count')->default(0);
            $table->timestamps();

            $table->index(['flow_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flow_runs');
    }
};
