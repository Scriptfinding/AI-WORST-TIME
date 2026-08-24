<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_models', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('user_id', 32);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('ai_integration_id', 32);
            $table->foreign('ai_integration_id')->references('id')->on('integrations')->restrictOnDelete();
            $table->string('ai_model_id');
            $table->json('capabilities');
            $table->string('name');
            $table->string('group', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('stale')->default(false)->index();
            $table->timestamps();

            $table->index(['workspace_id', 'ai_integration_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_models');
    }
};
