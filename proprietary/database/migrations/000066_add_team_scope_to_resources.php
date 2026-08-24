<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_channels', function (Blueprint $table) {
            $table->string('team_id', 32)->nullable()->after('scope');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });

        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('team_id', 32)->nullable()->after('scope');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });

        Schema::table('user_variables', function (Blueprint $table) {
            $table->string('team_id', 32)->nullable()->after('scope');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notification_channels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
        });

        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
        });

        Schema::table('user_variables', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
        });
    }
};
