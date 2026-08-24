<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_teams', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['workspace_id', 'name']);
            $table->unique(['id', 'workspace_id']);
        });

        Schema::create('team_user', function (Blueprint $table) {
            $table->id();
            $table->string('team_id', 32);
            $table->foreign('team_id')->references('id')->on('workspace_teams')->cascadeOnDelete();
            $table->string('user_id', 32);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('workspace_id', 32);
            $table->timestamps();

            $table->unique(['team_id', 'user_id']);
            $table->index(['user_id', 'team_id']);
            $table->foreign(['team_id', 'workspace_id'])
                ->references(['id', 'workspace_id'])
                ->on('workspace_teams')
                ->cascadeOnDelete();
            $table->foreign(['user_id', 'workspace_id'])
                ->references(['user_id', 'workspace_id'])
                ->on('user_workspace')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_user');
        Schema::dropIfExists('workspace_teams');
    }
};
