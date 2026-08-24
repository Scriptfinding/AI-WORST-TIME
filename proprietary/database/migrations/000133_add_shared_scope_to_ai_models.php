<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_models', function (Blueprint $table) {
            $table->string('scope')->default('user')->after('name');
            $table->string('team_id', 32)->nullable()->after('user_id');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ai_models', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn(['team_id', 'scope']);
        });
    }
};
