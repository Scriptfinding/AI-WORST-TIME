<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->unsignedSmallInteger('viewport_width')->default(1280)->after('slug');
            $table->unsignedSmallInteger('viewport_height')->default(720)->after('viewport_width');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->unsignedSmallInteger('viewport_width')->nullable()->after('include_raw_output');
            $table->unsignedSmallInteger('viewport_height')->nullable()->after('viewport_width');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['viewport_width', 'viewport_height']);
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn(['viewport_width', 'viewport_height']);
        });
    }
};
