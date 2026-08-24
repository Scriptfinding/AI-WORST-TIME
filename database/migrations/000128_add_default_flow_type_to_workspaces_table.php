<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('default_flow_type', 20)->default('nodal')->after('default_flow_code');
            $table->json('default_flow_nodal_graph')->nullable()->after('default_flow_type');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['default_flow_type', 'default_flow_nodal_graph']);
        });
    }
};
