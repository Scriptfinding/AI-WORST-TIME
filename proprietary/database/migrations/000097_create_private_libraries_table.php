<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('private_libraries', function (Blueprint $table) {
            $table->id();
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('user_id', 32)->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('team_id', 32)->nullable();
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('url', 1000);
            $table->string('visibility', 20)->default('owner');
            $table->string('group')->nullable();
            $table->string('repo')->nullable();
            $table->string('branch')->default('main');
            $table->json('manifest')->nullable();
            $table->timestamp('cached_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'visibility']);
            $table->index(['workspace_id', 'user_id']);
            $table->index(['workspace_id', 'team_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('private_libraries');
    }
};
