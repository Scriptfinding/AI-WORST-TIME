<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flows', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->longText('code')->nullable();
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('folder_id', 32)->nullable();
            $table->foreign('folder_id')->references('id')->on('folders')->nullOnDelete();
            $table->string('owner_id', 32);
            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->string('visibility', 20)->default('owner');
            $table->json('last_run_result')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'folder_id']);
            $table->index(['workspace_id', 'owner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flows');
    }
};
