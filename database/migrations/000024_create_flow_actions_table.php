<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flow_actions', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('flow_id', 32);
            $table->foreign('flow_id')->references('id')->on('flows')->cascadeOnDelete();
            $table->string('user_id', 32);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->enum('type', ['webhook']);
            $table->string('label');
            $table->text('config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(false);
            $table->boolean('fire_on_error')->default(false);
            $table->timestamp('last_triggered_at')->nullable();
            $table->timestamps();

            $table->index(['flow_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flow_actions');
    }
};
