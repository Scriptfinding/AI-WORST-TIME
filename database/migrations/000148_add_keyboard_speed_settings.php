<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->unsignedSmallInteger('keyboard_speed')->default(100)->after('viewport_height');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->unsignedSmallInteger('keyboard_speed')->nullable()->after('viewport_height');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn('keyboard_speed');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn('keyboard_speed');
        });
    }
};
