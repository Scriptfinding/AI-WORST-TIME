<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_repositories', function (Blueprint $table) {
            $table->id();
            $table->string('integration_id', 32);
            $table->foreign('integration_id')->references('id')->on('integrations')->cascadeOnDelete();
            $table->string('external_id');
            $table->string('name');
            $table->string('full_name');
            $table->string('default_branch')->default('main');
            $table->string('url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['integration_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_repositories');
    }
};
