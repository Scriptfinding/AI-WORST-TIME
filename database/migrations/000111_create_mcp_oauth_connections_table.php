<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mcp_oauth_connections', function (Blueprint $table) {
            $table->id();
            $table->string('workspace_id', 32);
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->string('user_id', 32);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->uuid('oauth_client_id');
            $table->string('oauth_access_token_id', 100)->unique();
            $table->string('client_name');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable()->index();
            $table->timestamps();

            $table->index(['workspace_id', 'user_id']);
            $table->index(['oauth_client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mcp_oauth_connections');
    }
};
