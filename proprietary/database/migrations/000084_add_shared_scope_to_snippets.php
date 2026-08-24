<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('snippets', function (Blueprint $table) {
            $table->string('scope', 20)->default('owner')->after('code');
            $table->string('team_id', 32)->nullable()->after('scope');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('snippets', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn(['team_id', 'scope']);
        });
    }
};
