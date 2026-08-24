<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_mcp_settings', function (Blueprint $table) {
            $table->id();
            $table->string('workspace_id', 32)->unique();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->boolean('enabled')->default(false);
            $table->boolean('include_unexposed_flow_previews')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_mcp_settings');
    }
};
