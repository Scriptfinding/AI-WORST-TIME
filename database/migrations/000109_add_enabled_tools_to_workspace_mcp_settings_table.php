<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspace_mcp_settings', function (Blueprint $table) {
            $table->json('enabled_tools')->nullable()->after('include_unexposed_flow_previews');
        });
    }

    public function down(): void
    {
        Schema::table('workspace_mcp_settings', function (Blueprint $table) {
            $table->dropColumn('enabled_tools');
        });
    }
};
