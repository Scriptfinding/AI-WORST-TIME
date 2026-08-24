<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('folders', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('parent_id', 32)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['workspace_id', 'parent_id']);
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('folders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('folders');
    }
};
