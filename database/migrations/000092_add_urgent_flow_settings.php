<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->boolean('allow_urgent_flows')->default(false)->after('default_flow_code');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->boolean('is_urgent')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn('allow_urgent_flows');
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn('is_urgent');
        });
    }
};
