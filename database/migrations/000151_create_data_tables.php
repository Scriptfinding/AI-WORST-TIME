<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_tables', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('user_id', 32);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('team_id', 32)->nullable();
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
            $table->string('name', 128);
            $table->text('description')->nullable();
            $table->string('visibility', 20)->default('owner');
            $table->string('physical_name', 63)->unique();
            $table->timestamps();

            $table->unique(['workspace_id', 'name']);
            $table->index(['workspace_id', 'visibility']);
            $table->index(['workspace_id', 'user_id']);
            $table->index(['workspace_id', 'team_id']);
        });

        Schema::create('data_table_columns', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('data_table_id', 32);
            $table->foreign('data_table_id')->references('id')->on('data_tables')->cascadeOnDelete();
            $table->string('name', 63);
            $table->string('type', 20);
            $table->unsignedInteger('position');
            $table->timestamps();

            $table->unique(['data_table_id', 'name']);
            $table->unique(['data_table_id', 'position']);
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('data_tables')) {
            DB::table('data_tables')
                ->orderBy('id')
                ->pluck('physical_name')
                ->each(function (mixed $name): void {
                    if (is_string($name)) {
                        Schema::dropIfExists($name);
                    }
                });
        }

        Schema::dropIfExists('data_table_columns');
        Schema::dropIfExists('data_tables');
    }
};
