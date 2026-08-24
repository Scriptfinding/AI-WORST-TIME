<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flow_triggers', function (Blueprint $table) {
            $table->string('scope', 20)->default('owner')->after('is_public');
            $table->string('team_id', 32)->nullable()->after('scope');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });

        Schema::table('flow_actions', function (Blueprint $table) {
            $table->string('scope', 20)->default('owner')->after('is_public');
            $table->string('team_id', 32)->nullable()->after('scope');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });

        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->string('user_id', 32)->nullable()->after('flow_id');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('scope', 20)->default('owner')->after('is_active');
            $table->string('team_id', 32)->nullable()->after('scope');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('flow_triggers', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn(['scope', 'team_id']);
        });

        Schema::table('flow_actions', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn(['scope', 'team_id']);
        });

        Schema::table('mailbox_watchers', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'scope', 'team_id']);
        });
    }
};
