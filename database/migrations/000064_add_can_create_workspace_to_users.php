<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_create_workspace')->default(true)->after('role');
        });

        Schema::table('workspace_invitations', function (Blueprint $table) {
            $table->boolean('can_create_workspace')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_create_workspace');
        });

        Schema::table('workspace_invitations', function (Blueprint $table) {
            $table->dropColumn('can_create_workspace');
        });
    }
};
