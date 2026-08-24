<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('flow_repository_links');

        Schema::create('flow_repository_links', function (Blueprint $table) {
            $table->id();
            $table->string('flow_id', 32);
            $table->foreign('flow_id')->references('id')->on('flows')->cascadeOnDelete();
            $table->string('integration_id', 32)->nullable();
            $table->foreign('integration_id')->references('id')->on('integrations')->nullOnDelete();
            $table->string('repo_full_name')->default('');
            $table->string('branch')->default('');
            $table->string('file_path')->default('nodeBody.js');
            $table->string('sync_trigger', 20)->default('push');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique('flow_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flow_repository_links');
    }
};
