<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->string('team_id', 32)->nullable()->after('workspace_folder_id');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->string('team_id', 32)->nullable()->after('is_shared');
            $table->foreign('team_id')->references('id')->on('workspace_teams')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('folders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
        });
    }
};
